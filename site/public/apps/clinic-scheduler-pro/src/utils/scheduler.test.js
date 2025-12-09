import { describe, it, expect } from 'vitest';
import { Scheduler } from './scheduler';

// Mock data
const mockResidents = [
    {
        id: 'r1',
        name: 'Resident 1',
        halfDaysOff: [{ date: '2023-11-01', timeSlot: 'AM' }],
        rotationAssignments: [{ month: '2023-11', primarySiteId: 'site1' }]
    },
    {
        id: 'r2',
        name: 'Resident 2',
        rotationAssignments: [{ month: '2023-11', primarySiteId: 'site2' }]
    },
    {
        id: 'r3',
        name: 'Resident 3',
        rotationAssignments: [{ month: '2023-11', primarySiteId: 'site1' }]
    }
];

const mockAttendings = [
    {
        id: 'a1',
        name: 'Attending 1',
        clinics: [{
            id: 'c1',
            name: 'Clinic 1',
            siteId: 'site1',
            residentCapacity: 2,
            defaultSessions: [{ dayOfWeek: 3, timeSlot: 'AM' }] // Wednesday
        }]
    },
    {
        id: 'a2',
        name: 'Attending 2',
        clinics: [{
            id: 'c2',
            name: 'Clinic 2',
            siteId: 'site2',
            residentCapacity: 1,
            defaultSessions: [{ dayOfWeek: 3, timeSlot: 'AM' }] // Wednesday same slot
        }]
    }
];

