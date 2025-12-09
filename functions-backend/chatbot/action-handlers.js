const crypto = require('crypto');
const { addWeeks, parseISO, isValid: isValidDate } = require('date-fns');
const { FieldValue, Timestamp } = require('firebase-admin/firestore');
const { ACTIONS } = require('./intents');
const { pushUndoRecord, popUndoRecords, MAX_STACK_DEPTH } = require('./undo-store');
const { buildSlotsForMoment, normalizeAttending } = require('../lib/attending-utils.js');

const MAX_RECURRENCE = 12;

const randomId = (prefix = 'auto') => `${prefix}_${crypto.randomUUID()}`;

const parseDateOnly = (value) => {
  if (!value) return null;
  const parsed = parseISO(value);
  if (!isValidDate(parsed)) return null;
  return parsed;
};

const isProtectedSlot = ({ resident, date, timeSlot, protectedTimes }) => {
  if (!resident || !date) return false;
  const dayOfWeek = date.getDay();

  if (resident.continuityDay && resident.continuityTime) {
    const continuityDay = resident.continuityDay.toLowerCase();
    const dayMap = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    };
    if (dayMap[continuityDay] === dayOfWeek && resident.continuityTime === timeSlot) {
      return true;
    }
  }

  if (Array.isArray(resident.halfDaysOff)) {
    const isoDate = date.toISOString().split('T')[0];
    if (resident.halfDaysOff.includes(`${isoDate}_${timeSlot}`)) {
      return true;
    }
  }

  if (Array.isArray(protectedTimes)) {
    return protectedTimes.some(pt => {
      if (pt.dayOfWeek !== dayOfWeek) return false;
      if (pt.timeSlot !== timeSlot) return false;
      if (pt.appliesTo === 'all') return true;
      const residentPGY = resident.pgyStatus || resident.pgyLevel || '';
      return pt.appliesTo === residentPGY;
    });
  }

  return false;
};

const ensureNotProtectedAssignment = (assignment) => {
  const type = assignment?.type;
  return type !== 'protected' && type !== 'continuity';
};

const getResident = async (context, residentId) => {
  if (!residentId) return null;
  if (!context.residentCache.has(residentId)) {
    const snap = await context.institutionRef.collection('residents').doc(residentId).get();
    context.residentCache.set(residentId, snap.exists ? { id: snap.id, ...snap.data() } : null);
  }
  return context.residentCache.get(residentId);
};

const getAttending = async (context, attendingId) => {
  if (!attendingId) return null;
  if (!context.attendingCache.has(attendingId)) {
    const snap = await context.institutionRef.collection('attendings').doc(attendingId).get();
    const sites = context.sites || [];
    const data = snap.exists ? normalizeAttending({ id: snap.id, ...snap.data() }, sites) : null;
    context.attendingCache.set(attendingId, data);
  }
  return context.attendingCache.get(attendingId);
};

const assignmentCollection = (context) =>
  context.institutionRef.collection('assignments');

const respond = (message, data = {}) => ({ message, data });

