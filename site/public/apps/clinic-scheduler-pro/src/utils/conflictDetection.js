/**
 * Conflict detection utilities for clinic scheduler
 * ACGME compliance checking and scheduling conflict detection
 */

import { normalizeDate, getStartOfWeekSunday, getEndOfWeekSaturday } from './dateUtils';

export const ConflictDetection = {
    // Check if a person is already assigned at the same date/time
    checkDoubleBooking: (assignments, newAssignment, excludeId = null) => {
        const conflicts = [];

        for (const assignment of assignments) {
            // Skip if this is the assignment being edited
            if (excludeId && assignment.id === excludeId) continue;

            // Check if same person, same date, same time
            if (assignment.date === newAssignment.date &&
                assignment.timeSlot === newAssignment.timeSlot) {

                if (assignment.residentId === newAssignment.residentId && newAssignment.residentId) {
                    conflicts.push({
                        type: 'double-booking',
                        severity: 'error',
                        message: `Resident is already assigned at ${newAssignment.timeSlot} on this date`,
                        conflictingAssignment: assignment
                    });
                }

                if (assignment.attendingId === newAssignment.attendingId && newAssignment.attendingId) {
                    conflicts.push({
                        type: 'double-booking',
                        severity: 'error',
                        message: `Attending is already assigned at ${newAssignment.timeSlot} on this date`,
                        conflictingAssignment: assignment
                    });
                }
            }
        }

        return conflicts;
    },

    // Check if person is on vacation
    checkVacationConflict: (person, date) => {
        if (!person || !person.vacationWeeks) return [];

        const assignmentDate = normalizeDate(date);
        const conflicts = [];

        for (const vacationWeek of person.vacationWeeks) {
            const vacationStart = new Date(vacationWeek);
            const vacationEnd = new Date(vacationStart);
            vacationEnd.setDate(vacationEnd.getDate() + 6);

            if (assignmentDate >= vacationStart && assignmentDate <= vacationEnd) {
                conflicts.push({
                    type: 'vacation',
                    severity: 'warning',
                    message: `${person.name} is on vacation this week`,
                    vacationDates: { start: vacationStart, end: vacationEnd }
                });
            }
        }

        return conflicts;
    },

    // Check continuity clinic conflicts
    checkContinuityConflict: (resident, date, timeSlot) => {
        if (!resident || !resident.continuityDay) return [];

        const assignmentDate = normalizeDate(date);
        const dayOfWeek = assignmentDate.getDay();
        const dayMap = {
            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
            'thursday': 4, 'friday': 5, 'saturday': 6
        };

        const continuityDayNum = dayMap[resident.continuityDay.toLowerCase()];

        if (dayOfWeek === continuityDayNum && timeSlot === resident.continuityTime) {
            return [{
                type: 'continuity-clinic',
                severity: 'info',
                message: `This is ${resident.name}'s continuity clinic time`,
                isExpected: true
            }];
        }

        return [];
    },

    // Check maximum assignments per day
    checkMaxAssignments: (assignments, person, date, maxPerDay = 2) => {
        const dayAssignments = assignments.filter(a => {
            if (a.date !== date) return false;
            if (person.role === 'resident' && a.residentId === person.id) return true;
            if (person.role === 'attending' && a.attendingId === person.id) return true;
            return false;
        });

        if (dayAssignments.length >= maxPerDay) {
            return [{
                type: 'max-assignments',
                severity: 'warning',
                message: `${person.name} already has ${dayAssignments.length} assignments on this date (max: ${maxPerDay})`,
                currentCount: dayAssignments.length,
                maximum: maxPerDay
            }];
        }

        return [];
    },

    // ACGME Compliance: Check weekly duty hours (max 80 hours/week)
    // Excludes virtual assignments (continuity clinics, protected times) from calculation
    checkWeeklyHours: (assignments, residentId, newAssignmentDate, options = {}) => {
        const HOURS_PER_HALF_DAY = options.hoursPerHalfDay || 4;
        const MAX_WEEKLY_HOURS = options.maxWeeklyHours || 80;
        const WARNING_THRESHOLD = options.warningThreshold || 70;

        const assignmentDate = normalizeDate(newAssignmentDate);
        const weekStart = getStartOfWeekSunday(assignmentDate);
        const weekEnd = getEndOfWeekSaturday(assignmentDate);

        // Count hours for this resident in the same week
        // CRITICAL: Exclude virtual assignments (continuity, protected times)
        const weeklyAssignments = assignments.filter(a => {
            if (a.residentId !== residentId) return false;
            if (a.virtual === true) return false; // Exclude virtual assignments
            if (a.type === 'continuity' || a.type === 'protected') return false; // Also check type field
            const aDate = normalizeDate(a.date);
            return aDate >= weekStart && aDate <= weekEnd;
        });

        const currentHours = weeklyAssignments.length * HOURS_PER_HALF_DAY;
        const projectedHours = currentHours + HOURS_PER_HALF_DAY;

        if (projectedHours > MAX_WEEKLY_HOURS) {
            return [{
                type: 'acgme-weekly-hours',
                severity: 'error',
                message: `Would exceed ${MAX_WEEKLY_HOURS}-hour weekly limit (current: ${currentHours}h, would be: ${projectedHours}h)`,
                currentHours,
                projectedHours,
                maxHours: MAX_WEEKLY_HOURS
            }];
        }

        // Warning at threshold
        if (projectedHours >= WARNING_THRESHOLD) {
            return [{
                type: 'acgme-weekly-hours',
                severity: 'warning',
                message: `Approaching weekly hour limit (would be ${projectedHours}h of ${MAX_WEEKLY_HOURS}h max)`,
                currentHours,
                projectedHours,
                maxHours: MAX_WEEKLY_HOURS
            }];
        }

        return [];
    },

    // ACGME Compliance: Check consecutive duty days (max 6 consecutive days)
    // Excludes virtual assignments (continuity clinics, protected times) from calculation
    checkConsecutiveDays: (assignments, residentId, newAssignmentDate, options = {}) => {
        const MAX_CONSECUTIVE_DAYS = options.maxConsecutiveDays || 6;
        const WARNING_THRESHOLD = options.warningThreshold || 5;
        const assignmentDate = normalizeDate(newAssignmentDate);

        // Get all dates this resident has assignments
        // CRITICAL: Exclude virtual assignments (continuity, protected times)
        const residentDates = new Set(
            assignments
                .filter(a => {
                    if (a.residentId !== residentId) return false;
                    if (a.virtual === true) return false; // Exclude virtual assignments
                    if (a.type === 'continuity' || a.type === 'protected') return false;
                    return true;
                })
                .map(a => a.date)
        );

        // Add the new assignment date
        const dateStr = assignmentDate.toISOString().split('T')[0];
        residentDates.add(dateStr);

        // Count consecutive days including and before the new date
        let consecutiveBefore = 0;
        let checkDate = new Date(assignmentDate);
        checkDate.setDate(checkDate.getDate() - 1);

        while (consecutiveBefore < MAX_CONSECUTIVE_DAYS) {
            const checkStr = checkDate.toISOString().split('T')[0];
            if (residentDates.has(checkStr)) {
                consecutiveBefore++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        // Count consecutive days after the new date
        let consecutiveAfter = 0;
        checkDate = new Date(assignmentDate);
        checkDate.setDate(checkDate.getDate() + 1);

        while (consecutiveAfter < MAX_CONSECUTIVE_DAYS) {
            const checkStr = checkDate.toISOString().split('T')[0];
            if (residentDates.has(checkStr)) {
                consecutiveAfter++;
                checkDate.setDate(checkDate.getDate() + 1);
            } else {
                break;
            }
        }

        const totalConsecutive = consecutiveBefore + 1 + consecutiveAfter;

        if (totalConsecutive > MAX_CONSECUTIVE_DAYS) {
            return [{
                type: 'acgme-consecutive-days',
                severity: 'error',
                message: `Would exceed ${MAX_CONSECUTIVE_DAYS} consecutive days of duty (would be ${totalConsecutive} days)`,
                consecutiveDays: totalConsecutive,
                maxDays: MAX_CONSECUTIVE_DAYS
            }];
        }

        // Warning at threshold
        if (totalConsecutive >= WARNING_THRESHOLD) {
            return [{
                type: 'acgme-consecutive-days',
                severity: 'warning',
                message: `${totalConsecutive} consecutive duty days (max: ${MAX_CONSECUTIVE_DAYS})`,
                consecutiveDays: totalConsecutive,
                maxDays: MAX_CONSECUTIVE_DAYS
            }];
        }

        return [];
    },

    // Check protected time conflicts
    checkProtectedTime: (protectedTimes, date, timeSlot, residentPGY) => {
        if (!protectedTimes || !protectedTimes.length) return [];

        const assignmentDate = normalizeDate(date);
        const dayOfWeek = assignmentDate.getDay();
        const conflicts = [];

        for (const pt of protectedTimes) {
            if (pt.dayOfWeek === dayOfWeek && pt.timeSlot === timeSlot) {
                // Check if this protected time applies to this resident
                if (pt.appliesTo === 'all' ||
                    (pt.appliesTo === residentPGY) ||
                    (pt.appliesTo === 'junior' && residentPGY && parseInt(residentPGY.replace('PGY', '')) <= 2) ||
                    (pt.appliesTo === 'senior' && residentPGY && parseInt(residentPGY.replace('PGY', '')) >= 3)) {

                    conflicts.push({
                        type: 'protected-time',
                        severity: pt.mandatory ? 'error' : 'warning',
                        message: `${pt.name} is scheduled at this time${pt.mandatory ? ' (mandatory)' : ''}`,
                        protectedTime: pt
                    });
                }
            }
        }

        return conflicts;
    },

    // Main conflict checking function
    checkAllConflicts: ({
        assignments,
        newAssignment,
        attendings,
        residents,
        institution,
        excludeId = null
    }) => {
        const allConflicts = [];

        // Check double booking
        const doubleBooking = ConflictDetection.checkDoubleBooking(assignments, newAssignment, excludeId);
        allConflicts.push(...doubleBooking);

        // Check vacation conflicts
        if (newAssignment.residentId) {
            const resident = residents.find(r => r.id === newAssignment.residentId);
            if (resident) {
                const vacationConflicts = ConflictDetection.checkVacationConflict(resident, newAssignment.date);
                allConflicts.push(...vacationConflicts);

                // Check continuity clinic
                const continuityConflicts = ConflictDetection.checkContinuityConflict(
                    resident,
                    newAssignment.date,
                    newAssignment.timeSlot
                );
                allConflicts.push(...continuityConflicts);

                // Check max assignments
                const maxConflicts = ConflictDetection.checkMaxAssignments(
                    assignments,
                    { ...resident, role: 'resident' },
                    newAssignment.date,
                    institution?.settings?.maxAssignmentsPerDay || 2
                );
                allConflicts.push(...maxConflicts);

                // Check protected time
                const protectedConflicts = ConflictDetection.checkProtectedTime(
                    institution?.settings?.protectedTimes,
                    newAssignment.date,
                    newAssignment.timeSlot,
                    resident.pgyStatus || resident.pgyLevel
                );
                allConflicts.push(...protectedConflicts);

                // ACGME Compliance: Check weekly duty hours (80h max)
                const flatAssignments = Array.isArray(assignments)
                    ? assignments
                    : Object.values(assignments).flat();

                // Build ACGME options from institution settings
                const acgmeSettings = institution?.settings?.acgme || {};
                const acgmeOptions = {
                    maxWeeklyHours: acgmeSettings.maxWeeklyHours || 80,
                    warningThreshold: acgmeSettings.weeklyHoursWarning || 70,
                    hoursPerHalfDay: acgmeSettings.hoursPerHalfDay || 4,
                    maxConsecutiveDays: acgmeSettings.maxConsecutiveDays || 6,
                    consecutiveDaysWarning: acgmeSettings.consecutiveDaysWarning || 5
                };

                const weeklyHoursConflicts = ConflictDetection.checkWeeklyHours(
                    flatAssignments,
                    resident.id,
                    newAssignment.date,
                    acgmeOptions
                );
                allConflicts.push(...weeklyHoursConflicts);

                // ACGME Compliance: Check consecutive duty days (6 max)
                const consecutiveDaysConflicts = ConflictDetection.checkConsecutiveDays(
                    flatAssignments,
                    resident.id,
                    newAssignment.date,
                    { maxConsecutiveDays: acgmeOptions.maxConsecutiveDays, warningThreshold: acgmeOptions.consecutiveDaysWarning }
                );
                allConflicts.push(...consecutiveDaysConflicts);
            }
        }

        if (newAssignment.attendingId) {
            const attending = attendings.find(a => a.id === newAssignment.attendingId);
            if (attending) {
                const vacationConflicts = ConflictDetection.checkVacationConflict(attending, newAssignment.date);
                allConflicts.push(...vacationConflicts);

                // Check max assignments for attending
                const maxConflicts = ConflictDetection.checkMaxAssignments(
                    assignments,
                    { ...attending, role: 'attending' },
                    newAssignment.date,
                    institution?.settings?.maxAttendingAssignmentsPerDay || 4
                );
                allConflicts.push(...maxConflicts);
            }
        }

        return {
            hasConflicts: allConflicts.length > 0,
            hasErrors: allConflicts.some(c => c.severity === 'error'),
            hasWarnings: allConflicts.some(c => c.severity === 'warning'),
            conflicts: allConflicts,
            canProceed: !allConflicts.some(c => c.severity === 'error'),
            summary: allConflicts.length > 0
                ? `Found ${allConflicts.filter(c => c.severity === 'error').length} errors, ${allConflicts.filter(c => c.severity === 'warning').length} warnings`
                : 'No conflicts detected'
        };
    }
};

export default ConflictDetection;