describe('Scheduler', () => {
    it('respects half-days off', () => {
        const result = Scheduler.generateSchedule({
            residents: mockResidents,
            attendings: mockAttendings,
            existingAssignments: [],
            startDate: '2023-11-01', // Wednesday
            endDate: '2023-11-01',
            options: { includeWeekends: true }
        });

        const adds = result.additions;
        expect(adds.length).toBeGreaterThanOrEqual(1);
        const assignedIds = adds.map(a => a.residentId);
        expect(assignedIds).not.toContain('r1');
        expect(assignedIds).toContain('r2');
    });

    it('prevents double-booking across clinics in same slot', () => {
        const result = Scheduler.generateSchedule({
            residents: mockResidents,
            attendings: mockAttendings,
            existingAssignments: [],
            startDate: '2023-11-15', // Wednesday
            endDate: '2023-11-15',
            options: { includeWeekends: true }
        });

        const assigned = result.additions.filter(a => a.date === '2023-11-15' && a.timeSlot === 'AM');
        const residentSlots = assigned.map(a => `${a.residentId}-${a.date}-${a.timeSlot}`);
        const unique = new Set(residentSlots);
        expect(unique.size).toBe(residentSlots.length); // no resident appears twice same slot
    });

    it('enforces daily cap of 2 assignments', () => {
        const preExisting = [
            { id: 'am1', residentId: 'r1', clinicId: 'c1', date: '2023-11-15', timeSlot: 'AM' },
            { id: 'pm1', residentId: 'r1', clinicId: 'c2', date: '2023-11-15', timeSlot: 'PM' }
        ];

        const result = Scheduler.generateSchedule({
            residents: mockResidents,
            attendings: mockAttendings,
            existingAssignments: preExisting,
            startDate: '2023-11-15',
            endDate: '2023-11-15',
            options: { includeWeekends: true }
        });

        // r1 already has 2; ensure new additions do not include r1
        const additionsForDay = result.additions.filter(a => a.date === '2023-11-15');
        expect(additionsForDay.every(a => a.residentId !== 'r1')).toBe(true);
    });

    it('blocks assignments exceeding weekly hours', () => {
        // Use a lower limit to trigger the block with fewer assignments
        // 20 hours max. 4 hours per slot. 5 slots = 20 hours. 6th slot should fail.

        // Create 6 assignments in the same week (Nov 5 - Nov 11)
        // Nov 5 (Sun), Nov 6 (Mon), Nov 7 (Tue)
        const heavyWeek = [
            { id: 'h1', residentId: 'r1', clinicId: 'c1', date: '2023-11-05', timeSlot: 'AM' },
            { id: 'h2', residentId: 'r1', clinicId: 'c1', date: '2023-11-05', timeSlot: 'PM' },
            { id: 'h3', residentId: 'r1', clinicId: 'c1', date: '2023-11-06', timeSlot: 'AM' },
            { id: 'h4', residentId: 'r1', clinicId: 'c1', date: '2023-11-06', timeSlot: 'PM' },
            { id: 'h5', residentId: 'r1', clinicId: 'c1', date: '2023-11-07', timeSlot: 'AM' },
            { id: 'h6', residentId: 'r1', clinicId: 'c1', date: '2023-11-07', timeSlot: 'PM' }
        ];
        // Total 24 hours.

        const result = Scheduler.generateSchedule({
            residents: mockResidents,
            attendings: mockAttendings,
            existingAssignments: heavyWeek,
            startDate: '2023-11-08', // Wednesday, same week
            endDate: '2023-11-08',
            institution: {
                settings: {
                    acgme: { maxWeeklyHours: 20 }
                }
            },
            options: { includeWeekends: true }
        });

        expect(result.additions.some(a => a.residentId === 'r1')).toBe(false);
    });

    it('prioritizes site match deterministically', () => {
        const result = Scheduler.generateSchedule({
            residents: mockResidents,
            attendings: mockAttendings,
            existingAssignments: [],
            startDate: '2023-11-08',
            endDate: '2023-11-08',
            options: { includeWeekends: true }
        });

        const adds = result.additions;
        expect(adds.length).toBeGreaterThanOrEqual(1);
        expect(adds[0].residentId).toBe('r1'); // site1 match wins over r2
    });

    it('prefers less busy residents (fairness)', () => {
        const heavyAssignments = Array.from({ length: 10 }).map((_, i) => ({
            id: `old-${i}`,
            residentId: 'r1',
            clinicId: 'c1',
            date: '2023-10-01', // Past assignments
            timeSlot: 'PM'
        }));

        // Use a custom attending with capacity 1 to force a choice
        const singleCapAttending = [{
            ...mockAttendings[0],
            clinics: [{ ...mockAttendings[0].clinics[0], residentCapacity: 1 }]
        }];

        const result = Scheduler.generateSchedule({
            residents: [mockResidents[0], mockResidents[2]], // r1 (busy), r3 (free)
            attendings: singleCapAttending,
            existingAssignments: heavyAssignments,
            startDate: '2023-11-15',
            endDate: '2023-11-15',
            options: { includeWeekends: true }
        });

        expect(result.additions.length).toBe(1);
        expect(result.additions[0].residentId).toBe('r3');
    });

    it('honors locks and replaces unlocked when needed', () => {
        const lockedAssignment = {
            id: 'locked1',
            clinicId: 'c1',
            residentId: 'r1',
            date: '2023-11-22',
            timeSlot: 'AM',
            locked: true
        };
        const unlockedAssignment = {
            id: 'unlocked1',
            clinicId: 'c1',
            residentId: 'r2',
            date: '2023-11-22',
            timeSlot: 'AM',
            locked: false
        };

        const result = Scheduler.generateSchedule({
            residents: mockResidents,
            attendings: mockAttendings,
            existingAssignments: [lockedAssignment, unlockedAssignment],
            startDate: '2023-11-22',
            endDate: '2023-11-22',
            options: { includeWeekends: true }
        });

        // capacity 2: keep locked (r1), pick best remaining (r3 > r2).
        // r2 should be replaced by r3.
        expect(result.deletions).toContain('unlocked1'); // replaced

        // Additions should only contain r3. r1 is already there (locked).
        // r2 is removed.
        const newAdditions = result.additions.filter(a => a.date === '2023-11-22' && a.clinicId === 'c1');
        expect(newAdditions.length).toBe(1);
        expect(newAdditions[0].residentId).toBe('r3');
    });
});
