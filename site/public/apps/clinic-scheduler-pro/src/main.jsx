// Source for Clinic Scheduler Pro browser bundle. Run `npm run clinic:scheduler:build` after editing.
const { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } = React;
const { createPortal } = ReactDOM;
// Framer Motion Integration
const { motion, AnimatePresence } = window['framer-motion'] || {
    motion: { div: 'div', button: 'button' },
    AnimatePresence: ({ children }) => children
};
const ToastDispatchContext = createContext(null);
const ToastStateContext = createContext([]);

let externalToastDispatch = null;

const toast = {
    success: (message) => externalToastDispatch?.({ type: 'success', message }),
    error: (message) => externalToastDispatch?.({ type: 'error', message }),
    warning: (message) => externalToastDispatch?.({ type: 'warning', message })
};

const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const publish = useCallback(({ type, message }) => {
        if (!message) return;
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setToasts((prev) => [...prev, { id, type, message }]);
    }, []);

    useEffect(() => {
        externalToastDispatch = publish;
        return () => {
            if (externalToastDispatch === publish) {
                externalToastDispatch = null;
            }
        };
    }, [publish]);

    return (
        <ToastDispatchContext.Provider value={removeToast}>
            <ToastStateContext.Provider value={toasts}>
                {children}
                <ToastViewport />
            </ToastStateContext.Provider>
        </ToastDispatchContext.Provider>
    );
};

const ToastViewport = () => {
    const toasts = useContext(ToastStateContext);
    const dismiss = useContext(ToastDispatchContext);

    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                position: 'fixed',
                bottom: '1.5rem',
                right: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                zIndex: 9999,
                maxWidth: '20rem'
            }}
        >
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
        </div>
    );
};

const ToastItem = ({ toast, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 3500);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    const paletteMap = {
        success: { bg: '#dcfce7', border: '#86efac', text: '#065f46' },
        error: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
        warning: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' }
    };

    const palette = paletteMap[toast.type] || paletteMap.success;

    return (
        <div
            role="alert"
            onClick={() => onDismiss(toast.id)}
            style={{
                borderRadius: '1rem',
                padding: '0.85rem 1rem',
                background: palette.bg,
                border: `1px solid ${palette.border}`,
                color: palette.text,
                fontWeight: 600,
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.15)',
                cursor: 'pointer'
            }}
        >
            {toast.message}
        </div>
    );
};

const Toaster = () => null;

const DAYS_OF_WEEK = [
    { id: 0, name: 'Sunday', short: 'Sun' },
    { id: 1, name: 'Monday', short: 'Mon' },
    { id: 2, name: 'Tuesday', short: 'Tue' },
    { id: 3, name: 'Wednesday', short: 'Wed' },
    { id: 4, name: 'Thursday', short: 'Thu' },
    { id: 5, name: 'Friday', short: 'Fri' },
    { id: 6, name: 'Saturday', short: 'Sat' }
];

const TIME_SLOTS = ['AM', 'PM'];

const generateId = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const convertLegacyClinicSchedule = (legacySchedule = [], sites = []) => {
    if (!Array.isArray(legacySchedule) || legacySchedule.length === 0) {
        return [];
    }

    const siteLookup = new Map(sites.map(site => [site.id, site]));
    const clinicsMap = new Map();

    legacySchedule.forEach((session = {}) => {
        const dayOfWeek = typeof session.dayOfWeek === 'number' ? session.dayOfWeek : null;
        const timeSlot = session.timeSlot || 'AM';
        const siteId = session.siteId || '';

        const fallbackId = `legacy_${siteId || 'none'}_${dayOfWeek}_${timeSlot}`;
        const clinicId = session.clinicId || session.id || fallbackId;

        if (!clinicsMap.has(clinicId)) {
            const site = siteLookup.get(siteId);
            const dayLabel = (dayOfWeek != null ? DAYS_OF_WEEK.find(d => d.id === dayOfWeek)?.short : 'Day');
            clinicsMap.set(clinicId, {
                id: clinicId,
                siteId,
                name: session.clinicName || `${site?.name || 'Clinic'} ${dayLabel || ''} ${timeSlot}`.trim(),
                residentCapacity: session.maxResidents || session.capacity || 2,
                defaultSessions: []
            });
        }

        const clinic = clinicsMap.get(clinicId);
        clinic.defaultSessions.push({
            dayOfWeek: dayOfWeek ?? 0,
            timeSlot
        });

        if (session.maxResidents || session.capacity) {
            clinic.residentCapacity = session.maxResidents || session.capacity;
        }
    });

    return Array.from(clinicsMap.values());
};

const normalizeClinics = (clinics = []) => {
    if (!Array.isArray(clinics)) return [];
    return clinics
        .filter(Boolean)
        .map((clinic) => ({
            id: clinic.id || generateId('clinic'),
            name: clinic.name || 'Clinic',
            siteId: clinic.siteId || '',
            residentCapacity: Number.isFinite(clinic.residentCapacity) ? clinic.residentCapacity : (clinic.capacity || clinic.maxResidents || 2),
            defaultSessions: Array.isArray(clinic.defaultSessions)
                ? clinic.defaultSessions
                    .filter(session => typeof session?.dayOfWeek === 'number' && TIME_SLOTS.includes(session?.timeSlot || ''))
                    .map(session => ({ dayOfWeek: session.dayOfWeek, timeSlot: session.timeSlot || 'AM' }))
                : []
        }));
};

const normalizeAttendingRecord = (attending = {}, sites = []) => {
    if (!attending) return attending;
    const clinics = normalizeClinics(attending.clinics);

    const normalizedClinics = clinics.length > 0
        ? clinics
        : convertLegacyClinicSchedule(attending.clinicSchedule, sites);

    return {
        ...attending,
        clinics: normalizeClinics(normalizedClinics),
        scheduleOverrides: Array.isArray(attending.scheduleOverrides) ? attending.scheduleOverrides : []
    };
};

