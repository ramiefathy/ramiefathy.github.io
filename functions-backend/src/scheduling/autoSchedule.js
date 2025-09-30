/**
 * Auto-Scheduling Algorithm
 * Core logic for automatic schedule generation with ACGME compliance
 */

const { parseISO, format, addDays, differenceInDays } = require('date-fns');
const admin = require('firebase-admin');
const {
  TIME_SLOTS,
  normalizeAttending,
  makeSlotKey,
  makeGenericSlotKey,
  buildSlotsForMoment,
  getWeekKey
} = require('../../lib/attending-utils');
const { isResidentOnVacation, hasProtectedTime, checkDutyHourCompliance } = require('../utils/validators');

/**
 * Helper to push value to Map of arrays
 * @param {Map} map - Map to push to
 * @param {string} key - Key in map
 * @param {*} value - Value to push
 */
function pushToMap(map, key, value) {
  if (!map.has(key)) {
    map.set(key, []);
  }
  map.get(key).push(value);
}

/**
 * Build tracking maps for existing assignments
 * @param {Array} existingAssignments - Existing assignments
 * @returns {Object} Tracking maps
 */
function buildAssignmentMaps(existingAssignments) {
  const existingAssignmentsBySpecificSlot = new Map();
  const existingAssignmentsByGenericSlot = new Map();
  const assignmentsByResidentSlot = new Map();
  const residentWeekAssignmentCounts = new Map();
  const pairingCounts = new Map();

  existingAssignments.forEach(assignment => {
    if (!assignment.date || !assignment.timeSlot) {
      return;
    }

    const specificKey = makeSlotKey({
      date: assignment.date,
      timeSlot: assignment.timeSlot,
      attendingId: assignment.attendingId,
      clinicId: assignment.clinicId || 'noClinic'
    });
    pushToMap(existingAssignmentsBySpecificSlot, specificKey, assignment);

    const genericKey = makeGenericSlotKey({
      date: assignment.date,
      timeSlot: assignment.timeSlot,
      attendingId: assignment.attendingId
    });
    pushToMap(existingAssignmentsByGenericSlot, genericKey, assignment);

    if (assignment.residentId) {
      const residentSlotKey = `${assignment.residentId}|${assignment.date}|${assignment.timeSlot}`;
      pushToMap(assignmentsByResidentSlot, residentSlotKey, assignment);

      const weekKey = getWeekKey(assignment.date);
      const residentWeekKey = `${assignment.residentId}|${weekKey}`;
      residentWeekAssignmentCounts.set(
        residentWeekKey,
        (residentWeekAssignmentCounts.get(residentWeekKey) || 0) + 1
      );

      if (assignment.attendingId) {
        const pairingKey = `${assignment.residentId}|${weekKey}|${assignment.attendingId}`;
        pairingCounts.set(pairingKey, (pairingCounts.get(pairingKey) || 0) + 1);
      }
    }
  });

  return {
    existingAssignmentsBySpecificSlot,
    existingAssignmentsByGenericSlot,
    assignmentsByResidentSlot,
    residentWeekAssignmentCounts,
    pairingCounts
  };
}

/**
 * Generate continuity clinic assignments
 * @param {Object} params - Parameters
 * @returns {Array} Continuity assignments
 */
function generateContinuityAssignments(params) {
  const {
    residents,
    startDateObj,
    endDateObj,
    options,
    protectedTimes,
    existingAssignments,
    newAssignments,
    assignmentsByResidentSlot,
    residentWeekAssignmentCounts,
    userId
  } = params;

  const continuityAssignments = [];
  const totalDays = differenceInDays(endDateObj, startDateObj) + 1;

  const dayMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const currentDate = addDays(startDateObj, dayOffset);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayOfWeek = currentDate.getDay();

    if (!options.includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      continue;
    }

    for (const timeSlot of TIME_SLOTS) {
      for (const resident of residents) {
        if (!resident.continuityDay || !resident.continuityTime || !resident.continuitySiteId) {
          continue;
        }

        if (resident.continuityTime !== timeSlot) {
          continue;
        }

        const targetDay = dayMap[resident.continuityDay?.toLowerCase?.()];
        if (targetDay !== dayOfWeek) {
          continue;
        }

        if (isResidentOnVacation(resident, currentDate)) {
          continue;
        }

        if (hasProtectedTime(resident, currentDate, timeSlot, protectedTimes)) {
          continue;
        }

        const residentSlotKey = `${resident.id}|${dateStr}|${timeSlot}`;
        if (assignmentsByResidentSlot.has(residentSlotKey)) {
          continue;
        }

        const continuityAssignment = {
          date: dateStr,
          timeSlot,
          residentId: resident.id,
          attendingId: null,
          type: 'continuity',
          siteId: resident.continuitySiteId,
          createdBy: userId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const compliance = checkDutyHourCompliance(
          [...existingAssignments, ...newAssignments, ...continuityAssignments],
          resident.id,
          continuityAssignment
        );

        if (compliance.compliant) {
          continuityAssignments.push(continuityAssignment);
          pushToMap(assignmentsByResidentSlot, residentSlotKey, continuityAssignment);

          const weekKey = getWeekKey(dateStr);
          const residentWeekKey = `${resident.id}|${weekKey}`;
          residentWeekAssignmentCounts.set(
            residentWeekKey,
            (residentWeekAssignmentCounts.get(residentWeekKey) || 0) + 1
          );
        }
      }
    }
  }

  return continuityAssignments;
}

