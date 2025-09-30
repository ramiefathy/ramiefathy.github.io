/**
 * Validation Utilities
 * Functions for validating residents, assignments, and ACGME compliance
 */

const {
  parseISO,
  addDays,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  format
} = require('date-fns');

/**
 * Check if resident is on vacation for a given date
 * @param {Object} resident - Resident object with vacationWeeks array
 * @param {Date} date - Date to check
 * @returns {boolean}
 */
function isResidentOnVacation(resident, date) {
  if (!resident.vacationWeeks || resident.vacationWeeks.length === 0) {
    return false;
  }

  return resident.vacationWeeks.some(vw => {
    const vacationStart = parseISO(vw);
    const vacationEnd = addDays(vacationStart, 6);
    return isWithinInterval(date, { start: vacationStart, end: vacationEnd });
  });
}

/**
 * Check if resident has protected time for a specific time slot
 * @param {Object} resident - Resident object
 * @param {Date} date - Date to check
 * @param {string} timeSlot - Time slot (AM/PM)
 * @param {Array} protectedTimes - Institution's protected times configuration
 * @returns {boolean}
 */
function hasProtectedTime(resident, date, timeSlot, protectedTimes) {
  const dayOfWeek = date.getDay();
  const residentPGY = resident.pgyStatus || 'PGY-1';

  return protectedTimes.some(pt =>
    pt.dayOfWeek === dayOfWeek &&
    pt.timeSlot === timeSlot &&
    (pt.appliesTo === 'all' || pt.appliesTo === residentPGY)
  );
}

/**
 * Check ACGME duty hour compliance for a new assignment
 * @param {Array} assignments - All assignments for the institution
 * @param {string} residentId - Resident's ID
 * @param {Object} newAssignment - New assignment to check
 * @returns {Object} - { compliant: boolean, reason?: string }
 */
function checkDutyHourCompliance(assignments, residentId, newAssignment) {
  // ACGME Rules:
  // - Max 80 hours per week averaged over 4 weeks
  // - Max 24 hours continuous duty + 4 hours for transitions
  // - Min 8 hours off between shifts
  // - Min 1 day off per week averaged over 4 weeks

  const relevantAssignments = assignments.filter(a => a.residentId === residentId);
  const weekStart = startOfWeek(parseISO(newAssignment.date), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(parseISO(newAssignment.date), { weekStartsOn: 0 });

  // Check weekly hours
  const weeklyAssignments = relevantAssignments.filter(a => {
    const date = parseISO(a.date);
    return isWithinInterval(date, { start: weekStart, end: weekEnd });
  });

  const weeklyHours = weeklyAssignments.length * 4; // Assuming 4 hours per half-day
  const newTotalHours = weeklyHours + 4;

  if (newTotalHours > 80) {
    return {
      compliant: false,
      reason: `Would exceed 80-hour weekly limit (current: ${weeklyHours}h)`
    };
  }

  // Check for minimum rest between shifts
  const sameDay = relevantAssignments.filter(a => a.date === newAssignment.date);
  if (sameDay.length > 0 && sameDay[0].timeSlot !== newAssignment.timeSlot) {
    // Both AM and PM on same day is allowed
    return { compliant: true };
  }

  // Check for consecutive days
  const previousDay = format(addDays(parseISO(newAssignment.date), -1), 'yyyy-MM-dd');

  // Simple check: no more than 6 consecutive days
  let consecutiveDays = 1;
  let checkDate = previousDay;
  for (let i = 0; i < 6; i++) {
    if (relevantAssignments.some(a => a.date === checkDate)) {
      consecutiveDays++;
    } else {
      break;
    }
    checkDate = format(addDays(parseISO(checkDate), -1), 'yyyy-MM-dd');
  }

  if (consecutiveDays >= 6) {
    return {
      compliant: false,
      reason: 'Would exceed 6 consecutive days of duty'
    };
  }

  return { compliant: true };
}

module.exports = {
  isResidentOnVacation,
  hasProtectedTime,
  checkDutyHourCompliance
};