async function handleAddAssignment(args, context) {
  const date = parseDateOnly(args.date);
  if (!date) {
    return respond('I could not understand the date you provided. Please use YYYY-MM-DD.');
  }
  const timeSlot = (args.timeSlot || '').toUpperCase();
  if (!['AM', 'PM'].includes(timeSlot)) {
    return respond('Time slot must be AM or PM.');
  }

  const resident = await getResident(context, args.residentId);
  if (args.residentId && !resident) {
    return respond(`I could not find a resident with ID ${args.residentId}.`);
  }
  if (resident && isProtectedSlot({ resident, date, timeSlot, protectedTimes: context.protectedTimes })) {
    return respond('That time is protected for the resident (continuity clinic, didactics, or approved time off).');
  }

  const attending = await getAttending(context, args.attendingId);
  if (args.attendingId && !attending) {
    return respond(`I could not find an attending with ID ${args.attendingId}.`);
  }

  let siteId = args.siteId || null;
  if (!siteId && attending && args.clinicId) {
    const clinic = (attending.clinics || []).find(c => c.id === args.clinicId);
    siteId = clinic?.siteId || null;
  }

  const recurrence = args.recurrence && typeof args.recurrence === 'object'
    ? {
      frequency: args.recurrence.frequency,
      occurrences: Math.min(args.recurrence.occurrences || 1, MAX_RECURRENCE)
    }
    : null;

  const occurrences = recurrence ? recurrence.occurrences : 1;
  const createdAssignments = [];
  const batch = context.firestore.batch();
  const attendingCapacityCache = new Map();

  for (let i = 0; i < occurrences; i += 1) {
    const targetDate = i === 0 ? date : addWeeks(date, i);
    const dateKey = targetDate.toISOString().split('T')[0];

    if (resident) {
      const residentSnap = await assignmentCollection(context)
        .where('date', '==', dateKey)
        .where('timeSlot', '==', timeSlot)
        .where('residentId', '==', resident.id)
        .limit(1)
        .get();
      if (!residentSnap.empty) {
        return respond(`${resident.name} already has an assignment at ${timeSlot} on ${dateKey}.`);
      }
    }

    if (attending && args.attendingId) {
      const cacheKey = `${dateKey}_${timeSlot}`;
      let capacityRecord = attendingCapacityCache.get(cacheKey);
      if (!capacityRecord) {
        const existingSnap = await assignmentCollection(context)
          .where('date', '==', dateKey)
          .where('timeSlot', '==', timeSlot)
          .where('attendingId', '==', args.attendingId)
          .get();
        const slots = buildSlotsForMoment(attending, dateKey, targetDate.getDay(), timeSlot);
        const capacity = slots.reduce((sum, slot) => sum + (slot.capacity || 0), 0);
        capacityRecord = { existing: existingSnap.size, capacity, newCount: 0 };
        attendingCapacityCache.set(cacheKey, capacityRecord);
      }
      const totalCount = capacityRecord.existing + capacityRecord.newCount + 1;
      if (capacityRecord.capacity && totalCount > capacityRecord.capacity) {
        return respond(
          'That attending already has the maximum number of residents for that clinic.'
        );
      }
      capacityRecord.newCount += 1;
    }

    const docRef = assignmentCollection(context).doc();
    const payload = {
      date: dateKey,
      timeSlot,
      residentId: args.residentId || null,
      attendingId: args.attendingId || null,
      siteId,
      clinicId: args.clinicId || null,
      type: 'clinical',
      createdBy: context.userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      notes: args.notes || ''
    };
    batch.set(docRef, payload);
    createdAssignments.push({ id: docRef.id, ...payload });
  }

  await batch.commit();

  await pushUndoRecord({
    firestore: context.firestore,
    institutionId: context.institutionId,
    userId: context.userId,
    record: {
      action: 'delete_assignments',
      assignments: createdAssignments.map(a => ({ id: a.id }))
    }
  });

  const residentName = resident?.name ? ` for ${resident.name}` : '';
  return respond(`Scheduled ${occurrences} assignment${occurrences > 1 ? 's' : ''}${residentName}.`, {
    createdAssignments: createdAssignments.map(a => a.id)
  });
}

async function handleMoveAssignment(args, context) {
  const assignmentId = args.assignmentId;
  if (!assignmentId) {
    return respond('Please provide the assignment ID to move.');
  }
  const docRef = assignmentCollection(context).doc(assignmentId);
  const snap = await docRef.get();
  if (!snap.exists) {
    return respond(`I could not find assignment ${assignmentId}.`);
  }
  const assignment = { id: snap.id, ...snap.data() };
  if (!ensureNotProtectedAssignment(assignment)) {
    return respond('I cannot move protected assignments such as continuity clinics or didactics.');
  }

  const date = parseDateOnly(args.date);
  if (!date) {
    return respond('I could not understand the new date. Please use YYYY-MM-DD.');
  }
  const timeSlot = (args.timeSlot || '').toUpperCase();
  if (!['AM', 'PM'].includes(timeSlot)) {
    return respond('Time slot must be AM or PM.');
  }

  const resident = assignment.residentId ? await getResident(context, assignment.residentId) : null;
  if (resident && isProtectedSlot({ resident, date, timeSlot, protectedTimes: context.protectedTimes })) {
    return respond('The new slot conflicts with protected time for that resident.');
  }

  const dateKey = date.toISOString().split('T')[0];

  if (resident) {
    const residentSnap = await assignmentCollection(context)
      .where('date', '==', dateKey)
      .where('timeSlot', '==', timeSlot)
      .where('residentId', '==', resident.id)
      .get();
    const conflict = residentSnap.docs.some(doc => doc.id !== assignmentId);
    if (conflict) {
      return respond(`${resident.name} already has an assignment at ${timeSlot} on ${dateKey}.`);
    }
  }

  if (assignment.attendingId) {
    const attending = await getAttending(context, assignment.attendingId);
    if (attending) {
      const existingSnap = await assignmentCollection(context)
        .where('date', '==', dateKey)
        .where('timeSlot', '==', timeSlot)
        .where('attendingId', '==', assignment.attendingId)
        .get();
      const totalOthers = existingSnap.docs.filter(doc => doc.id !== assignmentId).length;
      const slots = buildSlotsForMoment(attending, dateKey, date.getDay(), timeSlot);
      const capacity = slots.reduce((sum, slot) => sum + (slot.capacity || 0), 0);
      if (capacity && (totalOthers + 1) > capacity) {
        return respond('Moving would exceed the attending\'s clinic capacity for that slot.');
      }
    }
  }

  await docRef.update({
    date: dateKey,
    timeSlot,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: context.userId
  });

  await pushUndoRecord({
    firestore: context.firestore,
    institutionId: context.institutionId,
    userId: context.userId,
    record: {
      action: 'move_assignment',
      assignmentId,
      previousDate: assignment.date,
      previousTimeSlot: assignment.timeSlot
    }
  });

  return respond('The assignment has been moved to the requested slot.');
}