/**
 * Find eligible candidates for a clinic slot
 * @param {Object} params - Parameters
 * @returns {Array} Sorted candidates
 */
function findCandidatesForSlot(params) {
  const {
    residents,
    slot,
    attending,
    currentDate,
    dateStr,
    timeSlot,
    monthStr,
    protectedTimes,
    assignmentsByResidentSlot,
    existingAssignments,
    newAssignments,
    pairingCounts,
    residentWeekAssignmentCounts,
    maxPairingsPerWeek
  } = params;

  const candidates = [];

  for (const resident of residents) {
    if (isResidentOnVacation(resident, currentDate)) {
      continue;
    }

    if (hasProtectedTime(resident, currentDate, timeSlot, protectedTimes)) {
      continue;
    }

    const residentSlotKey = `${resident.id}|${dateStr}|${timeSlot}`;
    if (assignmentsByResidentSlot.has(residentSlotKey)) {
      continue;
    }

    const rotation = resident.rotationAssignments?.find(ra => ra.month === monthStr);
    if (!rotation) {
      continue;
    }

    const supportsRotation = Array.isArray(attending.rotationIds)
      ? attending.rotationIds.includes(rotation.rotationId)
      : false;

    const siteMatch = slot.siteId && rotation.primarySiteId
      ? slot.siteId === rotation.primarySiteId
      : false;

    if (!supportsRotation && !siteMatch) {
      continue;
    }

    const compliance = checkDutyHourCompliance(
      [...existingAssignments, ...newAssignments],
      resident.id,
      { date: dateStr, timeSlot }
    );
    if (!compliance.compliant) {
      continue;
    }

    const weekKey = getWeekKey(dateStr);
    const pairingKey = `${resident.id}|${weekKey}|${attending.id}`;
    if (pairingCounts.get(pairingKey) >= maxPairingsPerWeek) {
      continue;
    }

    const residentWeekKey = `${resident.id}|${weekKey}`;
    const weeklyCount = residentWeekAssignmentCounts.get(residentWeekKey) || 0;

    candidates.push({
      resident,
      supportsRotation,
      siteMatch,
      weeklyCount,
      pairingCount: pairingCounts.get(pairingKey) || 0
    });
  }

  // Sort by priority: site match > rotation support > fewest weekly assignments > fewest pairings
  candidates.sort((a, b) => {
    if (b.siteMatch !== a.siteMatch) return b.siteMatch - a.siteMatch;
    if (b.supportsRotation !== a.supportsRotation) return b.supportsRotation - a.supportsRotation;
    if (a.weeklyCount !== b.weeklyCount) return a.weeklyCount - b.weeklyCount;
    return a.pairingCount - b.pairingCount;
  });

  return candidates;
}

/**
 * Generate clinical assignments for attending clinics
 * @param {Object} params - Parameters
 * @returns {Array} Clinical assignments
 */
