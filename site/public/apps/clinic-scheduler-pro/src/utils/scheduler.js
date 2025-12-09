/**
 * Client-side scheduler for clinic assignments
 * Implements demand modeling, constraints, scoring, and lock-aware replacement.
 */

import { ConflictDetection } from './conflictDetection';

const dateKey = (date, slot) => `${date}_${slot}`;

const parseYMDToUTCDate = (ymd) => {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
};

export const Scheduler = {
    /**
     * Generate a schedule diff for the given date range.
     * Returns new assignments to add and unlocked existing assignments to delete.
     */
    generateSchedule: ({
        residents,
        attendings,
        existingAssignments,
        startDate,
        endDate,
        institution,
        rotations = [],
        options = {}
    }) => {
        const start = parseYMDToUTCDate(startDate);
        const end = parseYMDToUTCDate(endDate);

        // Create rotation lookup map
        const rotationMap = Object.fromEntries(rotations.map(r => [r.id, r]));

        // Helper: get resident's rotation for a date
        const getResidentRotation = (resident, dateStr) => {
            const monthStr = dateStr.slice(0, 7);
            const assignment = resident.rotationAssignments?.find(ra => ra.month === monthStr);
            if (!assignment) return null;
            return rotationMap[assignment.rotationId] || null;
        };

        // Index existing assignments by slot
        const assignmentsByDate = {};
        existingAssignments.forEach(a => {
            const key = dateKey(a.date, a.timeSlot);
            if (!assignmentsByDate[key]) assignmentsByDate[key] = [];
            assignmentsByDate[key].push(a);
        });

        const residentMap = Object.fromEntries(residents.map(r => [r.id, r]));

        const additions = [];
        const deletions = new Set(); // assignment ids to delete (unlocked only)
        const notes = [];

        // Deterministic ordering: iterate dates then slots then clinics sorted by id
        for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayOfWeek = d.getUTCDay(); // 0=Sunday, timezone-stable
            if (!options.includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) continue;

            ['AM', 'PM'].forEach(timeSlot => {
                // Build clinic demand for this slot
                const clinicsToday = [];
                attendings.forEach(att => {
                    (att.clinics || []).forEach(clinic => {
                        const hasSession = clinic.defaultSessions?.some(
                            s => s.dayOfWeek === dayOfWeek && s.timeSlot === timeSlot
                        );
                        if (hasSession) {
                            clinicsToday.push({
                                ...clinic,
                                attendingId: att.id,
                                attendingName: att.name
                            });
                        }
                    });
                });
                clinicsToday.sort((a, b) => a.id.localeCompare(b.id));

                const slotKey = dateKey(dateStr, timeSlot);
                if (!assignmentsByDate[slotKey]) assignmentsByDate[slotKey] = [];
                let slotAssignments = assignmentsByDate[slotKey];
                const locked = slotAssignments.filter(a => a.locked);
                const unlocked = slotAssignments.filter(a => !a.locked);
                const lockedResidentIds = new Set(locked.map(a => a.residentId));

                clinicsToday.forEach(clinic => {
                    const capacity = clinic.residentCapacity || 1;
                    const attending = attendings.find(a => a.id === clinic.attendingId);

                    // Separate existing assignments for this clinic
                    const lockedHere = locked.filter(a => a.clinicId === clinic.id);
                    const unlockedHere = unlocked.filter(a => a.clinicId === clinic.id);
                    const remainingSlots = Math.max(capacity - lockedHere.length, 0);

                    // Candidate pool = unlocked existing + free residents
                    const existingCandidates = unlockedHere
                        .map(a => residentMap[a.residentId])
                        .filter(Boolean);

                    const availableResidents = residents.filter(resident => {
                        if (!resident) return false;

                        // Get resident's current rotation
                        const rotation = getResidentRotation(resident, dateStr);

                        // Skip if on consult service (no clinic assignments at all)
                        if (rotation?.isConsultService) return false;

                        // Float rotation residents ARE eligible for clinic coverage
                        // (they'll be scored lower than rotation-matched residents)

                        // If attending requires specific rotation (e.g., surgeons), check match
                        if (attending?.requiredRotationId) {
                            const monthStr = dateStr.slice(0, 7);
                            const residentRotationAssignment = resident.rotationAssignments?.find(ra => ra.month === monthStr);
                            if (residentRotationAssignment?.rotationId !== attending.requiredRotationId) return false;
                        }

                        // skip if already locked in this slot (any clinic)
                        if (lockedResidentIds.has(resident.id)) return false;

                        // skip if currently assigned in this slot elsewhere (live view)
                        if (assignmentsByDate[slotKey].some(a => a.residentId === resident.id)) return false;

                        // vacation / half day / continuity conflicts
                        if (ConflictDetection.checkVacationConflict(resident, dateStr).length) return false;
                        if (resident.halfDaysOff?.some(off => off.date === dateStr && off.timeSlot === timeSlot)) return false;
                        if (ConflictDetection.checkContinuityConflict(resident, dateStr, timeSlot).length) return false;

                        // daily max 2 across AM/PM and clinics
                        const dayCount = Object.values(assignmentsByDate)
                            .flat()
                            .filter(a => a.date === dateStr && a.residentId === resident.id).length;
                        const maxPerDay = institution?.settings?.maxAssignmentsPerDay || 2;
                        if (dayCount >= maxPerDay) return false;

                        // weekly hours (client-side warning) — treat error as hard stop
                        const weekly = ConflictDetection.checkWeeklyHours(
                            Object.values(assignmentsByDate).flat().filter(a => a.residentId === resident.id),
                            resident.id,
                            dateStr,
                            institution?.settings?.acgme || {}
                        );
                        const weeklyErrors = weekly.filter(w => w.severity === 'error');
                        if (weeklyErrors.length) {
                            notes.push(`${resident.name} skipped on ${dateStr} ${timeSlot} (weekly hours limit)`);
                            return false;
                        }

                        return true;
                    });

                    // Deduplicate candidates (existing unlocked + available)
                    const candidateMap = new Map();
                    existingCandidates.forEach(r => candidateMap.set(r.id, r));
                    availableResidents.forEach(r => candidateMap.set(r.id, r));
                    const candidates = Array.from(candidateMap.values());

                    const scored = candidates.map(resident => {
                        let score = 0;
                        // Rotation/site match
                        const monthStr = dateStr.slice(0, 7);
                        const rotationAssignment = resident.rotationAssignments?.find(ra => ra.month === monthStr);
                        const residentRotation = rotationMap[rotationAssignment?.rotationId];
                        if (rotationAssignment?.primarySiteId === clinic.siteId) score += 10;

                        // Float rotation penalty (prefer rotation-matched residents)
                        if (residentRotation?.isFloat) score -= 8;

                        // Fairness penalty
                        const totalAssignments = Object.values(assignmentsByDate)
                            .flat()
                            .filter(a => a.residentId === resident.id).length;
                        score -= totalAssignments * 0.5;
                        // Tie-breaker deterministic: resident id
                        return { resident, score };
                    }).sort((a, b) => {
                        if (b.score !== a.score) return b.score - a.score;
                        return a.resident.id.localeCompare(b.resident.id);
                    });

                    const winners = scored.slice(0, Math.max(remainingSlots, 0));
                    const winnerIds = new Set(winners.map(w => w.resident.id));

                    // Decide which unlocked existing to keep vs replace
                    unlockedHere.forEach(a => {
                        if (!winnerIds.has(a.residentId)) {
                            deletions.add(a.id);
                        }
                    });

                    winners.forEach(w => {
                        const alreadyUnlocked = unlockedHere.find(a => a.residentId === w.resident.id);
                        if (alreadyUnlocked) {
                            // Keep as-is
                            return;
                        }
                        additions.push({
                            date: dateStr,
                            timeSlot,
                            residentId: w.resident.id,
                            residentName: w.resident.name,
                            attendingId: clinic.attendingId,
                            attendingName: clinic.attendingName,
                            clinicId: clinic.id,
                            clinicName: clinic.name,
                            siteId: clinic.siteId,
                            type: 'clinic',
                            status: 'scheduled',
                            locked: false
                        });
                    });

                    // Update working slot assignments (keep other clinics' rows)
                    const keptUnlocked = unlockedHere.filter(a => !deletions.has(a.id));
                    const newAdds = additions.filter(a => a.date === dateStr && a.timeSlot === timeSlot && a.clinicId === clinic.id);

                    // Remove deleted unlocked for this clinic
                    slotAssignments = slotAssignments.filter(a => !(a.clinicId === clinic.id && deletions.has(a.id)));
                    // Append new winners
                    newAdds.forEach(a => {
                        slotAssignments.push({ ...a, id: a.id || `new-${a.residentId}-${a.date}-${a.timeSlot}-${clinic.id}` });
                    });
                    assignmentsByDate[slotKey] = slotAssignments;
                });

                // === SST FILL PASS ===
                // After all clinic slots are assigned, fill unfilled residents with SST
                // Only for residents on rotations that allow SST
                const assignedResidentIds = new Set(
                    assignmentsByDate[slotKey]?.map(a => a.residentId) || []
                );

                // Find residents who can receive SST this slot
                const sstCandidates = residents.filter(resident => {
                    if (!resident) return false;
                    if (assignedResidentIds.has(resident.id)) return false;

                    // Check rotation allows SST
                    const rotation = getResidentRotation(resident, dateStr);
                    if (!rotation?.allowsSST) return false;

                    // Skip if on consult/float rotation
                    if (rotation?.isConsultService || rotation?.isFloat) return false;

                    // Check vacation/half day conflicts
                    if (ConflictDetection.checkVacationConflict(resident, dateStr).length) return false;
                    if (resident.halfDaysOff?.some(off => off.date === dateStr && off.timeSlot === timeSlot)) return false;

                    return true;
                });

                // Score by fairness: residents with fewer SST/ARE assignments get priority
                const scoredSST = sstCandidates.map(resident => {
                    const rotation = getResidentRotation(resident, dateStr);
                    const existingCount = Object.values(assignmentsByDate)
                        .flat()
                        .filter(a => a.residentId === resident.id && (a.type === 'sst' || a.type === 'are')).length;
                    // Determine if this resident should get ARE (vs SST)
                    const useARE = resident.areEligible && resident.areActive && rotation?.allowsARE;
                    return { resident, count: existingCount, useARE };
                }).sort((a, b) => {
                    if (a.count !== b.count) return a.count - b.count;
                    return a.resident.id.localeCompare(b.resident.id);
                });

                // Assign SST or ARE to candidates (limit: 1 per resident per slot)
                scoredSST.forEach(({ resident, useARE }) => {
                    // Check if already has assignment in this slot
                    if (assignmentsByDate[slotKey]?.some(a => a.residentId === resident.id)) return;

                    const assignmentType = useARE ? 'are' : 'sst';
                    const assignment = {
                        date: dateStr,
                        timeSlot,
                        residentId: resident.id,
                        residentName: resident.name,
                        type: assignmentType,
                        status: 'scheduled',
                        locked: false
                    };
                    additions.push(assignment);

                    // Track in working assignments
                    if (!assignmentsByDate[slotKey]) assignmentsByDate[slotKey] = [];
                    assignmentsByDate[slotKey].push({
                        ...assignment,
                        id: `new-${assignmentType}-${resident.id}-${dateStr}-${timeSlot}`
                    });
                });
            });
        }

        return {
            additions,
            deletions: Array.from(deletions),
            notes
        };
    }
};