async function handleDeleteAssignment(args, context) {
  const assignmentId = args.assignmentId;
  if (!assignmentId) {
    return respond('Please provide the assignment ID to delete.');
  }
  const docRef = assignmentCollection(context).doc(assignmentId);
  const snap = await docRef.get();
  if (!snap.exists) {
    return respond(`I could not find assignment ${assignmentId}.`);
  }
  const assignment = { id: snap.id, ...snap.data() };
  if (!ensureNotProtectedAssignment(assignment)) {
    return respond('Protected assignments cannot be removed.');
  }

  await docRef.delete();

  await pushUndoRecord({
    firestore: context.firestore,
    institutionId: context.institutionId,
    userId: context.userId,
    record: {
      action: 'restore_assignments',
      assignments: [assignment]
    }
  });

  return respond('The assignment has been removed.');
}

const upsertAttendingOverride = async ({ context, attendingId, override, remove = false }) => {
  const docRef = context.institutionRef.collection('attendings').doc(attendingId);
  await context.firestore.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    if (!snap.exists) {
      throw new Error('Attending not found');
    }
    const data = snap.data();
    const overrides = Array.isArray(data.scheduleOverrides) ? [...data.scheduleOverrides] : [];
    const key = (item) => `${item.clinicId}_${item.date}_${item.timeSlot}`;
    if (remove) {
      const index = overrides.findIndex(item => key(item) === key(override));
      if (index >= 0) {
        overrides.splice(index, 1);
      }
    } else {
      overrides.push(override);
    }
    tx.update(docRef, {
      scheduleOverrides: overrides,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: context.userId
    });
  });
};

async function handleAddOverride(args, context) {
  const required = ['attendingId', 'date', 'timeSlot', 'clinicId'];
  for (const key of required) {
    if (!args[key]) return respond(`Missing ${key} for the override.`);
  }
  const attendingId = args.attendingId;
  const override = {
    id: randomId('override'),
    action: 'add',
    clinicId: args.clinicId,
    siteId: args.siteId || null,
    date: args.date,
    timeSlot: args.timeSlot.toUpperCase(),
    residentCapacity: Number.parseInt(args.capacity ?? 0, 10) || 0,
    createdBy: context.userId,
    createdAt: Timestamp.now()
  };

  await upsertAttendingOverride({ context, attendingId, override, remove: false });

  await pushUndoRecord({
    firestore: context.firestore,
    institutionId: context.institutionId,
    userId: context.userId,
    record: {
      action: 'remove_override',
      attendingId,
      override
    }
  });

  return respond('The attending now has an additional clinic session for that slot.');
}

async function handleRemoveOverride(args, context) {
  const required = ['attendingId', 'date', 'timeSlot', 'clinicId'];
  for (const key of required) {
    if (!args[key]) return respond(`Missing ${key} for cancelling the override.`);
  }
  const attendingId = args.attendingId;
  const timeSlot = args.timeSlot.toUpperCase();
  const docRef = context.institutionRef.collection('attendings').doc(attendingId);
  const snap = await docRef.get();
  if (!snap.exists) return respond('I could not find that attending.');
  const overrides = Array.isArray(snap.data().scheduleOverrides) ? snap.data().scheduleOverrides : [];
  const match = overrides.find(item =>
    item.clinicId === args.clinicId &&
    item.date === args.date &&
    item.timeSlot === timeSlot
  );
  if (!match) {
    return respond('There is no override for that slot.');
  }

  await upsertAttendingOverride({ context, attendingId, override: match, remove: true });

  await pushUndoRecord({
    firestore: context.firestore,
    institutionId: context.institutionId,
    userId: context.userId,
    record: {
      action: 'add_override',
      attendingId,
      override: match
    }
  });

  return respond('The extra clinic session has been removed.');
}

async function handleCreateAttending(args, context) {
  if (!args.name) {
    return respond('Please provide a name for the attending.');
  }
  const docRef = context.institutionRef.collection('attendings').doc();
  const payload = {
    name: args.name,
    email: args.email || '',
    phone: args.phone || '',
    rotationIds: Array.isArray(args.rotationIds) ? args.rotationIds : [],
    clinics: [],
    scheduleOverrides: [],
    createdAt: FieldValue.serverTimestamp(),
    createdBy: context.userId
  };
  await docRef.set(payload);

  await pushUndoRecord({
    firestore: context.firestore,
    institutionId: context.institutionId,
    userId: context.userId,
    record: {
      action: 'delete_attending',
      attendingId: docRef.id
    }
  });

  return respond(`Attending ${args.name} has been created.`, { attendingId: docRef.id });
}

