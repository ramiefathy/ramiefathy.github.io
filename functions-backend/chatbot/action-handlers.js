const crypto = require('crypto');
const { addWeeks, parseISO, isValid: isValidDate } = require('date-fns');
const { FieldValue, Timestamp } = require('firebase-admin/firestore');
const { ACTIONS } = require('./intents');
const { pushUndoRecord, popUndoRecord } = require('./undo-store');
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
  case ACTIONS.UNDO: {
    const record = await popUndoRecord({
      firestore: context.firestore,
      institutionId: context.institutionId,
      userId: context.userId
    });
    return applyInverse(record, context);
  }
  case ACTIONS.INFO_ONLY:
  default:
    return respond('I can help with scheduling changes, but I did not recognise that request.');
  }
}

module.exports = {
  handleAction,
  applyInverse
};
