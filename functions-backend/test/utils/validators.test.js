/**
 * Tests for Validator Utilities
 */

const { describe, it } = require('mocha');
const assert = require('assert');
const {
  isResidentOnVacation,
  hasProtectedTime,
  checkDutyHourCompliance
} = require('../../src/utils/validators');

describe('Validator Utilities', () => {
  describe('isResidentOnVacation', () => {
    it('should return false if resident has no vacation weeks', () => {
      const resident = { id: 'res1', name: 'Test Resident' };
      const date = new Date('2025-10-15');

      const result = isResidentOnVacation(resident, date);

      assert.strictEqual(result, false);
    });

    it('should return false if resident has empty vacation weeks array', () => {
      const resident = { id: 'res1', vacationWeeks: [] };
      const date = new Date('2025-10-15');

      const result = isResidentOnVacation(resident, date);

      assert.strictEqual(result, false);
    });

    it('should return true if date falls within vacation week', () => {
      const resident = {
        id: 'res1',
        vacationWeeks: ['2025-10-13'] // Start of week
      };
      const date = new Date('2025-10-15'); // Wednesday of that week

      const result = isResidentOnVacation(resident, date);

      assert.strictEqual(result, true);
    });

    it('should return false if date is outside vacation week', () => {
      const resident = {
        id: 'res1',
        vacationWeeks: ['2025-10-13'] // Oct 13-19
      };
      const date = new Date('2025-10-20'); // Day after vacation ends

      const result = isResidentOnVacation(resident, date);

      assert.strictEqual(result, false);
    });

    it('should handle multiple vacation weeks', () => {
      const resident = {
        id: 'res1',
        vacationWeeks: ['2025-10-13', '2025-11-10']
      };
      const date1 = new Date('2025-10-15'); // First vacation
      const date2 = new Date('2025-11-12'); // Second vacation
      const date3 = new Date('2025-12-01'); // No vacation

      assert.strictEqual(isResidentOnVacation(resident, date1), true);
      assert.strictEqual(isResidentOnVacation(resident, date2), true);
      assert.strictEqual(isResidentOnVacation(resident, date3), false);
    });
  });

  describe('hasProtectedTime', () => {
    it('should return false if no protected times configured', () => {
      const resident = { id: 'res1', pgyStatus: 'PGY-1' };
      const date = new Date('2025-10-15'); // Wednesday
      const timeSlot = 'AM';
      const protectedTimes = [];

      const result = hasProtectedTime(resident, date, timeSlot, protectedTimes);

      assert.strictEqual(result, false);
    });

    it('should return true if protected time matches day, time, and applies to all', () => {
      const resident = { id: 'res1', pgyStatus: 'PGY-1' };
      const date = new Date('2025-10-15'); // Tuesday (dayOfWeek = 2)
      const timeSlot = 'AM';
      const protectedTimes = [
        { dayOfWeek: 2, timeSlot: 'AM', appliesTo: 'all' }
      ];

      const result = hasProtectedTime(resident, date, timeSlot, protectedTimes);

      assert.strictEqual(result, true);
    });

    it('should return true if protected time matches PGY status', () => {
      const resident = { id: 'res1', pgyStatus: 'PGY-2' };
      const date = new Date('2025-10-15'); // Tuesday (2)
      const timeSlot = 'PM';
      const protectedTimes = [
        { dayOfWeek: 2, timeSlot: 'PM', appliesTo: 'PGY-2' }
      ];

      const result = hasProtectedTime(resident, date, timeSlot, protectedTimes);

      assert.strictEqual(result, true);
    });

    it('should return false if PGY status does not match', () => {
      const resident = { id: 'res1', pgyStatus: 'PGY-1' };
      const date = new Date('2025-10-15'); // Tuesday (2)
      const timeSlot = 'AM';
      const protectedTimes = [
        { dayOfWeek: 2, timeSlot: 'AM', appliesTo: 'PGY-3' }
      ];

      const result = hasProtectedTime(resident, date, timeSlot, protectedTimes);

      assert.strictEqual(result, false);
    });

    it('should return false if day of week does not match', () => {
      const resident = { id: 'res1', pgyStatus: 'PGY-1' };
      const date = new Date('2025-10-15'); // Tuesday (2)
      const timeSlot = 'AM';
      const protectedTimes = [
        { dayOfWeek: 3, timeSlot: 'AM', appliesTo: 'all' } // Wednesday
      ];

      const result = hasProtectedTime(resident, date, timeSlot, protectedTimes);

      assert.strictEqual(result, false);
    });

    it('should return false if time slot does not match', () => {
      const resident = { id: 'res1', pgyStatus: 'PGY-1' };
      const date = new Date('2025-10-15');
      const timeSlot = 'AM';
      const protectedTimes = [
        { dayOfWeek: 3, timeSlot: 'PM', appliesTo: 'all' }
      ];

      const result = hasProtectedTime(resident, date, timeSlot, protectedTimes);

      assert.strictEqual(result, false);
    });
  });

  describe('checkDutyHourCompliance', () => {
    it('should return compliant for first assignment', () => {
      const assignments = [];
      const residentId = 'res1';
      const newAssignment = {
        date: '2025-10-15',
        timeSlot: 'AM',
        residentId: 'res1'
      };

      const result = checkDutyHourCompliance(assignments, residentId, newAssignment);

      assert.strictEqual(result.compliant, true);
    });

    it('should return non-compliant if exceeds 80 hour weekly limit', () => {
      const residentId = 'res1';
      // Create 20 half-day assignments (80 hours) spread across a week with gaps
      const assignments = [];
      const startDate = new Date('2025-10-13'); // Monday, start of week

      // Add assignments: M AM/PM, T off, W AM/PM, Th AM/PM, F AM/PM, Sa AM/PM, Su AM/PM
      // That's 5 days * 2 slots = 10 slots per week
      // We need 20 slots to hit 80 hours, so 2 full weeks
      for (let day = 0; day < 10; day++) {
        const date = new Date(startDate);
        // Skip day 1 (Tuesday) to avoid consecutive days issue
        const offset = day < 2 ? day : day + 1;
        date.setDate(date.getDate() + offset);

        assignments.push({
          residentId: 'res1',
          date: date.toISOString().split('T')[0],
          timeSlot: 'AM'
        });
        assignments.push({
          residentId: 'res1',
          date: date.toISOString().split('T')[0],
          timeSlot: 'PM'
        });
      }

      const newAssignment = {
        date: '2025-10-14', // Tuesday in first week (within the week)
        timeSlot: 'AM',
        residentId: 'res1'
      };

      const result = checkDutyHourCompliance(assignments, residentId, newAssignment);

      assert.strictEqual(result.compliant, false);
      assert.ok(result.reason && result.reason.includes('80'));
    });

    it('should allow both AM and PM on same day', () => {
      const residentId = 'res1';
      const assignments = [
        {
          residentId: 'res1',
          date: '2025-10-15',
          timeSlot: 'AM'
        }
      ];

      const newAssignment = {
        date: '2025-10-15',
        timeSlot: 'PM',
        residentId: 'res1'
      };

      const result = checkDutyHourCompliance(assignments, residentId, newAssignment);

      assert.strictEqual(result.compliant, true);
    });

    it('should return non-compliant if exceeds 6 consecutive days', () => {
      const residentId = 'res1';
      const assignments = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date('2025-10-09');
        date.setDate(date.getDate() + i);
        assignments.push({
          residentId: 'res1',
          date: date.toISOString().split('T')[0],
          timeSlot: 'AM'
        });
      }

      const newAssignment = {
        date: '2025-10-15',
        timeSlot: 'AM',
        residentId: 'res1'
      };

      const result = checkDutyHourCompliance(assignments, residentId, newAssignment);

      assert.strictEqual(result.compliant, false);
      assert.ok(result.reason.includes('consecutive days'));
    });

    it('should allow assignment after day off', () => {
      const residentId = 'res1';
      const assignments = [
        { residentId: 'res1', date: '2025-10-13', timeSlot: 'AM' },
        { residentId: 'res1', date: '2025-10-14', timeSlot: 'AM' },
        // Gap on Oct 15
        { residentId: 'res1', date: '2025-10-16', timeSlot: 'AM' }
      ];

      const newAssignment = {
        date: '2025-10-17',
        timeSlot: 'AM',
        residentId: 'res1'
      };

      const result = checkDutyHourCompliance(assignments, residentId, newAssignment);

      assert.strictEqual(result.compliant, true);
    });
  });
});