async function handleUpdateAttending(args, context) {
  const attendingId = args.attendingId;
  if (!attendingId) return respond('Provide the attending ID to update.');
  const docRef = context.institutionRef.collection('attendings').doc(attendingId);
  const snap = await docRef.get();
  if (!snap.exists) return respond('I could not find that attending.');
  const previousData = snap.data();
  const updates = {};
  const rollback = {};
  ['name', 'email', 'phone'].forEach(key => {
    if (args[key] !== undefined && args[key] !== null) {
      updates[key] = args[key];
      rollback[key] = {
        exists: Object.prototype.hasOwnProperty.call(previousData, key),
        value: previousData[key] !== undefined ? previousData[key] : null
      };
    }
  });
  if (Array.isArray(args.rotationIds)) {
    updates.rotationIds = args.rotationIds;
    rollback.rotationIds = {
      exists: Object.prototype.hasOwnProperty.call(previousData, 'rotationIds'),
      value: Array.isArray(previousData.rotationIds) ? previousData.rotationIds : []
    };
  }
  if (Object.keys(updates).length === 0) {
    return respond('There were no changes to apply.');
  }
  updates.updatedAt = FieldValue.serverTimestamp();
  updates.updatedBy = context.userId;
  await docRef.update(updates);

  await pushUndoRecord({
    firestore: context.firestore,
    institutionId: context.institutionId,
    userId: context.userId,
    record: {
      action: 'update_attending',
      attendingId,
      previous: rollback
    }
  });

  return respond('The attending has been updated.');
}

async function handleCreateResident(args, context) {
  if (!args.name || !args.pgyStatus) {
    return respond('Please provide both name and PGY status for the resident.');
  }
  const docRef = context.institutionRef.collection('residents').doc();
  const payload = {
    name: args.name,
    pgyStatus: args.pgyStatus,
    email: args.email || '',
    rotationAssignments: [],
    halfDaysOff: [],
    vacationWeeks: [],
    createdAt: FieldValue.serverTimestamp(),
    createdBy: context.userId
  };
  await docRef.set(payload);

  await pushUndoRecord({
    firestore: context.firestore,
    institutionId: context.institutionId,
    userId: context.userId,
    record: {
      action: 'delete_resident',
      residentId: docRef.id
    }
  });

  return respond(`Resident ${args.name} has been created.`, { residentId: docRef.id });
}

async function handleUpdateResident(args, context) {
  const residentId = args.residentId;
  if (!residentId) return respond('Provide the resident ID to update.');
  const docRef = context.institutionRef.collection('residents').doc(residentId);
  const snap = await docRef.get();
  if (!snap.exists) return respond('I could not find that resident.');
  const previousData = snap.data();
  const updates = {};
  const rollback = {};
  ['name', 'pgyStatus', 'email'].forEach(key => {
    if (args[key] !== undefined && args[key] !== null) {
      updates[key] = args[key];
      rollback[key] = {
        exists: Object.prototype.hasOwnProperty.call(previousData, key),
        value: previousData[key] !== undefined ? previousData[key] : null
      };
    }
  });
  if (Object.keys(updates).length === 0) return respond('There were no changes to apply.');
  updates.updatedAt = FieldValue.serverTimestamp();
  updates.updatedBy = context.userId;
  await docRef.update(updates);

  await pushUndoRecord({
    firestore: context.firestore,
    institutionId: context.institutionId,
    userId: context.userId,
    record: {
      action: 'update_resident',
      residentId,
      previous: rollback
    }
  });

  return respond('The resident has been updated.');
}

async function handleCreateClinic(args, context) {
  const attendingId = args.attendingId;
  if (!attendingId) return respond('Please specify which attending this clinic belongs to.');
  if (!args.name || !args.siteId) return respond('Provide both a clinic name and site.');
  const docRef = context.institutionRef.collection('attendings').doc(attendingId);
  const snap = await docRef.get();
  if (!snap.exists) return respond('I could not find that attending.');
  const clinics = Array.isArray(snap.data().clinics) ? snap.data().clinics : [];
  const clinicId = randomId('clinic');
  const clinic = {
    id: clinicId,
    name: args.name,
    siteId: args.siteId,
    residentCapacity: Number.parseInt(args.residentCapacity ?? 0, 10) || 0,
    defaultSessions: Array.isArray(args.defaultSessions) ? args.defaultSessions : []
  };
  clinics.push(clinic);
  await docRef.update({
    clinics,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: context.userId
  });

  await pushUndoRecord({
    firestore: context.firestore,
    institutionId: context.institutionId,
    userId: context.userId,
    record: {
      action: 'remove_clinic',
      attendingId,
      clinicId
    }
  });

  return respond('The clinic has been created.', { clinicId });
}

