/**
 * Date utility functions for clinic scheduler
 * Extracted for reuse and testing
 */

/**
 * Normalize a date to midnight local time.
 * Handles Date objects, ISO strings (YYYY-MM-DD), and timestamps.
 */
export const normalizeDate = (value) => {
    if (value instanceof Date) {
        const date = new Date(value.getFullYear(), value.getMonth(), value.getDate());
        date.setHours(0, 0, 0, 0);
        return date;
    }

    if (typeof value === 'string') {
        const parts = value.split('-').map(Number);
        if (parts.length === 3 && parts.every((part) => Number.isInteger(part))) {
            const [year, month, day] = parts;
            const date = new Date(year, month - 1, day);
            date.setHours(0, 0, 0, 0);
            return date;
        }
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        const fallback = new Date();
        fallback.setHours(0, 0, 0, 0);
        return fallback;
    }
    date.setHours(0, 0, 0, 0);
    return date;
};

/**
 * Get start of week (Sunday)
 */
export const getStartOfWeekSunday = (value) => {
    const date = normalizeDate(value);
    const day = date.getDay();
    if (day === 0) return date;
    const start = new Date(date.getTime());
    start.setDate(date.getDate() - day);
    return normalizeDate(start);
};

/**
 * Get end of week (Saturday)
 */
export const getEndOfWeekSaturday = (value) => {
    const date = normalizeDate(value);
    const day = date.getDay();
    if (day === 6) return date;
    const end = new Date(date.getTime());
    end.setDate(date.getDate() + (6 - day));
    return normalizeDate(end);
};

/**
 * Get start of month
 */
export const getStartOfMonthDate = (value) => {
    const date = normalizeDate(value);
    date.setDate(1);
    return normalizeDate(date);
};

/**
 * Get end of month
 */
export const getEndOfMonthDate = (value) => {
    const date = normalizeDate(value);
    return normalizeDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
};

/**
 * Format date for display
 */
export const formatDate = (date, options = {}) => {
    if (!date) return '';
    const d = normalizeDate(date);
    return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options
    });
};

/**
 * Check if date is today
 */
export const isToday = (date) => {
    const today = new Date();
    const d = normalizeDate(date);
    return d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
};

/**
 * Check if date is in the past
 */
export const isPastDate = (date) => {
    const today = normalizeDate(new Date());
    const d = normalizeDate(date);
    return d < today;
};

/**
 * Get day name from date
 */
export const getDayName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[normalizeDate(date).getDay()];
};

/**
 * Get short day name from date
 */
export const getShortDayName = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[normalizeDate(date).getDay()];
};

/**
 * Generate array of dates between start and end
 */
export const getDateRange = (start, end) => {
    const dates = [];
    const current = normalizeDate(start);
    const endDate = normalizeDate(end);

    while (current <= endDate) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    return dates;
};

/**
 * Get ISO week number
 */
export const getWeekNumber = (date) => {
    const d = normalizeDate(date);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

export default {
    normalizeDate,
    getStartOfWeekSunday,
    getEndOfWeekSaturday,
    getStartOfMonthDate,
    getEndOfMonthDate,
    formatDate,
    isToday,
    isPastDate,
    getDayName,
    getShortDayName,
    getDateRange,
    getWeekNumber
};