function generateClinicalAssignments(params) {
  const {
    residents,
    attendings,
    startDateObj,
    endDateObj,
    options,
    protectedTimes,
    existingAssignments,
    continuityAssignments,
    existingAssignmentsBySpecificSlot,
    existingAssignmentsByGenericSlot,
    assignmentsByResidentSlot,
    residentWeekAssignmentCounts,
    pairingCounts,
    maxPairingsPerWeek,
    userId
  } = params;

  const clinicalAssignments = [];
  const newAssignmentsBySlot = new Map();
  const totalDays = differenceInDays(endDateObj, startDateObj) + 1;

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const currentDate = addDays(startDateObj, dayOffset);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayOfWeek = currentDate.getDay();
    const monthStr = format(currentDate, 'yyyy-MM');

    if (!options.includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      continue;
    }

    for (const timeSlot of TIME_SLOTS) {
      const slots = [];
      attendings.forEach(attending => {
        const momentSlots = buildSlotsForMoment(attending, dateStr, dayOfWeek, timeSlot);
        if (momentSlots.length) {
          slots.push(...momentSlots);
        }
      });

      if (!slots.length) {
        continue;
      }

      for (const slot of slots) {
        const attending = attendings.find(a => a.id === slot.attendingId);
        if (!attending) {
          continue;
        }

        const specificKey = makeSlotKey({
          date: slot.date,
          timeSlot: slot.timeSlot,
          attendingId: slot.attendingId,
          clinicId: slot.assignmentClinicId || slot.clinicId || 'noClinic'
        });

        let existingForSlot = existingAssignmentsBySpecificSlot.get(specificKey) || [];
        if (!existingForSlot.length) {
          const genericKey = makeGenericSlotKey({
            date: slot.date,
            timeSlot: slot.timeSlot,
            attendingId: slot.attendingId
          });
          existingForSlot = existingAssignmentsByGenericSlot.get(genericKey) || [];
        }

        if (!options.overwrite && existingForSlot.length >= slot.capacity) {
          continue;
        }

        const newForSlot = newAssignmentsBySlot.get(slot.key) || [];
        const baselineExisting = options.overwrite ? 0 : existingForSlot.length;
        let capacityRemaining = slot.capacity - baselineExisting - newForSlot.length;
        if (capacityRemaining <= 0) {
          continue;
        }

        const candidates = findCandidatesForSlot({
          residents,
          slot,
          attending,
          currentDate,
          dateStr,
          timeSlot,
          monthStr,
          protectedTimes,
          assignmentsByResidentSlot,
          existingAssignments,
          newAssignments: [...continuityAssignments, ...clinicalAssignments],
          pairingCounts,
          residentWeekAssignmentCounts,
          maxPairingsPerWeek
        });

        for (const candidate of candidates) {
          if (capacityRemaining <= 0) {
            break;
          }

          const resident = candidate.resident;
          const rotation = resident.rotationAssignments?.find(ra => ra.month === monthStr);

          const assignment = {
            date: dateStr,
            timeSlot,
            residentId: resident.id,
            attendingId: slot.attendingId,
            type: 'clinical',
            siteId: slot.siteId || '',
            clinicId: slot.clinicId,
            rotationId: rotation?.rotationId,
            createdBy: userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };

          clinicalAssignments.push(assignment);

          if (!newAssignmentsBySlot.has(slot.key)) {
            newAssignmentsBySlot.set(slot.key, []);
          }
          newAssignmentsBySlot.get(slot.key).push(assignment);

          const residentSlotKey = `${resident.id}|${dateStr}|${timeSlot}`;
          pushToMap(assignmentsByResidentSlot, residentSlotKey, assignment);

          const weekKey = getWeekKey(dateStr);
          const residentWeekKey = `${resident.id}|${weekKey}`;
          residentWeekAssignmentCounts.set(
            residentWeekKey,
            (residentWeekAssignmentCounts.get(residentWeekKey) || 0) + 1
          );

          const pairingKey = `${resident.id}|${weekKey}|${slot.attendingId}`;
          pairingCounts.set(pairingKey, (pairingCounts.get(pairingKey) || 0) + 1);

          capacityRemaining -= 1;
        }
      }
    }
  }

  return clinicalAssignments;
}

/**
 * Main auto-scheduling algorithm
 * @param {Object} params - Scheduling parameters
 * @returns {Array} Generated assignments
 */
function generateSchedule(params) {
  const {
    attendings,
    residents,
    existingAssignments,
    startDate,
    endDate,
    protectedTimes,
    sites,
    rules,
    options,
    userId
  } = params;

  // Normalize attendings with site information
  const normalizedAttendings = attendings.map(att => normalizeAttending(att, sites));

  // Parse dates
  const startDateObj = parseISO(startDate);
  const endDateObj = parseISO(endDate);

  // Extract max pairings per week from rules
  let maxPairingsPerWeek = 2;
  for (const rule of rules) {
    const configured = (rule?.config && rule.config.maxPairingsPerWeek) || rule?.maxPairingsPerWeek;
    const parsed = Number(configured);
    if (Number.isFinite(parsed) && parsed > 0) {
      maxPairingsPerWeek = parsed;
      break;
    }
  }

  // Build tracking maps
  const {
    existingAssignmentsBySpecificSlot,
    existingAssignmentsByGenericSlot,
    assignmentsByResidentSlot,
    residentWeekAssignmentCounts,
    pairingCounts
  } = buildAssignmentMaps(existingAssignments);

  // Generate continuity clinic assignments
  const continuityAssignments = generateContinuityAssignments({
    residents,
    startDateObj,
    endDateObj,
    options,
    protectedTimes,
    existingAssignments,
    newAssignments: [],
    assignmentsByResidentSlot,
    residentWeekAssignmentCounts,
    userId
  });

  // Generate clinical assignments
  const clinicalAssignments = generateClinicalAssignments({
    residents,
    attendings: normalizedAttendings,
    startDateObj,
    endDateObj,
    options,
    protectedTimes,
    existingAssignments,
    continuityAssignments,
    existingAssignmentsBySpecificSlot,
    existingAssignmentsByGenericSlot,
    assignmentsByResidentSlot,
    residentWeekAssignmentCounts,
    pairingCounts,
    maxPairingsPerWeek,
    userId
  });

  return [...continuityAssignments, ...clinicalAssignments];
}

module.exports = {
  generateSchedule,
  buildAssignmentMaps,
  generateContinuityAssignments,
  generateClinicalAssignments,
  findCandidatesForSlot
};