async function handleUpdateClinic(args, context) {
  const attendingId = args.attendingId;
  const clinicId = args.clinicId;
  if (!attendingId || !clinicId) return respond('Provide both the attending ID and clinic ID.');
  const docRef = context.institutionRef.collection('attendings').doc(attendingId);
  const snap = await docRef.get();
  if (!snap.exists) return respond('I could not find that attending.');
  const clinics = Array.isArray(snap.data().clinics) ? [...snap.data().clinics] : [];
  const index = clinics.findIndex(c => c.id === clinicId);
  if (index === -1) return respond('No clinic with that ID exists for the attending.');
  const previous = { ...clinics[index] };
  if (args.name !== undefined && args.name !== null) clinics[index].name = args.name;
  if (args.residentCapacity !== undefined && args.residentCapacity !== null) {
    clinics[index].residentCapacity = Number.parseInt(args.residentCapacity, 10) || 0;
  }
  await docRef.update({
    clinics,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: context.userId
  });

  await pushUndoRecord({
    firestore: context.firestore,
    institutionId: context.institutionId,
    userId: context.userId,
    record: {
      action: 'update_clinic',
      attendingId,
      clinicId,
      previous
    }
  });

  return respond('The clinic has been updated.');
}

function handleInformational(args = {}) {
  const message = typeof args.message === 'string' && args.message.trim().length
    ? args.message.trim()
    : 'Here is the information you requested.';
  return respond(message, { informational: true });
}

const MAX_SUMMARY_DAYS = 14;

const slotPriority = (slot) => {
  if (slot === 'AM') return 0;
  if (slot === 'PM') return 1;
  return 2;
};

const formatDateKey = (date) => date.toISOString().split('T')[0];

async function handleSummarizeCoverage(args = {}, context) {
  let startDate = args.startDate ? parseDateOnly(args.startDate) : null;
  let endDate = args.endDate ? parseDateOnly(args.endDate) : null;
  const singleDate = args.date ? parseDateOnly(args.date) : null;

  if (startDate && !endDate) {
    endDate = startDate;
  }
  if (!startDate && endDate) {
    return respond('Please provide a start date when specifying an end date.');
  }

  if (!startDate && !endDate) {
    startDate = singleDate || new Date();
    endDate = startDate;
  }

  if (!startDate || !endDate) {
    return respond('I could not understand the requested date range. Please use YYYY-MM-DD.');
  }

  if (endDate < startDate) {
    return respond('The end date must be on or after the start date.');
  }

  const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  if (totalDays > MAX_SUMMARY_DAYS) {
    return respond(`Please request coverage summaries for ${MAX_SUMMARY_DAYS} days or fewer at a time.`);
  }

  const startKey = formatDateKey(startDate);
  const endKey = formatDateKey(endDate);

  let query = assignmentCollection(context);
  if (startKey === endKey) {
    query = query.where('date', '==', startKey);
  } else {
    query = query.where('date', '>=', startKey).where('date', '<=', endKey).orderBy('date');
  }

  const snapshot = await query.get();
  if (snapshot.empty) {
    return respond('No assignments were found for the requested timeframe.', {
      startDate: startKey,
      endDate: endKey,
      totalAssignments: 0
    });
  }

  const assignments = [];
  snapshot.forEach(doc => assignments.push({ id: doc.id, ...doc.data() }));
  assignments.sort((a, b) => {
    if (a.date === b.date) {
      return slotPriority(a.timeSlot) - slotPriority(b.timeSlot);
    }
    return a.date.localeCompare(b.date);
  });

  const siteLookup = new Map(
    Array.isArray(context.sites)
      ? context.sites
        .filter(site => site && site.id)
        .map(site => [site.id, site.name || site.id])
      : []
  );

  const breakdownMap = new Map();
  const slotOrder = ['AM', 'PM'];

  for (const assignment of assignments) {
    const dateKey = assignment.date || startKey;
    let slotsForDate = breakdownMap.get(dateKey);
    if (!slotsForDate) {
      slotsForDate = new Map();
      breakdownMap.set(dateKey, slotsForDate);
    }

    const slotKey = slotOrder.includes(assignment.timeSlot) ? assignment.timeSlot : 'Other';
    let slotEntries = slotsForDate.get(slotKey);
    if (!slotEntries) {
      slotEntries = [];
      slotsForDate.set(slotKey, slotEntries);
    }

    const resident = assignment.residentId ? await getResident(context, assignment.residentId) : null;
    const attending = assignment.attendingId ? await getAttending(context, assignment.attendingId) : null;
    const clinic = assignment.clinicId && attending
      ? (attending.clinics || []).find(c => c.id === assignment.clinicId)
      : null;
    const siteName = assignment.siteId ? siteLookup.get(assignment.siteId) || null : null;

    const residentLabel = resident?.name || assignment.residentName || assignment.residentId || 'Unassigned';
    const attendingLabel = attending?.name
      || assignment.attendingName
      || assignment.attendingId
      || 'Unassigned attending';
    let label = `${residentLabel} -> ${attendingLabel}`;
    if (clinic?.name) {
      label += ` at ${clinic.name}`;
    }
    if (siteName) {
      label += ` (${siteName})`;
    }

    const entry = {
      assignmentId: assignment.id,
      resident: residentLabel,
      attending: attendingLabel,
      clinicName: clinic?.name || null,
      siteName: siteName || null,
      slot: slotKey,
      notes: assignment.notes || '',
      label
    };

    slotEntries.push(entry);
  }

  const lines = [];
  const header = startKey === endKey
    ? `Coverage summary for ${startKey}`
    : `Coverage summary for ${startKey} through ${endKey}`;
  lines.push(header);

  const orderedDates = Array.from(breakdownMap.keys()).sort();
  for (const dateKey of orderedDates) {
    lines.push(`\n${dateKey}`);
    const slots = breakdownMap.get(dateKey);
    const orderedSlots = Array.from(slots.keys()).sort((a, b) => slotPriority(a) - slotPriority(b));
    for (const slotKey of orderedSlots) {
      const slotEntries = slots.get(slotKey);
      lines.push(`  ${slotKey} (${slotEntries.length})`);
      slotEntries.forEach(item => {
        lines.push(`    - ${item.label}`);
      });
    }
  }

  return respond(lines.join('\n'), {
    startDate: startKey,
    endDate: endKey,
    totalAssignments: assignments.length,
    breakdown: orderedDates.map(dateKey => ({
      date: dateKey,
      slots: Array.from(breakdownMap.get(dateKey).entries()).map(([slotKey, items]) => ({
        slot: slotKey,
        assignments: items
      }))
    }))
  });
}

