/**
 * Utils barrel export
 * Re-exports all utilities for convenient importing
 */

// Constants
export {
    TIME_SLOTS,
    DAYS_OF_WEEK as DAYS_ARRAY,
    SHORT_DAYS,
    DEFAULT_WORK_DAYS,
    ACGME_LIMITS,
    ASSIGNMENT_TYPES,
    ASSIGNMENT_STATUS,
    PGY_LEVELS,
    CONFLICT_SEVERITY,
    VIEW_MODES,
    STORAGE_KEYS,
    COLLECTIONS,
    TOAST_DURATION
} from './constants';

// Date utilities
export {
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
} from './dateUtils';

// Permissions
export {
    Permissions,
    ROLE_HIERARCHY,
    ADMIN_ROLES,
    SCHEDULER_ROLES
} from './permissions';

// Icons
export { iconMap, getIcon } from './icons';

// Validation
export { ValidationUtils } from './validation';

// Conflict detection
export { ConflictDetection } from './conflictDetection';

// Export utilities
export { ExportUtils } from './export';

// Helper functions
export {
    DAYS_OF_WEEK,
    generateId,
    convertLegacyClinicSchedule,
    normalizeClinics,
    normalizeAttendingRecord
} from './helpers';
