import { describe, it, expect } from 'vitest';
import {
    normalizeDate,
    getStartOfWeekSunday,
    getEndOfWeekSaturday,
    getStartOfMonthDate,
    getEndOfMonthDate
} from './dateUtils';

describe('dateUtils', () => {
    describe('normalizeDate', () => {
        it('should normalize a Date object to midnight', () => {
            const input = new Date(2024, 0, 15, 14, 30, 45);
            const result = normalizeDate(input);
            expect(result.getHours()).toBe(0);
            expect(result.getMinutes()).toBe(0);
            expect(result.getSeconds()).toBe(0);
            expect(result.getDate()).toBe(15);
        });

        it('should parse YYYY-MM-DD string format', () => {
            const result = normalizeDate('2024-03-15');
            expect(result.getFullYear()).toBe(2024);
            expect(result.getMonth()).toBe(2); // March is 2
            expect(result.getDate()).toBe(15);
        });

        it('should return current date for invalid input', () => {
            const result = normalizeDate('invalid');
            const today = new Date();
            expect(result.getFullYear()).toBe(today.getFullYear());
        });
    });

    describe('getStartOfWeekSunday', () => {
        it('should return Sunday for a Wednesday', () => {
            // 2024-01-17 is a Wednesday
            const result = getStartOfWeekSunday('2024-01-17');
            expect(result.getDay()).toBe(0); // Sunday
            expect(result.getDate()).toBe(14);
        });

        it('should return the same day if already Sunday', () => {
            // 2024-01-14 is a Sunday
            const result = getStartOfWeekSunday('2024-01-14');
            expect(result.getDay()).toBe(0);
            expect(result.getDate()).toBe(14);
        });
    });

    describe('getEndOfWeekSaturday', () => {
        it('should return Saturday for a Wednesday', () => {
            // 2024-01-17 is a Wednesday
            const result = getEndOfWeekSaturday('2024-01-17');
            expect(result.getDay()).toBe(6); // Saturday
            expect(result.getDate()).toBe(20);
        });

        it('should return the same day if already Saturday', () => {
            // 2024-01-20 is a Saturday
            const result = getEndOfWeekSaturday('2024-01-20');
            expect(result.getDay()).toBe(6);
            expect(result.getDate()).toBe(20);
        });
    });

    describe('getStartOfMonthDate', () => {
        it('should return the first day of the month', () => {
            const result = getStartOfMonthDate('2024-03-15');
            expect(result.getDate()).toBe(1);
            expect(result.getMonth()).toBe(2);
        });
    });

    describe('getEndOfMonthDate', () => {
        it('should return the last day of the month', () => {
            // March 2024 has 31 days
            const result = getEndOfMonthDate('2024-03-15');
            expect(result.getDate()).toBe(31);
            expect(result.getMonth()).toBe(2);
        });

        it('should handle February correctly', () => {
            // 2024 is a leap year
            const result = getEndOfMonthDate('2024-02-15');
            expect(result.getDate()).toBe(29);
        });
    });
});