const MAX_BULK_ENTRIES = 400;
const BATCH_CHUNK = 450;

async function handleBulkCreateResidents(args = {}, context) {
  const entries = Array.isArray(args.entries) ? args.entries : [];
  if (!entries.length) {
    return respond('I did not find any resident entries to add.');
  }
  if (entries.length > MAX_BULK_ENTRIES) {
    return respond(`Please add ${MAX_BULK_ENTRIES} or fewer residents per request.`);
  }

  const seenNames = new Set();
  const created = [];
  const skipped = [];
  let batch = context.firestore.batch();
  let writesInBatch = 0;

  const flushBatch = async () => {
    if (writesInBatch === 0) return;
    await batch.commit();
    batch = context.firestore.batch();
    writesInBatch = 0;
  };

  for (const entry of entries) {
    const name = typeof entry?.name === 'string' ? entry.name.trim() : '';
    const pgyStatus = typeof entry?.pgyStatus === 'string' ? entry.pgyStatus.trim() : '';
    const email = typeof entry?.email === 'string' ? entry.email.trim() : '';

    if (!name || !pgyStatus) {
      skipped.push({ name: name || entry?.name || null, reason: 'Missing name or PGY status' });
      continue;
    }

    const lowerName = name.toLowerCase();
    if (seenNames.has(lowerName)) {
      skipped.push({ name, reason: 'Duplicate within request' });
      continue;
    }

    const existingSnap = await context.institutionRef
      .collection('residents')
      .where('name', '==', name)
      .limit(1)
      .get();
    if (!existingSnap.empty) {
      skipped.push({ name, reason: 'Resident already exists' });
      continue;
    }

    const docRef = context.institutionRef.collection('residents').doc();
    batch.set(docRef, {
      name,
      pgyStatus,
      email,
      rotationAssignments: [],
      halfDaysOff: [],
      vacationWeeks: [],
      createdAt: FieldValue.serverTimestamp(),
      createdBy: context.userId
    });
    writesInBatch += 1;
    seenNames.add(lowerName);
    created.push({ id: docRef.id, name, pgyStatus, email });

    if (writesInBatch >= BATCH_CHUNK) {
      await flushBatch();
    }
  }

  if (!created.length) {
    await flushBatch();
    return respond('No residents were added.', { skipped });
  }

  await flushBatch();

  await pushUndoRecord({
    firestore: context.firestore,
    institutionId: context.institutionId,
    userId: context.userId,
    record: {
      action: 'delete_residents',
      residentIds: created.map(entry => entry.id)
    }
  });

  const messageParts = [`Added ${created.length} resident${created.length === 1 ? '' : 's'}.`];
  if (skipped.length) {
    messageParts.push(`${skipped.length} entr${skipped.length === 1 ? 'y was' : 'ies were'} skipped.`);
  }

  return respond(messageParts.join(' '), {
    created,
    skipped
  });
}

