/**
 * Constants for clinic scheduler
 */

// Time slots for scheduling
export const TIME_SLOTS = ['AM', 'PM'];

// Days of the week
export const DAYS_OF_WEEK = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Default work days (Mon-Fri)
export const DEFAULT_WORK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

// ACGME duty hour limits
export const ACGME_LIMITS = {
    MAX_WEEKLY_HOURS: 80,
    MAX_CONSECUTIVE_DAYS: 6,
    WARNING_HOURS_THRESHOLD: 70,
    WARNING_DAYS_THRESHOLD: 5,
    HOURS_PER_HALF_DAY: 4
};

// Assignment types
export const ASSIGNMENT_TYPES = {
    CLINICAL: 'clinical',
    CONTINUITY: 'continuity',
    DIDACTICS: 'didactics',
    PROTECTED: 'protected'
};

// Assignment statuses
export const ASSIGNMENT_STATUS = {
    ACTIVE: 'active',
    CANCELLED: 'cancelled',
    PENDING: 'pending'
};

// PGY status levels
export const PGY_LEVELS = ['PGY-1', 'PGY-2', 'PGY-3', 'PGY-4', 'PGY-5'];

// Conflict severity levels
export const CONFLICT_SEVERITY = {
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// View modes for calendar
export const VIEW_MODES = {
    WEEK: 'week',
    MONTH: 'month'
};

// Local storage keys
export const STORAGE_KEYS = {
    VIEW_MODE: 'scheduleViewMode',
    THEME: 'theme',
    SIDEBAR_COLLAPSED: 'sidebarCollapsed'
};

// Firebase collection names
export const COLLECTIONS = {
    INSTITUTIONS: 'institutions',
    USERS: 'users',
    INVITE_CODES: 'inviteCodes',
    MEMBERS: 'members',
    ATTENDINGS: 'attendings',
    RESIDENTS: 'residents',
    ASSIGNMENTS: 'assignments',
    RULES: 'rules',
    AUDIT_LOG: 'auditLog'
};

// Toast durations (ms)
export const TOAST_DURATION = {
    SHORT: 3000,
    MEDIUM: 5000,
    LONG: 8000
};

export default {
    TIME_SLOTS,
    DAYS_OF_WEEK,
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
};