// ==================== Error Boundary Component ====================
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log to Firebase Analytics if available
        if (window.firebaseApp) {
            try {
                console.log('Logging error to Firebase:', error.toString());
            } catch (logError) {
                console.error('Failed to log error to Firebase:', logError);
            }
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        // Optionally refresh the page
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
                    <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-8">
                        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-xl mb-6">
                            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                            {this.props.title || 'Something went wrong'}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {this.props.message || 'An unexpected error occurred. The application has recovered, but you may need to refresh the page.'}
                        </p>

                        {/* Error details (only in development) */}
                        {window.location.hostname === 'localhost' && this.state.error && (
                            <details className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                                    Error Details (Development Only)
                                </summary>
                                <pre className="mt-3 text-xs text-gray-600 overflow-auto">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Route-level error boundary with more specific error handling
class RouteErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error(`Error in ${this.props.routeName || 'route'}:`, error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                        Unable to load {this.props.routeName || 'this section'}
                    </h3>
                    <p className="text-yellow-700 mb-4">
                        There was a problem loading this section. Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

const { format, parseISO, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, getDay, addDays } = window['date-fns'];
const { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = window.Recharts;

// ==================== Validation Utilities ====================
const ValidationUtils = {
    // Email validation using RFC 5322 compliant regex
    validateEmail: (email) => {
        if (!email) return { isValid: false, error: 'Email is required' };
        const trimmedEmail = email.trim();
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegex.test(trimmedEmail)) {
            return { isValid: false, error: 'Please enter a valid email address' };
        }
        if (trimmedEmail.length > 255) {
            return { isValid: false, error: 'Email must be less than 255 characters' };
        }
        return { isValid: true, value: trimmedEmail };
    },

    // Required field validation
    validateRequired: (value, fieldName) => {
        if (!value || (typeof value === 'string' && !value.trim())) {
            return { isValid: false, error: `${fieldName} is required` };
        }
        return { isValid: true, value: typeof value === 'string' ? value.trim() : value };
    },

    // Trim and validate length
    trimAndValidate: (value, maxLength, fieldName) => {
        if (!value) return { isValid: true, value: '' };
        const trimmed = value.trim();
        if (trimmed.length > maxLength) {
            return { isValid: false, error: `${fieldName} must be less than ${maxLength} characters` };
        }
        return { isValid: true, value: trimmed };
    },

    // Phone number validation (optional)
    validatePhoneNumber: (phone, required = false) => {
        if (!phone && !required) return { isValid: true, value: '' };
        if (!phone && required) return { isValid: false, error: 'Phone number is required' };

        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 10) {
            return { isValid: false, error: 'Phone number must be at least 10 digits' };
        }
        if (cleaned.length > 15) {
            return { isValid: false, error: 'Phone number must be less than 15 digits' };
        }

        // Format as (XXX) XXX-XXXX for US numbers
        let formatted = cleaned;
        if (cleaned.length === 10) {
            formatted = `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
        }
        return { isValid: true, value: formatted };
    },

    // Name validation - no numbers or special characters except spaces, hyphens, apostrophes
    validateName: (name, fieldName = 'Name') => {
        if (!name) return { isValid: false, error: `${fieldName} is required` };
        const trimmed = name.trim();
        if (trimmed.length < 2) {
            return { isValid: false, error: `${fieldName} must be at least 2 characters` };
        }
        if (trimmed.length > 100) {
            return { isValid: false, error: `${fieldName} must be less than 100 characters` };
        }
        const nameRegex = /^[a-zA-Z\s'-]+$/;
        if (!nameRegex.test(trimmed)) {
            return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
        }
        return { isValid: true, value: trimmed };
    },

    // PGY level validation
    validatePGYLevel: (level) => {
        const num = parseInt(level);
        if (isNaN(num) || num < 1 || num > 10) {
            return { isValid: false, error: 'PGY level must be between 1 and 10' };
        }
        return { isValid: true, value: num };
    },

    // Validate all fields in a form
    validateForm: (fields) => {
        const errors = {};
        const values = {};
        let isValid = true;

        for (const [key, validation] of Object.entries(fields)) {
            const result = validation();
            if (!result.isValid) {
                errors[key] = result.error;
                isValid = false;
            } else {
                values[key] = result.value;
            }
        }

        return { isValid, errors, values };
    }
};

// ==================== Date Utilities ====================
const normalizeDate = (value) => {
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

const getStartOfWeekSunday = (value) => {
    const date = normalizeDate(value);
    const day = date.getDay();
    if (day === 0) return date;
    const start = new Date(date.getTime());
    start.setDate(date.getDate() - day);
    return normalizeDate(start);
};

const getEndOfWeekSaturday = (value) => {
    const date = normalizeDate(value);
    const day = date.getDay();
    if (day === 6) return date;
    const end = new Date(date.getTime());
    end.setDate(date.getDate() + (6 - day));
    return normalizeDate(end);
};

const getStartOfMonthDate = (value) => {
    const date = normalizeDate(value);
    date.setDate(1);
    return normalizeDate(date);
};

const getEndOfMonthDate = (value) => {
    const date = normalizeDate(value);
    return normalizeDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
};

// ==================== Conflict Detection Utilities ====================
const ConflictDetection = {
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

// ==================== Export Utilities ====================
const ExportUtils = {
    // Convert assignments to CSV format
    assignmentsToCSV: (assignments, attendings, residents, startDate, endDate) => {
        const headers = ['Date', 'Day', 'Time', 'Resident', 'Attending', 'Site', 'Rotation', 'Notes'];
        const rows = [headers];

        // Filter and sort assignments
        const filtered = assignments
            .filter(a => {
                if (startDate && a.date < startDate) return false;
                if (endDate && a.date > endDate) return false;
                return true;
            })
            .sort((a, b) => {
                const dateCompare = a.date.localeCompare(b.date);
                if (dateCompare !== 0) return dateCompare;
                return a.timeSlot === 'AM' ? -1 : 1;
            });

        // Convert to rows
        for (const assignment of filtered) {
            const resident = residents.find(r => r.id === assignment.residentId);
            const attending = attendings.find(a => a.id === assignment.attendingId);
            const assignmentDate = normalizeDate(assignment.date);
            const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][assignmentDate.getDay()];

            rows.push([
                assignment.date,
                dayName,
                assignment.timeSlot,
                resident?.name || '',
                attending?.name || '',
                assignment.siteId || '',
                assignment.rotationId || '',
                assignment.notes || ''
            ]);
        }

        // Convert to CSV string
        return rows.map(row =>
            row.map(cell => {
                // Escape quotes and wrap in quotes if contains comma
                const escaped = String(cell).replace(/"/g, '""');
                return escaped.includes(',') ? `"${escaped}"` : escaped;
            }).join(',')
        ).join('\n');
    },

    // Convert attendings list to CSV
    attendingsToCSV: (attendings) => {
        const headers = ['Name', 'Email', 'Phone', 'Sites', 'Rotations', 'Max Weekly'];
        const rows = [headers];

        for (const attending of attendings) {
            rows.push([
                attending.name,
                attending.email || '',
                attending.phone || '',
                (attending.sites || []).join('; '),
                (attending.rotations || []).join('; '),
                attending.maxWeeklyAssignments || ''
            ]);
        }

        return rows.map(row =>
            row.map(cell => {
                const escaped = String(cell).replace(/"/g, '""');
                return escaped.includes(',') ? `"${escaped}"` : escaped;
            }).join(',')
        ).join('\n');
    },

    // Export to JSON for backup
    exportToJSON: (data) => {
        return JSON.stringify({
            version: '1.0',
            exportDate: new Date().toISOString(),
            data: data
        }, null, 2);
    },

    // Download file utility
    downloadFile: (content, filename, mimeType = 'text/csv') => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Generate filename with timestamp
    generateFilename: (prefix, extension) => {
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
        return `${prefix}_${timestamp}.${extension}`;
    },

    // Validate imported data schema
    validateImportData: (data) => {
        const errors = [];
        const warnings = [];

        // Validate attendings
        if (data.attendings) {
            if (!Array.isArray(data.attendings)) {
                errors.push('Attendings must be an array');
            } else {
                data.attendings.forEach((attending, index) => {
                    if (!attending.name) {
                        errors.push(`Attending at index ${index} is missing a name`);
                    }
                    if (attending.email && !ValidationUtils.validateEmail(attending.email).isValid) {
                        warnings.push(`Attending "${attending.name || index}" has invalid email`);
                    }
                    if (attending.maxWeeklyAssignments && (typeof attending.maxWeeklyAssignments !== 'number' || attending.maxWeeklyAssignments < 0)) {
                        warnings.push(`Attending "${attending.name || index}" has invalid maxWeeklyAssignments`);
                    }
                });
            }
        }

        // Validate residents
        if (data.residents) {
            if (!Array.isArray(data.residents)) {
                errors.push('Residents must be an array');
            } else {
                data.residents.forEach((resident, index) => {
                    if (!resident.name) {
                        errors.push(`Resident at index ${index} is missing a name`);
                    }
                    if (resident.email && !ValidationUtils.validateEmail(resident.email).isValid) {
                        warnings.push(`Resident "${resident.name || index}" has invalid email`);
                    }
                    const residentPgy = resident.pgyStatus || resident.pgyLevel;
                    if (residentPgy) {
                        const pgyValidation = ValidationUtils.validatePGYLevel(residentPgy);
                        if (!pgyValidation.isValid) {
                            warnings.push(`Resident "${resident.name || index}" has invalid PGY level`);
                        }
                    }
                });
            }
        }

        // Validate assignments
        if (data.assignments) {
            if (!Array.isArray(data.assignments)) {
                errors.push('Assignments must be an array');
            } else {
                data.assignments.forEach((assignment, index) => {
                    if (!assignment.date) {
                        errors.push(`Assignment at index ${index} is missing a date`);
                    } else {
                        // Validate date format (YYYY-MM-DD)
                        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                        if (!dateRegex.test(assignment.date)) {
                            errors.push(`Assignment at index ${index} has invalid date format (expected YYYY-MM-DD)`);
                        }
                    }
                    if (!assignment.timeSlot) {
                        errors.push(`Assignment at index ${index} is missing a time slot`);
                    } else if (!['AM', 'PM'].includes(assignment.timeSlot)) {
                        warnings.push(`Assignment at index ${index} has invalid time slot "${assignment.timeSlot}"`);
                    }
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            summary: {
                attendings: data.attendings ? data.attendings.length : 0,
                residents: data.residents ? data.residents.length : 0,
                assignments: data.assignments ? data.assignments.length : 0
            }
        };
    },

    // Parse and validate imported JSON
    parseImportedJSON: (jsonString) => {
        try {
            const parsed = JSON.parse(jsonString);

            // Validate structure
            if (!parsed.version || !parsed.data) {
                throw new Error('Invalid backup file format');
            }

            // Check version compatibility
            if (parsed.version !== '1.0') {
                throw new Error(`Unsupported backup version: ${parsed.version}`);
            }

            // Validate data schema
            const validation = ExportUtils.validateImportData(parsed.data);

            if (!validation.isValid) {
                return {
                    success: false,
                    error: 'Import data validation failed',
                    validationErrors: validation.errors,
                    validationWarnings: validation.warnings
                };
            }

            return {
                success: true,
                data: parsed.data,
                exportDate: parsed.exportDate,
                validation: validation
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to parse backup file'
            };
        }
    },

    // Create file input and handle selection
    selectFile: (accept = '.json', onFileSelected) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;

        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                onFileSelected(e.target.result, file.name);
            };
            reader.onerror = () => {
                toast.error('Failed to read file');
            };
            reader.readAsText(file);
        };

        input.click();
    }
};

// Wait for Firebase to be available
const waitForFirebase = () => {
    return new Promise((resolve) => {
        const checkFirebase = () => {
            if (window.firebase) {
                resolve();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    });
};

// ==================== Firebase Service ====================
class FirebaseService {
    constructor() {
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.currentInstitution = null;
        this.listeners = [];
        this.unsubscribers = [];
    }

    async initialize() {
        await waitForFirebase();
        this.auth = window.firebaseAuth;
        this.db = window.firebaseDb;

        // Set up auth listener
        window.firebase.auth.onAuthStateChanged(this.auth, async (user) => {
            this.currentUser = user;
            if (user) {
                await this.loadUserProfile();
            } else {
                this.currentInstitution = null;
                this.cleanup();
            }
        });
    }

    cleanup() {
        // Unsubscribe from all listeners
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
    }

    // ===== Authentication =====
    async signUp(email, password, name) {
        try {
            const userCredential = await window.firebase.auth.createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;

            // Ensure current user is available immediately for subsequent operations
            this.currentUser = user;

            // Create user profile
            await window.firebase.firestore.setDoc(
                window.firebase.firestore.doc(this.db, 'users', user.uid),
                {
                    email,
                    name,
                    createdAt: window.firebase.firestore.serverTimestamp(),
                    institutions: []
                }
            );

            return { success: true, user };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const userCredential = await window.firebase.auth.signInWithEmailAndPassword(this.auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            this.cleanup();
            await window.firebase.auth.signOut(this.auth);
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    async resetPassword(email) {
        try {
            await window.firebase.auth.sendPasswordResetEmail(this.auth, email);
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== User Management =====
    async loadUserProfile() {
        if (!this.currentUser) return null;

        try {
            const userRef = window.firebase.firestore.doc(this.db, 'users', this.currentUser.uid);
            const userDoc = await window.firebase.firestore.getDoc(userRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();

                // Normalize institutions array to simple string IDs
                const rawInstitutions = Array.isArray(userData.institutions) ? userData.institutions : [];
                const normalizedInstitutions = rawInstitutions
                    .map(inst => typeof inst === 'string' ? inst : inst?.id)
                    .filter(id => typeof id === 'string' && id.length > 0);

                if (normalizedInstitutions.length !== rawInstitutions.length) {
                    try {
                        await window.firebase.firestore.updateDoc(userRef, {
                            institutions: normalizedInstitutions
                        });
                    } catch (updateError) {
                        console.warn('Failed to normalize institutions array:', updateError);
                    }
                    userData.institutions = normalizedInstitutions;
                } else {
                    userData.institutions = normalizedInstitutions;
                }

                const preferredInstitution =
                    typeof userData.currentInstitution === 'string' && userData.currentInstitution
                        ? userData.currentInstitution
                        : normalizedInstitutions[0];

                if (preferredInstitution) {
                    await this.loadInstitution(preferredInstitution);
                }

                return userData;
            } else {
                // Create user document if it doesn't exist
                console.log('Creating new user profile...');
                const newUserData = {
                    email: this.currentUser.email,
                    uid: this.currentUser.uid,
                    institutions: [],
                    createdAt: window.firebase.firestore.serverTimestamp(),
                    updatedAt: window.firebase.firestore.serverTimestamp()
                };

                await window.firebase.firestore.setDoc(userRef, newUserData);
                console.log('User profile created successfully');
                return newUserData;
            }
        } catch (error) {
            console.error('Load user profile error:', error);
            // If permission denied, return minimal user data
            if (error.code === 'permission-denied') {
                console.warn('Permission denied - returning basic user data');
                return {
                    email: this.currentUser.email,
                    uid: this.currentUser.uid,
                    institutions: []
                };
            }
            return null;
        }
    }

    // ===== Institution Management =====
    async createInstitution(name, userData) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            const institutionRef = window.firebase.firestore.doc(
                window.firebase.firestore.collection(this.db, 'institutions')
            );

            const institutionData = {
                name,
                createdBy: this.currentUser.uid,
                createdAt: window.firebase.firestore.serverTimestamp(),
                // Initialize members array with the creating user
                members: [{
                    userId: this.currentUser.uid,
                    name: userData.name,
                    email: userData.email,
                    role: 'program_admin',
                    joinedAt: new Date().toISOString()
                }],
                settings: {
                    sites: [
                        { id: 'site_1', name: 'Main Clinic', code: 'MAIN', color: '#10b981' }
                    ],
                    rotations: [
                        { id: 'rot_1', name: 'General', code: 'GEN', minSessions: 4 }
                    ],
                    protectedTimes: [
                        {
                            id: 'pt_1',
                            name: 'Didactics',
                            dayOfWeek: 3,
                            timeSlot: 'AM',
                            mandatory: true
                        }
                    ],
                    academicYear: {
                        start: format(new Date(), 'yyyy-07-01'),
                        end: format(addDays(new Date(), 365), 'yyyy-06-30')
                    }
                }
            };

            // Create institution
            await window.firebase.firestore.setDoc(institutionRef, institutionData);

            // Add user as admin member
            await window.firebase.firestore.setDoc(
                window.firebase.firestore.doc(this.db, 'institutions', institutionRef.id, 'members', this.currentUser.uid),
                {
                    userId: this.currentUser.uid,
                    name: userData.name,
                    email: userData.email,
                    role: 'program_admin',
                    joinedAt: window.firebase.firestore.serverTimestamp()
                }
            );

            // Update user's institutions list
            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'users', this.currentUser.uid),
                {
                    institutions: window.firebase.firestore.arrayUnion(institutionRef.id)
                }
            );

            this.currentInstitution = institutionRef.id;
            return { success: true, institutionId: institutionRef.id };
        } catch (error) {
            console.error('Create institution error:', error);
            return { success: false, error: error.message };
        }
    }

    async loadInstitution(institutionId) {
        if (!this.currentUser) return null;

        try {
            // Check if user is a member
            const memberDoc = await window.firebase.firestore.getDoc(
                window.firebase.firestore.doc(this.db, 'institutions', institutionId, 'members', this.currentUser.uid)
            );

            if (!memberDoc.exists()) {
                throw new Error('Not a member of this institution');
            }

            this.currentInstitution = institutionId;
            this.setupRealtimeListeners();

            return { success: true };
        } catch (error) {
            console.error('Load institution error:', error);
            return { success: false, error: error.message };
        }
    }

    setupRealtimeListeners() {
        if (!this.currentInstitution) return;

        this.cleanup();

        // Listen to institution settings
        const institutionUnsub = window.firebase.firestore.onSnapshot(
            window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution),
            (doc) => {
                if (doc.exists()) {
                    this.notifyListeners('institution', doc.data());
                }
            }
        );
        this.unsubscribers.push(institutionUnsub);

        // Listen to attendings
        const attendingsUnsub = window.firebase.firestore.onSnapshot(
            window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'attendings'),
            (snapshot) => {
                const attendings = [];
                snapshot.forEach(doc => {
                    attendings.push({ id: doc.id, ...doc.data() });
                });
                this.notifyListeners('attendings', attendings);
            }
        );
        this.unsubscribers.push(attendingsUnsub);

        // Listen to residents
        const residentsUnsub = window.firebase.firestore.onSnapshot(
            window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'residents'),
            (snapshot) => {
                const residents = [];
                snapshot.forEach(doc => {
                    residents.push({ id: doc.id, ...doc.data() });
                });
                this.notifyListeners('residents', residents);
            }
        );
        this.unsubscribers.push(residentsUnsub);

        // Listen to assignments
        const assignmentsUnsub = window.firebase.firestore.onSnapshot(
            window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'assignments'),
            (snapshot) => {
                const assignments = {};
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const key = `${data.date}_${data.timeSlot}`;
                    if (!assignments[key]) assignments[key] = [];
                    assignments[key].push({ id: doc.id, ...data });
                });
                this.notifyListeners('assignments', assignments);
            }
        );
        this.unsubscribers.push(assignmentsUnsub);

        // Listen to rules
        const rulesUnsub = window.firebase.firestore.onSnapshot(
            window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'rules'),
            (snapshot) => {
                const rules = [];
                snapshot.forEach(doc => {
                    rules.push({ id: doc.id, ...doc.data() });
                });
                this.notifyListeners('rules', rules);
            }
        );
        this.unsubscribers.push(rulesUnsub);
    }

    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    notifyListeners(type, data) {
        this.listeners.forEach(listener => listener(type, data));
    }

    // ===== CRUD Operations =====
    async addAttending(attending) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            const docRef = await window.firebase.firestore.addDoc(
                window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'attendings'),
                {
                    ...attending,
                    createdAt: window.firebase.firestore.serverTimestamp(),
                    createdBy: this.currentUser.uid
                }
            );

            await this.addAuditLog('attending_added', { id: docRef.id, ...attending });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Add attending error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateAttending(id, updates) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'attendings', id),
                {
                    ...updates,
                    updatedAt: window.firebase.firestore.serverTimestamp()
                }
            );

            await this.addAuditLog('attending_updated', { id, updates });
            return { success: true };
        } catch (error) {
            console.error('Update attending error:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteAttending(id) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            await window.firebase.firestore.deleteDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'attendings', id)
            );

            await this.addAuditLog('attending_deleted', { id });
            return { success: true };
        } catch (error) {
            console.error('Delete attending error:', error);
            return { success: false, error: error.message };
        }
    }

    async addResident(resident) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            const docRef = await window.firebase.firestore.addDoc(
                window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'residents'),
                {
                    ...resident,
                    createdAt: window.firebase.firestore.serverTimestamp(),
                    createdBy: this.currentUser.uid
                }
            );

            await this.addAuditLog('resident_added', { id: docRef.id, ...resident });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Add resident error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateResident(id, updates) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'residents', id),
                {
                    ...updates,
                    updatedAt: window.firebase.firestore.serverTimestamp()
                }
            );

            await this.addAuditLog('resident_updated', { id, updates });
            return { success: true };
        } catch (error) {
            console.error('Update resident error:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteResident(id) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            await window.firebase.firestore.deleteDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'residents', id)
            );

            await this.addAuditLog('resident_deleted', { id });
            return { success: true };
        } catch (error) {
            console.error('Delete resident error:', error);
            return { success: false, error: error.message };
        }
    }

    async addAssignment(assignment) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            const docRef = await window.firebase.firestore.addDoc(
                window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'assignments'),
                {
                    ...assignment,
                    createdAt: window.firebase.firestore.serverTimestamp(),
                    createdBy: this.currentUser.uid
                }
            );

            await this.addAuditLog('assignment_added', { id: docRef.id, ...assignment });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Add assignment error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateAssignment(id, updates) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'assignments', id),
                {
                    ...updates,
                    updatedAt: window.firebase.firestore.serverTimestamp()
                }
            );

            await this.addAuditLog('assignment_updated', { id, updates });
            return { success: true };
        } catch (error) {
            console.error('Update assignment error:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteAssignment(id) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            await window.firebase.firestore.deleteDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'assignments', id)
            );

            await this.addAuditLog('assignment_deleted', { id });
            return { success: true };
        } catch (error) {
            console.error('Delete assignment error:', error);
            return { success: false, error: error.message };
        }
    }

    async addRule(rule) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            const docRef = await window.firebase.firestore.addDoc(
                window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'rules'),
                {
                    ...rule,
                    createdAt: window.firebase.firestore.serverTimestamp(),
                    createdBy: this.currentUser.uid
                }
            );

            await this.addAuditLog('rule_added', { id: docRef.id, ...rule });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Add rule error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateRule(id, updates) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'rules', id),
                {
                    ...updates,
                    updatedAt: window.firebase.firestore.serverTimestamp()
                }
            );

            await this.addAuditLog('rule_updated', { id, updates });
            return { success: true };
        } catch (error) {
            console.error('Update rule error:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteRule(id) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            await window.firebase.firestore.deleteDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'rules', id)
            );

            await this.addAuditLog('rule_deleted', { id });
            return { success: true };
        } catch (error) {
            console.error('Delete rule error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateInstitutionSettings(updates) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution),
                {
                    settings: updates,
                    updatedAt: window.firebase.firestore.serverTimestamp()
                }
            );

            await this.addAuditLog('settings_updated', updates);
            return { success: true };
        } catch (error) {
            console.error('Update settings error:', error);
            return { success: false, error: error.message };
        }
    }

    async addAuditLog(action, data) {
        if (!this.currentInstitution) return;

        try {
            await window.firebase.firestore.addDoc(
                window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'auditLogs'),
                {
                    action,
                    data,
                    userId: this.currentUser?.uid,
                    timestamp: window.firebase.firestore.serverTimestamp()
                }
            );
        } catch (error) {
            console.error('Add audit log error:', error);
        }
    }

    // Batch operations for efficiency
    async batchAddAssignments(assignments) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            const CHUNK_SIZE = 450; // stay safely below Firestore's 500 op limit
            let committed = 0;

            for (let i = 0; i < assignments.length; i += CHUNK_SIZE) {
                const batch = window.firebase.firestore.writeBatch(this.db);
                const chunk = assignments.slice(i, i + CHUNK_SIZE);

                chunk.forEach(assignment => {
                    const docRef = window.firebase.firestore.doc(
                        window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'assignments')
                    );
                    batch.set(docRef, {
                        ...assignment,
                        createdAt: window.firebase.firestore.serverTimestamp(),
                        createdBy: this.currentUser.uid
                    });
                });

                await batch.commit();
                committed += chunk.length;
            }

            await this.addAuditLog('batch_assignments_added', { count: committed });
            return { success: true };
        } catch (error) {
            console.error('Batch add assignments error:', error);
            return { success: false, error: error.message };
        }
    }

    async clearAllAssignments() {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            const snapshot = await window.firebase.firestore.getDocs(
                window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'assignments')
            );

            const CHUNK_SIZE = 450;
            let processed = 0;

            for (let i = 0; i < snapshot.docs.length; i += CHUNK_SIZE) {
                const batch = window.firebase.firestore.writeBatch(this.db);
                const chunk = snapshot.docs.slice(i, i + CHUNK_SIZE);
                chunk.forEach(docItem => {
                    batch.delete(docItem.ref);
                });
                await batch.commit();
                processed += chunk.length;
            }

            await this.addAuditLog('all_assignments_cleared', { count: processed });
            return { success: true };
        } catch (error) {
            console.error('Clear assignments error:', error);
            return { success: false, error: error.message };
        }
    }

    // Real-time listeners
    listenToAttendings(callback) {
        if (!this.currentInstitution) {
            callback([]);
            return () => {};
        }

        const query = window.firebase.firestore.query(
            window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'attendings'),
            window.firebase.firestore.orderBy('name')
        );

        const unsubscribe = window.firebase.firestore.onSnapshot(
            query,
            (snapshot) => {
                const data = snapshot.docs.map(doc =>
                    normalizeAttendingRecord({
                        id: doc.id,
                        ...doc.data()
                    })
                );
                callback(data);
            },
            (error) => {
                console.error('Attendings listener error:', error);
                callback([]);
            }
        );

        return unsubscribe;
    }

    listenToResidents(callback) {
        if (!this.currentInstitution) {
            callback([]);
            return () => {};
        }

        const query = window.firebase.firestore.query(
            window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'residents'),
            window.firebase.firestore.orderBy('name')
        );

        const unsubscribe = window.firebase.firestore.onSnapshot(
            query,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(data);
            },
            (error) => {
                console.error('Residents listener error:', error);
                callback([]);
            }
        );

        return unsubscribe;
    }

    listenToAssignments(callback) {
        if (!this.currentInstitution) {
            callback([]);
            return () => {};
        }

        const query = window.firebase.firestore.query(
            window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'assignments'),
            window.firebase.firestore.orderBy('date')
        );

        const unsubscribe = window.firebase.firestore.onSnapshot(
            query,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(data);
            },
            (error) => {
                console.error('Assignments listener error:', error);
                callback([]);
            }
        );

        return unsubscribe;
    }

    listenToRules(callback) {
        if (!this.currentInstitution) {
            callback([]);
            return () => {};
        }

        const query = window.firebase.firestore.query(
            window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'rules'),
            window.firebase.firestore.orderBy('name')
        );

        const unsubscribe = window.firebase.firestore.onSnapshot(
            query,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(data);
            },
            (error) => {
                console.error('Rules listener error:', error);
                callback([]);
            }
        );

        return unsubscribe;
    }

    listenToInstitution(callback) {
        if (!this.currentInstitution) {
            callback(null);
            return () => {};
        }

        const unsubscribe = window.firebase.firestore.onSnapshot(
            window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution),
            (doc) => {
                if (doc.exists) {
                    callback({ id: doc.id, ...doc.data() });
                } else {
                    callback(null);
                }
            },
            (error) => {
                console.error('Institution listener error:', error);
                callback(null);
            }
        );

        return unsubscribe;
    }

    // ===== Member Management =====
    async getInstitutionMembers() {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            const institutionDoc = await window.firebase.firestore.getDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution)
            );

            if (!institutionDoc.exists()) {
                throw new Error('Institution not found');
            }

            const institutionData = institutionDoc.data();
            const members = institutionData.members || [];

            // Fetch user details for each member
            const memberDetails = await Promise.all(
                members.map(async (member) => {
                    try {
                        const userDoc = await window.firebase.firestore.getDoc(
                            window.firebase.firestore.doc(this.db, 'users', member.userId)
                        );

                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            return {
                                id: member.userId,
                                name: userData.name || 'Unknown',
                                email: userData.email,
                                role: member.role || 'member',
                                joinedAt: member.joinedAt
                            };
                        }
                        return null;
                    } catch (error) {
                        console.error('Error fetching member details:', error);
                        return null;
                    }
                })
            );

            // Filter out null entries and return
            return memberDetails.filter(member => member !== null);
        } catch (error) {
            console.error('Error fetching institution members:', error);
            throw error;
        }
    }

    async createInviteCode(inviteData) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            // Generate a unique invite code
            const code = Math.random().toString(36).substring(2, 10).toUpperCase();

            // Store invite code in Firestore
            await window.firebase.firestore.setDoc(
                window.firebase.firestore.doc(this.db, 'inviteCodes', code),
                {
                    institutionId: this.currentInstitution,
                    role: inviteData.role || 'member',
                    createdBy: this.currentUser.uid,
                    createdAt: window.firebase.firestore.serverTimestamp(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                    used: false
                }
            );

            // Add audit log
            await this.addAuditLog('INVITE_CODE_CREATED', {
                code,
                role: inviteData.role
            });

            return { success: true, code };
        } catch (error) {
            console.error('Error creating invite code:', error);
            return { success: false, error: error.message };
        }
    }

    async updateMemberRole(memberId, newRole) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            // Get current institution document
            const institutionDoc = await window.firebase.firestore.getDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution)
            );

            if (!institutionDoc.exists()) {
                throw new Error('Institution not found');
            }

            const institutionData = institutionDoc.data();
            const members = institutionData.members || [];

            // Find and update the member's role
            const updatedMembers = members.map(member => {
                if (member.userId === memberId) {
                    return { ...member, role: newRole };
                }
                return member;
            });

            // Update the institution document
            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution),
                {
                    members: updatedMembers,
                    updatedAt: window.firebase.firestore.serverTimestamp()
                }
            );

            // Add audit log
            await this.addAuditLog('MEMBER_ROLE_UPDATED', {
                memberId,
                newRole
            });

            return { success: true };
        } catch (error) {
            console.error('Error updating member role:', error);
            return { success: false, error: error.message };
        }
    }

    async removeMember(memberId) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            // Get current institution document
            const institutionDoc = await window.firebase.firestore.getDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution)
            );

            if (!institutionDoc.exists()) {
                throw new Error('Institution not found');
            }

            const institutionData = institutionDoc.data();
            const members = institutionData.members || [];

            // Remove the member
            const updatedMembers = members.filter(member => member.userId !== memberId);

            // Update the institution document
            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution),
                {
                    members: updatedMembers,
                    updatedAt: window.firebase.firestore.serverTimestamp()
                }
            );

            // Remove institution from user's institutions array
            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'users', memberId),
                {
                    institutions: window.firebase.firestore.arrayRemove(
                        this.currentInstitution,
                        {
                            id: this.currentInstitution,
                            role: members.find(m => m.userId === memberId)?.role || 'member'
                        }
                    )
                }
            );

            // Add audit log
            await this.addAuditLog('MEMBER_REMOVED', {
                memberId
            });

            return { success: true };
        } catch (error) {
            console.error('Error removing member:', error);
            return { success: false, error: error.message };
        }
    }

    async redeemInviteCode(code) {
        if (!this.currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            // Get the invite code document
            const inviteDoc = await window.firebase.firestore.getDoc(
                window.firebase.firestore.doc(this.db, 'inviteCodes', code.toUpperCase())
            );

            if (!inviteDoc.exists()) {
                return { success: false, error: 'Invalid invite code' };
            }

            const inviteData = inviteDoc.data();

            // Check if invite code has expired
            if (inviteData.expiresAt && inviteData.expiresAt.toDate() < new Date()) {
                return { success: false, error: 'Invite code has expired' };
            }

            // Check if invite code has already been used (if single-use)
            if (inviteData.used) {
                return { success: false, error: 'Invite code has already been used' };
            }

            // Get institution details
            const institutionDoc = await window.firebase.firestore.getDoc(
                window.firebase.firestore.doc(this.db, 'institutions', inviteData.institutionId)
            );

            if (!institutionDoc.exists()) {
                return { success: false, error: 'Institution not found' };
            }

            const institutionData = institutionDoc.data();

            // Add user to institution members
            const members = institutionData.members || [];
            const userProfile = await this.loadUserProfile();

            // Check if user is already a member
            if (members.some(m => m.userId === this.currentUser.uid)) {
                return { success: false, error: 'You are already a member of this institution' };
            }

            // Add user as member
            members.push({
                userId: this.currentUser.uid,
                name: userProfile.displayName || this.currentUser.email,
                email: this.currentUser.email,
                role: inviteData.role || 'member',
                joinedAt: window.firebase.firestore.serverTimestamp()
            });

            // Update institution with new member
            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'institutions', inviteData.institutionId),
                {
                    members: members,
                    updatedAt: window.firebase.firestore.serverTimestamp()
                }
            );

            // Add institution to user's institutions array (store IDs consistently)
            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'users', this.currentUser.uid),
                {
                    institutions: window.firebase.firestore.arrayUnion(inviteData.institutionId),
                    currentInstitution: inviteData.institutionId
                }
            );

            // Mark invite code as used (if single-use)
            if (inviteData.singleUse !== false) {
                await window.firebase.firestore.updateDoc(
                    window.firebase.firestore.doc(this.db, 'inviteCodes', code.toUpperCase()),
                    {
                        used: true,
                        usedBy: this.currentUser.uid,
                        usedAt: window.firebase.firestore.serverTimestamp()
                    }
                );
            }

            // Set current institution
            this.currentInstitution = inviteData.institutionId;
            await this.loadInstitution(inviteData.institutionId);

            // Add audit log
            await this.addAuditLog('MEMBER_JOINED_VIA_INVITE', {
                inviteCode: code,
                role: inviteData.role || 'member'
            });

            return {
                success: true,
                institutionName: institutionData.name,
                institutionId: inviteData.institutionId
            };
        } catch (error) {
            console.error('Error redeeming invite code:', error);
            return { success: false, error: error.message };
        }
    }
}

// ==================== App Context ====================
const firebaseService = new FirebaseService();
const AppContext = createContext();

const AppProvider = ({ children }) => {
    const [state, setState] = useState({
        user: null,
        institution: null,
        attendings: [],
        residents: [],
        assignments: {},
        rules: [],
        loading: true
    });

    useEffect(() => {
        const initFirebase = async () => {
            await firebaseService.initialize();

            // Subscribe to Firebase updates
            firebaseService.subscribe((type, data) => {
                setState(prev => ({
                    ...prev,
                    [type === 'institution' ? 'institution' : type]: data
                }));
            });

            // Listen to auth state
            window.firebase.auth.onAuthStateChanged(window.firebaseAuth, async (user) => {
                if (user) {
                    const profile = await firebaseService.loadUserProfile();
                    setState(prev => ({
                        ...prev,
                        user: { ...user, ...profile },
                        loading: false
                    }));
                } else {
                    setState(prev => ({
                        ...prev,
                        user: null,
                        institution: null,
                        attendings: [],
                        residents: [],
                        assignments: {},
                        rules: [],
                        loading: false
                    }));
                }
            });
        };

        initFirebase();
    }, []);

    const value = {
        ...state,
        firebaseService
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const useApp = () => useContext(AppContext);

// ==================== Shared Components ====================
const Icon = ({ name, size = 20, className = "" }) => {
    useEffect(() => {
        if (lucide?.createIcons) {
            const icons = lucide.icons;
            icons ? lucide.createIcons({ icons }) : lucide.createIcons();
        }
    }, []);
    return <i data-lucide={name} className={className} style={{ width: size, height: size }}></i>;
};

const Button = ({ children, variant = 'primary', size = 'md', className = "", icon, loading = false, ...props }) => {
    const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ease-in-out focus-ring transform";
    const variants = {
        primary: "bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/20 hover:-translate-y-0.5 active:scale-95 focus:ring-primary-500",
        secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md hover:-translate-y-0.5 active:scale-95 focus:ring-primary-500",
        ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 focus:ring-gray-500",
        danger: "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20 hover:-translate-y-0.5 active:scale-95 focus:ring-red-500",
        success: "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/20 hover:-translate-y-0.5 active:scale-95 focus:ring-green-500"
    };
    const sizes = {
        sm: "px-3 py-1.5 text-sm gap-1.5",
        md: "px-4 py-2 text-sm gap-2",
        lg: "px-6 py-3 text-base gap-2"
    };

    return (
        <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`}
            disabled={loading}
            {...props}
        >
            {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : icon ? (
                <Icon name={icon} size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} />
            ) : null}
            {children}
        </motion.button>
    );
};

const Card = ({ children, className = "", padding = true, hover = false, ...motionProps }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
        className={`bg-white rounded-xl card-shadow border border-gray-200 transition-all duration-200 ease-in-out ${
            hover ? 'hover:card-shadow-hover' : ''
        } ${padding ? 'p-6' : ''} ${className}`}
        {...motionProps}
    >
        {children}
    </motion.div>
);

// Enhanced Loading Components
const LoadingSpinner = ({ size = 'md', className = "" }) => {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    return (
        <div className={`flex justify-center py-8 ${className}`}>
            <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizes[size]}`}></div>
        </div>
    );
};

const SkeletonCard = ({ lines = 3, className = "" }) => (
    <Card className={`animate-pulse ${className}`}>
        <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded shimmer"></div>
            {Array.from({ length: lines - 1 }).map((_, i) => (
                <div key={i} className={`h-4 bg-gray-200 rounded shimmer ${i === lines - 2 ? 'w-3/4' : ''}`}></div>
            ))}
        </div>
    </Card>
);

const SkeletonText = ({ lines = 2, className = "" }) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className={`h-4 bg-gray-200 rounded shimmer ${i === lines - 1 ? 'w-3/4' : ''}`}></div>
        ))}
    </div>
);

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl'
    };

    const dialogRef = useRef(null);
    const previousFocusRef = useRef(null);
    const titleIdRef = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`);

    useEffect(() => {
        if (!isOpen) return;

        previousFocusRef.current = document.activeElement;

        const focusFirstElement = () => {
            const node = dialogRef.current;
            if (!node) return;
            const focusableSelectors = [
                'a[href]',
                'button:not([disabled])',
                'textarea:not([disabled])',
                'input:not([disabled])',
                'select:not([disabled])',
                '[tabindex]:not([tabindex="-1"])'
            ];
            const focusable = node.querySelectorAll(focusableSelectors.join(','));
            if (focusable.length > 0) {
                focusable[0].focus();
            } else {
                node.focus();
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose?.();
                return;
            }

            if (event.key !== 'Tab') return;

            const node = dialogRef.current;
            if (!node) return;

            const focusableSelectors = [
                'a[href]',
                'button:not([disabled])',
                'textarea:not([disabled])',
                'input:not([disabled])',
                'select:not([disabled])',
                '[tabindex]:not([tabindex="-1"])'
            ];
            const focusable = node.querySelectorAll(focusableSelectors.join(','));
            if (focusable.length === 0) {
                event.preventDefault();
                node.focus();
                return;
            }

            const firstElement = focusable[0];
            const lastElement = focusable[focusable.length - 1];
            const activeElement = document.activeElement;

            if (event.shiftKey) {
                if (activeElement === firstElement || !node.contains(activeElement)) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else if (activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        focusFirstElement();
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
                previousFocusRef.current.focus();
            }
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 overflow-y-auto"
            >
                <div className="flex items-center justify-center min-h-screen p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`relative bg-white rounded-2xl shadow-2xl ${sizes[size]} w-full max-h-[90vh] overflow-hidden`}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleIdRef.current}
                        ref={dialogRef}
                        tabIndex={-1}
                    >
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 id={titleIdRef.current} className="text-xl font-semibold text-gray-900">{title}</h3>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Close dialog"
                            >
                                <Icon name="x" size={20} />
                            </motion.button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                            {children}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>,
        document.getElementById('modal-root')
    );
};

// ==================== Auth Components ====================
const LoginPage = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        confirmPassword: '',
        inviteCode: ''
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const { firebaseService } = useApp();

    const validateField = (field, value) => {
        let result = { isValid: true };

        switch (field) {
            case 'email':
                result = ValidationUtils.validateEmail(value);
                break;
            case 'name':
                if (isSignUp) {
                    result = ValidationUtils.validateName(value, 'Full name');
                }
                break;
            case 'password':
                if (!value) {
                    result = { isValid: false, error: 'Password is required' };
                }
                break;
            case 'confirmPassword':
                if (isSignUp) {
                    if (!value) {
                        result = { isValid: false, error: 'Please confirm your password' };
                    } else if (value !== formData.password) {
                        result = { isValid: false, error: 'Passwords do not match' };
                    }
                }
                break;
            case 'inviteCode':
                // Invite code is optional, but if provided should be 6 characters
                if (isSignUp && value) {
                    const trimmed = value.trim().toUpperCase();
                    if (trimmed.length !== 6) {
                        result = { isValid: false, error: 'Invite code must be 6 characters' };
                    } else {
                        result = { isValid: true, value: trimmed };
                    }
                }
                break;
        }

        return result;
    };

    const handleFieldChange = (field, value) => {
        setFormData({ ...formData, [field]: value });

        // Clear error when user starts typing
        if (touched[field]) {
            const validation = validateField(field, value);
            setErrors(prev => ({
                ...prev,
                [field]: validation.isValid ? undefined : validation.error
            }));
        }
    };

    const handleFieldBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const validation = validateField(field, formData[field]);
        setErrors(prev => ({
            ...prev,
            [field]: validation.isValid ? undefined : validation.error
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validate all fields
        const fieldsToValidate = isSignUp
            ? ['email', 'password', 'name', 'confirmPassword']
            : ['email', 'password'];

        const newErrors = {};
        const validatedValues = {};
        let isFormValid = true;

        for (const field of fieldsToValidate) {
            const validation = validateField(field, formData[field]);
            if (!validation.isValid) {
                newErrors[field] = validation.error;
                isFormValid = false;
            } else if (validation.value !== undefined) {
                validatedValues[field] = validation.value;
            }
        }

        if (!isFormValid) {
            setErrors(newErrors);
            setTouched(Object.fromEntries(fieldsToValidate.map(f => [f, true])));
            setLoading(false);
            return;
        }

        try {
            if (isSignUp) {
                const result = await firebaseService.signUp(
                    validatedValues.email || formData.email,
                    formData.password,
                    validatedValues.name || formData.name
                );
                if (result.success) {
                    toast.success('Account created successfully!');

                    // Check if user has an invite code
                    const inviteCode = validatedValues.inviteCode || formData.inviteCode;
                    if (inviteCode) {
                        // Redeem invite code to join existing institution
                        const redeemResult = await firebaseService.redeemInviteCode(inviteCode);
                        if (redeemResult.success) {
                            toast.success(`Joined ${redeemResult.institutionName} successfully!`);
                        } else {
                            toast.error(`Failed to redeem invite code: ${redeemResult.error}`);
                        }
                    } else {
                        // Create first institution if no invite code
                        const instResult = await firebaseService.createInstitution(
                            `${validatedValues.name || formData.name}'s Institution`,
                            { name: validatedValues.name || formData.name, email: validatedValues.email || formData.email }
                        );
                        if (instResult.success) {
                            toast.success('Institution created!');
                        }
                    }
                } else {
                    toast.error(result.error);
                }
            } else {
                const result = await firebaseService.signIn(
                    validatedValues.email || formData.email,
                    formData.password
                );
                if (result.success) {
                    toast.success('Welcome back!');
                } else {
                    toast.error(result.error);
                }
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        const emailValidation = ValidationUtils.validateEmail(formData.email);
        if (!emailValidation.isValid) {
            setErrors({ email: emailValidation.error });
            setTouched({ email: true });
            return;
        }

        const result = await firebaseService.resetPassword(emailValidation.value);
        if (result.success) {
            toast.success('Password reset email sent!');
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card>
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-xl mb-4">
                            <Icon name="calendar-days" size={32} className="text-primary-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Clinic Scheduler</h1>
                        <p className="text-gray-600 mt-2">
                            {isSignUp ? 'Create your account' : 'Sign in to continue'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                    onBlur={() => handleFieldBlur('name')}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                        errors.name && touched.name
                                            ? 'border-red-500 bg-red-50'
                                            : touched.name && !errors.name
                                            ? 'border-green-500'
                                            : 'border-gray-300'
                                    }`}
                                    aria-invalid={errors.name && touched.name}
                                    aria-describedby={errors.name && touched.name ? 'name-error' : undefined}
                                />
                                {errors.name && touched.name && (
                                    <p id="name-error" className="mt-1 text-xs text-red-600">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleFieldChange('email', e.target.value)}
                                onBlur={() => handleFieldBlur('email')}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                    errors.email && touched.email
                                        ? 'border-red-500 bg-red-50'
                                        : touched.email && !errors.email
                                        ? 'border-green-500'
                                        : 'border-gray-300'
                                }`}
                                autoComplete="email"
                                aria-invalid={errors.email && touched.email}
                                aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
                            />
                            {errors.email && touched.email && (
                                <p id="email-error" className="mt-1 text-xs text-red-600">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => handleFieldChange('password', e.target.value)}
                                onBlur={() => handleFieldBlur('password')}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                    errors.password && touched.password
                                        ? 'border-red-500 bg-red-50'
                                        : touched.password && !errors.password
                                        ? 'border-green-500'
                                        : 'border-gray-300'
                                }`}
                                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                                aria-invalid={errors.password && touched.password}
                                aria-describedby={errors.password && touched.password ? 'password-error' : undefined}
                            />
                            {errors.password && touched.password && (
                                <p id="password-error" className="mt-1 text-xs text-red-600">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {isSignUp && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                                        onBlur={() => handleFieldBlur('confirmPassword')}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                            errors.confirmPassword && touched.confirmPassword
                                                ? 'border-red-500 bg-red-50'
                                                : touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword
                                                ? 'border-green-500'
                                                : 'border-gray-300'
                                        }`}
                                        autoComplete="new-password"
                                        aria-invalid={errors.confirmPassword && touched.confirmPassword}
                                        aria-describedby={errors.confirmPassword && touched.confirmPassword ? 'confirm-password-error' : undefined}
                                    />
                                    {errors.confirmPassword && touched.confirmPassword && (
                                        <p id="confirm-password-error" className="mt-1 text-xs text-red-600">
                                            {errors.confirmPassword}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Invite Code <span className="text-gray-400 text-xs">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.inviteCode}
                                        onChange={(e) => handleFieldChange('inviteCode', e.target.value)}
                                        onBlur={() => handleFieldBlur('inviteCode')}
                                        placeholder="Enter 6-character code"
                                        maxLength={6}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                            errors.inviteCode && touched.inviteCode
                                                ? 'border-red-500 bg-red-50'
                                                : touched.inviteCode && !errors.inviteCode && formData.inviteCode
                                                ? 'border-green-500'
                                                : 'border-gray-300'
                                        }`}
                                        style={{ textTransform: 'uppercase' }}
                                        aria-invalid={errors.inviteCode && touched.inviteCode}
                                        aria-describedby={errors.inviteCode && touched.inviteCode ? 'invite-code-error' : undefined}
                                    />
                                    {errors.inviteCode && touched.inviteCode && (
                                        <p id="invite-code-error" className="mt-1 text-xs text-red-600">
                                            {errors.inviteCode}
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        Have an invite code? Enter it to join an existing institution.
                                    </p>
                                </div>
                            </>
                        )}

                        <Button type="submit" className="w-full" loading={loading}>
                            {isSignUp ? 'Create Account' : 'Sign In'}
                        </Button>

                        {!isSignUp && (
                            <button
                                type="button"
                                onClick={handleResetPassword}
                                className="w-full text-sm text-primary-600 hover:text-primary-700"
                            >
                                Forgot Password?
                            </button>
                        )}

                        <div className="text-center pt-4 border-t">
                            <p className="text-sm text-gray-600">
                                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                                <button
                                    type="button"
                                    onClick={() => setIsSignUp(!isSignUp)}
                                    className="ml-1 text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    {isSignUp ? 'Sign In' : 'Sign Up'}
                                </button>
                            </p>
                        </div>
                    </form>
                </Card>

                <p className="text-center text-xs text-gray-500 mt-4">
                    Protected by Firebase Authentication • Real-time Sync Enabled
                </p>
            </div>
        </div>
    );
};

// ==================== Dashboard Component ====================
const Dashboard = () => {
    const { attendings, residents, assignments, rules, institution, firebaseService } = useApp();

    const stats = useMemo(() => {
        const totalAssignments = Object.values(assignments).flat().length;
        const thisWeek = Object.entries(assignments)
            .filter(([key]) => {
                const [date] = key.split('_');
                const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
                const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
                const assignmentDate = parseISO(date);
                return assignmentDate >= weekStart && assignmentDate <= weekEnd;
            })
            .reduce((sum, [, items]) => sum + items.length, 0);

        return [
            { label: 'Total Attendings', value: attendings.length, icon: 'users', color: 'blue' },
            { label: 'Total Residents', value: residents.length, icon: 'user-check', color: 'green' },
            { label: 'This Week', value: thisWeek, icon: 'calendar', color: 'purple' },
            { label: 'Active Rules', value: rules.filter(r => r.isActive).length, icon: 'shield-check', color: 'amber' }
        ];
    }, [attendings, residents, assignments, rules]);

    const getColorClasses = (color) => {
        const colors = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            amber: 'bg-amber-100 text-amber-600'
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                    <p className="text-gray-600">Real-time overview of your scheduling system</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={async () => {
                            try {
                                const calculateAnalytics = window.firebase.functions.httpsCallable('calculateAnalytics');
                                const startDate = new Date();
                                startDate.setMonth(startDate.getMonth() - 1);
                                const result = await calculateAnalytics({
                                    institutionId: firebaseService.currentInstitution,
                                    startDate: startDate.toISOString().split('T')[0],
                                    endDate: new Date().toISOString().split('T')[0]
                                });
                                console.log('Analytics:', result.data);
                                toast.success('Analytics calculated - check console');
                            } catch (error) {
                                toast.error('Failed to calculate analytics');
                            }
                        }}
                    >
                        <Icon name="bar-chart" size={16} className="mr-2" />
                        Analytics
                    </Button>
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={async () => {
                            try {
                                const generatePDF = window.firebase.functions.httpsCallable('generateSchedulePDF');
                                const startDate = new Date();
                                const endDate = new Date();
                                endDate.setDate(endDate.getDate() + 30);
                                const result = await generatePDF({
                                    institutionId: firebaseService.currentInstitution,
                                    startDate: startDate.toISOString().split('T')[0],
                                    endDate: endDate.toISOString().split('T')[0]
                                });
                                // Download the PDF
                                const binaryPdf = atob(result.data.pdf);
                                const byteArray = new Uint8Array(binaryPdf.length);
                                for (let i = 0; i < binaryPdf.length; i++) {
                                    byteArray[i] = binaryPdf.charCodeAt(i);
                                }
                                const blob = new Blob([byteArray], { type: 'application/pdf' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = result.data.filename;
                                a.click();
                                toast.success('PDF generated and downloaded');
                            } catch (error) {
                                toast.error('Failed to generate PDF');
                            }
                        }}
                    >
                        <Icon name="download" size={16} className="mr-2" />
                        Export PDF
                    </Button>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-700 font-medium">Live Sync</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                    >
                        <Card hover className="card-shadow-hover">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">{stat.label}</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                                    <Icon name={stat.icon} size={24} />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

// ==================== Schedule Calendar Component ====================
const ScheduleCalendar = ({ initialFilter, onNavigateToPerson, onOpenChatAssistant }) => {
    const { firebaseService, institution } = useApp();
    const sites = institution?.settings?.sites || [];
    const [viewMode, setViewMode] = useState(() => {
        return localStorage.getItem('scheduleViewMode') || 'month';
    });
    const [activeDate, setActiveDate] = useState(() => normalizeDate(new Date()));
    const [assignments, setAssignments] = useState([]);
    const [attendings, setAttendings] = useState([]);
    const [residents, setResidents] = useState([]);
    const [draggedItem, setDraggedItem] = useState(null);
    const [showAutoScheduler, setShowAutoScheduler] = useState(false);
    const [selectedCell, setSelectedCell] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deletingIds, setDeletingIds] = useState(new Set());
    const [showAttendingAdjuster, setShowAttendingAdjuster] = useState(false);

    // Individual schedule view states
    const [scheduleFilter, setScheduleFilter] = useState(initialFilter?.type || 'all');
    const [selectedPersonId, setSelectedPersonId] = useState(initialFilter?.id || null);
    const [showPersonSelector, setShowPersonSelector] = useState(false);

    const normalizedAttendings = useMemo(() => {
        return attendings.map(att => normalizeAttendingRecord(att, sites));
    }, [attendings, sites]);

    const residentsRef = useRef(residents);
    useEffect(() => {
        residentsRef.current = residents;
    }, [residents]);

    const attendingsRef = useRef(normalizedAttendings);
    useEffect(() => {
        attendingsRef.current = normalizedAttendings;
    }, [normalizedAttendings]);

    useEffect(() => {
        setAttendings(current => current.map(att => normalizeAttendingRecord(att, sites)));
    }, [sites]);

    const selectedAttending = useMemo(() => {
        if (scheduleFilter !== 'attending' || !selectedPersonId) return null;
        return normalizedAttendings.find(a => a.id === selectedPersonId) || null;
    }, [normalizedAttendings, scheduleFilter, selectedPersonId]);

    // Update filter when prop changes
    useEffect(() => {
        if (initialFilter) {
            setScheduleFilter(initialFilter.type);
            setSelectedPersonId(initialFilter.id);
        }
    }, [initialFilter]);

    // Save view mode preference
    useEffect(() => {
        localStorage.setItem('scheduleViewMode', viewMode);
    }, [viewMode]);

    // Generate virtual assignments for continuity clinics and protected times
    const generateVirtualAssignments = (residents, protectedTimes, attendingsList = [], siteList = []) => {
        const virtual = [];
        const today = new Date();

        const siteLookup = new Map(siteList.map(site => [site.id, site]));

        // Generate continuity clinic assignments
        residents.forEach(resident => {
            if (resident.continuityDay && resident.continuityTime && resident.continuitySiteId) {
                const dayMap = {
                    sunday: 0,
                    monday: 1,
                    tuesday: 2,
                    wednesday: 3,
                    thursday: 4,
                    friday: 5,
                    saturday: 6
                };
                const targetDay = dayMap[resident.continuityDay?.toLowerCase?.()] ?? null;
                if (targetDay === null) {
                    return;
                }

                // Generate for next 52 weeks (1 year)
                for (let week = 0; week < 52; week++) {
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay() + week * 7);
                    const targetDate = new Date(weekStart);
                    targetDate.setDate(weekStart.getDate() + targetDay);

                    // Check if this week is a vacation week
                    const targetWeekStr = targetDate.toISOString().split('T')[0];
                    const isVacationWeek = resident.vacationWeeks?.some(vw => {
                        const vacationStart = new Date(vw);
                        const vacationEnd = new Date(vacationStart);
                        vacationEnd.setDate(vacationEnd.getDate() + 6);
                        return targetDate >= vacationStart && targetDate <= vacationEnd;
                    });

                    if (targetDate >= today && !isVacationWeek) {
                        virtual.push({
                            id: `continuity_${resident.id}_${targetDate.toISOString().split('T')[0]}`,
                            residentId: resident.id,
                            attendingId: null,
                            date: targetDate.toISOString().split('T')[0],
                            timeSlot: resident.continuityTime,
                            type: 'continuity',
                            siteId: resident.continuitySiteId,
                            virtual: true
                        });
                    }
                }
            }
        });

        // Generate protected time assignments
        if (protectedTimes) {
            protectedTimes.forEach(pt => {
                // Generate for next 52 weeks (1 year)
                for (let week = 0; week < 52; week++) {
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay() + week * 7);
                    const targetDate = new Date(weekStart);
                    targetDate.setDate(weekStart.getDate() + pt.dayOfWeek);

                    if (targetDate >= today) {
                        // Create assignments for all applicable residents
                        residents.forEach(resident => {
                            const residentPGY = resident.pgyStatus || 'PGY-1';
                            if (pt.appliesTo === 'all' || pt.appliesTo === residentPGY) {
                                virtual.push({
                                    id: `protected_${pt.id}_${resident.id}_${targetDate.toISOString().split('T')[0]}`,
                                    residentId: resident.id,
                                    attendingId: null,
                                    date: targetDate.toISOString().split('T')[0],
                                    timeSlot: pt.timeSlot,
                                    type: 'protected',
                                    eventName: pt.name,
                                    eventType: pt.eventType,
                                    siteId: pt.siteId,
                                    mandatory: pt.mandatory,
                                    virtual: true
                                });
                            }
                        });
                    }
                }
            });
        }

        // Generate attending default clinic sessions
        attendingsList.forEach(attending => {
            if (!attending) return;
            const clinics = attending.clinics || [];
            const overrides = Array.isArray(attending.scheduleOverrides) ? attending.scheduleOverrides : [];

            const overridesBySlot = new Map();
            overrides.forEach(override => {
                if (!override?.date || !override?.timeSlot) return;
                const key = `${override.date}_${override.timeSlot}`;
                if (!overridesBySlot.has(key)) {
                    overridesBySlot.set(key, []);
                }
                overridesBySlot.get(key).push(override);
            });

            clinics.forEach(clinic => {
                const defaultSessions = clinic.defaultSessions || [];
                defaultSessions.forEach(session => {
                    for (let week = 0; week < 52; week++) {
                        const weekStart = new Date(today);
                        weekStart.setDate(today.getDate() - today.getDay() + week * 7);
                        const targetDate = new Date(weekStart);
                        targetDate.setDate(weekStart.getDate() + session.dayOfWeek);

                        if (targetDate < today) {
                            continue;
                        }

                        const dateStr = targetDate.toISOString().split('T')[0];
                        const timeSlot = session.timeSlot || 'AM';
                        const key = `${dateStr}_${timeSlot}`;
                        const slotOverrides = overridesBySlot.get(key) || [];
                        const isCancelled = slotOverrides.some(override => {
                            if (override.action !== 'cancel') return false;
                            if (override.clinicId && override.clinicId !== clinic.id) return false;
                            return true;
                        });

                        if (isCancelled) {
                            continue;
                        }

                        virtual.push({
                            id: `attending_default_${attending.id}_${clinic.id}_${dateStr}_${timeSlot}`,
                            attendingId: attending.id,
                            clinicId: clinic.id,
                            siteId: clinic.siteId || '',
                            date: dateStr,
                            timeSlot,
                            type: 'clinic-default',
                            residentCapacity: clinic.residentCapacity || 0,
                            virtual: true,
                            virtualSource: 'attending-default',
                            attendingName: attending.name,
                            clinicName: clinic.name || 'Clinic',
                            siteName: siteLookup.get(clinic.siteId)?.name || ''
                        });
                    }
                });
            });

            overrides.forEach(override => {
                if (!override || override.action !== 'add' || !override.date || !override.timeSlot) {
                    return;
                }

                const clinic = clinics.find(c => c.id === override.clinicId);
                const timeSlot = override.timeSlot || 'AM';
                const siteId = override.siteId || clinic?.siteId || '';

                virtual.push({
                    id: `attending_override_${attending.id}_${override.date}_${timeSlot}_${override.id || generateId('override')}`,
                    attendingId: attending.id,
                    clinicId: override.clinicId || clinic?.id || null,
                    siteId,
                    date: override.date,
                    timeSlot,
                    type: 'clinic-override',
                    residentCapacity: override.residentCapacity ?? clinic?.residentCapacity ?? 0,
                    virtual: true,
                    virtualSource: 'attending-override',
                    scheduleOverrideId: override.id || null,
                    attendingName: attending.name,
                    clinicName: override.label || clinic?.name || 'Clinic',
                    siteName: siteLookup.get(siteId)?.name || ''
                });
            });
        });

        return virtual;
    };

    useEffect(() => {
        if (!firebaseService.currentInstitution) {
            setLoading(false);
            return;
        }

        // Set up real-time listeners
        const unsubscribeAssignments = firebaseService.listenToAssignments((data) => {
            const virtualAssignments = generateVirtualAssignments(
                residentsRef.current,
                institution?.settings?.protectedTimes,
                attendingsRef.current,
                sites
            );
            const mergedAssignments = [...data, ...virtualAssignments];
            setAssignments(mergedAssignments);
            setLoading(false);
        });

        const unsubscribeAttendings = firebaseService.listenToAttendings((data) => {
            const normalized = data.map(att => normalizeAttendingRecord(att, sites));
            setAttendings(normalized);
            attendingsRef.current = normalized;
            setAssignments(prev => {
                const realAssignments = prev.filter(a => !a.virtual);
                const virtualAssignments = generateVirtualAssignments(
                    residentsRef.current,
                    institution?.settings?.protectedTimes,
                    normalized,
                    sites
                );
                return [...realAssignments, ...virtualAssignments];
            });
        });

        const unsubscribeResidents = firebaseService.listenToResidents((data) => {
            setResidents(data);
            residentsRef.current = data;
            const virtualAssignments = generateVirtualAssignments(
                data,
                institution?.settings?.protectedTimes,
                attendingsRef.current,
                sites
            );
            setAssignments(prev => {
                const realAssignments = prev.filter(a => !a.virtual);
                return [...realAssignments, ...virtualAssignments];
            });
        });

        return () => {
            unsubscribeAssignments();
            unsubscribeAttendings();
            unsubscribeResidents();
        };
    }, [firebaseService.currentInstitution, institution?.settings?.protectedTimes, sites]);

    const weekStart = useMemo(() => getStartOfWeekSunday(activeDate), [activeDate]);
    const monthStart = useMemo(() => getStartOfMonthDate(activeDate), [activeDate]);
    const monthEnd = useMemo(() => getEndOfMonthDate(activeDate), [activeDate]);

    const weekDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart.getTime());
            day.setDate(day.getDate() + i);
            days.push(day);
        }
        return days;
    }, [weekStart]);

    const getDayName = (date) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    };

    const isWeekend = (date) => {
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday (0) or Saturday (6)
    };

    const monthDays = useMemo(() => {
        if (viewMode !== 'month') return [];

        const calendarStart = getStartOfWeekSunday(monthStart);
        const calendarEnd = getEndOfWeekSaturday(monthEnd);

        const days = [];
        const cursor = new Date(calendarStart.getTime());
        while (cursor <= calendarEnd) {
            days.push(new Date(cursor.getTime()));
            cursor.setDate(cursor.getDate() + 1);
        }

        return days;
    }, [monthStart, monthEnd, viewMode]);

    const timeSlots = ['AM', 'PM'];

    const getAssignmentsForSlot = (date, timeSlot) => {
        const dateStr = window.dateFns ? window.dateFns.format(date, 'yyyy-MM-dd') : date.toISOString().split('T')[0];
        return assignments.filter(a => a.date === dateStr && a.timeSlot === timeSlot);
    };

    const handleDragStart = (e, assignment) => {
        setDraggedItem(assignment);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, date, timeSlot) => {
        e.preventDefault();
        if (!draggedItem) return;

        const dateStr = window.dateFns ? window.dateFns.format(date, 'yyyy-MM-dd') : date.toISOString().split('T')[0];

        const conflictCheck = ConflictDetection.checkAllConflicts({
            assignments,
            newAssignment: { ...draggedItem, date: dateStr, timeSlot },
            attendings,
            residents,
            institution,
            excludeId: draggedItem.id
        });

        if (conflictCheck.hasErrors) {
            toast.error(conflictCheck.summary);
            setDraggedItem(null);
            return;
        }

        if (conflictCheck.hasWarnings) {
            toast.warning(conflictCheck.summary);
        }

        await firebaseService.updateAssignment(draggedItem.id, {
            date: dateStr,
            timeSlot
        });

        toast.success('Assignment moved successfully');
        setDraggedItem(null);
    };

    const handleQuickAdd = async (date, timeSlot) => {
        const dateStr = window.dateFns ? window.dateFns.format(date, 'yyyy-MM-dd') : date.toISOString().split('T')[0];
        setSelectedCell({ date: dateStr, timeSlot });
    };

    const handleDeleteAssignment = async (assignmentId) => {
        if (!confirm('Delete this assignment?')) return;

        // Add to deleting set
        setDeletingIds(prev => new Set(prev).add(assignmentId));

        try {
            await firebaseService.deleteAssignment(assignmentId);
            toast.success('Assignment deleted');
        } catch (error) {
            console.error('Error deleting assignment:', error);
            toast.error('Failed to delete assignment');
        } finally {
            // Remove from deleting set
            setDeletingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(assignmentId);
                return newSet;
            });
        }
    };

    const navigate = (direction) => {
        setActiveDate(prev => {
            const next = new Date(prev.getTime());
            if (viewMode === 'week') {
                next.setDate(next.getDate() + direction * 7);
            } else {
                const currentDay = next.getDate();
                next.setDate(1);
                next.setMonth(next.getMonth() + direction);
                const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
                next.setDate(Math.min(currentDay, daysInMonth));
            }
            return normalizeDate(next);
        });
    };

    const switchViewMode = (mode) => {
        setViewMode(mode);
    };

    const getAssignmentCount = (date) => {
        const dateStr = window.dateFns ? window.dateFns.format(date, 'yyyy-MM-dd') : date.toISOString().split('T')[0];
        return assignments.filter(a => a.date === dateStr).length;
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    const isCurrentMonth = (date) => {
        return date.getMonth() === monthStart.getMonth() && date.getFullYear() === monthStart.getFullYear();
    };

    // Filter assignments based on selected person
    const getFilteredAssignments = () => {
        if (scheduleFilter === 'all' || !selectedPersonId) {
            return assignments;
        }

        if (scheduleFilter === 'resident') {
            return assignments.filter(a => a.residentId === selectedPersonId);
        }

        if (scheduleFilter === 'attending') {
            return assignments.filter(a => a.attendingId === selectedPersonId);
        }

        return assignments;
    };

    const getFilteredAssignmentsForSlot = (date, timeSlot) => {
        const dateStr = window.dateFns ? window.dateFns.format(date, 'yyyy-MM-dd') : date.toISOString().split('T')[0];
        const filtered = getFilteredAssignments();
        return filtered.filter(a => a.date === dateStr && a.timeSlot === timeSlot);
    };

    const selectPerson = (type, personId) => {
        setScheduleFilter(type);
        setSelectedPersonId(personId);
        setShowPersonSelector(false);
    };

    const clearFilter = () => {
        setScheduleFilter('all');
        setSelectedPersonId(null);
    };

    const getSelectedPersonName = () => {
        if (scheduleFilter === 'resident' && selectedPersonId) {
            const resident = residents.find(r => r.id === selectedPersonId);
            return resident?.name || 'Unknown';
        }
        if (scheduleFilter === 'attending' && selectedPersonId) {
            const attending = normalizedAttendings.find(a => a.id === selectedPersonId);
            return attending?.name || 'Unknown';
        }
        return null;
    };

    const handleApplyAttendingOverride = async (attendingId, overrideData) => {
        const attending = normalizedAttendings.find(a => a.id === attendingId);
        if (!attending) {
            toast.error('Attending not found');
            return;
        }

        const { action, clinicId, date, timeSlot, residentCapacity, siteId } = overrideData;
        if (!action || !date || !timeSlot) {
            toast.error('Select a date, time, and action.');
            return;
        }

        const overrides = Array.isArray(attending.scheduleOverrides)
            ? [...attending.scheduleOverrides]
            : [];

        const clinic = attending.clinics?.find(c => c.id === clinicId) || null;
        const dateObj = normalizeDate(date);
        if (!Number.isFinite(dateObj.getTime())) {
            toast.error('Invalid date selected.');
            return;
        }
        const dayOfWeek = dateObj.getDay();

        let message = '';

        if (action === 'cancel') {
            if (!clinic) {
                toast.error('Select a clinic to cancel.');
                return;
            }

            const hasDefaultSession = clinic.defaultSessions?.some(session =>
                session.dayOfWeek === dayOfWeek && session.timeSlot === timeSlot
            );

            if (!hasDefaultSession) {
                toast.error('No default clinic is scheduled for that day and time.');
                return;
            }

            const existingIndex = overrides.findIndex(override =>
                override.action === 'cancel' &&
                override.clinicId === clinicId &&
                override.date === date &&
                override.timeSlot === timeSlot
            );

            if (existingIndex >= 0) {
                overrides.splice(existingIndex, 1);
                message = 'Default clinic restored for that day.';
            } else {
                overrides.push({
                    id: generateId('override'),
                    action: 'cancel',
                    clinicId,
                    date,
                    timeSlot
                });
                message = 'Default clinic cancelled for that day.';
            }
        } else if (action === 'add') {
            if (!clinic) {
                toast.error('Select a clinic to add.');
                return;
            }

            const alreadyExists = overrides.some(override =>
                override.action === 'add' &&
                override.clinicId === clinicId &&
                override.date === date &&
                override.timeSlot === timeSlot
            );

            if (alreadyExists) {
                toast.warning('An additional session already exists for this slot.');
                return;
            }

            overrides.push({
                id: generateId('override'),
                action: 'add',
                clinicId,
                siteId: siteId || clinic.siteId || '',
                date,
                timeSlot,
                residentCapacity: Number.isFinite(residentCapacity) ? residentCapacity : (clinic.residentCapacity || 0),
                label: clinic.name
            });
            message = 'Additional clinic session added.';
        } else {
            toast.error('Unsupported override action.');
            return;
        }

        try {
            await firebaseService.updateAttending(attendingId, { scheduleOverrides: overrides });
            setAttendings(current => current.map(att => (
                att.id === attendingId
                    ? { ...att, scheduleOverrides: overrides }
                    : att
            )));
            toast.success(message);
        } catch (error) {
            console.error('Failed to update attending overrides:', error);
            toast.error('Failed to update attending schedule.');
        }
    };

    const handleRemoveAttendingOverride = async (attendingId, override) => {
        const attending = normalizedAttendings.find(a => a.id === attendingId);
        if (!attending) {
            toast.error('Attending not found');
            return;
        }

        const overrides = (attending.scheduleOverrides || []).filter(item => {
            if (override.id && item.id) {
                return item.id !== override.id;
            }
            return !(
                item.action === override.action &&
                item.clinicId === override.clinicId &&
                item.date === override.date &&
                item.timeSlot === override.timeSlot
            );
        });

        try {
            await firebaseService.updateAttending(attendingId, { scheduleOverrides: overrides });
            setAttendings(current => current.map(att => (
                att.id === attendingId
                    ? { ...att, scheduleOverrides: overrides }
                    : att
            )));
            toast.success('Override removed');
        } catch (error) {
            console.error('Failed to remove attending override:', error);
            toast.error('Failed to remove override.');
        }
    };

    if (loading) {
        return <LoadingSpinner size="lg" className="py-12" />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Schedule Calendar
                        {getSelectedPersonName() && (
                            <span className="ml-2 text-lg font-normal text-gray-600">
                                - {getSelectedPersonName()}
                            </span>
                        )}
                    </h2>
                    <p className="text-gray-600">
                        {scheduleFilter === 'all'
                            ? 'Drag and drop to manage assignments'
                            : `Viewing ${scheduleFilter} schedule`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Person Selector Dropdown */}
                    <div className="relative">
                        <Button
                            variant="secondary"
                            onClick={() => setShowPersonSelector(!showPersonSelector)}
                        >
                            <Icon name="user" size={16} className="mr-2" />
                            {scheduleFilter === 'all' ? 'All Schedules' : getSelectedPersonName()}
                            <Icon name="chevron-down" size={16} className="ml-2" />
                        </Button>

                        {showPersonSelector && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                                <button
                                    onClick={clearFilter}
                                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${scheduleFilter === 'all' ? 'bg-primary-50 text-primary-700' : ''}`}
                                >
                                    <Icon name="users" size={16} className="inline mr-2" />
                                    All Schedules
                                </button>

                                {residents.length > 0 && (
                                    <>
                                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                                            RESIDENTS
                                        </div>
                                        {residents.map(resident => (
                                            <button
                                                key={resident.id}
                                                onClick={() => selectPerson('resident', resident.id)}
                                                className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                                                    scheduleFilter === 'resident' && selectedPersonId === resident.id
                                                        ? 'bg-primary-50 text-primary-700'
                                                        : ''
                                                }`}
                                            >
                                                <Icon name="user" size={16} className="inline mr-2" />
                                                {resident.name}
                                                <span className="text-xs text-gray-500 ml-1">
                                                    ({resident.pgyStatus || `PGY-${resident.year || 1}`})
                                                </span>
                                            </button>
                                        ))}
                                    </>
                                )}

                                {attendings.length > 0 && (
                                    <>
                                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                                            ATTENDINGS
                                        </div>
                                        {attendings.map(attending => (
                                            <button
                                                key={attending.id}
                                                onClick={() => selectPerson('attending', attending.id)}
                                                className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                                                    scheduleFilter === 'attending' && selectedPersonId === attending.id
                                                        ? 'bg-primary-50 text-primary-700'
                                                        : ''
                                                }`}
                                            >
                                                <Icon name="user-check" size={16} className="inline mr-2" />
                                                {attending.name}
                                            </button>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    {/* View Mode Toggle */}
                    <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-white">
                        <button
                            onClick={() => switchViewMode('month')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                viewMode === 'month'
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => switchViewMode('week')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                viewMode === 'week'
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Week
                        </button>
                    </div>

                    {/* Navigation */}
                    <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
                        <Icon name="chevron-left" size={16} />
                    </Button>
                    <span className="font-medium text-gray-700 min-w-[150px] text-center">
                        {viewMode === 'month'
                            ? (window.dateFns ? window.dateFns.format(monthStart, 'MMMM yyyy') : `${monthStart.toLocaleString('default', { month: 'long' })} ${monthStart.getFullYear()}`)
                            : (window.dateFns ? window.dateFns.format(activeDate, 'MMM d, yyyy') : activeDate.toLocaleDateString())
                        }
                    </span>
                    <Button variant="secondary" size="sm" onClick={() => navigate(1)}>
                        <Icon name="chevron-right" size={16} />
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            const startDate = window.dateFns
                                ? window.dateFns.format(monthStart, 'yyyy-MM-dd')
                                : monthStart.toISOString().split('T')[0];
                            const endDate = window.dateFns
                                ? window.dateFns.format(monthEnd, 'yyyy-MM-dd')
                                : monthEnd.toISOString().split('T')[0];

                            const csv = ExportUtils.assignmentsToCSV(assignments, attendings, residents, startDate, endDate);
                            const filename = ExportUtils.generateFilename('schedule', 'csv');
                            ExportUtils.downloadFile(csv, filename);
                            toast.success('Schedule exported successfully');
                        }}
                    >
                        <Icon name="download" size={16} className="mr-2" />
                        Export
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => onOpenChatAssistant && onOpenChatAssistant()}
                    >
                        <Icon name="message-circle" size={16} className="mr-2" />
                        Chat Assistant
                    </Button>
                    {scheduleFilter === 'attending' && selectedAttending && (
                        <Button variant="secondary" onClick={() => setShowAttendingAdjuster(true)}>
                            <Icon name="settings" size={16} className="mr-2" />
                            Adjust Attending Day
                        </Button>
                    )}
                    <Button onClick={() => setShowAutoScheduler(true)}>
                        <Icon name="sparkles" size={16} className="mr-2" />
                        Auto-Schedule
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <Card className="overflow-hidden">
                {viewMode === 'week' ? (
                    /* Week View */
                    <div className="calendar-grid-week">
                        {/* Header Row with Day Names */}
                        <div className="bg-gray-50 p-2 font-medium text-gray-700">Time</div>
                        {weekDays.map(day => {
                            const dayOfWeek = day.getDay();
                            const dayName = getDayName(day);
                            const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
                            const isTodayDay = isToday(day);
                            const isActiveDay = day.getTime() === activeDate.getTime();

                            return (
                                <div
                                    key={day}
                                    className={`p-2 font-medium text-center ${
                                        isWeekendDay ? 'bg-gray-100 text-gray-500' : 'bg-gray-50'
                                    } ${isTodayDay ? 'bg-primary-50 text-primary-700' : isWeekendDay ? 'text-gray-500' : 'text-gray-700'} ${isActiveDay ? 'ring-2 ring-primary-400/70' : ''}`}
                                >
                                    <div className="text-sm font-semibold">{dayName}</div>
                                    <div className="text-xs">
                                        {window.dateFns ? window.dateFns.format(day, 'MMM d') : day.toLocaleDateString()}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Time Slots */}
                        {timeSlots.map(timeSlot => (
                            <React.Fragment key={timeSlot}>
                                <div className="bg-gray-50 p-4 font-medium text-gray-700">
                                    {timeSlot}
                                </div>
                                {weekDays.map(day => {
                                    const slotAssignments = getFilteredAssignmentsForSlot(day, timeSlot);
                                    const isWeekendDay = day.getDay() === 0 || day.getDay() === 6;
                                    const isTodaySlot = isToday(day);
                                    const isActiveDay = day.getTime() === activeDate.getTime();

                                    return (
                                        <div
                                            key={`${day}-${timeSlot}`}
                                            className={`time-slot ${isWeekendDay ? 'weekend-slot' : ''} ${isTodaySlot ? 'today-slot' : ''} ${isActiveDay ? 'border-2 border-primary-400/60' : ''}`}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, day, timeSlot)}
                                            onClick={() => handleQuickAdd(day, timeSlot)}
                                        >
                                            {slotAssignments.map(assignment => {
                                                const resident = residents.find(r => r.id === assignment.residentId);
                                                const attending = normalizedAttendings.find(a => a.id === assignment.attendingId);
                                                const isTemplate = assignment.virtualSource === 'attending-default' || assignment.virtualSource === 'attending-override';

                                                if (isTemplate) {
                                                    const clinic = attending?.clinics?.find(c => c.id === assignment.clinicId);
                                                    const site = sites.find(s => s.id === (assignment.siteId || clinic?.siteId));
                                                    const capacity = assignment.residentCapacity ?? clinic?.residentCapacity ?? 0;
                                                    const label = assignment.clinicName || clinic?.name || 'Clinic Session';

                                                    return (
                                                        <div
                                                            key={assignment.id}
                                                            className={`assignment-card bg-white border-dashed ${assignment.virtualSource === 'attending-override' ? 'border-primary-300 bg-primary-50/40' : 'border-gray-300 bg-slate-50'}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (scheduleFilter === 'attending' && selectedAttending) {
                                                                    setShowAttendingAdjuster(true);
                                                                } else {
                                                                    toast.info('Select an attending to adjust their schedule.');
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <div className="font-medium text-gray-800">
                                                                        {attending?.name || 'Attending Clinic'}
                                                                    </div>
                                                                    <div className="text-sm text-gray-600">
                                                                        {label}
                                                                        {site ? ` · ${site.name}` : ''}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {capacity} resident slots
                                                                    </div>
                                                                </div>
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                                                                    assignment.virtualSource === 'attending-override'
                                                                        ? 'bg-primary-100 text-primary-700'
                                                                        : 'bg-gray-200 text-gray-700'
                                                                }`}>
                                                                    {assignment.virtualSource === 'attending-override' ? 'Additional Session' : 'Default Template'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div
                                                        key={assignment.id}
                                                        draggable={assignment.type !== 'protected'}
                                                        onDragStart={(e) => handleDragStart(e, assignment)}
                                                        className={`assignment-card ${
                                                            assignment.type === 'protected' ? 'bg-gray-100 border-gray-300 opacity-75' :
                                                            assignment.type === 'continuity' ? 'bg-amber-50 border-amber-200' :
                                                            ''
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                {assignment.type === 'protected' ? (
                                                                    <>
                                                                        <div className="font-medium text-gray-700">
                                                                            {assignment.eventName || 'Protected Time'}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">
                                                                            {resident?.name || 'All Residents'}
                                                                        </div>
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-700">
                                                                            <Icon name="shield" size={10} className="mr-1" />
                                                                            Protected
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (resident && onNavigateToPerson) {
                                                                                    onNavigateToPerson('resident', assignment.residentId);
                                                                                }
                                                                            }}
                                                                            className="font-medium text-gray-900 hover:text-blue-600 text-left"
                                                                        >
                                                                            {resident?.name || 'Unknown Resident'}
                                                                        </button>
                                                                        {assignment.type === 'continuity' ? (
                                                                            <>
                                                                                <div className="text-sm text-gray-600">
                                                                                    Continuity Clinic
                                                                                </div>
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
                                                                                    <Icon name="repeat" size={10} className="mr-1" />
                                                                                    Continuity
                                                                                </span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        if (attending && onNavigateToPerson) {
                                                                                            onNavigateToPerson('attending', assignment.attendingId);
                                                                                        }
                                                                                    }}
                                                                                    className="text-gray-600 hover:text-blue-600 block text-left"
                                                                                >
                                                                                    {attending?.name || 'Unknown Attending'}
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                            {!assignment.virtual && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteAssignment(assignment.id);
                                                                    }}
                                                                    className={`text-gray-400 hover:text-red-600 ${
                                                                        deletingIds.has(assignment.id) ? 'animate-spin' : ''
                                                                    }`}
                                                                    disabled={deletingIds.has(assignment.id)}
                                                                >
                                                                    {deletingIds.has(assignment.id) ? (
                                                                        <div className="animate-spin h-3.5 w-3.5 border-2 border-red-600 border-t-transparent rounded-full"></div>
                                                                    ) : (
                                                                        <Icon name="x" size={14} />
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                ) : (
                    /* Month View */
                    <div className="calendar-grid-month">
                        {/* Day Headers */}
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                            <div key={day} className={`p-2 text-center font-medium text-sm ${
                                index === 0 || index === 6
                                    ? 'bg-gray-100 text-gray-500'
                                    : 'bg-gray-50 text-gray-700'
                            }`}>
                                {day}
                            </div>
                        ))}

                        {/* Month Days */}
                        {monthDays.map(day => {
                            const dateStr = window.dateFns ? window.dateFns.format(day, 'yyyy-MM-dd') : day.toISOString().split('T')[0];
                            const filtered = getFilteredAssignments();
                            const dayAssignments = filtered.filter(a => a.date === dateStr);
                            const amAssignments = dayAssignments.filter(a => a.timeSlot === 'AM');
                            const pmAssignments = dayAssignments.filter(a => a.timeSlot === 'PM');

                            const dayOfWeek = day.getDay();
                            const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
                            const isActiveDay = day.getTime() === activeDate.getTime();

                            return (
                                <div
                                    key={dateStr}
                                    className={`month-day-cell ${!isCurrentMonth(day) ? 'opacity-50' : ''} ${isToday(day) ? 'ring-2 ring-primary-500' : ''} ${isWeekendDay ? 'weekend-slot' : ''} ${isActiveDay ? 'border-primary-400 ring-2 ring-primary-400/60' : ''}`}
                                    onClick={() => {
                                        if (isCurrentMonth(day)) {
                                            // Switch to week view for this day
                                            setActiveDate(normalizeDate(day));
                                            setViewMode('week');
                                        }
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-sm font-medium ${!isCurrentMonth(day) ? 'text-gray-400' : 'text-gray-700'}`}>
                                            {day.getDate()}
                                        </span>
                                        {dayAssignments.length > 0 && (
                                            <span className="bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded-full">
                                                {dayAssignments.length}
                                            </span>
                                        )}
                                    </div>

                                    {/* AM Slot */}
                                    <div
                                        className={`mb-1 ${amAssignments.length > 0 ? '' : 'min-h-[30px]'}`}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, day, 'AM')}
                                    >
                                        {amAssignments.length > 0 && (
                                            <>
                                                <div className="text-xs font-medium text-gray-500">AM</div>
                                                <div className="space-y-0.5">
                                                    {amAssignments.slice(0, 2).map(assignment => {
                                                        const resident = residents.find(r => r.id === assignment.residentId);
                                                        return (
                                                            <div
                                                                key={assignment.id}
                                                                draggable
                                                                onDragStart={(e) => handleDragStart(e, assignment)}
                                                                className="text-xs bg-blue-50 rounded px-1 py-0.5 truncate cursor-move hover:bg-blue-100"
                                                                title={resident?.name}
                                                            >
                                                                {resident?.name?.split(' ').map(n => n[0]).join('') || '??'}
                                                            </div>
                                                        );
                                                    })}
                                                    {amAssignments.length > 2 && (
                                                        <div className="text-xs text-gray-500">+{amAssignments.length - 2}</div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* PM Slot */}
                                    <div
                                        className={`${pmAssignments.length > 0 ? '' : 'min-h-[30px]'}`}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, day, 'PM')}
                                    >
                                        {pmAssignments.length > 0 && (
                                            <>
                                                <div className="text-xs font-medium text-gray-500">PM</div>
                                                <div className="space-y-0.5">
                                                    {pmAssignments.slice(0, 2).map(assignment => {
                                                        const resident = residents.find(r => r.id === assignment.residentId);
                                                        return (
                                                            <div
                                                                key={assignment.id}
                                                                draggable
                                                                onDragStart={(e) => handleDragStart(e, assignment)}
                                                                className="text-xs bg-green-50 rounded px-1 py-0.5 truncate cursor-move hover:bg-green-100"
                                                                title={resident?.name}
                                                            >
                                                                {resident?.name?.split(' ').map(n => n[0]).join('') || '??'}
                                                            </div>
                                                        );
                                                    })}
                                                    {pmAssignments.length > 2 && (
                                                        <div className="text-xs text-gray-500">+{pmAssignments.length - 2}</div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Quick Add Modal */}
            {selectedCell && (
                <Modal
                    isOpen={true}
                    onClose={() => setSelectedCell(null)}
                    title="Add Assignment"
                >
                    <AssignmentForm
                        date={selectedCell.date}
                        timeSlot={selectedCell.timeSlot}
                        residents={residents}
                        attendings={normalizedAttendings}
                        assignments={assignments}
                        institution={institution}
                        onSave={async (data) => {
                            if (!data.residentId && data.attendingId && data.clinicId) {
                                const clinicAttending = normalizedAttendings.find(a => a.id === data.attendingId);
                                const clinic = clinicAttending?.clinics?.find(c => c.id === data.clinicId);
                                if (!clinicAttending || !clinic) {
                                    toast.error('Unable to identify clinic for attending.');
                                    return;
                                }

                                await handleApplyAttendingOverride(clinicAttending.id, {
                                    action: 'add',
                                    clinicId: clinic.id,
                                    date: data.date,
                                    timeSlot: data.timeSlot,
                                    residentCapacity: clinic.residentCapacity,
                                    siteId: clinic.siteId
                                });

                                setSelectedCell(null);
                                return;
                            }

                            // Check for conflicts
                            const conflictCheck = ConflictDetection.checkAllConflicts({
                                assignments,
                                newAssignment: data,
                                attendings: normalizedAttendings,
                                residents,
                                institution
                            });

                            if (conflictCheck.hasErrors) {
                                // Show conflicts and ask for confirmation
                                const errorMessages = conflictCheck.conflicts
                                    .filter(c => c.severity === 'error')
                                    .map(c => c.message)
                                    .join('\n');

                                if (!confirm(`Conflicts detected:\n\n${errorMessages}\n\nDo you want to override and continue?`)) {
                                    return;
                                }
                            } else if (conflictCheck.hasWarnings) {
                                // Show warnings but allow to proceed
                                const warningMessages = conflictCheck.conflicts
                                    .filter(c => c.severity === 'warning')
                                    .map(c => c.message)
                                    .join('\n');

                                if (!confirm(`Warnings:\n\n${warningMessages}\n\nDo you want to continue?`)) {
                                    return;
                                }
                            }

                            await firebaseService.addAssignment(data);
                            toast.success('Assignment added');
                            setSelectedCell(null);
                        }}
                        onCancel={() => setSelectedCell(null)}
                    />
                </Modal>
            )}

            {/* Auto-Scheduler Modal */}
            {showAutoScheduler && (
                <Modal
                    isOpen={true}
                    onClose={() => setShowAutoScheduler(false)}
                    title="Auto-Schedule Assignments"
                >
                    <AutoScheduler
                        onClose={() => setShowAutoScheduler(false)}
                    />
                </Modal>
            )}

            {showAttendingAdjuster && selectedAttending && (
                <Modal
                    isOpen={true}
                    onClose={() => setShowAttendingAdjuster(false)}
                    title="Adjust Attending Schedule"
                >
                    <AttendingScheduleAdjuster
                        attending={selectedAttending}
                        sites={sites}
                        onApply={(data) => handleApplyAttendingOverride(selectedAttending.id, data)}
                        onRemove={(override) => handleRemoveAttendingOverride(selectedAttending.id, override)}
                        onClose={() => setShowAttendingAdjuster(false)}
                    />
                </Modal>
            )}
        </div>
    );
};

const AttendingScheduleAdjuster = ({ attending, sites, onApply, onRemove, onClose }) => {
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    const clinics = attending?.clinics || [];

    const clinicsKey = clinics.map(c => c.id).join('|');

    const [formData, setFormData] = useState(() => ({
        action: 'cancel',
        date: todayStr,
        timeSlot: 'AM',
        clinicId: clinics[0]?.id || '',
        residentCapacity: clinics[0]?.residentCapacity || 0
    }));

    useEffect(() => {
        if (!attending) return;
        setFormData(current => ({
            ...current,
            clinicId: clinics[0]?.id || '',
            residentCapacity: clinics[0]?.residentCapacity || 0
        }));
    }, [attending?.id, clinicsKey]);

    const dayOfWeek = useMemo(() => {
        if (!formData.date) return null;
        const dateObj = normalizeDate(formData.date);
        return Number.isFinite(dateObj.getTime()) ? dateObj.getDay() : null;
    }, [formData.date]);

    const cancellableClinics = useMemo(() => {
        if (dayOfWeek === null) return [];
        return clinics.filter(clinic => clinic.defaultSessions?.some(session =>
            session.dayOfWeek === dayOfWeek && session.timeSlot === formData.timeSlot
        ));
    }, [clinics, dayOfWeek, formData.timeSlot]);

    const availableClinics = formData.action === 'cancel' ? cancellableClinics : clinics;
    const availableClinicsKey = availableClinics.map(clinic => clinic.id).join('|');

    useEffect(() => {
        if (!availableClinics.length) {
            setFormData(current => ({ ...current, clinicId: '' }));
            return;
        }
        if (!availableClinics.some(clinic => clinic.id === formData.clinicId)) {
            setFormData(current => ({
                ...current,
                clinicId: availableClinics[0].id,
                residentCapacity: availableClinics[0]?.residentCapacity || 0
            }));
        }
    }, [availableClinicsKey, formData.clinicId]);

    const selectedClinic = clinics.find(clinic => clinic.id === formData.clinicId) || null;

    const sortedOverrides = useMemo(() => {
        const overrides = Array.isArray(attending?.scheduleOverrides) ? [...attending.scheduleOverrides] : [];
        overrides.sort((a, b) => {
            if (a.date === b.date) {
                return (a.timeSlot || 'AM').localeCompare(b.timeSlot || 'AM');
            }
            return (a.date || '').localeCompare(b.date || '');
        });
        return overrides;
    }, [attending?.scheduleOverrides]);

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!formData.date || !formData.timeSlot || !formData.action || !formData.clinicId) {
            toast.error('Complete all override fields.');
            return;
        }

        const capacityValue = Number.isFinite(formData.residentCapacity)
            ? formData.residentCapacity
            : parseInt(formData.residentCapacity, 10) || 0;

        onApply({
            action: formData.action,
            clinicId: formData.clinicId,
            date: formData.date,
            timeSlot: formData.timeSlot,
            residentCapacity: capacityValue,
            siteId: selectedClinic?.siteId || ''
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900">{attending?.name}</h3>
                <p className="text-sm text-gray-600">Adjust automatic clinic sessions for specific dates.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                        <select
                            value={formData.action}
                            onChange={(e) => setFormData(current => ({ ...current, action: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="cancel">Remove default clinic (one day)</option>
                            <option value="add">Add additional clinic (one day)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData(current => ({ ...current, date: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg"
                            min={todayStr}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                        <select
                            value={formData.timeSlot}
                            onChange={(e) => setFormData(current => ({ ...current, timeSlot: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            {TIME_SLOTS.map(slot => (
                                <option key={slot} value={slot}>{slot}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Clinic</label>
                        {availableClinics.length === 0 ? (
                            <div className="px-3 py-2 border rounded-lg bg-gray-50 text-sm text-gray-600">
                                {formData.action === 'cancel'
                                    ? 'No default clinic scheduled at this day/time.'
                                    : 'No clinics configured for this attending.'}
                            </div>
                        ) : (
                            <select
                                value={formData.clinicId}
                                onChange={(e) => {
                                    const clinicId = e.target.value;
                                    const clinic = clinics.find(c => c.id === clinicId);
                                    setFormData(current => ({
                                        ...current,
                                        clinicId,
                                        residentCapacity: clinic?.residentCapacity || 0
                                    }));
                                }}
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                {availableClinics.map(clinic => {
                                    const site = sites.find(s => s.id === clinic.siteId);
                                    return (
                                        <option key={clinic.id} value={clinic.id}>
                                            {clinic.name}
                                            {site ? ` · ${site.name}` : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        )}
                    </div>
                    {formData.action === 'add' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Resident Capacity</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.residentCapacity}
                                onChange={(e) => setFormData(current => ({
                                    ...current,
                                    residentCapacity: Math.max(0, parseInt(e.target.value, 10) || 0)
                                }))}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
                    <Button type="submit" disabled={!availableClinics.length}>
                        Apply
                    </Button>
                </div>
            </form>

            <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Existing Overrides</h4>
                {sortedOverrides.length === 0 ? (
                    <div className="px-3 py-2 border rounded-lg text-sm text-gray-600 bg-gray-50">
                        No overrides configured.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sortedOverrides.map((override) => {
                            const clinic = clinics.find(c => c.id === override.clinicId);
                            const site = sites.find(s => s.id === (override.siteId || clinic?.siteId));
                            return (
                                <div key={override.id || `${override.date}_${override.timeSlot}_${override.clinicId}`} className="border rounded-lg px-3 py-2 bg-white flex items-center justify-between text-sm">
                                    <div>
                                        <p className="font-medium text-gray-800">
                                            {override.action === 'cancel' ? 'Cancel default clinic' : 'Add clinic session'}
                                        </p>
                                        <p className="text-gray-600">
                                            {override.date} · {override.timeSlot}
                                            {clinic ? ` · ${clinic.name}` : ''}
                                            {site ? ` · ${site.name}` : ''}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => onRemove(override)}
                                    >
                                        <Icon name="trash" size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// Assignment Form Component
const AssignmentForm = ({ date, timeSlot, residents, attendings, assignments = [], institution: institutionProp, onSave, onCancel }) => {
    const { institution: contextInstitution } = useApp();
    const institution = institutionProp || contextInstitution;
    const sites = institution?.settings?.sites || [];
    const rotations = institution?.settings?.rotations || [];

    const [formData, setFormData] = useState({
        date,
        timeSlot,
        residentId: '',
        attendingId: '',
        type: 'clinical',
        siteId: '',
        rotationId: '',
        clinicId: ''
    });
    const [conflicts, setConflicts] = useState([]);
    const [assignResident, setAssignResident] = useState(true);

    const selectedDateValue = formData.date || date;
    const selectedDate = useMemo(() => normalizeDate(selectedDateValue), [selectedDateValue]);

    const normalizedAttendings = useMemo(() => {
        return attendings.map(att => normalizeAttendingRecord(att, sites));
    }, [attendings, sites]);

    // Get resident's current rotation for the month
    const getResidentRotation = (residentId) => {
        if (!residentId) return null;
        const resident = residents.find(r => r.id === residentId);
        if (!resident) return null;

        const monthStr = selectedDate.toISOString().slice(0, 7);
        const assignment = resident.rotationAssignments?.find(ra => ra.month === monthStr);
        if (!assignment) return null;

        return rotations.find(r => r.id === assignment.rotationId);
    };

    // Get available attendings based on rotation and time slot
    const getClinicsForSlot = (attending) => {
        if (!attending) return [];
        const dayOfWeek = selectedDate.getDay();
        return (attending.clinics || []).map(clinic => ({
            ...clinic,
            isDefaultSession: clinic.defaultSessions?.some(session =>
                session.dayOfWeek === dayOfWeek && session.timeSlot === timeSlot
            )
        }));
    };

    const getAvailableAttendings = () => {
        const rotation = getResidentRotation(formData.residentId);
        const dayOfWeek = selectedDate.getDay();

        return normalizedAttendings.filter(attending => {
            const supportsRotation = rotation ? attending.rotationIds?.includes(rotation.id) : true;
            const hasClinicSession = attending.clinics?.some(clinic =>
                clinic.defaultSessions?.some(session => session.dayOfWeek === dayOfWeek && session.timeSlot === timeSlot)
            );

            if (!assignResident) {
                return hasClinicSession || (attending.clinics || []).length > 0;
            }

            return supportsRotation && hasClinicSession;
        });
    };

    const availableAttendings = getAvailableAttendings();

    const selectedAttending = normalizedAttendings.find(a => a.id === formData.attendingId);
    const clinicsForAttending = getClinicsForSlot(selectedAttending);

    // Check for conflicts when form data changes
    useEffect(() => {
        if (!formData.residentId && !formData.attendingId) {
            setConflicts([]);
            return;
        }

        const conflictCheck = ConflictDetection.checkAllConflicts({
            assignments,
            newAssignment: formData,
            attendings: normalizedAttendings,
            residents,
            institution
        });

        setConflicts(conflictCheck.conflicts);
    }, [formData.residentId, formData.attendingId, formData.clinicId, formData.date, formData.timeSlot, normalizedAttendings, residents, assignments, institution]);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                const payload = {
                    ...formData,
                    residentId: assignResident ? formData.residentId : '',
                    rotationId: assignResident ? formData.rotationId : ''
                };

                if (!assignResident) {
                    delete payload.residentId;
                    delete payload.rotationId;
                }

                onSave(payload);
            }}
            className="space-y-4"
        >
            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                        type="checkbox"
                        checked={assignResident}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            setAssignResident(checked);
                            if (!checked) {
                                setFormData(current => ({
                                    ...current,
                                    residentId: '',
                                    rotationId: ''
                                }));
                            }
                        }}
                        className="rounded"
                    />
                    Assign resident to this clinic
                </label>
                {assignResident && (
                    <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Resident</label>
                        <select
                            value={formData.residentId}
                            onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                            required={assignResident}
                        >
                            <option value="">Select Resident</option>
                            {residents.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attending
                    {availableAttendings.length === 0 && formData.residentId && (
                        <span className="text-red-500 text-xs ml-2">No attendings available for this rotation/time</span>
                    )}
                </label>
                <select
                    value={formData.attendingId}
                    onChange={(e) => {
                        const attendingId = e.target.value;
                        const attending = normalizedAttendings.find(a => a.id === attendingId);
                        const clinics = getClinicsForSlot(attending);
                        const preferredClinic = clinics.find(c => c.isDefaultSession) || clinics[0];
                        setFormData(current => ({
                            ...current,
                            attendingId,
                            clinicId: preferredClinic?.id || '',
                            siteId: preferredClinic?.siteId || '',
                            rotationId: getResidentRotation(assignResident ? current.residentId : '')?.id || ''
                        }));
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                >
                    <option value="">Select Attending</option>
                    {availableAttendings.map(a => {
                        const clinics = getClinicsForSlot(a);
                        const hasDefault = clinics.some(c => c.isDefaultSession);
                        const labelSuffix = hasDefault
                            ? ''
                            : clinics.length === 0
                                ? ' (no clinics configured)'
                                : ' (no default clinic this slot)';
                        return (
                            <option key={a.id} value={a.id}>
                                {a.name}{labelSuffix}
                            </option>
                        );
                    })}
                </select>
            </div>
            {formData.attendingId && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Clinic</label>
                    {clinicsForAttending.length === 0 ? (
                        <div className="text-sm text-gray-500 border rounded-lg p-3 bg-gray-50">
                            This attending has no clinics configured. Update their profile to add clinics before scheduling.
                        </div>
                    ) : (
                        <select
                            value={formData.clinicId}
                            onChange={(e) => {
                                const clinicId = e.target.value;
                                const selectedClinic = clinicsForAttending.find(c => c.id === clinicId);
                                setFormData(current => ({
                                    ...current,
                                    clinicId,
                                    siteId: selectedClinic?.siteId || current.siteId
                                }));
                            }}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                        >
                            <option value="">Select Clinic</option>
                            {clinicsForAttending.map(clinic => {
                                const site = sites.find(s => s.id === clinic.siteId);
                                return (
                                    <option key={clinic.id} value={clinic.id}>
                                        {clinic.name || 'Clinic'}
                                        {site && ` · ${site.name}`}
                                        {clinic.isDefaultSession ? '' : ' · one-off'}
                                    </option>
                                );
                            })}
                        </select>
                    )}
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                >
                    <option value="clinical">Clinical</option>
                    <option value="continuity">Continuity</option>
                </select>
            </div>

            {/* Conflict Warnings */}
            {conflicts.length > 0 && (
                <div className="space-y-2">
                    {conflicts.map((conflict, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg border-l-4 ${
                                conflict.severity === 'error'
                                    ? 'bg-red-50 border-red-500 text-red-800'
                                    : conflict.severity === 'warning'
                                    ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
                                    : 'bg-blue-50 border-blue-500 text-blue-800'
                            }`}
                        >
                            <div className="flex items-start gap-2">
                                <Icon
                                    name={
                                        conflict.severity === 'error'
                                            ? 'alert-circle'
                                            : conflict.severity === 'warning'
                                            ? 'alert-triangle'
                                            : 'info'
                                    }
                                    size={16}
                                    className="mt-0.5 flex-shrink-0"
                                />
                                <div>
                                    <p className="text-sm font-medium">{conflict.message}</p>
                                    {conflict.type === 'vacation' && conflict.vacationDates && (
                                        <p className="text-xs mt-1 opacity-75">
                                            Vacation: {conflict.vacationDates.start.toLocaleDateString()} - {conflict.vacationDates.end.toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};

// ==================== Attendings List Component ====================
const AttendingsList = ({ navigateToSchedule }) => {
    const { firebaseService, institution } = useApp();
    const [attendings, setAttendings] = useState([]);
    const [editingAttending, setEditingAttending] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firebaseService.currentInstitution) return;

        const unsubscribe = firebaseService.listenToAttendings((data) => {
            setAttendings(data);
            setLoading(false);
        });

        return unsubscribe;
    }, [firebaseService.currentInstitution]);

    const sites = institution?.settings?.sites || [];

    const normalizedAttendings = useMemo(() => {
        return attendings.map(att => normalizeAttendingRecord(att, sites));
    }, [attendings, sites]);

    const handleSave = async (attendingData) => {
        if (attendingData.id) {
            await firebaseService.updateAttending(attendingData.id, attendingData);
            toast.success('Attending updated');
        } else {
            await firebaseService.addAttending(attendingData);
            toast.success('Attending added');
        }
        setEditingAttending(null);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this attending?')) return;
        await firebaseService.deleteAttending(id);
        toast.success('Attending deleted');
    };

    if (loading) {
        return <LoadingSpinner size="lg" className="py-12" />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Attendings</h2>
                    <p className="text-gray-600">Manage attending physicians</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            const csv = ExportUtils.attendingsToCSV(attendings);
                            const filename = ExportUtils.generateFilename('attendings', 'csv');
                            ExportUtils.downloadFile(csv, filename);
                            toast.success('Attendings exported successfully');
                        }}
                    >
                        <Icon name="download" size={16} className="mr-2" />
                        Export
                    </Button>
                    <Button onClick={() => setEditingAttending({})}>
                        <Icon name="plus" size={16} className="mr-2" />
                        Add Attending
                    </Button>
                </div>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4">Name</th>
                                <th className="text-left py-3 px-4">Default Sessions</th>
                                <th className="text-left py-3 px-4">Weekly Capacity</th>
                                <th className="text-left py-3 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {normalizedAttendings.map(attending => {
                                const sessionCount = attending.clinics?.reduce((total, clinic) => total + (clinic.defaultSessions?.length || 0), 0) || 0;
                                const totalCapacity = attending.clinics?.reduce((sum, clinic) => {
                                    const sessions = clinic.defaultSessions?.length || 0;
                                    const capacity = clinic.residentCapacity || 0;
                                    return sum + (sessions * capacity);
                                }, 0) || 0;
                                return (
                                <tr key={attending.id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4">{attending.name}</td>
                                    <td className="py-3 px-4">{sessionCount} default sessions/week</td>
                                    <td className="py-3 px-4">{totalCapacity} resident slots/week</td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => navigateToSchedule('attending', attending.id)}
                                                className="text-blue-600 hover:text-blue-700"
                                                title="View Schedule"
                                            >
                                                <Icon name="calendar" size={16} />
                                            </button>
                                            <button
                                                onClick={() => setEditingAttending(normalizeAttendingRecord(attending, sites))}
                                                className="text-primary-600 hover:text-primary-700"
                                                title="Edit"
                                            >
                                                <Icon name="pencil" size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(attending.id)}
                                                className="text-red-600 hover:text-red-700"
                                                title="Delete"
                                            >
                                                <Icon name="trash" size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {editingAttending && (
                <Modal
                    isOpen={true}
                    onClose={() => setEditingAttending(null)}
                    title={editingAttending.id ? 'Edit Attending' : 'Add Attending'}
                >
                    <AttendingForm
                        attending={editingAttending}
                        onSave={handleSave}
                        onCancel={() => setEditingAttending(null)}
                    />
                </Modal>
            )}
        </div>
    );
};

// Attending Form Component
const AttendingForm = ({ attending, onSave, onCancel }) => {
    const { institution } = useApp();
    const sites = institution?.settings?.sites || [];
    const rotations = institution?.settings?.rotations || [];

    const buildInitialFormState = useCallback(() => {
        const normalized = normalizeAttendingRecord(attending, sites);
        const clinics = normalized.clinics?.length
            ? normalized.clinics
            : [{
                id: generateId('clinic'),
                name: `${normalized.name || 'Clinic'} Clinic`,
                siteId: sites[0]?.id || '',
                residentCapacity: 2,
                defaultSessions: []
            }];

        return {
            name: normalized.name || '',
            rotationIds: normalized.rotationIds || [],
            clinics,
            scheduleOverrides: normalized.scheduleOverrides || [],
            email: normalized.email || '',
            phone: normalized.phone || '',
            maxWeeklyAssignments: normalized.maxWeeklyAssignments || '',
            notes: normalized.notes || '',
            id: normalized.id || null
        };
    }, [attending, sites]);

    const [formData, setFormData] = useState(buildInitialFormState);

    useEffect(() => {
        setFormData(buildInitialFormState());
    }, [buildInitialFormState]);

    const dedupeSessions = (sessions = []) => {
        const seen = new Set();
        const result = [];
        sessions.forEach(session => {
            if (typeof session?.dayOfWeek !== 'number' || !TIME_SLOTS.includes(session?.timeSlot)) {
                return;
            }
            const key = `${session.dayOfWeek}_${session.timeSlot}`;
            if (!seen.has(key)) {
                seen.add(key);
                result.push({ dayOfWeek: session.dayOfWeek, timeSlot: session.timeSlot });
            }
        });
        return result;
    };

    const updateClinic = (clinicId, updates) => {
        setFormData(current => ({
            ...current,
            clinics: current.clinics.map(clinic =>
                clinic.id === clinicId
                    ? { ...clinic, ...updates }
                    : clinic
            )
        }));
    };

    const toggleClinicSession = (clinicId, dayOfWeek, timeSlot) => {
        setFormData(current => ({
            ...current,
            clinics: current.clinics.map(clinic => {
                if (clinic.id !== clinicId) return clinic;
                const hasSession = clinic.defaultSessions?.some(session =>
                    session.dayOfWeek === dayOfWeek && session.timeSlot === timeSlot
                );

                const nextSessions = hasSession
                    ? clinic.defaultSessions.filter(session => !(session.dayOfWeek === dayOfWeek && session.timeSlot === timeSlot))
                    : [...(clinic.defaultSessions || []), { dayOfWeek, timeSlot }];

                return {
                    ...clinic,
                    defaultSessions: dedupeSessions(nextSessions)
                };
            })
        }));
    };

    const handleResidentCapacityChange = (clinicId, value) => {
        const capacity = Math.max(0, parseInt(value, 10) || 0);
        updateClinic(clinicId, { residentCapacity: capacity });
    };

    const addClinic = () => {
        const defaultSiteId = sites[0]?.id || '';
        setFormData(current => ({
            ...current,
            clinics: [
                ...current.clinics,
                {
                    id: generateId('clinic'),
                    name: defaultSiteId ? `${sites.find(s => s.id === defaultSiteId)?.name || 'Clinic'} Clinic` : 'New Clinic',
                    siteId: defaultSiteId,
                    residentCapacity: 2,
                    defaultSessions: []
                }
            ]
        }));
    };

    const removeClinic = (clinicId) => {
        setFormData(current => ({
            ...current,
            clinics: current.clinics.filter(clinic => clinic.id !== clinicId)
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const cleanedClinics = formData.clinics.map(clinic => ({
            id: clinic.id || generateId('clinic'),
            name: clinic.name?.trim() || 'Clinic',
            siteId: clinic.siteId || '',
            residentCapacity: Math.max(0, parseInt(clinic.residentCapacity, 10) || 0),
            defaultSessions: dedupeSessions(clinic.defaultSessions || [])
        }));

        const payload = {
            ...attending,
            name: formData.name.trim(),
            rotationIds: formData.rotationIds || [],
            clinics: cleanedClinics,
            scheduleOverrides: formData.scheduleOverrides || [],
            email: formData.email?.trim() || '',
            phone: formData.phone?.trim() || '',
            maxWeeklyAssignments: formData.maxWeeklyAssignments || '',
            notes: formData.notes || ''
        };

        delete payload.clinicSchedule;
        delete payload.clinicScheduleLegacy;

        onSave(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(current => ({ ...current, name: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email (optional)</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(current => ({ ...current, email: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone (optional)</label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(current => ({ ...current, phone: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Weekly Assignments</label>
                    <input
                        type="number"
                        min="0"
                        value={formData.maxWeeklyAssignments}
                        onChange={(e) => setFormData(current => ({ ...current, maxWeeklyAssignments: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                        className="w-full px-3 py-2 border rounded-lg"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(current => ({ ...current, notes: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={3}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supported Rotations</label>
                <p className="text-xs text-gray-500 mb-2">Select rotations this attending supports</p>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                    {rotations.map(rotation => (
                        <label key={rotation.id} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.rotationIds?.includes(rotation.id)}
                                onChange={(e) => {
                                    setFormData(current => ({
                                        ...current,
                                        rotationIds: e.target.checked
                                            ? [...(current.rotationIds || []), rotation.id]
                                            : (current.rotationIds || []).filter(id => id !== rotation.id)
                                    }));
                                }}
                                className="rounded"
                            />
                            <span className="text-sm">
                                {rotation.name} ({rotation.code})
                                {rotation.isMultiSite && (
                                    <span className="ml-1 text-xs text-gray-500">[Multi-site]</span>
                                )}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Clinics & Default Schedule</label>
                        <p className="text-xs text-gray-500">Configure clinic capacity, site, and weekly default sessions for each attending clinic.</p>
                    </div>
                    <Button type="button" onClick={addClinic}>
                        <Icon name="plus" size={16} className="mr-2" />
                        Add Clinic
                    </Button>
                </div>

                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                    {formData.clinics.map((clinic, index) => {
                        const site = sites.find(s => s.id === clinic.siteId);
                        return (
                            <Card key={clinic.id} className="border border-gray-200">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Clinic Name</label>
                                                <input
                                                    type="text"
                                                    value={clinic.name}
                                                    onChange={(e) => updateClinic(clinic.id, { name: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                                    placeholder={`Clinic ${index + 1}`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Site</label>
                                                <select
                                                    value={clinic.siteId}
                                                    onChange={(e) => updateClinic(clinic.id, { siteId: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                                >
                                                    <option value="">Select Site</option>
                                                    {sites.map(siteOption => (
                                                        <option key={siteOption.id} value={siteOption.id}>
                                                            {siteOption.name} ({siteOption.code})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Resident Capacity</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={clinic.residentCapacity}
                                                    onChange={(e) => handleResidentCapacityChange(clinic.id, e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    <div
                                                        className="w-3 h-3 rounded-full border"
                                                        style={{ backgroundColor: site?.color || '#CBD5F5' }}
                                                    />
                                                    <span>{site?.name || 'No site selected'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium text-gray-600 mb-2">Default Sessions</p>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full border-collapse">
                                                    <thead>
                                                        <tr>
                                                            <th className="w-16"></th>
                                                            {DAYS_OF_WEEK.map(day => (
                                                                <th key={day.id} className="text-xs font-medium text-gray-500 p-1">
                                                                    {day.short}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {TIME_SLOTS.map(slot => (
                                                            <tr key={`${clinic.id}_${slot}`}>
                                                                <td className="text-xs font-medium text-gray-600 p-1">{slot}</td>
                                                                {DAYS_OF_WEEK.map(day => {
                                                                    const isSelected = clinic.defaultSessions?.some(session =>
                                                                        session.dayOfWeek === day.id && session.timeSlot === slot
                                                                    );
                                                                    const isWeekend = day.id === 0 || day.id === 6;
                                                                    return (
                                                                        <td key={`${clinic.id}_${day.id}_${slot}`} className="p-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => toggleClinicSession(clinic.id, day.id, slot)}
                                                                                className={`w-full h-10 rounded border text-xs transition-colors ${
                                                                                    isSelected
                                                                                        ? 'bg-primary-100 border-primary-300 text-primary-700'
                                                                                        : isWeekend
                                                                                        ? 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                                                                                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                                                                }`}
                                                                            >
                                                                                {isSelected ? 'Scheduled' : '—'}
                                                                            </button>
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs text-gray-500">Clinic {index + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeClinic(clinic.id)}
                                            className="text-red-600 hover:text-red-700"
                                            title="Remove clinic"
                                        >
                                            <Icon name="trash" size={16} />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                    {formData.clinics.length === 0 && (
                        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-sm text-gray-500">
                            No clinics configured. Add a clinic to begin scheduling.
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};

// ==================== Residents List Component ====================
const ResidentsList = ({ navigateToSchedule }) => {
    const { firebaseService } = useApp();
    const [residents, setResidents] = useState([]);
    const [editingResident, setEditingResident] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firebaseService.currentInstitution) return;

        const unsubscribe = firebaseService.listenToResidents((data) => {
            setResidents(data);
            setLoading(false);
        });

        return unsubscribe;
    }, [firebaseService.currentInstitution]);

    const handleSave = async (residentData) => {
        if (residentData.id) {
            await firebaseService.updateResident(residentData.id, residentData);
            toast.success('Resident updated');
        } else {
            await firebaseService.addResident(residentData);
            toast.success('Resident added');
        }
        setEditingResident(null);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this resident?')) return;
        await firebaseService.deleteResident(id);
        toast.success('Resident deleted');
    };

    if (loading) {
        return <LoadingSpinner size="lg" className="py-12" />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Residents</h2>
                    <p className="text-gray-600">Manage resident physicians</p>
                </div>
                <Button onClick={() => setEditingResident({})}>
                    <Icon name="plus" size={16} className="mr-2" />
                    Add Resident
                </Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4">Name</th>
                                <th className="text-left py-3 px-4">Year</th>
                                <th className="text-left py-3 px-4">Continuity Day</th>
                                <th className="text-left py-3 px-4">Continuity Time</th>
                                <th className="text-left py-3 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {residents.map(resident => (
                                <tr key={resident.id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4">{resident.name}</td>
                                    <td className="py-3 px-4">{resident.pgyStatus || `PGY-${resident.year || 1}`}</td>
                                    <td className="py-3 px-4">{resident.continuityDay || '-'}</td>
                                    <td className="py-3 px-4">{resident.continuityTime || '-'}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => navigateToSchedule('resident', resident.id)}
                                                className="text-blue-600 hover:text-blue-700"
                                                title="View Schedule"
                                            >
                                                <Icon name="calendar" size={16} />
                                            </button>
                                            <button
                                                onClick={() => setEditingResident(resident)}
                                                className="text-primary-600 hover:text-primary-700"
                                                title="Edit"
                                            >
                                                <Icon name="pencil" size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(resident.id)}
                                                className="text-red-600 hover:text-red-700"
                                                title="Delete"
                                            >
                                                <Icon name="trash" size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {editingResident && (
                <Modal
                    isOpen={true}
                    onClose={() => setEditingResident(null)}
                    title={editingResident.id ? 'Edit Resident' : 'Add Resident'}
                >
                    <ResidentForm
                        resident={editingResident}
                        onSave={handleSave}
                        onCancel={() => setEditingResident(null)}
                    />
                </Modal>
            )}
        </div>
    );
};

// Resident Form Component
const ResidentForm = ({ resident, onSave, onCancel }) => {
    const { institution } = useApp();
    const sites = institution?.settings?.sites || [];
    const rotations = institution?.settings?.rotations || [];

    const [formData, setFormData] = useState({
        name: resident.name || '',
        pgyStatus: resident.pgyStatus || 'PGY-1',
        continuityDay: resident.continuityDay || '',
        continuityTime: resident.continuityTime || '',
        continuitySiteId: resident.continuitySiteId || '',
        rotationAssignments: resident.rotationAssignments || [],
        halfDaysOff: resident.halfDaysOff || [],
        vacationWeeks: resident.vacationWeeks || [],
        ...resident
    });

    const [editingMonth, setEditingMonth] = useState(null);

    const getMonthName = (monthStr) => {
        if (!monthStr) return '';
        const date = new Date(monthStr + '-01');
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const getCurrentAndFutureMonths = () => {
        const months = [];
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const monthStr = date.toISOString().slice(0, 7); // YYYY-MM format
            months.push(monthStr);
        }
        return months;
    };

    const getRotationForMonth = (month) => {
        return formData.rotationAssignments.find(ra => ra.month === month);
    };

    const setRotationForMonth = (month, rotationId, primarySiteId) => {
        const existing = formData.rotationAssignments.filter(ra => ra.month !== month);
        if (rotationId) {
            setFormData({
                ...formData,
                rotationAssignments: [...existing, { month, rotationId, primarySiteId }]
            });
        } else {
            setFormData({
                ...formData,
                rotationAssignments: existing
            });
        }
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PGY Status</label>
                <select
                    value={formData.pgyStatus}
                    onChange={(e) => setFormData({ ...formData, pgyStatus: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                >
                    <option value="PGY-1">PGY-1</option>
                    <option value="PGY-2">PGY-2</option>
                    <option value="PGY-3">PGY-3</option>
                    <option value="PGY-4">PGY-4</option>
                    <option value="PGY-5+">PGY-5+</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rotation Assignments</label>
                <p className="text-xs text-gray-500 mb-2">Assign rotations for each month</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {getCurrentAndFutureMonths().map(month => {
                        const assignment = getRotationForMonth(month);
                        return (
                            <div key={month} className="flex items-center gap-2 p-2 border rounded">
                                <span className="w-32 text-sm font-medium">{getMonthName(month)}</span>
                                <select
                                    value={assignment?.rotationId || ''}
                                    onChange={(e) => {
                                        const rotation = rotations.find(r => r.id === e.target.value);
                                        const rotationSiteIds = rotation?.siteIds || [];
                                        const availableSiteIds = rotationSiteIds.filter(id => sites.some(site => site.id === id));
                                        const defaultSiteId = availableSiteIds.length === 1 ? availableSiteIds[0] : '';
                                        setRotationForMonth(month, e.target.value, defaultSiteId);
                                    }}
                                    className="flex-1 px-2 py-1 border rounded text-sm"
                                >
                                    <option value="">No Rotation</option>
                                    {rotations.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                            {r.isMultiSite && ' [Multi-site]'}
                                        </option>
                                    ))}
                                </select>
                                {assignment && (() => {
                                    const rotation = rotations.find(r => r.id === assignment.rotationId);
                                    if (!rotation) return null;
                                    const rotationSiteIds = rotation.siteIds || [];
                                    const siteOptions = rotationSiteIds.length > 0
                                        ? sites.filter(s => rotationSiteIds.includes(s.id))
                                        : sites;

                                    if (!siteOptions.length) {
                                        return null;
                                    }

                                    const requiresSelection = rotation.isMultiSite || siteOptions.length > 1;

                                    return (
                                        <select
                                            value={assignment.primarySiteId || ''}
                                            onChange={(e) => setRotationForMonth(month, assignment.rotationId, e.target.value)}
                                            className="w-40 px-2 py-1 border rounded text-sm"
                                            required={requiresSelection}
                                        >
                                            <option value="">Select Site</option>
                                            {siteOptions.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    );
                                })()}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Continuity Clinic</label>
                <div className="space-y-2">
                    <select
                        value={formData.continuitySiteId}
                        onChange={(e) => setFormData({ ...formData, continuitySiteId: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                    >
                        <option value="">No Continuity Site</option>
                        {sites.map(site => (
                            <option key={site.id} value={site.id}>
                                {site.name} ({site.code})
                            </option>
                        ))}
                    </select>
                    {formData.continuitySiteId && (
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                value={formData.continuityDay}
                                onChange={(e) => setFormData({ ...formData, continuityDay: e.target.value })}
                                className="px-3 py-2 border rounded-lg"
                            >
                                <option value="">Select Day</option>
                                <option value="monday">Monday</option>
                                <option value="tuesday">Tuesday</option>
                                <option value="wednesday">Wednesday</option>
                                <option value="thursday">Thursday</option>
                                <option value="friday">Friday</option>
                            </select>
                            <select
                                value={formData.continuityTime}
                                onChange={(e) => setFormData({ ...formData, continuityTime: e.target.value })}
                                className="px-3 py-2 border rounded-lg"
                            >
                                <option value="">Select Time</option>
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vacation Weeks</label>
                <p className="text-xs text-gray-500 mb-2">Select weeks when this resident is on vacation (no continuity clinic)</p>
                <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                        <input
                            type="date"
                            placeholder="Select week start date"
                            className="px-3 py-2 border rounded-lg"
                            onChange={(e) => {
                                if (e.target.value && !formData.vacationWeeks?.includes(e.target.value)) {
                                    setFormData({
                                        ...formData,
                                        vacationWeeks: [...(formData.vacationWeeks || []), e.target.value]
                                    });
                                    e.target.value = '';
                                }
                            }}
                        />
                        <span className="text-sm text-gray-600">Add vacation week starting on this date</span>
                    </div>
                    {formData.vacationWeeks?.length > 0 && (
                        <div className="space-y-1 max-h-32 overflow-y-auto border rounded-lg p-2">
                            {formData.vacationWeeks.sort().map((weekStart, idx) => {
                                const startDate = new Date(weekStart);
                                const endDate = new Date(weekStart);
                                endDate.setDate(endDate.getDate() + 6);
                                return (
                                    <div key={idx} className="flex items-center justify-between p-1 hover:bg-gray-50 rounded">
                                        <span className="text-sm">
                                            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData({
                                                    ...formData,
                                                    vacationWeeks: formData.vacationWeeks.filter(w => w !== weekStart)
                                                });
                                            }}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Icon name="x" size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};

// ==================== Rules List Component ====================
const RulesList = () => {
    const { firebaseService } = useApp();
    const [rules, setRules] = useState([]);
    const [editingRule, setEditingRule] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firebaseService.currentInstitution) return;

        const unsubscribe = firebaseService.listenToRules((data) => {
            setRules(data);
            setLoading(false);
        });

        return unsubscribe;
    }, [firebaseService.currentInstitution]);

    const handleSave = async (ruleData) => {
        if (ruleData.id) {
            await firebaseService.updateRule(ruleData.id, ruleData);
            toast.success('Rule updated');
        } else {
            await firebaseService.addRule(ruleData);
            toast.success('Rule added');
        }
        setEditingRule(null);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this rule?')) return;
        await firebaseService.deleteRule(id);
        toast.success('Rule deleted');
    };

    const handleToggleActive = async (rule) => {
        await firebaseService.updateRule(rule.id, { active: !rule.active });
        toast.success(`Rule ${rule.active ? 'disabled' : 'enabled'}`);
    };

    if (loading) {
        return <LoadingSpinner size="lg" className="py-12" />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Scheduling Rules</h2>
                    <p className="text-gray-600">Configure automatic scheduling constraints</p>
                </div>
                <Button onClick={() => setEditingRule({})}>
                    <Icon name="plus" size={16} className="mr-2" />
                    Add Rule
                </Button>
            </div>

            <div className="grid gap-4">
                {rules.map(rule => (
                    <Card key={rule.id} className="hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-medium text-gray-900">{rule.name}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        rule.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                        {rule.active ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        rule.type === 'hard' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {rule.type === 'hard' ? 'Hard Rule' : 'Soft Rule'}
                                    </span>
                                </div>
                                <p className="text-gray-600 mt-2">{rule.description}</p>
                                <p className="text-sm text-gray-500 mt-2">Conditions: {rule.conditions}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleToggleActive(rule)}
                                    className="text-gray-600 hover:text-primary-600"
                                >
                                    <Icon name={rule.active ? 'toggle-right' : 'toggle-left'} size={20} />
                                </button>
                                <button
                                    onClick={() => setEditingRule(rule)}
                                    className="text-primary-600 hover:text-primary-700"
                                >
                                    <Icon name="pencil" size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(rule.id)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Icon name="trash" size={16} />
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {editingRule && (
                <Modal
                    isOpen={true}
                    onClose={() => setEditingRule(null)}
                    title={editingRule.id ? 'Edit Rule' : 'Add Rule'}
                >
                    <RuleForm
                        rule={editingRule}
                        onSave={handleSave}
                        onCancel={() => setEditingRule(null)}
                    />
                </Modal>
            )}
        </div>
    );
};

// Rule Form Component
const RuleForm = ({ rule, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: rule.name || '',
        description: rule.description || '',
        type: rule.type || 'soft',
        conditions: rule.conditions || '',
        active: rule.active !== false,
        ...rule
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                >
                    <option value="soft">Soft Rule (Preference)</option>
                    <option value="hard">Hard Rule (Constraint)</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Conditions</label>
                <textarea
                    value={formData.conditions}
                    onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                    placeholder="e.g., Residents must not work more than 3 days in a row"
                    required
                />
            </div>
            <div>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
            </div>
            <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};

// ==================== Members Management Component ====================
const MembersManagement = () => {
    const { firebaseService, institution, user } = useApp();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviteCode, setInviteCode] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [updatingRoles, setUpdatingRoles] = useState(new Set());
    const [removingMembers, setRemovingMembers] = useState(new Set());

    useEffect(() => {
        if (!firebaseService.currentInstitution) return;

        const loadMembers = async () => {
            try {
                const membersData = await firebaseService.getInstitutionMembers();
                setMembers(membersData);
            } catch (error) {
                console.error('Error loading members:', error);
                toast.error('Failed to load members');
            } finally {
                setLoading(false);
            }
        };

        loadMembers();
    }, [firebaseService.currentInstitution]);

    const generateInviteCode = () => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        const inviteData = {
            code,
            institutionId: firebaseService.currentInstitution,
            institutionName: institution.name,
            createdBy: user.uid,
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
            used: false
        };

        // In a real implementation, save this to Firebase
        firebaseService.createInviteCode(inviteData).then(() => {
            setInviteCode(code);
            setShowInviteModal(true);
            toast.success('Invite code generated');
        }).catch(error => {
            toast.error('Failed to generate invite code');
        });
    };

    const handleRoleChange = async (memberId, newRole) => {
        setUpdatingRoles(prev => new Set(prev).add(memberId));

        try {
            await firebaseService.updateMemberRole(memberId, newRole);
            setMembers(members.map(m =>
                m.id === memberId ? { ...m, role: newRole } : m
            ));
            toast.success('Role updated successfully');
        } catch (error) {
            console.error('Error updating role:', error);
            toast.error('Failed to update role');
        } finally {
            setUpdatingRoles(prev => {
                const newSet = new Set(prev);
                newSet.delete(memberId);
                return newSet;
            });
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!confirm('Are you sure you want to remove this member?')) return;

        setRemovingMembers(prev => new Set(prev).add(memberId));

        try {
            await firebaseService.removeMember(memberId);
            setMembers(members.filter(m => m.id !== memberId));
            toast.success('Member removed');
        } catch (error) {
            console.error('Error removing member:', error);
            toast.error('Failed to remove member');
        } finally {
            setRemovingMembers(prev => {
                const newSet = new Set(prev);
                newSet.delete(memberId);
                return newSet;
            });
        }
    };

    const currentUserMember = members.find(m => m.userId === user.uid);
    const isAdmin = currentUserMember?.role === 'admin';

    if (loading) {
        return <LoadingSpinner size="lg" className="py-12" />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Institution Members</h3>
                    <p className="text-sm text-gray-600">Manage users who have access to this institution</p>
                </div>
                {isAdmin && (
                    <Button onClick={generateInviteCode}>
                        <Icon name="user-plus" size={16} className="mr-2" />
                        Generate Invite
                    </Button>
                )}
            </div>

            <div className="space-y-3">
                {members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-medical-400 to-medical-600 rounded-full flex items-center justify-center">
                                <Icon name="user" size={18} className="text-white" />
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">{member.name || member.email}</div>
                                <div className="text-sm text-gray-500">{member.email}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={member.role}
                                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                disabled={!isAdmin || member.userId === user.uid}
                                className="px-3 py-1 border rounded-lg text-sm"
                            >
                                <option value="member">Member</option>
                                <option value="scheduler">Scheduler</option>
                                <option value="admin">Admin</option>
                            </select>
                            {isAdmin && member.userId !== user.uid && (
                                <button
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Icon name="trash" size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <Modal
                    isOpen={true}
                    onClose={() => setShowInviteModal(false)}
                    title="Invitation Code Generated"
                >
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            Share this code with the person you want to invite. They can use it to join the institution.
                        </p>
                        <div className="p-4 bg-gray-100 rounded-lg">
                            <div className="text-center">
                                <p className="text-sm text-gray-500 mb-2">Invitation Code</p>
                                <p className="text-2xl font-mono font-bold text-gray-900">{inviteCode}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">
                            This code will expire in 7 days.
                        </p>
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(inviteCode);
                                toast.success('Code copied to clipboard');
                            }}
                            className="w-full"
                        >
                            Copy Code
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// ==================== Backup & Restore Component ====================
const BackupRestore = () => {
    const { firebaseService, attendings, residents, assignments, institution } = useApp();
    const [importing, setImporting] = useState(false);
    const [exportType, setExportType] = useState('all');

    const handleExport = () => {
        let dataToExport = {};

        if (exportType === 'all' || exportType === 'institution') {
            dataToExport.institution = institution;
        }
        if (exportType === 'all' || exportType === 'attendings') {
            dataToExport.attendings = attendings;
        }
        if (exportType === 'all' || exportType === 'residents') {
            dataToExport.residents = residents;
        }
        if (exportType === 'all' || exportType === 'assignments') {
            dataToExport.assignments = assignments;
        }

        const json = ExportUtils.exportToJSON(dataToExport);
        const filename = ExportUtils.generateFilename(`backup_${exportType}`, 'json');
        ExportUtils.downloadFile(json, filename, 'application/json');
        toast.success(`${exportType} data exported successfully`);
    };

    const handleImport = () => {
        ExportUtils.selectFile('.json', async (content, filename) => {
            setImporting(true);

            const result = ExportUtils.parseImportedJSON(content);

            if (!result.success) {
                // Show detailed validation errors if present
                if (result.validationErrors && result.validationErrors.length > 0) {
                    const errorMessage = `Validation errors:\n${result.validationErrors.slice(0, 5).join('\n')}${
                        result.validationErrors.length > 5 ? `\n...and ${result.validationErrors.length - 5} more errors` : ''
                    }`;
                    toast.error(errorMessage);
                } else {
                    toast.error(result.error);
                }
                setImporting(false);
                return;
            }

            // Build confirmation message with validation info
            const dataTypes = Object.keys(result.data);
            let message = `Import Summary:\n`;

            if (result.validation) {
                message += `\n📊 Data to import:`;
                message += `\n• ${result.validation.summary.attendings} Attendings`;
                message += `\n• ${result.validation.summary.residents} Residents`;
                message += `\n• ${result.validation.summary.assignments} Assignments`;

                if (result.validation.warnings.length > 0) {
                    message += `\n\n⚠️ Warnings (${result.validation.warnings.length}):`;
                    message += `\n${result.validation.warnings.slice(0, 3).join('\n')}`;
                    if (result.validation.warnings.length > 3) {
                        message += `\n...and ${result.validation.warnings.length - 3} more warnings`;
                    }
                }
            } else {
                message += `\nData types: ${dataTypes.join(', ')}`;
            }

            message += `\n\nExported: ${result.exportDate || 'Unknown date'}`;
            message += `\n\nDo you want to continue?`;

            if (!confirm(message)) {
                setImporting(false);
                return;
            }

            try {
                // Import each data type
                if (result.data.attendings) {
                    for (const attending of result.data.attendings) {
                        await firebaseService.addAttending(attending);
                    }
                }
                if (result.data.residents) {
                    for (const resident of result.data.residents) {
                        await firebaseService.addResident(resident);
                    }
                }
                if (result.data.assignments) {
                    for (const assignment of result.data.assignments) {
                        await firebaseService.addAssignment(assignment);
                    }
                }

                toast.success('Data imported successfully');
            } catch (error) {
                console.error('Import error:', error);
                toast.error('Failed to import data');
            } finally {
                setImporting(false);
            }
        });
    };

    return (
        <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Backup & Restore</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Section */}
                <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Export Data</h4>
                    <p className="text-sm text-gray-600">
                        Create a backup of your institution data
                    </p>

                    <select
                        value={exportType}
                        onChange={(e) => setExportType(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                    >
                        <option value="all">All Data</option>
                        <option value="institution">Institution Settings Only</option>
                        <option value="attendings">Attendings Only</option>
                        <option value="residents">Residents Only</option>
                        <option value="assignments">Assignments Only</option>
                    </select>

                    <Button onClick={handleExport} className="w-full">
                        <Icon name="download" size={16} className="mr-2" />
                        Export {exportType === 'all' ? 'All Data' : exportType}
                    </Button>
                </div>

                {/* Import Section */}
                <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Import Data</h4>
                    <p className="text-sm text-gray-600">
                        Restore data from a backup file
                    </p>

                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-start gap-2">
                            <Icon name="alert-triangle" size={16} className="text-yellow-600 mt-0.5" />
                            <div className="text-sm text-yellow-800">
                                <p className="font-medium">Warning</p>
                                <p>Importing will add data to your existing records. Duplicate entries may be created.</p>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleImport}
                        disabled={importing}
                        variant="secondary"
                        className="w-full"
                    >
                        <Icon name="upload" size={16} className="mr-2" />
                        {importing ? 'Importing...' : 'Import from File'}
                    </Button>
                </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                    <Icon name="info" size={16} className="text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium">Backup Best Practices</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Export your data regularly</li>
                            <li>Store backups in a secure location</li>
                            <li>Test restore functionality periodically</li>
                            <li>Keep multiple versions of backups</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==================== Settings View Component ====================
const SettingsView = () => {
    const { firebaseService, institution } = useApp();
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState({
        institutionName: institution?.name || '',
        timezone: institution?.settings?.timezone || 'America/New_York',
        workDays: institution?.settings?.workDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        autoScheduleEnabled: institution?.settings?.autoScheduleEnabled !== false,
        notificationsEnabled: institution?.settings?.notificationsEnabled !== false,
        sites: institution?.settings?.sites || [
            { id: 'site_1', name: 'Main Clinic', code: 'MAIN', color: '#10b981', address: '' }
        ],
        rotations: institution?.settings?.rotations || [
            { id: 'rot_1', name: 'General', code: 'GEN', siteIds: ['site_1'], isMultiSite: false, requirements: {} }
        ],
        protectedTimes: institution?.settings?.protectedTimes || []
    });
    const [saving, setSaving] = useState(false);
    const [editingSite, setEditingSite] = useState(null);
    const [editingRotation, setEditingRotation] = useState(null);
    const [editingProtectedTime, setEditingProtectedTime] = useState(null);

    const handleSave = async () => {
        setSaving(true);
        await firebaseService.updateInstitutionSettings(settings);
        toast.success('Settings saved');
        setSaving(false);
    };

    const tabs = [
        { id: 'general', name: 'General', icon: 'settings' },
        { id: 'sites', name: 'Sites', icon: 'map-pin' },
        { id: 'rotations', name: 'Rotations', icon: 'repeat' },
        { id: 'protected', name: 'Protected Times', icon: 'shield' },
        { id: 'schedule', name: 'Schedule', icon: 'calendar' },
        { id: 'members', name: 'Members', icon: 'users' },
        { id: 'backup', name: 'Backup', icon: 'database' }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <p className="text-gray-600">Configure institution preferences</p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <Icon name={tab.icon} size={16} />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            <Card>
                <div className="space-y-6">
                    {activeTab === 'general' && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Institution Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Institution Name</label>
                                <input
                                    type="text"
                                    value={settings.institutionName}
                                    onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                                <select
                                    value={settings.timezone}
                                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="America/New_York">Eastern Time</option>
                                    <option value="America/Chicago">Central Time</option>
                                    <option value="America/Denver">Mountain Time</option>
                                    <option value="America/Los_Angeles">Pacific Time</option>
                                </select>
                            </div>
                        </div>
                        </div>
                    )}

                    {activeTab === 'sites' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Clinical Sites</h3>
                                <Button
                                    onClick={() => setEditingSite({})}
                                    size="sm"
                                >
                                    <Icon name="plus" size={16} className="mr-1" />
                                    Add Site
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {settings.sites.map(site => (
                                    <div key={site.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: site.color }}
                                            />
                                            <div>
                                                <div className="font-medium">{site.name} ({site.code})</div>
                                                {site.address && (
                                                    <div className="text-sm text-gray-500">{site.address}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingSite(site)}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <Icon name="pencil" size={16} />
                                            </button>
                                            {settings.sites.length > 1 && (
                                                <button
                                                    onClick={() => {
                                                        setSettings({
                                                            ...settings,
                                                            sites: settings.sites.filter(s => s.id !== site.id)
                                                        });
                                                    }}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Icon name="trash-2" size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'rotations' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Rotation Types</h3>
                                <Button
                                    onClick={() => setEditingRotation({})}
                                    size="sm"
                                >
                                    <Icon name="plus" size={16} className="mr-1" />
                                    Add Rotation
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {settings.rotations.map(rotation => (
                                    <div key={rotation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <div className="font-medium">{rotation.name} ({rotation.code})</div>
                                            <div className="text-sm text-gray-500">
                                                {rotation.isMultiSite ? 'Multi-site' : 'Single site'} •
                                                {rotation.siteIds?.length || 0} site(s)
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingRotation(rotation)}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <Icon name="pencil" size={16} />
                                            </button>
                                            {settings.rotations.length > 1 && (
                                                <button
                                                    onClick={() => {
                                                        setSettings({
                                                            ...settings,
                                                            rotations: settings.rotations.filter(r => r.id !== rotation.id)
                                                        });
                                                    }}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Icon name="trash-2" size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'protected' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Protected Times</h3>
                                <Button
                                    onClick={() => setEditingProtectedTime({})}
                                    size="sm"
                                >
                                    <Icon name="plus" size={16} className="mr-1" />
                                    Add Protected Time
                                </Button>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Define recurring weekly events like Didactics, Grand Rounds, or protected educational time.
                            </p>
                            <div className="space-y-2">
                                {settings.protectedTimes.map(pt => (
                                    <div key={pt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <div className="font-medium">{pt.name}</div>
                                            <div className="text-sm text-gray-500">
                                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pt.dayOfWeek]} {pt.timeSlot}
                                                {pt.appliesTo && pt.appliesTo !== 'all' && ` • ${pt.appliesTo.toUpperCase()}`}
                                                {pt.mandatory && ' • Mandatory'}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingProtectedTime(pt)}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <Icon name="pencil" size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSettings({
                                                        ...settings,
                                                        protectedTimes: settings.protectedTimes.filter(p => p.id !== pt.id)
                                                    });
                                                }}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Icon name="trash-2" size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {settings.protectedTimes.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        No protected times defined. Click "Add Protected Time" to create one.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Preferences</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Work Days</label>
                                    <div className="space-y-2">
                                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                                            <label key={day} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.workDays.includes(day)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSettings({ ...settings, workDays: [...settings.workDays, day] });
                                                        } else {
                                                            setSettings({ ...settings, workDays: settings.workDays.filter(d => d !== day) });
                                                        }
                                                    }}
                                                    className="rounded"
                                                />
                                                <span className="text-sm capitalize">{day}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={settings.autoScheduleEnabled}
                                            onChange={(e) => setSettings({ ...settings, autoScheduleEnabled: e.target.checked })}
                                            className="rounded"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Enable Auto-Scheduling</span>
                                    </label>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={settings.notificationsEnabled}
                                            onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                                            className="rounded"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Enable Notifications</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <MembersManagement />
                    )}

                    {activeTab === 'backup' && (
                        <BackupRestore />
                    )}

                    {activeTab !== 'members' && activeTab !== 'backup' && (
                        <div className="flex justify-end">
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Site Edit Modal */}
            {editingSite && (
                <Modal
                    isOpen={true}
                    onClose={() => setEditingSite(null)}
                    title={editingSite.id ? 'Edit Site' : 'Add Site'}
                >
                    <SiteForm
                        site={editingSite}
                        existingSites={settings.sites}
                        onSave={(siteData) => {
                            if (siteData.id) {
                                setSettings({
                                    ...settings,
                                    sites: settings.sites.map(s => s.id === siteData.id ? siteData : s)
                                });
                            } else {
                                const newSite = {
                                    ...siteData,
                                    id: `site_${Date.now()}`
                                };
                                setSettings({
                                    ...settings,
                                    sites: [...settings.sites, newSite]
                                });
                            }
                            setEditingSite(null);
                        }}
                        onCancel={() => setEditingSite(null)}
                    />
                </Modal>
            )}

            {/* Rotation Edit Modal */}
            {editingRotation && (
                <Modal
                    isOpen={true}
                    onClose={() => setEditingRotation(null)}
                    title={editingRotation.id ? 'Edit Rotation' : 'Add Rotation'}
                >
                    <RotationForm
                        rotation={editingRotation}
                        sites={settings.sites}
                        existingRotations={settings.rotations}
                        onSave={(rotationData) => {
                            if (rotationData.id) {
                                setSettings({
                                    ...settings,
                                    rotations: settings.rotations.map(r => r.id === rotationData.id ? rotationData : r)
                                });
                            } else {
                                const newRotation = {
                                    ...rotationData,
                                    id: `rot_${Date.now()}`
                                };
                                setSettings({
                                    ...settings,
                                    rotations: [...settings.rotations, newRotation]
                                });
                            }
                            setEditingRotation(null);
                        }}
                        onCancel={() => setEditingRotation(null)}
                    />
                </Modal>
            )}

            {/* Protected Time Edit Modal */}
            {editingProtectedTime && (
                <Modal
                    isOpen={true}
                    onClose={() => setEditingProtectedTime(null)}
                    title={editingProtectedTime.id ? 'Edit Protected Time' : 'Add Protected Time'}
                >
                    <ProtectedTimeForm
                        protectedTime={editingProtectedTime}
                        sites={settings.sites}
                        onSave={(ptData) => {
                            if (ptData.id) {
                                setSettings({
                                    ...settings,
                                    protectedTimes: settings.protectedTimes.map(pt => pt.id === ptData.id ? ptData : pt)
                                });
                            } else {
                                const newPT = {
                                    ...ptData,
                                    id: `pt_${Date.now()}`
                                };
                                setSettings({
                                    ...settings,
                                    protectedTimes: [...settings.protectedTimes, newPT]
                                });
                            }
                            setEditingProtectedTime(null);
                        }}
                        onCancel={() => setEditingProtectedTime(null)}
                    />
                </Modal>
            )}
        </div>
    );
};

// Site Form Component
const SiteForm = ({ site, existingSites, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: site.name || '',
        code: site.code || '',
        address: site.address || '',
        color: site.color || '#10b981',
        ...site
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Main Hospital"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., MAIN"
                    maxLength="5"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="123 Medical Center Dr, City, State 12345"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="h-10 w-20"
                    />
                    <span className="text-sm text-gray-600">{formData.color}</span>
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Site</Button>
            </div>
        </form>
    );
};

// Rotation Form Component
const RotationForm = ({ rotation, sites, existingRotations, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: rotation.name || '',
        code: rotation.code || '',
        siteIds: rotation.siteIds || [],
        isMultiSite: rotation.isMultiSite || false,
        requirements: rotation.requirements || {},
        ...rotation
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rotation Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Pediatrics"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., PEDS"
                    maxLength="10"
                    required
                />
            </div>
            <div>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={formData.isMultiSite}
                        onChange={(e) => setFormData({ ...formData, isMultiSite: e.target.checked })}
                        className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Multi-site rotation</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">Check if residents on this rotation work at multiple sites</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Associated Sites</label>
                <div className="space-y-2">
                    {sites.map(site => (
                        <label key={site.id} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.siteIds.includes(site.id)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFormData({ ...formData, siteIds: [...formData.siteIds, site.id] });
                                    } else {
                                        setFormData({ ...formData, siteIds: formData.siteIds.filter(id => id !== site.id) });
                                    }
                                }}
                                className="rounded"
                            />
                            <span className="text-sm">{site.name} ({site.code})</span>
                        </label>
                    ))}
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Rotation</Button>
            </div>
        </form>
    );
};

// Protected Time Form Component
const ProtectedTimeForm = ({ protectedTime, sites, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: protectedTime.name || '',
        dayOfWeek: protectedTime.dayOfWeek ?? 3, // Default to Wednesday
        timeSlot: protectedTime.timeSlot || 'AM',
        appliesTo: protectedTime.appliesTo || 'all',
        mandatory: protectedTime.mandatory ?? true,
        eventType: protectedTime.eventType || 'didactics',
        siteId: protectedTime.siteId || '',
        ...protectedTime
    });

    const daysOfWeek = [
        { value: 0, label: 'Sunday' },
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' }
    ];

    const pgyLevels = ['all', 'PGY-1', 'PGY-2', 'PGY-3', 'PGY-4', 'PGY-5+'];
    const eventTypes = [
        { value: 'didactics', label: 'Didactics' },
        { value: 'grand-rounds', label: 'Grand Rounds' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'protected', label: 'Protected Education' },
        { value: 'other', label: 'Other' }
    ];

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Weekly Didactics"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                >
                    {eventTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                    <select
                        value={formData.dayOfWeek}
                        onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                    >
                        {daysOfWeek.map(day => (
                            <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                    <select
                        value={formData.timeSlot}
                        onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                    >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Applies To</label>
                <select
                    value={formData.appliesTo}
                    onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                >
                    {pgyLevels.map(level => (
                        <option key={level} value={level}>
                            {level === 'all' ? 'All Residents' : level}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site (Optional)</label>
                <select
                    value={formData.siteId}
                    onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                >
                    <option value="">All Sites</option>
                    {sites.map(site => (
                        <option key={site.id} value={site.id}>
                            {site.name} ({site.code})
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={formData.mandatory}
                        onChange={(e) => setFormData({ ...formData, mandatory: e.target.checked })}
                        className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Mandatory Attendance</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                    If checked, residents must attend unless explicitly excused
                </p>
            </div>

            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Protected Time</Button>
            </div>
        </form>
    );
};

// ==================== Auto-Scheduler Component ====================
const AutoScheduler = ({ onClose }) => {
    const { firebaseService } = useApp();
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    });
    const [scheduling, setScheduling] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleAutoSchedule = async () => {
        setScheduling(true);
        setProgress(20);

        try {
            // Call the Cloud Function for auto-scheduling
            const autoSchedule = window.firebase.functions.httpsCallable('autoSchedule');

            setProgress(40);

            const result = await autoSchedule({
                institutionId: firebaseService.currentInstitution,
                startDate: dateRange.start,
                endDate: dateRange.end,
                options: {
                    includeWeekends: false,
                    overwrite: false
                }
            });

            setProgress(80);

            if (result.data.success) {
                toast.success(`Created ${result.data.assignmentsCreated} assignments!`);
                setProgress(100);
                setTimeout(onClose, 1500);
            } else {
                throw new Error('Auto-scheduling failed');
            }
        } catch (error) {
            console.error('Auto-scheduling error:', error);
            toast.error(error.message || 'Failed to auto-schedule');
            setScheduling(false);
            setProgress(0);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={scheduling}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={scheduling}
                />
            </div>

            {scheduling && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Scheduling in progress...</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={onClose} disabled={scheduling}>
                    Cancel
                </Button>
                <Button onClick={handleAutoSchedule} disabled={scheduling}>
                    {scheduling ? 'Scheduling...' : 'Start Auto-Schedule'}
                </Button>
            </div>
        </div>
    );
};

// ==================== Chat Assistant Panel ====================
const ChatAssistantPanel = ({ onClose }) => {
    const { firebaseService, user } = useApp();
    const institutionId = firebaseService.currentInstitution;
    const firstName = user?.name ? user.name.split(' ')[0] : 'there';
    const [messages, setMessages] = useState(() => ([
        { id: generateId('msg'), role: 'assistant', content: `Hi ${firstName}! How can I help with the schedule today?` }
    ]));
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const listRef = useRef(null);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    const todayIso = () => new Date().toISOString().split('T')[0];

    const sendMessage = async (text, options = {}) => {
        const trimmed = typeof text === 'string' ? text.trim() : '';
        const hasDirectAction = Boolean(options?.directAction?.name);
        if ((!trimmed && !hasDirectAction) || !institutionId) {
            return;
        }

        const userContent = trimmed || options.fallbackUserMessage || 'Request sent.';
        const userMessage = { id: generateId('msg'), role: 'user', content: userContent };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');

        if (!window.firebase?.functions) {
            toast.error('Realtime functions are not available right now.');
            return;
        }

        setIsSending(true);
        try {
            const chatFn = window.firebase.functions.httpsCallable('chatAssistant');
            const historyPayload = messages
                .concat(userMessage)
                .slice(-10)
                .map(entry => ({ role: entry.role, content: entry.content }));

            const payload = {
                institutionId,
                message: userContent,
                history: historyPayload
            };

            if (hasDirectAction) {
                payload.directAction = options.directAction;
            }

            const response = await chatFn(payload);

            const data = response?.data || {};
            const assistantText = data.reply || 'Done.';
            const assistantMessage = {
                id: generateId('msg'),
                role: 'assistant',
                content: assistantText,
                metadata: data
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat assistant send error', error);
            toast.error(error.message || 'The assistant could not complete that request.');
            setMessages(prev => [...prev, { id: generateId('msg'), role: 'assistant', content: 'Sorry, I could not complete that request. Please try again.' }]);
        } finally {
            setIsSending(false);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (isSending) return;
        sendMessage(inputValue);
    };

    const handleUndo = () => {
        if (isSending) return;
        sendMessage('Undo the last change.', {
            directAction: {
                name: 'undo_action',
                args: { steps: 1 }
            }
        });
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(event);
        }
    };

    return (
        <div className="flex flex-col h-[500px]">
            <div ref={listRef} className="flex-1 overflow-y-auto pr-2 space-y-3">
                {messages.map(message => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[85%] px-4 py-2 rounded-2xl shadow-sm ${
                                message.role === 'user'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white text-gray-800 border border-gray-200'
                            }`}
                        >
                            <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                            {message.metadata?.action && (
                                <p className="mt-1 text-xs opacity-80">Action: {message.metadata.action}</p>
                            )}
                        </div>
                    </div>
                ))}
                {isSending && (
                    <div className="text-gray-500 text-sm italic">Assistant is thinking…</div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="mt-4">
                <div className="flex items-end gap-2">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask the assistant to add, adjust, or review schedules…"
                        className="flex-1 h-24 resize-none px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                    <Button type="submit" disabled={isSending || !inputValue.trim()}>
                        <Icon name="send" size={16} className="mr-2" />
                        Send
                    </Button>
                </div>
            </form>

            <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleUndo} disabled={isSending}>
                        <Icon name="rotate-ccw" size={14} className="mr-1" />
                        Undo last action
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => sendMessage('Summarize today\'s clinic coverage.', {
                            directAction: {
                                name: 'summarize_coverage',
                                args: { date: todayIso() }
                            }
                        })}
                        disabled={isSending}
                    >
                        <Icon name="sparkles" size={14} className="mr-1" />
                        Summarize today
                    </Button>
                </div>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            </div>
        </div>
    );
};

const AssistantGuideView = () => {
    const sections = [
        {
            title: 'Prerequisites',
            description: 'Before launching the assistant, make sure the basics are covered.',
            icon: 'badge-check',
            items: [
                'Sign in with an account that has admin, program_admin, chief_resident, or scheduler permissions.',
                'Confirm the Firebase Functions deployment includes the chatAssistant callable.',
                'Set environment config: gemini.location, gemini.model, chatbot.rate_limit, chatbot.undo_limit.',
                'For local testing, point GOOGLE_APPLICATION_CREDENTIALS to the service account JSON (keep it outside Git).'
            ]
        },
        {
            title: 'Launching the Assistant',
            description: 'Find the assistant inside the Schedule view.',
            icon: 'rocket',
            items: [
                'Open Clinic Scheduler Pro and navigate to the Schedule tab.',
                'Select the floating “Chat Assistant” button at the bottom right.',
                'Use the modal to review conversation history, send requests, or trigger quick actions like Undo and Summarize.'
            ]
        },
        {
            title: 'Request Tips',
            description: 'Provide structured details so Gemini can take precise action.',
            icon: 'list-checks',
            items: [
                'Include date (YYYY-MM-DD), time slot (AM/PM), attending/resident IDs, and site or clinic when known.',
                'Describe recurrence explicitly, e.g., “every week for 4 weeks starting 2025-10-02”.',
                'State the desired outcome in one sentence—avoid multi-step instructions in a single message.',
                'Roster uploads should list one person per line with name and PGY (add email/phone if available).',
                'Ask for a coverage summary and include a specific date or range when you need staffing snapshots.'
            ]
        },
        {
            title: 'Coverage & Rosters',
            description: 'Leverage purpose-built tools for summaries and bulk directory updates.',
            icon: 'file-text',
            items: [
                'Use the Summarize quick action or say “summarize coverage for 2025-11-04” to get slot-by-slot assignments.',
                'Undo up to 25 chatbot actions in one go, e.g., “undo the last 3 changes”.',
                'Keep bulk additions to 400 people or fewer to stay within Firestore write limits.'
            ]
        },
        {
            title: 'Guardrails & Limits',
            description: 'The assistant enforces safety rules before saving changes.',
            icon: 'shield-alert',
            items: [
                'Protected continuity clinics, didactics, and approved time off cannot be edited by the assistant.',
                'Rate limiting defaults to 20 requests per hour per user—slow down when you see a cooldown message.',
                'Undo reverts up to the last 25 bot actions for your account (per request or stacked); manual calendar edits remain untouched.'
            ]
        },
        {
            title: 'Troubleshooting',
            description: 'How to recover when something feels off.',
            icon: 'life-buoy',
            items: [
                'If responses hang on “Assistant is thinking…”, inspect Firebase logs (`firebase functions:log --only chatAssistant`).',
                'Permission errors typically mean your Firestore member record lacks the required role.',
                'Missing credentials? Redeploy with the chatbot service account or update GOOGLE_APPLICATION_CREDENTIALS locally.',
                'Large rollbacks: use the standard schedule restore workflow beyond the 25-step undo stack.'
            ]
        }
    ];

    const samplePrompts = [
        '“Schedule resident r_jackson with attending a_cole on 2025-10-14 AM at continuity clinic.”',
        '“Move Taylor’s October 09 AM clinic to Friday October 10 PM.”',
        '“Undo the last 3 actions.”',
        '“Summarize today’s clinic coverage.”',
        '“Add the following residents: Olivia Pierog, PGY-2; Jonathan Lai, PGY-2; Catherine Reilly, PGY-2; Diem-Phuong Dao, PGY-2.”'
    ];

    const bestPractices = [
        'Break complex reorganizations into smaller requests and review results between each step.',
        'Let the UI trim older chat history to keep responses fast; long transcripts increase latency.',
        'Document high-impact bot changes in audit notes so teammates understand the context.',
        'Coordinate with other schedulers to avoid overlapping edits during busy clinic weeks.',
        'Use quick actions for undo and coverage summaries to call the underlying tools directly.'
    ];

    return (
        <div className="space-y-6">
            <Card className="bg-gradient-to-r from-primary-50 via-white to-primary-50 border-primary-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <p className="uppercase tracking-widest text-xs text-primary-500 font-semibold">Assistant Onboarding</p>
                        <h2 className="text-2xl font-display font-bold text-medical-900 mt-1">Get Started with the Clinic Scheduler Chat Assistant</h2>
                        <p className="text-gray-600 mt-3 max-w-2xl">
                            Learn how to safely automate scheduling changes with Gemini. Follow these guidelines to request updates, respect guardrails, and recover quickly when something goes sideways.
                        </p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="px-5 py-4 bg-white border border-primary-100 rounded-xl shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary-100 rounded-xl">
                                <Icon name="bot" size={28} className="text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Roles with access</p>
                                <p className="font-semibold text-medical-900">Admin · Program Admin · Chief Resident · Scheduler</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </Card>

            <div className="grid gap-5 lg:grid-cols-2">
                {sections.map(section => (
                    <Card key={section.title} className="h-full">
                        <div className="flex items-start gap-3">
                            <div className="p-3 bg-medical-50 rounded-xl shadow-inner">
                                <Icon name={section.icon} size={24} className="text-medical-600" />
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-medical-900">{section.title}</h3>
                                    <p className="text-sm text-gray-600">{section.description}</p>
                                </div>
                                <ul className="space-y-2 text-sm text-gray-700 leading-relaxed">
                                    {section.items.map(item => (
                                        <li key={item} className="flex gap-2 items-start">
                                            <Icon name="check" size={16} className="mt-0.5 text-primary-500" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <Card className="h-full">
                    <h3 className="text-lg font-semibold text-medical-900 mb-3">Sample Prompts</h3>
                    <p className="text-sm text-gray-600 mb-4">Use these templates as a starting point and adjust IDs, dates, and clinics to fit your scenario.</p>
                    <div className="space-y-3">
                        {samplePrompts.map(prompt => (
                            <div key={prompt} className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-800">
                                {prompt}
                            </div>
                        ))}
                    </div>
                </Card>
                <Card className="h-full">
                    <h3 className="text-lg font-semibold text-medical-900 mb-3">Best Practices</h3>
                    <p className="text-sm text-gray-600 mb-4">Keep collaboration tight and reduce rework by following these habits.</p>
                    <ul className="space-y-3 text-sm text-gray-700 leading-relaxed">
                        {bestPractices.map(item => (
                            <li key={item} className="flex gap-2 items-start">
                                <Icon name="sparkles" size={16} className="mt-0.5 text-primary-500" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>

            <Card className="bg-medical-50 border-medical-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-medical-900">Need help or spotting anomalies?</h3>
                        <p className="text-sm text-gray-600 mt-1">Check the chatAssistant logs first. Escalate via #clinic-scheduler Slack or contact the platform ops team for urgent issues.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => navigator.clipboard?.writeText('firebase functions:log --only chatAssistant')}
                            className="bg-white"
                        >
                            <Icon name="clipboard-copy" size={16} className="mr-2" />
                            Copy log command
                        </Button>
                        <Button
                            onClick={() => toast.success('Remember to share context in #clinic-scheduler when you reach out!')}
                        >
                            <Icon name="message-circle" size={16} className="mr-2" />
                            Notify ops team
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
// ==================== Main App Component ====================
const App = () => {
    const { user, loading, firebaseService } = useApp();
    const [activeView, setActiveView] = useState('dashboard');
    const [scheduleFilterData, setScheduleFilterData] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showChatAssistant, setShowChatAssistant] = useState(false);

    const navigateToSchedule = (personType, personId) => {
        setScheduleFilterData({ type: personType, id: personId });
        setActiveView('schedule');
    };

    const handleNavClick = (viewId) => {
        setActiveView(viewId);
        setMobileMenuOpen(false); // Close mobile menu on navigation
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
        { id: 'schedule', label: 'Schedule', icon: 'calendar' },
        { id: 'attendings', label: 'Attendings', icon: 'users' },
        { id: 'residents', label: 'Residents', icon: 'user-check' },
        { id: 'rules', label: 'Rules', icon: 'shield-check' },
        { id: 'assistant-guide', label: 'Assistant Guide', icon: 'bot' },
        { id: 'settings', label: 'Settings', icon: 'settings' }
    ];

    const handleSignOut = async () => {
        await firebaseService.signOut();
        toast.success('Signed out successfully');
    };

    return (
        <div className="min-h-screen font-body" style={{ background: 'linear-gradient(180deg, #f0fdfa 0%, #ccfbf1 100%)' }}>
            {/* Premium Navigation Header */}
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="sticky top-0 z-50 glass-card border-b border-medical-200/20 backdrop-blur-xl"
                style={{ background: 'rgba(255, 255, 255, 0.82)' }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20">
                        <div className="flex items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-medical-400 to-medical-600 rounded-2xl shadow-lg shadow-medical-500/20">
                                    <Icon name="calendar-days" size={26} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-display font-bold text-medical-900">Clinic Scheduler</h1>
                                </div>
                            </div>

                            <div className="hidden md:flex ml-12 space-x-2">
                                {navItems.map(item => (
                                    <motion.button
                                        key={item.id}
                                        onClick={() => handleNavClick(item.id)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`
                                            px-4 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all relative
                                            ${activeView === item.id
                                                ? 'bg-gradient-to-r from-medical-500 to-medical-600 text-white shadow-lg shadow-medical-500/25'
                                                : 'text-medical-700 hover:bg-medical-50 hover:text-medical-900'
                                            }
                                        `}
                                    >
                                        <Icon name={item.icon} size={16} />
                                        {item.label}
                                        {activeView === item.id && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-gradient-to-r from-medical-500 to-medical-600 rounded-full -z-10"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 rounded-lg hover:bg-medical-50 transition-colors"
                                aria-label="Toggle menu"
                            >
                                <Icon
                                    name={mobileMenuOpen ? "x" : "menu"}
                                    size={24}
                                    className="text-medical-700"
                                />
                            </button>

                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="hidden sm:flex badge-live items-center gap-2 px-4 py-2 rounded-full"
                            >
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                <span className="text-sm text-white font-bold">Live Sync</span>
                            </motion.div>

                            <motion.button
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-3 glass-card rounded-full relative transition-all hover:shadow-lg"
                            >
                                <Icon name="bell" size={20} className="text-medical-700" />
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg"
                                >
                                    <span className="text-xs text-white font-bold">3</span>
                                </motion.span>
                            </motion.button>

                            <div className="hidden md:flex items-center gap-3 pl-3 border-l border-medical-200">
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-medical-900">{user.name || user.email}</p>
                                    <button
                                        onClick={handleSignOut}
                                        className="text-xs text-medical-600 hover:text-medical-800 font-medium transition-colors"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    className="w-10 h-10 bg-gradient-to-br from-medical-400 to-medical-600 rounded-full flex items-center justify-center shadow-lg shadow-medical-500/20"
                                >
                                    <Icon name="user" size={18} className="text-white" />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Navigation Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="md:hidden fixed inset-0 bg-black/50 z-40"
                        />

                        {/* Mobile Menu Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="md:hidden fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto"
                        >
                            <div className="flex flex-col h-full">
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b">
                                    <h2 className="text-lg font-bold text-medical-900">Menu</h2>
                                    <button
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        aria-label="Close menu"
                                    >
                                        <Icon name="x" size={24} className="text-gray-600" />
                                    </button>
                                </div>

                                {/* User Info */}
                                <div className="p-4 bg-gradient-to-br from-medical-50 to-medical-100 border-b">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-medical-400 to-medical-600 rounded-full flex items-center justify-center">
                                            <Icon name="user" size={20} className="text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-medical-900">{user.name || 'User'}</p>
                                            <p className="text-sm text-medical-600">{user.email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation Items */}
                                <nav className="flex-1 p-4">
                                    <ul className="space-y-2">
                                        {navItems.map(item => (
                                            <li key={item.id}>
                                                <button
                                                    onClick={() => handleNavClick(item.id)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                                        activeView === item.id
                                                            ? 'bg-gradient-to-r from-medical-500 to-medical-600 text-white shadow-lg'
                                                            : 'hover:bg-medical-50 text-medical-700'
                                                    }`}
                                                >
                                                    <Icon name={item.icon} size={20} />
                                                    <span className="font-medium">{item.label}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>

                                {/* Footer */}
                                <div className="p-4 border-t">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-lg mb-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-sm text-green-700 font-medium">Live Sync Active</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            handleSignOut();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                                    >
                                        <Icon name="log-out" size={20} />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content with Glass Background */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
                {activeView === 'dashboard' && <Dashboard />}
                {activeView === 'schedule' && (
                    <ScheduleCalendar
                        initialFilter={scheduleFilterData}
                        onNavigateToPerson={navigateToSchedule}
                        onOpenChatAssistant={() => setShowChatAssistant(true)}
                    />
                )}
                {activeView === 'attendings' && <AttendingsList navigateToSchedule={navigateToSchedule} />}
                {activeView === 'residents' && <ResidentsList navigateToSchedule={navigateToSchedule} />}
                {activeView === 'rules' && <RulesList />}
                {activeView === 'assistant-guide' && <AssistantGuideView />}
                {activeView === 'settings' && <SettingsView />}
            </main>

            {/* Global Chat Assistant Launcher */}
            <motion.button
                aria-label="Open Chat Assistant"
                onClick={() => setShowChatAssistant(true)}
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-xl shadow-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/50 focus:outline-none focus:ring-4 focus:ring-primary-300 rounded-full flex items-center justify-center w-14 h-14"
            >
                <Icon name="bot" size={22} className="text-white" />
            </motion.button>

            <Toaster
                position="bottom-right"
                toastOptions={{
                    className: 'font-medium',
                    duration: 3000,
                    style: {
                        background: '#fff',
                        color: '#363636',
                    },
                }}
            />

            {showChatAssistant && (
                <Modal
                    isOpen={showChatAssistant}
                    onClose={() => setShowChatAssistant(false)}
                    title="Chat Assistant"
                    size="xl"
                >
                    <ChatAssistantPanel onClose={() => setShowChatAssistant(false)} />
                </Modal>
            )}
        </div>
    );
};

// ==================== Root Component ====================
const Root = () => {
    return (
        <ErrorBoundary>
            <ToastProvider>
                <AppProvider>
                    <ErrorBoundary
                        title="Application Error"
                        message="An error occurred while loading the application. Please try refreshing the page."
                    >
                        <App />
                    </ErrorBoundary>
                </AppProvider>
            </ToastProvider>
        </ErrorBoundary>
    );
};

// Render the app
ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