async function handleBulkCreateAttendings(args = {}, context) {
  const entries = Array.isArray(args.entries) ? args.entries : [];
  if (!entries.length) {
    return respond('I did not find any attending entries to add.');
  }
  if (entries.length > MAX_BULK_ENTRIES) {
    return respond(`Please add ${MAX_BULK_ENTRIES} or fewer attendings per request.`);
  }

  const seenNames = new Set();
  const created = [];
  const skipped = [];
  let batch = context.firestore.batch();
  let writesInBatch = 0;

  const flushBatch = async () => {
    if (writesInBatch === 0) return;
    await batch.commit();
    batch = context.firestore.batch();
    writesInBatch = 0;
  };

  for (const entry of entries) {
    const name = typeof entry?.name === 'string' ? entry.name.trim() : '';
    const email = typeof entry?.email === 'string' ? entry.email.trim() : '';
    const phone = typeof entry?.phone === 'string' ? entry.phone.trim() : '';
    const rotationIds = Array.isArray(entry?.rotationIds) ? entry.rotationIds.filter(Boolean) : [];

    if (!name) {
      skipped.push({ name: name || entry?.name || null, reason: 'Missing name' });
      continue;
    }

    const lowerName = name.toLowerCase();
    if (seenNames.has(lowerName)) {
      skipped.push({ name, reason: 'Duplicate within request' });
      continue;
    }

    const existingSnap = await context.institutionRef
      .collection('attendings')
      .where('name', '==', name)
      .limit(1)
      .get();
    if (!existingSnap.empty) {
      skipped.push({ name, reason: 'Attending already exists' });
      continue;
    }

    const docRef = context.institutionRef.collection('attendings').doc();
    batch.set(docRef, {
      name,
      email,
      phone,
      rotationIds,
      clinics: [],
      scheduleOverrides: [],
      createdAt: FieldValue.serverTimestamp(),
      createdBy: context.userId
    });
    writesInBatch += 1;
    seenNames.add(lowerName);
    created.push({ id: docRef.id, name, email, phone, rotationIds });

    if (writesInBatch >= BATCH_CHUNK) {
      await flushBatch();
    }
  }

  if (!created.length) {
    await flushBatch();
    return respond('No attendings were added.', { skipped });
  }

  await flushBatch();

  await pushUndoRecord({
    firestore: context.firestore,
    institutionId: context.institutionId,
    userId: context.userId,
    record: {
      action: 'delete_attendings',
      attendingIds: created.map(entry => entry.id)
    }
  });

  const messageParts = [`Added ${created.length} attending${created.length === 1 ? '' : 's'}.`];
  if (skipped.length) {
    messageParts.push(`${skipped.length} entr${skipped.length === 1 ? 'y was' : 'ies were'} skipped.`);
  }

  return respond(messageParts.join(' '), {
    created,
    skipped
  });
}

async function applyInverse(record, context) {
  if (!record) {
    return respond('There are no actions left to undo.');
  }
  const type = record.action;
  switch (type) {
  case 'delete_assignments': {
    const batch = context.firestore.batch();
    record.assignments.forEach(item => {
      const ref = assignmentCollection(context).doc(item.id);
      batch.delete(ref);
    });
    await batch.commit();
    return respond('The previous assignments have been removed.');
  }
  case 'restore_assignments': {
    const batch = context.firestore.batch();
    record.assignments.forEach(item => {
      const { id, ...data } = item;
      const ref = assignmentCollection(context).doc(id);
      batch.set(ref, { ...data, updatedAt: FieldValue.serverTimestamp(), updatedBy: context.userId });
    });
    await batch.commit();
    return respond('The assignment has been restored.');
  }
  case 'move_assignment': {
    const ref = assignmentCollection(context).doc(record.assignmentId);
    await ref.update({
      date: record.previousDate,
      timeSlot: record.previousTimeSlot,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: context.userId
    });
    return respond('The previous move has been undone.');
  }
  case 'remove_override': {
    await upsertAttendingOverride({
      context,
      attendingId: record.attendingId,
      override: record.override,
      remove: true
    });
    return respond('The extra clinic session has been removed.');
  }
  case 'add_override': {
    await upsertAttendingOverride({
      context,
      attendingId: record.attendingId,
      override: record.override,
      remove: false
    });
    return respond('The clinic override has been restored.');
  }
  case 'delete_attending': {
    await context.institutionRef.collection('attendings').doc(record.attendingId).delete();
    return respond('The attending has been removed.');
  }
  case 'update_attending': {
    const docRef = context.institutionRef.collection('attendings').doc(record.attendingId);
    const updates = {};
    Object.entries(record.previous || {}).forEach(([key, info]) => {
      if (info && info.exists) {
        updates[key] = info.value;
      } else {
        updates[key] = FieldValue.delete();
      }
    });
    updates.updatedAt = FieldValue.serverTimestamp();
    updates.updatedBy = context.userId;
    await docRef.update(updates);
    return respond('Attending changes have been reverted.');
  }
  case 'delete_resident': {
    await context.institutionRef.collection('residents').doc(record.residentId).delete();
    return respond('The resident has been removed.');
  }
  case 'delete_residents': {
    const ids = Array.isArray(record.residentIds) ? record.residentIds.filter(Boolean) : [];
    if (!ids.length) {
      return respond('There were no residents to remove.');
    }
    for (let i = 0; i < ids.length; i += BATCH_CHUNK) {
      const batch = context.firestore.batch();
      ids.slice(i, i + BATCH_CHUNK).forEach(id => {
        const ref = context.institutionRef.collection('residents').doc(id);
        batch.delete(ref);
      });
      await batch.commit();
    }
    return respond('The residents have been removed.');
  }
  case 'update_resident': {
    const docRef = context.institutionRef.collection('residents').doc(record.residentId);
    const updates = {};
    Object.entries(record.previous || {}).forEach(([key, info]) => {
      if (info && info.exists) {
        updates[key] = info.value;
      } else {
        updates[key] = FieldValue.delete();
      }
    });
    updates.updatedAt = FieldValue.serverTimestamp();
    updates.updatedBy = context.userId;
    await docRef.update(updates);
    return respond('Resident changes have been reverted.');
  }
  case 'delete_attendings': {
    const ids = Array.isArray(record.attendingIds) ? record.attendingIds.filter(Boolean) : [];
    if (!ids.length) {
      return respond('There were no attendings to remove.');
    }
    for (let i = 0; i < ids.length; i += BATCH_CHUNK) {
      const batch = context.firestore.batch();
      ids.slice(i, i + BATCH_CHUNK).forEach(id => {
        const ref = context.institutionRef.collection('attendings').doc(id);
        batch.delete(ref);
      });
      await batch.commit();
    }
    return respond('The attendings have been removed.');
  }
  case 'remove_clinic': {
    const docRef = context.institutionRef.collection('attendings').doc(record.attendingId);
    const snap = await docRef.get();
    if (!snap.exists) return respond('The attending no longer exists.');
    const clinics = (snap.data().clinics || []).filter(c => c.id !== record.clinicId);
    await docRef.update({ clinics, updatedAt: FieldValue.serverTimestamp(), updatedBy: context.userId });
    return respond('The clinic has been removed again.');
  }
  case 'update_clinic': {
    const docRef = context.institutionRef.collection('attendings').doc(record.attendingId);
    const snap = await docRef.get();
    if (!snap.exists) return respond('Attending missing for undo.');
    const clinics = Array.isArray(snap.data().clinics) ? [...snap.data().clinics] : [];
    const index = clinics.findIndex(c => c.id === record.clinicId);
    if (index >= 0) {
      clinics[index] = record.previous;
      await docRef.update({ clinics, updatedAt: FieldValue.serverTimestamp(), updatedBy: context.userId });
    }
    return respond('Clinic changes have been reverted.');
  }
  default:
    return respond('I could not undo the last action.');
  }
}

async function handleAction(action, args, context) {
  switch (action) {
  case ACTIONS.ADD_ASSIGNMENT:
    return handleAddAssignment(args, context);
  case ACTIONS.MOVE_ASSIGNMENT:
    return handleMoveAssignment(args, context);
  case ACTIONS.DELETE_ASSIGNMENT:
    return handleDeleteAssignment(args, context);
  case ACTIONS.ADD_ATTENDING_OVERRIDE:
    return handleAddOverride(args, context);
  case ACTIONS.REMOVE_ATTENDING_OVERRIDE:
    return handleRemoveOverride(args, context);
  case ACTIONS.CREATE_ATTENDING:
    return handleCreateAttending(args, context);
  case ACTIONS.UPDATE_ATTENDING:
    return handleUpdateAttending(args, context);
  case ACTIONS.CREATE_RESIDENT:
    return handleCreateResident(args, context);
  case ACTIONS.UPDATE_RESIDENT:
    return handleUpdateResident(args, context);
  case ACTIONS.CREATE_CLINIC:
    return handleCreateClinic(args, context);
  case ACTIONS.UPDATE_CLINIC:
    return handleUpdateClinic(args, context);
  case ACTIONS.SUMMARIZE_COVERAGE:
    return handleSummarizeCoverage(args, context);
  case ACTIONS.BULK_CREATE_RESIDENTS:
    return handleBulkCreateResidents(args, context);
  case ACTIONS.BULK_CREATE_ATTENDINGS:
    return handleBulkCreateAttendings(args, context);
  case ACTIONS.UNDO: {
    const stepsRequested = Math.max(1, Math.min(Number.parseInt(args?.steps, 10) || 1, MAX_STACK_DEPTH));
    const records = await popUndoRecords({
      firestore: context.firestore,
      institutionId: context.institutionId,
      userId: context.userId,
      count: stepsRequested
    });
    if (!records.length) {
      return respond('There are no actions left to undo.');
    }

    const details = [];
    const perActionData = [];
    for (const record of records) {
      const result = await applyInverse(record, context);
      details.push(result?.message || 'Action undone.');
      perActionData.push(result?.data || null);
    }

    const message = records.length === 1
      ? details[0]
      : `Undid ${records.length} actions:\n- ${details.join('\n- ')}`;

    return respond(message, {
      undone: records.length,
      stepsRequested,
      details,
      results: perActionData
    });
  }
  case ACTIONS.INFO_ONLY:
    return handleInformational(args);
  default:
    return respond('I can help with scheduling changes, but I did not recognise that request.');
  }
}

module.exports = {
  handleAction,
  applyInverse
};
