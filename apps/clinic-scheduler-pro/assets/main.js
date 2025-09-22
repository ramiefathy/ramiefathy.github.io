function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Source for Clinic Scheduler Pro browser bundle. Run `npm run clinic:scheduler:build` after editing.
const {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  createContext,
  useContext
} = React;
const {
  createPortal
} = ReactDOM;
// Framer Motion Integration
const {
  motion,
  AnimatePresence
} = window['framer-motion'] || {
  motion: {
    div: 'div',
    button: 'button'
  },
  AnimatePresence: ({
    children
  }) => children
};
const ToastDispatchContext = createContext(null);
const ToastStateContext = createContext([]);
let externalToastDispatch = null;
const toast = {
  success: message => externalToastDispatch?.({
    type: 'success',
    message
  }),
  error: message => externalToastDispatch?.({
    type: 'error',
    message
  }),
  warning: message => externalToastDispatch?.({
    type: 'warning',
    message
  })
};
const ToastProvider = ({
  children
}) => {
  const [toasts, setToasts] = useState([]);
  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  const publish = useCallback(({
    type,
    message
  }) => {
    if (!message) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev, {
      id,
      type,
      message
    }]);
  }, []);
  useEffect(() => {
    externalToastDispatch = publish;
    return () => {
      if (externalToastDispatch === publish) {
        externalToastDispatch = null;
      }
    };
  }, [publish]);
  return /*#__PURE__*/React.createElement(ToastDispatchContext.Provider, {
    value: removeToast
  }, /*#__PURE__*/React.createElement(ToastStateContext.Provider, {
    value: toasts
  }, children, /*#__PURE__*/React.createElement(ToastViewport, null)));
};
const ToastViewport = () => {
  const toasts = useContext(ToastStateContext);
  const dismiss = useContext(ToastDispatchContext);
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    "aria-live": "polite",
    style: {
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      zIndex: 9999,
      maxWidth: '20rem'
    }
  }, toasts.map(toast => /*#__PURE__*/React.createElement(ToastItem, {
    key: toast.id,
    toast: toast,
    onDismiss: dismiss
  })));
};
const ToastItem = ({
  toast,
  onDismiss
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);
  const paletteMap = {
    success: {
      bg: '#dcfce7',
      border: '#86efac',
      text: '#065f46'
    },
    error: {
      bg: '#fee2e2',
      border: '#fca5a5',
      text: '#991b1b'
    },
    warning: {
      bg: '#fef3c7',
      border: '#fcd34d',
      text: '#92400e'
    }
  };
  const palette = paletteMap[toast.type] || paletteMap.success;
  return /*#__PURE__*/React.createElement("div", {
    role: "alert",
    onClick: () => onDismiss(toast.id),
    style: {
      borderRadius: '1rem',
      padding: '0.85rem 1rem',
      background: palette.bg,
      border: `1px solid ${palette.border}`,
      color: palette.text,
      fontWeight: 600,
      boxShadow: '0 12px 30px rgba(15, 23, 42, 0.15)',
      cursor: 'pointer'
    }
  }, toast.message);
};
const Toaster = () => null;

// ==================== Error Boundary Component ====================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }
  static getDerivedStateFromError(error) {
    return {
      hasError: true
    };
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
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    // Optionally refresh the page
    if (this.props.onReset) {
      this.props.onReset();
    }
  };
  render() {
    if (this.state.hasError) {
      return /*#__PURE__*/React.createElement("div", {
        className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4"
      }, /*#__PURE__*/React.createElement("div", {
        className: "max-w-2xl w-full bg-white rounded-xl shadow-xl p-8"
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex items-center justify-center w-16 h-16 bg-red-100 rounded-xl mb-6"
      }, /*#__PURE__*/React.createElement("svg", {
        className: "w-8 h-8 text-red-600",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor"
      }, /*#__PURE__*/React.createElement("path", {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      }))), /*#__PURE__*/React.createElement("h2", {
        className: "text-2xl font-bold text-gray-900 mb-3"
      }, this.props.title || 'Something went wrong'), /*#__PURE__*/React.createElement("p", {
        className: "text-gray-600 mb-6"
      }, this.props.message || 'An unexpected error occurred. The application has recovered, but you may need to refresh the page.'), window.location.hostname === 'localhost' && this.state.error && /*#__PURE__*/React.createElement("details", {
        className: "mb-6 p-4 bg-gray-50 rounded-lg"
      }, /*#__PURE__*/React.createElement("summary", {
        className: "cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900"
      }, "Error Details (Development Only)"), /*#__PURE__*/React.createElement("pre", {
        className: "mt-3 text-xs text-gray-600 overflow-auto"
      }, this.state.error.toString(), this.state.errorInfo && this.state.errorInfo.componentStack)), /*#__PURE__*/React.createElement("div", {
        className: "flex gap-3"
      }, /*#__PURE__*/React.createElement("button", {
        onClick: this.handleReset,
        className: "flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      }, "Try Again"), /*#__PURE__*/React.createElement("button", {
        onClick: () => window.location.reload(),
        className: "flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
      }, "Refresh Page"))));
    }
    return this.props.children;
  }
}

// Route-level error boundary with more specific error handling
class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false
    };
  }
  static getDerivedStateFromError(error) {
    return {
      hasError: true
    };
  }
  componentDidCatch(error, errorInfo) {
    console.error(`Error in ${this.props.routeName || 'route'}:`, error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return /*#__PURE__*/React.createElement("div", {
        className: "p-6 bg-yellow-50 border border-yellow-200 rounded-lg"
      }, /*#__PURE__*/React.createElement("h3", {
        className: "text-lg font-semibold text-yellow-900 mb-2"
      }, "Unable to load ", this.props.routeName || 'this section'), /*#__PURE__*/React.createElement("p", {
        className: "text-yellow-700 mb-4"
      }, "There was a problem loading this section. Please try refreshing the page."), /*#__PURE__*/React.createElement("button", {
        onClick: () => this.setState({
          hasError: false
        }),
        className: "px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
      }, "Retry"));
    }
    return this.props.children;
  }
}
const {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  getDay,
  addDays
} = window['date-fns'];
const {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} = window.Recharts;

// ==================== Validation Utilities ====================
const ValidationUtils = {
  // Email validation using RFC 5322 compliant regex
  validateEmail: email => {
    if (!email) return {
      isValid: false,
      error: 'Email is required'
    };
    const trimmedEmail = email.trim();
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(trimmedEmail)) {
      return {
        isValid: false,
        error: 'Please enter a valid email address'
      };
    }
    if (trimmedEmail.length > 255) {
      return {
        isValid: false,
        error: 'Email must be less than 255 characters'
      };
    }
    return {
      isValid: true,
      value: trimmedEmail
    };
  },
  // Required field validation
  validateRequired: (value, fieldName) => {
    if (!value || typeof value === 'string' && !value.trim()) {
      return {
        isValid: false,
        error: `${fieldName} is required`
      };
    }
    return {
      isValid: true,
      value: typeof value === 'string' ? value.trim() : value
    };
  },
  // Trim and validate length
  trimAndValidate: (value, maxLength, fieldName) => {
    if (!value) return {
      isValid: true,
      value: ''
    };
    const trimmed = value.trim();
    if (trimmed.length > maxLength) {
      return {
        isValid: false,
        error: `${fieldName} must be less than ${maxLength} characters`
      };
    }
    return {
      isValid: true,
      value: trimmed
    };
  },
  // Phone number validation (optional)
  validatePhoneNumber: (phone, required = false) => {
    if (!phone && !required) return {
      isValid: true,
      value: ''
    };
    if (!phone && required) return {
      isValid: false,
      error: 'Phone number is required'
    };
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      return {
        isValid: false,
        error: 'Phone number must be at least 10 digits'
      };
    }
    if (cleaned.length > 15) {
      return {
        isValid: false,
        error: 'Phone number must be less than 15 digits'
      };
    }

    // Format as (XXX) XXX-XXXX for US numbers
    let formatted = cleaned;
    if (cleaned.length === 10) {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return {
      isValid: true,
      value: formatted
    };
  },
  // Name validation - no numbers or special characters except spaces, hyphens, apostrophes
  validateName: (name, fieldName = 'Name') => {
    if (!name) return {
      isValid: false,
      error: `${fieldName} is required`
    };
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      return {
        isValid: false,
        error: `${fieldName} must be at least 2 characters`
      };
    }
    if (trimmed.length > 100) {
      return {
        isValid: false,
        error: `${fieldName} must be less than 100 characters`
      };
    }
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(trimmed)) {
      return {
        isValid: false,
        error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`
      };
    }
    return {
      isValid: true,
      value: trimmed
    };
  },
  // PGY level validation
  validatePGYLevel: level => {
    const num = parseInt(level);
    if (isNaN(num) || num < 1 || num > 10) {
      return {
        isValid: false,
        error: 'PGY level must be between 1 and 10'
      };
    }
    return {
      isValid: true,
      value: num
    };
  },
  // Validate all fields in a form
  validateForm: fields => {
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
    return {
      isValid,
      errors,
      values
    };
  }
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
      if (assignment.date === newAssignment.date && assignment.timeSlot === newAssignment.timeSlot) {
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
    const assignmentDate = new Date(date);
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
          vacationDates: {
            start: vacationStart,
            end: vacationEnd
          }
        });
      }
    }
    return conflicts;
  },
  // Check continuity clinic conflicts
  checkContinuityConflict: (resident, date, timeSlot) => {
    if (!resident || !resident.continuityDay) return [];
    const assignmentDate = new Date(date);
    const dayOfWeek = assignmentDate.getDay();
    const dayMap = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
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
    const assignmentDate = new Date(date);
    const dayOfWeek = assignmentDate.getDay();
    const conflicts = [];
    for (const pt of protectedTimes) {
      if (pt.dayOfWeek === dayOfWeek && pt.timeSlot === timeSlot) {
        // Check if this protected time applies to this resident
        if (pt.appliesTo === 'all' || pt.appliesTo === residentPGY || pt.appliesTo === 'junior' && residentPGY && parseInt(residentPGY.replace('PGY', '')) <= 2 || pt.appliesTo === 'senior' && residentPGY && parseInt(residentPGY.replace('PGY', '')) >= 3) {
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
        const continuityConflicts = ConflictDetection.checkContinuityConflict(resident, newAssignment.date, newAssignment.timeSlot);
        allConflicts.push(...continuityConflicts);

        // Check max assignments
        const maxConflicts = ConflictDetection.checkMaxAssignments(assignments, {
          ...resident,
          role: 'resident'
        }, newAssignment.date, institution?.settings?.maxAssignmentsPerDay || 2);
        allConflicts.push(...maxConflicts);

        // Check protected time
        const protectedConflicts = ConflictDetection.checkProtectedTime(institution?.settings?.protectedTimes, newAssignment.date, newAssignment.timeSlot, resident.pgyLevel);
        allConflicts.push(...protectedConflicts);
      }
    }
    if (newAssignment.attendingId) {
      const attending = attendings.find(a => a.id === newAssignment.attendingId);
      if (attending) {
        const vacationConflicts = ConflictDetection.checkVacationConflict(attending, newAssignment.date);
        allConflicts.push(...vacationConflicts);

        // Check max assignments for attending
        const maxConflicts = ConflictDetection.checkMaxAssignments(assignments, {
          ...attending,
          role: 'attending'
        }, newAssignment.date, institution?.settings?.maxAttendingAssignmentsPerDay || 4);
        allConflicts.push(...maxConflicts);
      }
    }
    return {
      hasConflicts: allConflicts.length > 0,
      hasErrors: allConflicts.some(c => c.severity === 'error'),
      hasWarnings: allConflicts.some(c => c.severity === 'warning'),
      conflicts: allConflicts,
      canProceed: !allConflicts.some(c => c.severity === 'error'),
      summary: allConflicts.length > 0 ? `Found ${allConflicts.filter(c => c.severity === 'error').length} errors, ${allConflicts.filter(c => c.severity === 'warning').length} warnings` : 'No conflicts detected'
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
    const filtered = assignments.filter(a => {
      if (startDate && a.date < startDate) return false;
      if (endDate && a.date > endDate) return false;
      return true;
    }).sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.timeSlot === 'AM' ? -1 : 1;
    });

    // Convert to rows
    for (const assignment of filtered) {
      const resident = residents.find(r => r.id === assignment.residentId);
      const attending = attendings.find(a => a.id === assignment.attendingId);
      const assignmentDate = new Date(assignment.date);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][assignmentDate.getDay()];
      rows.push([assignment.date, dayName, assignment.timeSlot, resident?.name || '', attending?.name || '', assignment.siteId || '', assignment.rotationId || '', assignment.notes || '']);
    }

    // Convert to CSV string
    return rows.map(row => row.map(cell => {
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(cell).replace(/"/g, '""');
      return escaped.includes(',') ? `"${escaped}"` : escaped;
    }).join(',')).join('\n');
  },
  // Convert attendings list to CSV
  attendingsToCSV: attendings => {
    const headers = ['Name', 'Email', 'Phone', 'Sites', 'Rotations', 'Max Weekly'];
    const rows = [headers];
    for (const attending of attendings) {
      rows.push([attending.name, attending.email || '', attending.phone || '', (attending.sites || []).join('; '), (attending.rotations || []).join('; '), attending.maxWeeklyAssignments || '']);
    }
    return rows.map(row => row.map(cell => {
      const escaped = String(cell).replace(/"/g, '""');
      return escaped.includes(',') ? `"${escaped}"` : escaped;
    }).join(',')).join('\n');
  },
  // Export to JSON for backup
  exportToJSON: data => {
    return JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: data
    }, null, 2);
  },
  // Download file utility
  downloadFile: (content, filename, mimeType = 'text/csv') => {
    const blob = new Blob([content], {
      type: mimeType
    });
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
  validateImportData: data => {
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
          if (resident.pgyLevel) {
            const pgyValidation = ValidationUtils.validatePGYLevel(resident.pgyLevel);
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
  parseImportedJSON: jsonString => {
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
    input.onchange = event => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
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
  return new Promise(resolve => {
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
    window.firebase.auth.onAuthStateChanged(this.auth, async user => {
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
      await window.firebase.firestore.setDoc(window.firebase.firestore.doc(this.db, 'users', user.uid), {
        email,
        name,
        createdAt: window.firebase.firestore.serverTimestamp(),
        institutions: []
      });
      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async signIn(email, password) {
    try {
      const userCredential = await window.firebase.auth.signInWithEmailAndPassword(this.auth, email, password);
      return {
        success: true,
        user: userCredential.user
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async signOut() {
    try {
      this.cleanup();
      await window.firebase.auth.signOut(this.auth);
      return {
        success: true
      };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async resetPassword(email) {
    try {
      await window.firebase.auth.sendPasswordResetEmail(this.auth, email);
      return {
        success: true
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: error.message
      };
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
        const normalizedInstitutions = rawInstitutions.map(inst => typeof inst === 'string' ? inst : inst?.id).filter(id => typeof id === 'string' && id.length > 0);
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
        const preferredInstitution = typeof userData.currentInstitution === 'string' && userData.currentInstitution ? userData.currentInstitution : normalizedInstitutions[0];
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
      const institutionRef = window.firebase.firestore.doc(window.firebase.firestore.collection(this.db, 'institutions'));
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
          sites: [{
            id: 'site_1',
            name: 'Main Clinic',
            code: 'MAIN',
            color: '#10b981'
          }],
          rotations: [{
            id: 'rot_1',
            name: 'General',
            code: 'GEN',
            minSessions: 4
          }],
          protectedTimes: [{
            id: 'pt_1',
            name: 'Didactics',
            dayOfWeek: 3,
            timeSlot: 'AM',
            mandatory: true
          }],
          academicYear: {
            start: format(new Date(), 'yyyy-07-01'),
            end: format(addDays(new Date(), 365), 'yyyy-06-30')
          }
        }
      };

      // Create institution
      await window.firebase.firestore.setDoc(institutionRef, institutionData);

      // Add user as admin member
      await window.firebase.firestore.setDoc(window.firebase.firestore.doc(this.db, 'institutions', institutionRef.id, 'members', this.currentUser.uid), {
        userId: this.currentUser.uid,
        name: userData.name,
        email: userData.email,
        role: 'program_admin',
        joinedAt: window.firebase.firestore.serverTimestamp()
      });

      // Update user's institutions list
      await window.firebase.firestore.updateDoc(window.firebase.firestore.doc(this.db, 'users', this.currentUser.uid), {
        institutions: window.firebase.firestore.arrayUnion(institutionRef.id)
      });
      this.currentInstitution = institutionRef.id;
      return {
        success: true,
        institutionId: institutionRef.id
      };
    } catch (error) {
      console.error('Create institution error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async loadInstitution(institutionId) {
    if (!this.currentUser) return null;
    try {
      // Check if user is a member
      const memberDoc = await window.firebase.firestore.getDoc(window.firebase.firestore.doc(this.db, 'institutions', institutionId, 'members', this.currentUser.uid));
      if (!memberDoc.exists()) {
        throw new Error('Not a member of this institution');
      }
      this.currentInstitution = institutionId;
      this.setupRealtimeListeners();
      return {
        success: true
      };
    } catch (error) {
      console.error('Load institution error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  setupRealtimeListeners() {
    if (!this.currentInstitution) return;
    this.cleanup();

    // Listen to institution settings
    const institutionUnsub = window.firebase.firestore.onSnapshot(window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution), doc => {
      if (doc.exists()) {
        this.notifyListeners('institution', doc.data());
      }
    });
    this.unsubscribers.push(institutionUnsub);

    // Listen to attendings
    const attendingsUnsub = window.firebase.firestore.onSnapshot(window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'attendings'), snapshot => {
      const attendings = [];
      snapshot.forEach(doc => {
        attendings.push({
          id: doc.id,
          ...doc.data()
        });
      });
      this.notifyListeners('attendings', attendings);
    });
    this.unsubscribers.push(attendingsUnsub);

    // Listen to residents
    const residentsUnsub = window.firebase.firestore.onSnapshot(window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'residents'), snapshot => {
      const residents = [];
      snapshot.forEach(doc => {
        residents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      this.notifyListeners('residents', residents);
    });
    this.unsubscribers.push(residentsUnsub);

    // Listen to assignments
    const assignmentsUnsub = window.firebase.firestore.onSnapshot(window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'assignments'), snapshot => {
      const assignments = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        const key = `${data.date}_${data.timeSlot}`;
        if (!assignments[key]) assignments[key] = [];
        assignments[key].push({
          id: doc.id,
          ...data
        });
      });
      this.notifyListeners('assignments', assignments);
    });
    this.unsubscribers.push(assignmentsUnsub);

    // Listen to rules
    const rulesUnsub = window.firebase.firestore.onSnapshot(window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'rules'), snapshot => {
      const rules = [];
      snapshot.forEach(doc => {
        rules.push({
          id: doc.id,
          ...doc.data()
        });
      });
      this.notifyListeners('rules', rules);
    });
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
      const docRef = await window.firebase.firestore.addDoc(window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'attendings'), {
        ...attending,
        createdAt: window.firebase.firestore.serverTimestamp(),
        createdBy: this.currentUser.uid
      });
      await this.addAuditLog('attending_added', {
        id: docRef.id,
        ...attending
      });
      return {
        success: true,
        id: docRef.id
      };
    } catch (error) {
      console.error('Add attending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async updateAttending(id, updates) {
    if (!this.currentInstitution) throw new Error('No institution selected');
    try {
      await window.firebase.firestore.updateDoc(window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'attendings', id), {
        ...updates,
        updatedAt: window.firebase.firestore.serverTimestamp()
      });
      await this.addAuditLog('attending_updated', {
        id,
        updates
      });
      return {
        success: true
      };
    } catch (error) {
      console.error('Update attending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async deleteAttending(id) {
    if (!this.currentInstitution) throw new Error('No institution selected');
    try {
      await window.firebase.firestore.deleteDoc(window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'attendings', id));
      await this.addAuditLog('attending_deleted', {
        id
      });
      return {
        success: true
      };
    } catch (error) {
      console.error('Delete attending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async addResident(resident) {
    if (!this.currentInstitution) throw new Error('No institution selected');
    try {
      const docRef = await window.firebase.firestore.addDoc(window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'residents'), {
        ...resident,
        createdAt: window.firebase.firestore.serverTimestamp(),
        createdBy: this.currentUser.uid
      });
      await this.addAuditLog('resident_added', {
        id: docRef.id,
        ...resident
      });
      return {
        success: true,
        id: docRef.id
      };
    } catch (error) {
      console.error('Add resident error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async updateResident(id, updates) {
    if (!this.currentInstitution) throw new Error('No institution selected');
    try {
      await window.firebase.firestore.updateDoc(window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'residents', id), {
        ...updates,
        updatedAt: window.firebase.firestore.serverTimestamp()
      });
      await this.addAuditLog('resident_updated', {
        id,
        updates
      });
      return {
        success: true
      };
    } catch (error) {
      console.error('Update resident error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async deleteResident(id) {
    if (!this.currentInstitution) throw new Error('No institution selected');
    try {
      await window.firebase.firestore.deleteDoc(window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'residents', id));
      await this.addAuditLog('resident_deleted', {
        id
      });
      return {
        success: true
      };
    } catch (error) {
      console.error('Delete resident error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async addAssignment(assignment) {
    if (!this.currentInstitution) throw new Error('No institution selected');
    try {
      const docRef = await window.firebase.firestore.addDoc(window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'assignments'), {
        ...assignment,
        createdAt: window.firebase.firestore.serverTimestamp(),
        createdBy: this.currentUser.uid
      });
      await this.addAuditLog('assignment_added', {
        id: docRef.id,
        ...assignment
      });
      return {
        success: true,
        id: docRef.id
      };
    } catch (error) {
      console.error('Add assignment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async updateAssignment(id, updates) {
    if (!this.currentInstitution) throw new Error('No institution selected');
    try {
      await window.firebase.firestore.updateDoc(window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'assignments', id), {
        ...updates,
        updatedAt: window.firebase.firestore.serverTimestamp()
      });
      await this.addAuditLog('assignment_updated', {
        id,
        updates
      });
      return {
        success: true
      };
    } catch (error) {
      console.error('Update assignment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async deleteAssignment(id) {
    if (!this.currentInstitution) throw new Error('No institution selected');
    try {
      await window.firebase.firestore.deleteDoc(window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'assignments', id));
      await this.addAuditLog('assignment_deleted', {
        id
      });
      return {
        success: true
      };
    } catch (error) {
      console.error('Delete assignment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async addRule(rule) {
    if (!this.currentInstitution) throw new Error('No institution selected');
    try {
      const docRef = await window.firebase.firestore.addDoc(window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'rules'), {
        ...rule,
        createdAt: window.firebase.firestore.serverTimestamp(),
        createdBy: this.currentUser.uid
      });
      await this.addAuditLog('rule_added', {
        id: docRef.id,
        ...rule
      });
      return {
        success: true,
        id: docRef.id
      };
    } catch (error) {
      console.error('Add rule error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async updateRule(id, updates) {
    if (!this.currentInstitution) throw new Error('No institution selected');
    try {
      await window.firebase.firestore.updateDoc(window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'rules', id), {
        ...updates,
        updatedAt: window.firebase.firestore.serverTimestamp()
      });
      await this.addAuditLog('rule_updated', {
        id,
        updates
      });
      return {
        success: true
      };
    } catch (error) {
      console.error('Update rule error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async deleteRule(id) {
    if (!this.currentInstitution) throw new Error('No institution selected');
    try {
      await window.firebase.firestore.deleteDoc(window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'rules', id));
      await this.addAuditLog('rule_deleted', {
        id
      });
      return {
        success: true
      };
    } catch (error) {
      console.error('Delete rule error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async updateInstitutionSettings(updates) {
    if (!this.currentInstitution) throw new Error('No institution selected');
    try {
      await window.firebase.firestore.updateDoc(window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution), {
        settings: updates,
        updatedAt: window.firebase.firestore.serverTimestamp()
      });
      await this.addAuditLog('settings_updated', updates);
      return {
        success: true
      };
    } catch (error) {
      console.error('Update settings error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async addAuditLog(action, data) {
    if (!this.currentInstitution) return;
    try {
      await window.firebase.firestore.addDoc(window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'auditLogs'), {
        action,
        data,
        userId: this.currentUser?.uid,
        timestamp: window.firebase.firestore.serverTimestamp()
      });
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
          const docRef = window.firebase.firestore.doc(window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'assignments'));
          batch.set(docRef, {
            ...assignment,
            createdAt: window.firebase.firestore.serverTimestamp(),
            createdBy: this.currentUser.uid
          });
        });
        await batch.commit();
        committed += chunk.length;
      }
      await this.addAuditLog('batch_assignments_added', {
        count: committed
      });
      return {
        success: true
      };
    } catch (error) {
      console.error('Batch add assignments error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async clearAllAssignments() {
    if (!this.currentInstitution) throw new Error('No institution selected');
    try {
      const snapshot = await window.firebase.firestore.getDocs(window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'assignments'));
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
      await this.addAuditLog('all_assignments_cleared', {
        count: processed
      });
      return {
        success: true
      };
    } catch (error) {
      console.error('Clear assignments error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Real-time listeners
  listenToAttendings(callback) {
    if (!this.currentInstitution) {
      callback([]);
      return () => {};
    }
    const query = window.firebase.firestore.query(window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'attendings'), window.firebase.firestore.orderBy('name'));
    const unsubscribe = window.firebase.firestore.onSnapshot(query, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(data);
    }, error => {
      console.error('Attendings listener error:', error);
      callback([]);
    });
    return unsubscribe;
  }
  listenToResidents(callback) {
    if (!this.currentInstitution) {
      callback([]);
      return () => {};
    }
    const query = window.firebase.firestore.query(window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'residents'), window.firebase.firestore.orderBy('name'));
    const unsubscribe = window.firebase.firestore.onSnapshot(query, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(data);
    }, error => {
      console.error('Residents listener error:', error);
      callback([]);
    });
    return unsubscribe;
  }
  listenToAssignments(callback) {
    if (!this.currentInstitution) {
      callback([]);
      return () => {};
    }
    const query = window.firebase.firestore.query(window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'assignments'), window.firebase.firestore.orderBy('date'));
    const unsubscribe = window.firebase.firestore.onSnapshot(query, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(data);
    }, error => {
      console.error('Assignments listener error:', error);
      callback([]);
    });
    return unsubscribe;
  }
  listenToRules(callback) {
    if (!this.currentInstitution) {
      callback([]);
      return () => {};
    }
    const query = window.firebase.firestore.query(window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'rules'), window.firebase.firestore.orderBy('name'));
    const unsubscribe = window.firebase.firestore.onSnapshot(query, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(data);
    }, error => {
      console.error('Rules listener error:', error);
      callback([]);
    });
    return unsubscribe;
  }
  listenToInstitution(callback) {
    if (!this.currentInstitution) {
      callback(null);
      return () => {};
    }
    const unsubscribe = window.firebase.firestore.onSnapshot(window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution), doc => {
      if (doc.exists) {
        callback({
          id: doc.id,
          ...doc.data()
        });
      } else {
        callback(null);
      }
    }, error => {
      console.error('Institution listener error:', error);
      callback(null);
    });
    return unsubscribe;
  }

  // ===== Member Management =====
  async getInstitutionMembers() {
    if (!this.currentInstitution) throw new Error('No institution selected');
    try {
      const institutionDoc = await window.firebase.firestore.getDoc(window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution));
      if (!institutionDoc.exists()) {
        throw new Error('Institution not found');
      }
      const institutionData = institutionDoc.data();
      const members = institutionData.members || [];

      // Fetch user details for each member
      const memberDetails = await Promise.all(members.map(async member => {
        try {
          const userDoc = await window.firebase.firestore.getDoc(window.firebase.firestore.doc(this.db, 'users', member.userId));
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
      }));

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
      await window.firebase.firestore.setDoc(window.firebase.firestore.doc(this.db, 'inviteCodes', code), {
        institutionId: this.currentInstitution,
        role: inviteData.role || 'member',
        createdBy: this.currentUser.uid,
        createdAt: window.firebase.firestore.serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        // 7 days
        used: false
      });

      // Add audit log
      await this.addAuditLog('INVITE_CODE_CREATED', {
        code,
        role: inviteData.role
      });
      return {
        success: true,
        code
      };
    } catch (error) {
      console.error('Error creating invite code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async updateMemberRole(memberId, newRole) {
    if (!this.currentInstitution) throw new Error('No institution selected');
    try {
      // Get current institution document
      const institutionDoc = await window.firebase.firestore.getDoc(window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution));
      if (!institutionDoc.exists()) {
        throw new Error('Institution not found');
      }
      const institutionData = institutionDoc.data();
      const members = institutionData.members || [];

      // Find and update the member's role
      const updatedMembers = members.map(member => {
        if (member.userId === memberId) {
          return {
            ...member,
            role: newRole
          };
        }
        return member;
      });

      // Update the institution document
      await window.firebase.firestore.updateDoc(window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution), {
        members: updatedMembers,
        updatedAt: window.firebase.firestore.serverTimestamp()
      });

      // Add audit log
      await this.addAuditLog('MEMBER_ROLE_UPDATED', {
        memberId,
        newRole
      });
      return {
        success: true
      };
    } catch (error) {
      console.error('Error updating member role:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async removeMember(memberId) {
    if (!this.currentInstitution) throw new Error('No institution selected');
    try {
      // Get current institution document
      const institutionDoc = await window.firebase.firestore.getDoc(window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution));
      if (!institutionDoc.exists()) {
        throw new Error('Institution not found');
      }
      const institutionData = institutionDoc.data();
      const members = institutionData.members || [];

      // Remove the member
      const updatedMembers = members.filter(member => member.userId !== memberId);

      // Update the institution document
      await window.firebase.firestore.updateDoc(window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution), {
        members: updatedMembers,
        updatedAt: window.firebase.firestore.serverTimestamp()
      });

      // Remove institution from user's institutions array
      await window.firebase.firestore.updateDoc(window.firebase.firestore.doc(this.db, 'users', memberId), {
        institutions: window.firebase.firestore.arrayRemove(this.currentInstitution, {
          id: this.currentInstitution,
          role: members.find(m => m.userId === memberId)?.role || 'member'
        })
      });

      // Add audit log
      await this.addAuditLog('MEMBER_REMOVED', {
        memberId
      });
      return {
        success: true
      };
    } catch (error) {
      console.error('Error removing member:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async redeemInviteCode(code) {
    if (!this.currentUser) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }
    try {
      // Get the invite code document
      const inviteDoc = await window.firebase.firestore.getDoc(window.firebase.firestore.doc(this.db, 'inviteCodes', code.toUpperCase()));
      if (!inviteDoc.exists()) {
        return {
          success: false,
          error: 'Invalid invite code'
        };
      }
      const inviteData = inviteDoc.data();

      // Check if invite code has expired
      if (inviteData.expiresAt && inviteData.expiresAt.toDate() < new Date()) {
        return {
          success: false,
          error: 'Invite code has expired'
        };
      }

      // Check if invite code has already been used (if single-use)
      if (inviteData.used) {
        return {
          success: false,
          error: 'Invite code has already been used'
        };
      }

      // Get institution details
      const institutionDoc = await window.firebase.firestore.getDoc(window.firebase.firestore.doc(this.db, 'institutions', inviteData.institutionId));
      if (!institutionDoc.exists()) {
        return {
          success: false,
          error: 'Institution not found'
        };
      }
      const institutionData = institutionDoc.data();

      // Add user to institution members
      const members = institutionData.members || [];
      const userProfile = await this.loadUserProfile();

      // Check if user is already a member
      if (members.some(m => m.userId === this.currentUser.uid)) {
        return {
          success: false,
          error: 'You are already a member of this institution'
        };
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
      await window.firebase.firestore.updateDoc(window.firebase.firestore.doc(this.db, 'institutions', inviteData.institutionId), {
        members: members,
        updatedAt: window.firebase.firestore.serverTimestamp()
      });

      // Add institution to user's institutions array (store IDs consistently)
      await window.firebase.firestore.updateDoc(window.firebase.firestore.doc(this.db, 'users', this.currentUser.uid), {
        institutions: window.firebase.firestore.arrayUnion(inviteData.institutionId),
        currentInstitution: inviteData.institutionId
      });

      // Mark invite code as used (if single-use)
      if (inviteData.singleUse !== false) {
        await window.firebase.firestore.updateDoc(window.firebase.firestore.doc(this.db, 'inviteCodes', code.toUpperCase()), {
          used: true,
          usedBy: this.currentUser.uid,
          usedAt: window.firebase.firestore.serverTimestamp()
        });
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
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// ==================== App Context ====================
const firebaseService = new FirebaseService();
const AppContext = createContext();
const AppProvider = ({
  children
}) => {
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
      window.firebase.auth.onAuthStateChanged(window.firebaseAuth, async user => {
        if (user) {
          const profile = await firebaseService.loadUserProfile();
          setState(prev => ({
            ...prev,
            user: {
              ...user,
              ...profile
            },
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
  return /*#__PURE__*/React.createElement(AppContext.Provider, {
    value: value
  }, children);
};
const useApp = () => useContext(AppContext);

// ==================== Shared Components ====================
const Icon = ({
  name,
  size = 20,
  className = ""
}) => {
  useEffect(() => {
    if (lucide?.createIcons) {
      const icons = lucide.icons;
      icons ? lucide.createIcons({
        icons
      }) : lucide.createIcons();
    }
  }, []);
  return /*#__PURE__*/React.createElement("i", {
    "data-lucide": name,
    className: className,
    style: {
      width: size,
      height: size
    }
  });
};
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = "",
  icon,
  loading = false,
  ...props
}) => {
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
  return /*#__PURE__*/React.createElement(motion.button, _extends({
    whileHover: {
      scale: loading ? 1 : 1.02
    },
    whileTap: {
      scale: loading ? 1 : 0.98
    },
    className: `${baseClasses} ${variants[variant]} ${sizes[size]} ${loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`,
    disabled: loading
  }, props), loading ? /*#__PURE__*/React.createElement("div", {
    className: "animate-spin rounded-full h-4 w-4 border-b-2 border-current"
  }) : icon ? /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: size === 'sm' ? 16 : size === 'lg' ? 20 : 18
  }) : null, children);
};
const Card = ({
  children,
  className = "",
  padding = true,
  hover = false,
  ...motionProps
}) => /*#__PURE__*/React.createElement(motion.div, _extends({
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0
  },
  whileHover: hover ? {
    scale: 1.02,
    y: -4
  } : undefined,
  className: `bg-white rounded-xl card-shadow border border-gray-200 transition-all duration-200 ease-in-out ${hover ? 'hover:card-shadow-hover' : ''} ${padding ? 'p-6' : ''} ${className}`
}, motionProps), children);

// Enhanced Loading Components
const LoadingSpinner = ({
  size = 'md',
  className = ""
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  return /*#__PURE__*/React.createElement("div", {
    className: `flex justify-center py-8 ${className}`
  }, /*#__PURE__*/React.createElement("div", {
    className: `animate-spin rounded-full border-b-2 border-primary-600 ${sizes[size]}`
  }));
};
const SkeletonCard = ({
  lines = 3,
  className = ""
}) => /*#__PURE__*/React.createElement(Card, {
  className: `animate-pulse ${className}`
}, /*#__PURE__*/React.createElement("div", {
  className: "space-y-3"
}, /*#__PURE__*/React.createElement("div", {
  className: "h-4 bg-gray-200 rounded shimmer"
}), Array.from({
  length: lines - 1
}).map((_, i) => /*#__PURE__*/React.createElement("div", {
  key: i,
  className: `h-4 bg-gray-200 rounded shimmer ${i === lines - 2 ? 'w-3/4' : ''}`
}))));
const SkeletonText = ({
  lines = 2,
  className = ""
}) => /*#__PURE__*/React.createElement("div", {
  className: `space-y-2 ${className}`
}, Array.from({
  length: lines
}).map((_, i) => /*#__PURE__*/React.createElement("div", {
  key: i,
  className: `h-4 bg-gray-200 rounded shimmer ${i === lines - 1 ? 'w-3/4' : ''}`
})));
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
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
      const focusableSelectors = ['a[href]', 'button:not([disabled])', 'textarea:not([disabled])', 'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])'];
      const focusable = node.querySelectorAll(focusableSelectors.join(','));
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        node.focus();
      }
    };
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const node = dialogRef.current;
      if (!node) return;
      const focusableSelectors = ['a[href]', 'button:not([disabled])', 'textarea:not([disabled])', 'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])'];
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
  return createPortal(/*#__PURE__*/React.createElement(AnimatePresence, null, /*#__PURE__*/React.createElement(motion.div, {
    initial: {
      opacity: 0
    },
    animate: {
      opacity: 1
    },
    exit: {
      opacity: 0
    },
    className: "fixed inset-0 z-50 overflow-y-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center min-h-screen p-4"
  }, /*#__PURE__*/React.createElement(motion.div, {
    initial: {
      opacity: 0
    },
    animate: {
      opacity: 1
    },
    exit: {
      opacity: 0
    },
    className: "fixed inset-0 bg-black/50 backdrop-blur-sm",
    onClick: onClose
  }), /*#__PURE__*/React.createElement(motion.div, {
    initial: {
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    transition: {
      duration: 0.2,
      ease: "easeOut"
    },
    className: `relative bg-white rounded-2xl shadow-2xl ${sizes[size]} w-full max-h-[90vh] overflow-hidden`,
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": titleIdRef.current,
    ref: dialogRef,
    tabIndex: -1
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between p-6 border-b"
  }, /*#__PURE__*/React.createElement("h3", {
    id: titleIdRef.current,
    className: "text-xl font-semibold text-gray-900"
  }, title), /*#__PURE__*/React.createElement(motion.button, {
    whileHover: {
      scale: 1.1
    },
    whileTap: {
      scale: 0.9
    },
    onClick: onClose,
    className: "p-2 hover:bg-gray-100 rounded-lg transition-colors",
    "aria-label": "Close dialog"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 20
  }))), /*#__PURE__*/React.createElement("div", {
    className: "p-6 overflow-y-auto max-h-[calc(90vh-80px)]"
  }, children))))), document.getElementById('modal-root'));
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
  const {
    firebaseService
  } = useApp();
  const validateField = (field, value) => {
    let result = {
      isValid: true
    };
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
          result = {
            isValid: false,
            error: 'Password is required'
          };
        }
        break;
      case 'confirmPassword':
        if (isSignUp) {
          if (!value) {
            result = {
              isValid: false,
              error: 'Please confirm your password'
            };
          } else if (value !== formData.password) {
            result = {
              isValid: false,
              error: 'Passwords do not match'
            };
          }
        }
        break;
      case 'inviteCode':
        // Invite code is optional, but if provided should be 6 characters
        if (isSignUp && value) {
          const trimmed = value.trim().toUpperCase();
          if (trimmed.length !== 6) {
            result = {
              isValid: false,
              error: 'Invite code must be 6 characters'
            };
          } else {
            result = {
              isValid: true,
              value: trimmed
            };
          }
        }
        break;
    }
    return result;
  };
  const handleFieldChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });

    // Clear error when user starts typing
    if (touched[field]) {
      const validation = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: validation.isValid ? undefined : validation.error
      }));
    }
  };
  const handleFieldBlur = field => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
    const validation = validateField(field, formData[field]);
    setErrors(prev => ({
      ...prev,
      [field]: validation.isValid ? undefined : validation.error
    }));
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    // Validate all fields
    const fieldsToValidate = isSignUp ? ['email', 'password', 'name', 'confirmPassword'] : ['email', 'password'];
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
        const result = await firebaseService.signUp(validatedValues.email || formData.email, formData.password, validatedValues.name || formData.name);
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
            const instResult = await firebaseService.createInstitution(`${validatedValues.name || formData.name}'s Institution`, {
              name: validatedValues.name || formData.name,
              email: validatedValues.email || formData.email
            });
            if (instResult.success) {
              toast.success('Institution created!');
            }
          }
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await firebaseService.signIn(validatedValues.email || formData.email, formData.password);
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
      setErrors({
        email: emailValidation.error
      });
      setTouched({
        email: true
      });
      return;
    }
    const result = await firebaseService.resetPassword(emailValidation.value);
    if (result.success) {
      toast.success('Password reset email sent!');
    } else {
      toast.error(result.error);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-md"
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    className: "text-center mb-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-xl mb-4"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar-days",
    size: 32,
    className: "text-primary-600"
  })), /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl font-bold text-gray-900"
  }, "Clinic Scheduler"), /*#__PURE__*/React.createElement("p", {
    className: "text-gray-600 mt-2"
  }, isSignUp ? 'Create your account' : 'Sign in to continue')), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit,
    className: "space-y-4"
  }, isSignUp && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-1"
  }, "Full Name ", /*#__PURE__*/React.createElement("span", {
    className: "text-red-500"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.name,
    onChange: e => handleFieldChange('name', e.target.value),
    onBlur: () => handleFieldBlur('name'),
    className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.name && touched.name ? 'border-red-500 bg-red-50' : touched.name && !errors.name ? 'border-green-500' : 'border-gray-300'}`,
    "aria-invalid": errors.name && touched.name,
    "aria-describedby": errors.name && touched.name ? 'name-error' : undefined
  }), errors.name && touched.name && /*#__PURE__*/React.createElement("p", {
    id: "name-error",
    className: "mt-1 text-xs text-red-600"
  }, errors.name)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-1"
  }, "Email Address ", /*#__PURE__*/React.createElement("span", {
    className: "text-red-500"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    type: "email",
    value: formData.email,
    onChange: e => handleFieldChange('email', e.target.value),
    onBlur: () => handleFieldBlur('email'),
    className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.email && touched.email ? 'border-red-500 bg-red-50' : touched.email && !errors.email ? 'border-green-500' : 'border-gray-300'}`,
    autoComplete: "email",
    "aria-invalid": errors.email && touched.email,
    "aria-describedby": errors.email && touched.email ? 'email-error' : undefined
  }), errors.email && touched.email && /*#__PURE__*/React.createElement("p", {
    id: "email-error",
    className: "mt-1 text-xs text-red-600"
  }, errors.email)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-1"
  }, "Password ", /*#__PURE__*/React.createElement("span", {
    className: "text-red-500"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    type: "password",
    value: formData.password,
    onChange: e => handleFieldChange('password', e.target.value),
    onBlur: () => handleFieldBlur('password'),
    className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.password && touched.password ? 'border-red-500 bg-red-50' : touched.password && !errors.password ? 'border-green-500' : 'border-gray-300'}`,
    autoComplete: isSignUp ? 'new-password' : 'current-password',
    "aria-invalid": errors.password && touched.password,
    "aria-describedby": errors.password && touched.password ? 'password-error' : undefined
  }), errors.password && touched.password && /*#__PURE__*/React.createElement("p", {
    id: "password-error",
    className: "mt-1 text-xs text-red-600"
  }, errors.password)), isSignUp && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-1"
  }, "Confirm Password ", /*#__PURE__*/React.createElement("span", {
    className: "text-red-500"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    type: "password",
    value: formData.confirmPassword,
    onChange: e => handleFieldChange('confirmPassword', e.target.value),
    onBlur: () => handleFieldBlur('confirmPassword'),
    className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.confirmPassword && touched.confirmPassword ? 'border-red-500 bg-red-50' : touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword ? 'border-green-500' : 'border-gray-300'}`,
    autoComplete: "new-password",
    "aria-invalid": errors.confirmPassword && touched.confirmPassword,
    "aria-describedby": errors.confirmPassword && touched.confirmPassword ? 'confirm-password-error' : undefined
  }), errors.confirmPassword && touched.confirmPassword && /*#__PURE__*/React.createElement("p", {
    id: "confirm-password-error",
    className: "mt-1 text-xs text-red-600"
  }, errors.confirmPassword)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-1"
  }, "Invite Code ", /*#__PURE__*/React.createElement("span", {
    className: "text-gray-400 text-xs"
  }, "(optional)")), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.inviteCode,
    onChange: e => handleFieldChange('inviteCode', e.target.value),
    onBlur: () => handleFieldBlur('inviteCode'),
    placeholder: "Enter 6-character code",
    maxLength: 6,
    className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.inviteCode && touched.inviteCode ? 'border-red-500 bg-red-50' : touched.inviteCode && !errors.inviteCode && formData.inviteCode ? 'border-green-500' : 'border-gray-300'}`,
    style: {
      textTransform: 'uppercase'
    },
    "aria-invalid": errors.inviteCode && touched.inviteCode,
    "aria-describedby": errors.inviteCode && touched.inviteCode ? 'invite-code-error' : undefined
  }), errors.inviteCode && touched.inviteCode && /*#__PURE__*/React.createElement("p", {
    id: "invite-code-error",
    className: "mt-1 text-xs text-red-600"
  }, errors.inviteCode), /*#__PURE__*/React.createElement("p", {
    className: "mt-1 text-xs text-gray-500"
  }, "Have an invite code? Enter it to join an existing institution."))), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    className: "w-full",
    loading: loading
  }, isSignUp ? 'Create Account' : 'Sign In'), !isSignUp && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleResetPassword,
    className: "w-full text-sm text-primary-600 hover:text-primary-700"
  }, "Forgot Password?"), /*#__PURE__*/React.createElement("div", {
    className: "text-center pt-4 border-t"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-600"
  }, isSignUp ? 'Already have an account?' : "Don't have an account?", /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setIsSignUp(!isSignUp),
    className: "ml-1 text-primary-600 hover:text-primary-700 font-medium"
  }, isSignUp ? 'Sign In' : 'Sign Up'))))), /*#__PURE__*/React.createElement("p", {
    className: "text-center text-xs text-gray-500 mt-4"
  }, "Protected by Firebase Authentication \u2022 Real-time Sync Enabled")));
};

// ==================== Dashboard Component ====================
const Dashboard = () => {
  const {
    attendings,
    residents,
    assignments,
    rules,
    institution,
    firebaseService
  } = useApp();
  const stats = useMemo(() => {
    const totalAssignments = Object.values(assignments).flat().length;
    const thisWeek = Object.entries(assignments).filter(([key]) => {
      const [date] = key.split('_');
      const weekStart = startOfWeek(new Date(), {
        weekStartsOn: 0
      });
      const weekEnd = endOfWeek(new Date(), {
        weekStartsOn: 0
      });
      const assignmentDate = parseISO(date);
      return assignmentDate >= weekStart && assignmentDate <= weekEnd;
    }).reduce((sum, [, items]) => sum + items.length, 0);
    return [{
      label: 'Total Attendings',
      value: attendings.length,
      icon: 'users',
      color: 'blue'
    }, {
      label: 'Total Residents',
      value: residents.length,
      icon: 'user-check',
      color: 'green'
    }, {
      label: 'This Week',
      value: thisWeek,
      icon: 'calendar',
      color: 'purple'
    }, {
      label: 'Active Rules',
      value: rules.filter(r => r.isActive).length,
      icon: 'shield-check',
      color: 'amber'
    }];
  }, [attendings, residents, assignments, rules]);
  const getColorClasses = color => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      amber: 'bg-amber-100 text-amber-600'
    };
    return colors[color] || colors.blue;
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-gray-900"
  }, "Dashboard"), /*#__PURE__*/React.createElement("p", {
    className: "text-gray-600"
  }, "Real-time overview of your scheduling system")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "md",
    onClick: async () => {
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
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bar-chart",
    size: 16,
    className: "mr-2"
  }), "Analytics"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "md",
    onClick: async () => {
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
        const blob = new Blob([byteArray], {
          type: 'application/pdf'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.data.filename;
        a.click();
        toast.success('PDF generated and downloaded');
      } catch (error) {
        toast.error('Failed to generate PDF');
      }
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 16,
    className: "mr-2"
  }), "Export PDF"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 px-3 py-1 bg-green-100 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-2 h-2 bg-green-500 rounded-full animate-pulse"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-green-700 font-medium"
  }, "Live Sync")))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
  }, stats.map((stat, index) => /*#__PURE__*/React.createElement(motion.div, {
    key: stat.label,
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0
    },
    transition: {
      delay: index * 0.1
    },
    whileHover: {
      scale: 1.02
    }
  }, /*#__PURE__*/React.createElement(Card, {
    hover: true,
    className: "card-shadow-hover"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-600"
  }, stat.label), /*#__PURE__*/React.createElement("p", {
    className: "text-3xl font-bold text-gray-900 mt-1"
  }, stat.value)), /*#__PURE__*/React.createElement("div", {
    className: `p-3 rounded-lg ${getColorClasses(stat.color)}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: stat.icon,
    size: 24
  }))))))));
};

// ==================== Schedule Calendar Component ====================
const ScheduleCalendar = ({
  initialFilter,
  onNavigateToPerson
}) => {
  const {
    firebaseService,
    institution
  } = useApp();
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('scheduleViewMode') || 'month';
  });
  const [currentDate, setCurrentDate] = useState(() => {
    const startOfWeekFunc = window.dateFns ? window.dateFns.startOfWeek : d => d;
    const startOfMonthFunc = window.dateFns ? window.dateFns.startOfMonth : d => new Date(d.getFullYear(), d.getMonth(), 1);
    return viewMode === 'week' ? startOfWeekFunc(new Date(), {
      weekStartsOn: 0
    }) : startOfMonthFunc(new Date());
  });
  const [assignments, setAssignments] = useState([]);
  const [attendings, setAttendings] = useState([]);
  const [residents, setResidents] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [showAutoScheduler, setShowAutoScheduler] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState(new Set());

  // Individual schedule view states
  const [scheduleFilter, setScheduleFilter] = useState(initialFilter?.type || 'all');
  const [selectedPersonId, setSelectedPersonId] = useState(initialFilter?.id || null);
  const [showPersonSelector, setShowPersonSelector] = useState(false);

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
  const generateVirtualAssignments = (residents, protectedTimes) => {
    const virtual = [];
    const today = new Date();

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
        const targetDay = dayMap[resident.continuityDay];

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
    return virtual;
  };
  useEffect(() => {
    if (!firebaseService.currentInstitution) {
      setLoading(false);
      return;
    }

    // Set up real-time listeners
    const unsubscribeAssignments = firebaseService.listenToAssignments(data => {
      // Merge real assignments with virtual ones
      const virtualAssignments = generateVirtualAssignments(residents, institution?.settings?.protectedTimes);
      const mergedAssignments = [...data, ...virtualAssignments];
      setAssignments(mergedAssignments);
      setLoading(false);
    });
    const unsubscribeAttendings = firebaseService.listenToAttendings(data => {
      setAttendings(data);
    });
    const unsubscribeResidents = firebaseService.listenToResidents(data => {
      setResidents(data);
      // Regenerate assignments when residents change
      const virtualAssignments = generateVirtualAssignments(data, institution?.settings?.protectedTimes);
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
  }, [firebaseService.currentInstitution, institution?.settings?.protectedTimes]);
  const weekDays = useMemo(() => {
    const days = [];
    const addDaysFunc = window.dateFns ? window.dateFns.addDays : (d, n) => new Date(d.getTime() + n * 86400000);
    const startOfWeekFunc = window.dateFns ? window.dateFns.startOfWeek : d => {
      // Manual implementation to start week on Sunday
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day;
      return new Date(date.setDate(diff));
    };

    // Always get the Sunday of the current week
    const weekStart = window.dateFns ? window.dateFns.startOfWeek(currentDate, {
      weekStartsOn: 0
    }) : startOfWeekFunc(currentDate);

    // Show full week (7 days) starting from Sunday
    for (let i = 0; i < 7; i++) {
      days.push(addDaysFunc(weekStart, i));
    }
    return days;
  }, [currentDate, viewMode]);
  const getDayName = date => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };
  const isWeekend = date => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday (0) or Saturday (6)
  };
  const monthDays = useMemo(() => {
    if (viewMode !== 'month') return [];
    const days = [];
    const startOfMonthFunc = window.dateFns ? window.dateFns.startOfMonth : d => new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonthFunc = window.dateFns ? window.dateFns.endOfMonth : d => new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const startOfWeekFunc = window.dateFns ? window.dateFns.startOfWeek : d => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day;
      return new Date(date.setDate(diff));
    };
    const endOfWeekFunc = window.dateFns ? window.dateFns.endOfWeek : d => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() + (6 - day);
      return new Date(date.setDate(diff));
    };
    const eachDayOfIntervalFunc = window.dateFns ? window.dateFns.eachDayOfInterval : interval => {
      const days = [];
      const current = new Date(interval.start);
      while (current <= interval.end) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      return days;
    };
    const monthStart = startOfMonthFunc(currentDate);
    const monthEnd = endOfMonthFunc(currentDate);
    const calendarStart = window.dateFns ? window.dateFns.startOfWeek(monthStart, {
      weekStartsOn: 0
    }) : startOfWeekFunc(monthStart);
    const calendarEnd = window.dateFns ? window.dateFns.endOfWeek(monthEnd, {
      weekStartsOn: 0
    }) : endOfWeekFunc(monthEnd);
    return eachDayOfIntervalFunc({
      start: calendarStart,
      end: calendarEnd
    });
  }, [currentDate, viewMode]);
  const timeSlots = ['AM', 'PM'];
  const getAssignmentsForSlot = (date, timeSlot) => {
    const dateStr = window.dateFns ? window.dateFns.format(date, 'yyyy-MM-dd') : date.toISOString().split('T')[0];
    return assignments.filter(a => a.date === dateStr && a.timeSlot === timeSlot);
  };
  const handleDragStart = (e, assignment) => {
    setDraggedItem(assignment);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDrop = async (e, date, timeSlot) => {
    e.preventDefault();
    if (!draggedItem) return;
    const dateStr = window.dateFns ? window.dateFns.format(date, 'yyyy-MM-dd') : date.toISOString().split('T')[0];
    const conflictCheck = ConflictDetection.checkAllConflicts({
      assignments,
      newAssignment: {
        ...draggedItem,
        date: dateStr,
        timeSlot
      },
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
    setSelectedCell({
      date: dateStr,
      timeSlot
    });
  };
  const handleDeleteAssignment = async assignmentId => {
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
  const navigate = direction => {
    if (viewMode === 'week') {
      const addWeeksFunc = window.dateFns ? window.dateFns.addWeeks : (d, n) => new Date(d.getTime() + n * 7 * 86400000);
      setCurrentDate(prev => addWeeksFunc(prev, direction));
    } else {
      const addMonthsFunc = window.dateFns ? window.dateFns.addMonths : (d, n) => {
        const newDate = new Date(d);
        newDate.setMonth(newDate.getMonth() + n);
        return newDate;
      };
      setCurrentDate(prev => addMonthsFunc(prev, direction));
    }
  };
  const switchViewMode = mode => {
    setViewMode(mode);
    if (mode === 'week') {
      const startOfWeekFunc = window.dateFns ? window.dateFns.startOfWeek : d => d;
      setCurrentDate(startOfWeekFunc(currentDate, {
        weekStartsOn: 0
      }));
    } else {
      const startOfMonthFunc = window.dateFns ? window.dateFns.startOfMonth : d => new Date(d.getFullYear(), d.getMonth(), 1);
      setCurrentDate(startOfMonthFunc(currentDate));
    }
  };
  const getAssignmentCount = date => {
    const dateStr = window.dateFns ? window.dateFns.format(date, 'yyyy-MM-dd') : date.toISOString().split('T')[0];
    return assignments.filter(a => a.date === dateStr).length;
  };
  const isToday = date => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };
  const isCurrentMonth = date => {
    return date.getMonth() === currentDate.getMonth();
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
      const attending = attendings.find(a => a.id === selectedPersonId);
      return attending?.name || 'Unknown';
    }
    return null;
  };
  if (loading) {
    return /*#__PURE__*/React.createElement(LoadingSpinner, {
      size: "lg",
      className: "py-12"
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-gray-900"
  }, "Schedule Calendar", getSelectedPersonName() && /*#__PURE__*/React.createElement("span", {
    className: "ml-2 text-lg font-normal text-gray-600"
  }, "- ", getSelectedPersonName())), /*#__PURE__*/React.createElement("p", {
    className: "text-gray-600"
  }, scheduleFilter === 'all' ? 'Drag and drop to manage assignments' : `Viewing ${scheduleFilter} schedule`)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => setShowPersonSelector(!showPersonSelector)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user",
    size: 16,
    className: "mr-2"
  }), scheduleFilter === 'all' ? 'All Schedules' : getSelectedPersonName(), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 16,
    className: "ml-2"
  })), showPersonSelector && /*#__PURE__*/React.createElement("div", {
    className: "absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: clearFilter,
    className: `w-full text-left px-4 py-2 hover:bg-gray-50 ${scheduleFilter === 'all' ? 'bg-primary-50 text-primary-700' : ''}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "users",
    size: 16,
    className: "inline mr-2"
  }), "All Schedules"), residents.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50"
  }, "RESIDENTS"), residents.map(resident => /*#__PURE__*/React.createElement("button", {
    key: resident.id,
    onClick: () => selectPerson('resident', resident.id),
    className: `w-full text-left px-4 py-2 hover:bg-gray-50 ${scheduleFilter === 'resident' && selectedPersonId === resident.id ? 'bg-primary-50 text-primary-700' : ''}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user",
    size: 16,
    className: "inline mr-2"
  }), resident.name, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-500 ml-1"
  }, "(", resident.pgyStatus || `PGY-${resident.year || 1}`, ")")))), attendings.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50"
  }, "ATTENDINGS"), attendings.map(attending => /*#__PURE__*/React.createElement("button", {
    key: attending.id,
    onClick: () => selectPerson('attending', attending.id),
    className: `w-full text-left px-4 py-2 hover:bg-gray-50 ${scheduleFilter === 'attending' && selectedPersonId === attending.id ? 'bg-primary-50 text-primary-700' : ''}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user-check",
    size: 16,
    className: "inline mr-2"
  }), attending.name))))), /*#__PURE__*/React.createElement("div", {
    className: "inline-flex rounded-lg border border-gray-200 p-0.5 bg-white"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => switchViewMode('month'),
    className: `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'month' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:text-gray-900'}`
  }, "Month"), /*#__PURE__*/React.createElement("button", {
    onClick: () => switchViewMode('week'),
    className: `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'week' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:text-gray-900'}`
  }, "Week")), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    onClick: () => navigate(-1)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-left",
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-gray-700 min-w-[150px] text-center"
  }, viewMode === 'month' ? window.dateFns ? window.dateFns.format(currentDate, 'MMMM yyyy') : `${currentDate.toLocaleString('default', {
    month: 'long'
  })} ${currentDate.getFullYear()}` : window.dateFns ? window.dateFns.format(currentDate, 'MMM d, yyyy') : currentDate.toLocaleDateString()), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    onClick: () => navigate(1)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 16
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => {
      const startDate = window.dateFns ? window.dateFns.format(window.dateFns.startOfMonth(currentDate), 'yyyy-MM-dd') : currentDate.toISOString().split('T')[0];
      const endDate = window.dateFns ? window.dateFns.format(window.dateFns.endOfMonth(currentDate), 'yyyy-MM-dd') : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
      const csv = ExportUtils.assignmentsToCSV(assignments, attendings, residents, startDate, endDate);
      const filename = ExportUtils.generateFilename('schedule', 'csv');
      ExportUtils.downloadFile(csv, filename);
      toast.success('Schedule exported successfully');
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 16,
    className: "mr-2"
  }), "Export"), /*#__PURE__*/React.createElement(Button, {
    onClick: () => setShowAutoScheduler(true)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 16,
    className: "mr-2"
  }), "Auto-Schedule"))), /*#__PURE__*/React.createElement(Card, {
    className: "overflow-hidden"
  }, viewMode === 'week' ?
  /*#__PURE__*/
  /* Week View */
  React.createElement("div", {
    className: "calendar-grid-week"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-gray-50 p-2 font-medium text-gray-700"
  }, "Time"), weekDays.map(day => {
    const dayOfWeek = day.getDay();
    const dayName = getDayName(day);
    const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
    const isTodayDay = isToday(day);
    return /*#__PURE__*/React.createElement("div", {
      key: day,
      className: `p-2 font-medium text-center ${isWeekendDay ? 'bg-gray-100 text-gray-500' : 'bg-gray-50'} ${isTodayDay ? 'bg-primary-50 text-primary-700' : isWeekendDay ? 'text-gray-500' : 'text-gray-700'}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-sm font-semibold"
    }, dayName), /*#__PURE__*/React.createElement("div", {
      className: "text-xs"
    }, window.dateFns ? window.dateFns.format(day, 'MMM d') : day.toLocaleDateString()));
  }), timeSlots.map(timeSlot => /*#__PURE__*/React.createElement(React.Fragment, {
    key: timeSlot
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-gray-50 p-4 font-medium text-gray-700"
  }, timeSlot), weekDays.map(day => {
    const slotAssignments = getFilteredAssignmentsForSlot(day, timeSlot);
    const isWeekendDay = day.getDay() === 0 || day.getDay() === 6;
    const isTodaySlot = isToday(day);
    return /*#__PURE__*/React.createElement("div", {
      key: `${day}-${timeSlot}`,
      className: `time-slot ${isWeekendDay ? 'weekend-slot' : ''} ${isTodaySlot ? 'today-slot' : ''}`,
      onDragOver: handleDragOver,
      onDrop: e => handleDrop(e, day, timeSlot),
      onClick: () => handleQuickAdd(day, timeSlot)
    }, slotAssignments.map(assignment => {
      const resident = residents.find(r => r.id === assignment.residentId);
      const attending = attendings.find(a => a.id === assignment.attendingId);
      return /*#__PURE__*/React.createElement("div", {
        key: assignment.id,
        draggable: assignment.type !== 'protected',
        onDragStart: e => handleDragStart(e, assignment),
        className: `assignment-card ${assignment.type === 'protected' ? 'bg-gray-100 border-gray-300 opacity-75' : assignment.type === 'continuity' ? 'bg-amber-50 border-amber-200' : ''}`
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex items-center justify-between"
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex-1"
      }, assignment.type === 'protected' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        className: "font-medium text-gray-700"
      }, assignment.eventName || 'Protected Time'), /*#__PURE__*/React.createElement("div", {
        className: "text-sm text-gray-500"
      }, resident?.name || 'All Residents'), /*#__PURE__*/React.createElement("span", {
        className: "inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-700"
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "shield",
        size: 10,
        className: "mr-1"
      }), "Protected")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
        onClick: e => {
          e.stopPropagation();
          if (resident && onNavigateToPerson) {
            onNavigateToPerson('resident', assignment.residentId);
          }
        },
        className: "font-medium text-gray-900 hover:text-blue-600 text-left"
      }, resident?.name || 'Unknown Resident'), assignment.type === 'continuity' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        className: "text-sm text-gray-600"
      }, "Continuity Clinic"), /*#__PURE__*/React.createElement("span", {
        className: "inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700"
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "repeat",
        size: 10,
        className: "mr-1"
      }), "Continuity")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
        onClick: e => {
          e.stopPropagation();
          if (attending && onNavigateToPerson) {
            onNavigateToPerson('attending', assignment.attendingId);
          }
        },
        className: "text-gray-600 hover:text-blue-600 block text-left"
      }, attending?.name || 'Unknown Attending')))), !assignment.virtual && /*#__PURE__*/React.createElement("button", {
        onClick: e => {
          e.stopPropagation();
          handleDeleteAssignment(assignment.id);
        },
        className: `text-gray-400 hover:text-red-600 ${deletingIds.has(assignment.id) ? 'animate-spin' : ''}`,
        disabled: deletingIds.has(assignment.id)
      }, deletingIds.has(assignment.id) ? /*#__PURE__*/React.createElement("div", {
        className: "animate-spin h-3.5 w-3.5 border-2 border-red-600 border-t-transparent rounded-full"
      }) : /*#__PURE__*/React.createElement(Icon, {
        name: "x",
        size: 14
      }))));
    }));
  })))) :
  /*#__PURE__*/
  /* Month View */
  React.createElement("div", {
    className: "calendar-grid-month"
  }, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => /*#__PURE__*/React.createElement("div", {
    key: day,
    className: `p-2 text-center font-medium text-sm ${index === 0 || index === 6 ? 'bg-gray-100 text-gray-500' : 'bg-gray-50 text-gray-700'}`
  }, day)), monthDays.map(day => {
    const dateStr = window.dateFns ? window.dateFns.format(day, 'yyyy-MM-dd') : day.toISOString().split('T')[0];
    const filtered = getFilteredAssignments();
    const dayAssignments = filtered.filter(a => a.date === dateStr);
    const amAssignments = dayAssignments.filter(a => a.timeSlot === 'AM');
    const pmAssignments = dayAssignments.filter(a => a.timeSlot === 'PM');
    const dayOfWeek = day.getDay();
    const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
    return /*#__PURE__*/React.createElement("div", {
      key: dateStr,
      className: `month-day-cell ${!isCurrentMonth(day) ? 'opacity-50' : ''} ${isToday(day) ? 'ring-2 ring-primary-500' : ''} ${isWeekendDay ? 'weekend-slot' : ''}`,
      onClick: () => {
        if (isCurrentMonth(day)) {
          // Switch to week view for this day
          const startOfWeekFunc = window.dateFns ? window.dateFns.startOfWeek : d => d;
          setCurrentDate(startOfWeekFunc(day, {
            weekStartsOn: 0
          }));
          setViewMode('week');
        }
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between items-start mb-1"
    }, /*#__PURE__*/React.createElement("span", {
      className: `text-sm font-medium ${!isCurrentMonth(day) ? 'text-gray-400' : 'text-gray-700'}`
    }, day.getDate()), dayAssignments.length > 0 && /*#__PURE__*/React.createElement("span", {
      className: "bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded-full"
    }, dayAssignments.length)), /*#__PURE__*/React.createElement("div", {
      className: `mb-1 ${amAssignments.length > 0 ? '' : 'min-h-[30px]'}`,
      onDragOver: handleDragOver,
      onDrop: e => handleDrop(e, day, 'AM')
    }, amAssignments.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-medium text-gray-500"
    }, "AM"), /*#__PURE__*/React.createElement("div", {
      className: "space-y-0.5"
    }, amAssignments.slice(0, 2).map(assignment => {
      const resident = residents.find(r => r.id === assignment.residentId);
      return /*#__PURE__*/React.createElement("div", {
        key: assignment.id,
        draggable: true,
        onDragStart: e => handleDragStart(e, assignment),
        className: "text-xs bg-blue-50 rounded px-1 py-0.5 truncate cursor-move hover:bg-blue-100",
        title: resident?.name
      }, resident?.name?.split(' ').map(n => n[0]).join('') || '??');
    }), amAssignments.length > 2 && /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-gray-500"
    }, "+", amAssignments.length - 2)))), /*#__PURE__*/React.createElement("div", {
      className: `${pmAssignments.length > 0 ? '' : 'min-h-[30px]'}`,
      onDragOver: handleDragOver,
      onDrop: e => handleDrop(e, day, 'PM')
    }, pmAssignments.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-medium text-gray-500"
    }, "PM"), /*#__PURE__*/React.createElement("div", {
      className: "space-y-0.5"
    }, pmAssignments.slice(0, 2).map(assignment => {
      const resident = residents.find(r => r.id === assignment.residentId);
      return /*#__PURE__*/React.createElement("div", {
        key: assignment.id,
        draggable: true,
        onDragStart: e => handleDragStart(e, assignment),
        className: "text-xs bg-green-50 rounded px-1 py-0.5 truncate cursor-move hover:bg-green-100",
        title: resident?.name
      }, resident?.name?.split(' ').map(n => n[0]).join('') || '??');
    }), pmAssignments.length > 2 && /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-gray-500"
    }, "+", pmAssignments.length - 2)))));
  }))), selectedCell && /*#__PURE__*/React.createElement(Modal, {
    isOpen: true,
    onClose: () => setSelectedCell(null),
    title: "Add Assignment"
  }, /*#__PURE__*/React.createElement(AssignmentForm, {
    date: selectedCell.date,
    timeSlot: selectedCell.timeSlot,
    residents: residents,
    attendings: attendings,
    assignments: assignments,
    institution: institution,
    onSave: async data => {
      // Check for conflicts
      const conflictCheck = ConflictDetection.checkAllConflicts({
        assignments,
        newAssignment: data,
        attendings,
        residents,
        institution
      });
      if (conflictCheck.hasErrors) {
        // Show conflicts and ask for confirmation
        const errorMessages = conflictCheck.conflicts.filter(c => c.severity === 'error').map(c => c.message).join('\n');
        if (!confirm(`Conflicts detected:\n\n${errorMessages}\n\nDo you want to override and continue?`)) {
          return;
        }
      } else if (conflictCheck.hasWarnings) {
        // Show warnings but allow to proceed
        const warningMessages = conflictCheck.conflicts.filter(c => c.severity === 'warning').map(c => c.message).join('\n');
        if (!confirm(`Warnings:\n\n${warningMessages}\n\nDo you want to continue?`)) {
          return;
        }
      }
      await firebaseService.addAssignment(data);
      toast.success('Assignment added');
      setSelectedCell(null);
    },
    onCancel: () => setSelectedCell(null)
  })), showAutoScheduler && /*#__PURE__*/React.createElement(Modal, {
    isOpen: true,
    onClose: () => setShowAutoScheduler(false),
    title: "Auto-Schedule Assignments"
  }, /*#__PURE__*/React.createElement(AutoScheduler, {
    onClose: () => setShowAutoScheduler(false)
  })));
};

// Assignment Form Component
const AssignmentForm = ({
  date,
  timeSlot,
  residents,
  attendings,
  assignments = [],
  institution: institutionProp,
  onSave,
  onCancel
}) => {
  const {
    institution: contextInstitution
  } = useApp();
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
    rotationId: ''
  });
  const [conflicts, setConflicts] = useState([]);

  // Get resident's current rotation for the month
  const getResidentRotation = residentId => {
    if (!residentId) return null;
    const resident = residents.find(r => r.id === residentId);
    if (!resident) return null;
    const monthStr = new Date(date).toISOString().slice(0, 7);
    const assignment = resident.rotationAssignments?.find(ra => ra.month === monthStr);
    if (!assignment) return null;
    return rotations.find(r => r.id === assignment.rotationId);
  };

  // Get available attendings based on rotation and time slot
  const getAvailableAttendings = () => {
    if (!formData.residentId) return attendings;
    const rotation = getResidentRotation(formData.residentId);
    if (!rotation) return attendings;
    const dayOfWeek = new Date(date).getDay();

    // Filter attendings who:
    // 1. Support this rotation
    // 2. Have clinic sessions on this day/time
    return attendings.filter(attending => {
      const supportsRotation = attending.rotationIds?.includes(rotation.id);
      const hasClinicSession = attending.clinicSchedule?.some(session => session.dayOfWeek === dayOfWeek && session.timeSlot === timeSlot);
      return supportsRotation && hasClinicSession;
    });
  };
  const availableAttendings = getAvailableAttendings();

  // Check for conflicts when form data changes
  useEffect(() => {
    if (!formData.residentId && !formData.attendingId) {
      setConflicts([]);
      return;
    }
    const conflictCheck = ConflictDetection.checkAllConflicts({
      assignments,
      newAssignment: formData,
      attendings,
      residents,
      institution
    });
    setConflicts(conflictCheck.conflicts);
  }, [formData.residentId, formData.attendingId, formData.date, formData.timeSlot]);
  return /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onSave(formData);
    },
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Resident"), /*#__PURE__*/React.createElement("select", {
    value: formData.residentId,
    onChange: e => setFormData({
      ...formData,
      residentId: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg",
    required: true
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Select Resident"), residents.map(r => /*#__PURE__*/React.createElement("option", {
    key: r.id,
    value: r.id
  }, r.name)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Attending", availableAttendings.length === 0 && formData.residentId && /*#__PURE__*/React.createElement("span", {
    className: "text-red-500 text-xs ml-2"
  }, "No attendings available for this rotation/time")), /*#__PURE__*/React.createElement("select", {
    value: formData.attendingId,
    onChange: e => {
      const attendingId = e.target.value;
      const attending = attendings.find(a => a.id === attendingId);
      const dayOfWeek = new Date(date).getDay();
      const session = attending?.clinicSchedule?.find(s => s.dayOfWeek === dayOfWeek && s.timeSlot === timeSlot);
      setFormData({
        ...formData,
        attendingId,
        siteId: session?.siteId || '',
        rotationId: getResidentRotation(formData.residentId)?.id || ''
      });
    },
    className: "w-full px-3 py-2 border rounded-lg",
    required: true
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Select Attending"), availableAttendings.map(a => {
    const dayOfWeek = new Date(date).getDay();
    const session = a.clinicSchedule?.find(s => s.dayOfWeek === dayOfWeek && s.timeSlot === timeSlot);
    const site = sites.find(s => s.id === session?.siteId);
    return /*#__PURE__*/React.createElement("option", {
      key: a.id,
      value: a.id
    }, a.name, " ", site && `(${site.name})`);
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Type"), /*#__PURE__*/React.createElement("select", {
    value: formData.type,
    onChange: e => setFormData({
      ...formData,
      type: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg"
  }, /*#__PURE__*/React.createElement("option", {
    value: "clinical"
  }, "Clinical"), /*#__PURE__*/React.createElement("option", {
    value: "continuity"
  }, "Continuity"))), conflicts.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, conflicts.map((conflict, index) => /*#__PURE__*/React.createElement("div", {
    key: index,
    className: `p-3 rounded-lg border-l-4 ${conflict.severity === 'error' ? 'bg-red-50 border-red-500 text-red-800' : conflict.severity === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' : 'bg-blue-50 border-blue-500 text-blue-800'}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: conflict.severity === 'error' ? 'alert-circle' : conflict.severity === 'warning' ? 'alert-triangle' : 'info',
    size: 16,
    className: "mt-0.5 flex-shrink-0"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-medium"
  }, conflict.message), conflict.type === 'vacation' && conflict.vacationDates && /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-1 opacity-75"
  }, "Vacation: ", conflict.vacationDates.start.toLocaleDateString(), " - ", conflict.vacationDates.end.toLocaleDateString())))))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-3"
  }, /*#__PURE__*/React.createElement(Button, {
    type: "button",
    variant: "secondary",
    onClick: onCancel
  }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
    type: "submit"
  }, "Save")));
};

// ==================== Attendings List Component ====================
const AttendingsList = ({
  navigateToSchedule
}) => {
  const {
    firebaseService
  } = useApp();
  const [attendings, setAttendings] = useState([]);
  const [editingAttending, setEditingAttending] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!firebaseService.currentInstitution) return;
    const unsubscribe = firebaseService.listenToAttendings(data => {
      setAttendings(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [firebaseService.currentInstitution]);
  const handleSave = async attendingData => {
    if (attendingData.id) {
      await firebaseService.updateAttending(attendingData.id, attendingData);
      toast.success('Attending updated');
    } else {
      await firebaseService.addAttending(attendingData);
      toast.success('Attending added');
    }
    setEditingAttending(null);
  };
  const handleDelete = async id => {
    if (!confirm('Delete this attending?')) return;
    await firebaseService.deleteAttending(id);
    toast.success('Attending deleted');
  };
  if (loading) {
    return /*#__PURE__*/React.createElement(LoadingSpinner, {
      size: "lg",
      className: "py-12"
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-gray-900"
  }, "Attendings"), /*#__PURE__*/React.createElement("p", {
    className: "text-gray-600"
  }, "Manage attending physicians")), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => {
      const csv = ExportUtils.attendingsToCSV(attendings);
      const filename = ExportUtils.generateFilename('attendings', 'csv');
      ExportUtils.downloadFile(csv, filename);
      toast.success('Attendings exported successfully');
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 16,
    className: "mr-2"
  }), "Export"), /*#__PURE__*/React.createElement(Button, {
    onClick: () => setEditingAttending({})
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 16,
    className: "mr-2"
  }), "Add Attending"))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "border-b"
  }, /*#__PURE__*/React.createElement("th", {
    className: "text-left py-3 px-4"
  }, "Name"), /*#__PURE__*/React.createElement("th", {
    className: "text-left py-3 px-4"
  }, "Clinic Sessions"), /*#__PURE__*/React.createElement("th", {
    className: "text-left py-3 px-4"
  }, "Total Capacity"), /*#__PURE__*/React.createElement("th", {
    className: "text-left py-3 px-4"
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, attendings.map(attending => {
    const sessionCount = attending.clinicSchedule?.length || 0;
    const totalCapacity = attending.clinicSchedule?.reduce((sum, s) => sum + (s.maxResidents || 0), 0) || 0;
    return /*#__PURE__*/React.createElement("tr", {
      key: attending.id,
      className: "border-b hover:bg-gray-50"
    }, /*#__PURE__*/React.createElement("td", {
      className: "py-3 px-4"
    }, attending.name), /*#__PURE__*/React.createElement("td", {
      className: "py-3 px-4"
    }, sessionCount, " sessions/week"), /*#__PURE__*/React.createElement("td", {
      className: "py-3 px-4"
    }, totalCapacity, " residents"), /*#__PURE__*/React.createElement("td", {
      className: "py-3 px-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => navigateToSchedule('attending', attending.id),
      className: "text-blue-600 hover:text-blue-700",
      title: "View Schedule"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "calendar",
      size: 16
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => setEditingAttending(attending),
      className: "text-primary-600 hover:text-primary-700",
      title: "Edit"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "pencil",
      size: 16
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => handleDelete(attending.id),
      className: "text-red-600 hover:text-red-700",
      title: "Delete"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "trash",
      size: 16
    })))));
  }))))), editingAttending && /*#__PURE__*/React.createElement(Modal, {
    isOpen: true,
    onClose: () => setEditingAttending(null),
    title: editingAttending.id ? 'Edit Attending' : 'Add Attending'
  }, /*#__PURE__*/React.createElement(AttendingForm, {
    attending: editingAttending,
    onSave: handleSave,
    onCancel: () => setEditingAttending(null)
  })));
};

// Attending Form Component
const AttendingForm = ({
  attending,
  onSave,
  onCancel
}) => {
  const {
    institution
  } = useApp();
  const sites = institution?.settings?.sites || [];
  const rotations = institution?.settings?.rotations || [];
  const [formData, setFormData] = useState({
    name: attending.name || '',
    clinicSchedule: attending.clinicSchedule || [],
    rotationIds: attending.rotationIds || [],
    ...attending
  });
  const daysOfWeek = [{
    id: 0,
    name: 'Sunday',
    short: 'Sun'
  }, {
    id: 1,
    name: 'Monday',
    short: 'Mon'
  }, {
    id: 2,
    name: 'Tuesday',
    short: 'Tue'
  }, {
    id: 3,
    name: 'Wednesday',
    short: 'Wed'
  }, {
    id: 4,
    name: 'Thursday',
    short: 'Thu'
  }, {
    id: 5,
    name: 'Friday',
    short: 'Fri'
  }, {
    id: 6,
    name: 'Saturday',
    short: 'Sat'
  }];
  const timeSlots = ['AM', 'PM'];
  const toggleClinicSession = (siteId, dayOfWeek, timeSlot) => {
    const scheduleIndex = formData.clinicSchedule.findIndex(s => s.siteId === siteId && s.dayOfWeek === dayOfWeek && s.timeSlot === timeSlot);
    if (scheduleIndex >= 0) {
      // Remove session
      setFormData({
        ...formData,
        clinicSchedule: formData.clinicSchedule.filter((_, i) => i !== scheduleIndex)
      });
    } else {
      // Add session
      setFormData({
        ...formData,
        clinicSchedule: [...formData.clinicSchedule, {
          siteId,
          dayOfWeek,
          timeSlot,
          maxResidents: 2
        }]
      });
    }
  };
  const updateSessionResidents = (siteId, dayOfWeek, timeSlot, maxResidents) => {
    setFormData({
      ...formData,
      clinicSchedule: formData.clinicSchedule.map(session => session.siteId === siteId && session.dayOfWeek === dayOfWeek && session.timeSlot === timeSlot ? {
        ...session,
        maxResidents: parseInt(maxResidents) || 1
      } : session)
    });
  };
  const getSession = (siteId, dayOfWeek, timeSlot) => {
    return formData.clinicSchedule.find(s => s.siteId === siteId && s.dayOfWeek === dayOfWeek && s.timeSlot === timeSlot);
  };
  return /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onSave(formData);
    },
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.name,
    onChange: e => setFormData({
      ...formData,
      name: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg",
    required: true
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Supported Rotations"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-500 mb-2"
  }, "Select rotations this attending supports"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3"
  }, rotations.map(rotation => /*#__PURE__*/React.createElement("label", {
    key: rotation.id,
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: formData.rotationIds?.includes(rotation.id),
    onChange: e => {
      if (e.target.checked) {
        setFormData({
          ...formData,
          rotationIds: [...(formData.rotationIds || []), rotation.id]
        });
      } else {
        setFormData({
          ...formData,
          rotationIds: formData.rotationIds?.filter(id => id !== rotation.id) || []
        });
      }
    },
    className: "rounded"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm"
  }, rotation.name, " (", rotation.code, ")", rotation.isMultiSite && /*#__PURE__*/React.createElement("span", {
    className: "ml-1 text-xs text-gray-500"
  }, "[Multi-site]")))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Clinic Schedule"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-500 mb-3"
  }, "Click cells to add/remove clinic sessions. Enter resident capacity for each session."), sites.map(site => /*#__PURE__*/React.createElement("div", {
    key: site.id,
    className: "mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-3 h-3 rounded-full",
    style: {
      backgroundColor: site.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-sm"
  }, site.name)), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "min-w-full border-collapse"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "w-16"
  }), daysOfWeek.map(day => /*#__PURE__*/React.createElement("th", {
    key: day.id,
    className: "text-xs font-medium text-gray-600 p-1"
  }, day.short)))), /*#__PURE__*/React.createElement("tbody", null, timeSlots.map(timeSlot => /*#__PURE__*/React.createElement("tr", {
    key: timeSlot
  }, /*#__PURE__*/React.createElement("td", {
    className: "text-xs font-medium text-gray-600 p-1"
  }, timeSlot), daysOfWeek.map(day => {
    const session = getSession(site.id, day.id, timeSlot);
    const isWeekend = day.id === 0 || day.id === 6;
    return /*#__PURE__*/React.createElement("td", {
      key: `${day.id}-${timeSlot}`,
      className: "p-1"
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => toggleClinicSession(site.id, day.id, timeSlot),
      className: `border rounded cursor-pointer transition-colors ${session ? 'bg-primary-100 border-primary-300' : isWeekend ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 hover:bg-gray-50'} p-1`
    }, session && /*#__PURE__*/React.createElement("input", {
      type: "number",
      value: session.maxResidents,
      onChange: e => {
        e.stopPropagation();
        updateSessionResidents(site.id, day.id, timeSlot, e.target.value);
      },
      onClick: e => e.stopPropagation(),
      className: "w-full text-center text-xs p-0 border-0 bg-transparent",
      min: "1",
      max: "9"
    })));
  }))))))))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-3"
  }, /*#__PURE__*/React.createElement(Button, {
    type: "button",
    variant: "secondary",
    onClick: onCancel
  }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
    type: "submit"
  }, "Save")));
};

// ==================== Residents List Component ====================
const ResidentsList = ({
  navigateToSchedule
}) => {
  const {
    firebaseService
  } = useApp();
  const [residents, setResidents] = useState([]);
  const [editingResident, setEditingResident] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!firebaseService.currentInstitution) return;
    const unsubscribe = firebaseService.listenToResidents(data => {
      setResidents(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [firebaseService.currentInstitution]);
  const handleSave = async residentData => {
    if (residentData.id) {
      await firebaseService.updateResident(residentData.id, residentData);
      toast.success('Resident updated');
    } else {
      await firebaseService.addResident(residentData);
      toast.success('Resident added');
    }
    setEditingResident(null);
  };
  const handleDelete = async id => {
    if (!confirm('Delete this resident?')) return;
    await firebaseService.deleteResident(id);
    toast.success('Resident deleted');
  };
  if (loading) {
    return /*#__PURE__*/React.createElement(LoadingSpinner, {
      size: "lg",
      className: "py-12"
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-gray-900"
  }, "Residents"), /*#__PURE__*/React.createElement("p", {
    className: "text-gray-600"
  }, "Manage resident physicians")), /*#__PURE__*/React.createElement(Button, {
    onClick: () => setEditingResident({})
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 16,
    className: "mr-2"
  }), "Add Resident")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "border-b"
  }, /*#__PURE__*/React.createElement("th", {
    className: "text-left py-3 px-4"
  }, "Name"), /*#__PURE__*/React.createElement("th", {
    className: "text-left py-3 px-4"
  }, "Year"), /*#__PURE__*/React.createElement("th", {
    className: "text-left py-3 px-4"
  }, "Continuity Day"), /*#__PURE__*/React.createElement("th", {
    className: "text-left py-3 px-4"
  }, "Continuity Time"), /*#__PURE__*/React.createElement("th", {
    className: "text-left py-3 px-4"
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, residents.map(resident => /*#__PURE__*/React.createElement("tr", {
    key: resident.id,
    className: "border-b hover:bg-gray-50"
  }, /*#__PURE__*/React.createElement("td", {
    className: "py-3 px-4"
  }, resident.name), /*#__PURE__*/React.createElement("td", {
    className: "py-3 px-4"
  }, resident.pgyStatus || `PGY-${resident.year || 1}`), /*#__PURE__*/React.createElement("td", {
    className: "py-3 px-4"
  }, resident.continuityDay || '-'), /*#__PURE__*/React.createElement("td", {
    className: "py-3 px-4"
  }, resident.continuityTime || '-'), /*#__PURE__*/React.createElement("td", {
    className: "py-3 px-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => navigateToSchedule('resident', resident.id),
    className: "text-blue-600 hover:text-blue-700",
    title: "View Schedule"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    size: 16
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditingResident(resident),
    className: "text-primary-600 hover:text-primary-700",
    title: "Edit"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pencil",
    size: 16
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleDelete(resident.id),
    className: "text-red-600 hover:text-red-700",
    title: "Delete"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 16
  })))))))))), editingResident && /*#__PURE__*/React.createElement(Modal, {
    isOpen: true,
    onClose: () => setEditingResident(null),
    title: editingResident.id ? 'Edit Resident' : 'Add Resident'
  }, /*#__PURE__*/React.createElement(ResidentForm, {
    resident: editingResident,
    onSave: handleSave,
    onCancel: () => setEditingResident(null)
  })));
};

// Resident Form Component
const ResidentForm = ({
  resident,
  onSave,
  onCancel
}) => {
  const {
    institution
  } = useApp();
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
  const getMonthName = monthStr => {
    if (!monthStr) return '';
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
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
  const getRotationForMonth = month => {
    return formData.rotationAssignments.find(ra => ra.month === month);
  };
  const setRotationForMonth = (month, rotationId, primarySiteId) => {
    const existing = formData.rotationAssignments.filter(ra => ra.month !== month);
    if (rotationId) {
      setFormData({
        ...formData,
        rotationAssignments: [...existing, {
          month,
          rotationId,
          primarySiteId
        }]
      });
    } else {
      setFormData({
        ...formData,
        rotationAssignments: existing
      });
    }
  };
  return /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onSave(formData);
    },
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.name,
    onChange: e => setFormData({
      ...formData,
      name: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg",
    required: true
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "PGY Status"), /*#__PURE__*/React.createElement("select", {
    value: formData.pgyStatus,
    onChange: e => setFormData({
      ...formData,
      pgyStatus: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg",
    required: true
  }, /*#__PURE__*/React.createElement("option", {
    value: "PGY-1"
  }, "PGY-1"), /*#__PURE__*/React.createElement("option", {
    value: "PGY-2"
  }, "PGY-2"), /*#__PURE__*/React.createElement("option", {
    value: "PGY-3"
  }, "PGY-3"), /*#__PURE__*/React.createElement("option", {
    value: "PGY-4"
  }, "PGY-4"), /*#__PURE__*/React.createElement("option", {
    value: "PGY-5+"
  }, "PGY-5+"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Rotation Assignments"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-500 mb-2"
  }, "Assign rotations for each month"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 max-h-60 overflow-y-auto"
  }, getCurrentAndFutureMonths().map(month => {
    const assignment = getRotationForMonth(month);
    return /*#__PURE__*/React.createElement("div", {
      key: month,
      className: "flex items-center gap-2 p-2 border rounded"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-32 text-sm font-medium"
    }, getMonthName(month)), /*#__PURE__*/React.createElement("select", {
      value: assignment?.rotationId || '',
      onChange: e => {
        const rotation = rotations.find(r => r.id === e.target.value);
        const primarySite = rotation?.isMultiSite ? null : rotation?.siteIds?.[0] || sites[0]?.id;
        setRotationForMonth(month, e.target.value, primarySite);
      },
      className: "flex-1 px-2 py-1 border rounded text-sm"
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "No Rotation"), rotations.map(r => /*#__PURE__*/React.createElement("option", {
      key: r.id,
      value: r.id
    }, r.name, r.isMultiSite && ' [Multi-site]'))), assignment && (() => {
      const rotation = rotations.find(r => r.id === assignment.rotationId);
      return !rotation?.isMultiSite && /*#__PURE__*/React.createElement("select", {
        value: assignment.primarySiteId || '',
        onChange: e => setRotationForMonth(month, assignment.rotationId, e.target.value),
        className: "w-32 px-2 py-1 border rounded text-sm"
      }, /*#__PURE__*/React.createElement("option", {
        value: ""
      }, "Select Site"), sites.filter(s => rotation?.siteIds?.includes(s.id)).map(s => /*#__PURE__*/React.createElement("option", {
        key: s.id,
        value: s.id
      }, s.name)));
    })());
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Continuity Clinic"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("select", {
    value: formData.continuitySiteId,
    onChange: e => setFormData({
      ...formData,
      continuitySiteId: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "No Continuity Site"), sites.map(site => /*#__PURE__*/React.createElement("option", {
    key: site.id,
    value: site.id
  }, site.name, " (", site.code, ")"))), formData.continuitySiteId && /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2"
  }, /*#__PURE__*/React.createElement("select", {
    value: formData.continuityDay,
    onChange: e => setFormData({
      ...formData,
      continuityDay: e.target.value
    }),
    className: "px-3 py-2 border rounded-lg"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Select Day"), /*#__PURE__*/React.createElement("option", {
    value: "monday"
  }, "Monday"), /*#__PURE__*/React.createElement("option", {
    value: "tuesday"
  }, "Tuesday"), /*#__PURE__*/React.createElement("option", {
    value: "wednesday"
  }, "Wednesday"), /*#__PURE__*/React.createElement("option", {
    value: "thursday"
  }, "Thursday"), /*#__PURE__*/React.createElement("option", {
    value: "friday"
  }, "Friday")), /*#__PURE__*/React.createElement("select", {
    value: formData.continuityTime,
    onChange: e => setFormData({
      ...formData,
      continuityTime: e.target.value
    }),
    className: "px-3 py-2 border rounded-lg"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Select Time"), /*#__PURE__*/React.createElement("option", {
    value: "AM"
  }, "AM"), /*#__PURE__*/React.createElement("option", {
    value: "PM"
  }, "PM"))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Vacation Weeks"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-500 mb-2"
  }, "Select weeks when this resident is on vacation (no continuity clinic)"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 items-center"
  }, /*#__PURE__*/React.createElement("input", {
    type: "date",
    placeholder: "Select week start date",
    className: "px-3 py-2 border rounded-lg",
    onChange: e => {
      if (e.target.value && !formData.vacationWeeks?.includes(e.target.value)) {
        setFormData({
          ...formData,
          vacationWeeks: [...(formData.vacationWeeks || []), e.target.value]
        });
        e.target.value = '';
      }
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-gray-600"
  }, "Add vacation week starting on this date")), formData.vacationWeeks?.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "space-y-1 max-h-32 overflow-y-auto border rounded-lg p-2"
  }, formData.vacationWeeks.sort().map((weekStart, idx) => {
    const startDate = new Date(weekStart);
    const endDate = new Date(weekStart);
    endDate.setDate(endDate.getDate() + 6);
    return /*#__PURE__*/React.createElement("div", {
      key: idx,
      className: "flex items-center justify-between p-1 hover:bg-gray-50 rounded"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-sm"
    }, startDate.toLocaleDateString(), " - ", endDate.toLocaleDateString()), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => {
        setFormData({
          ...formData,
          vacationWeeks: formData.vacationWeeks.filter(w => w !== weekStart)
        });
      },
      className: "text-red-600 hover:text-red-700"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "x",
      size: 14
    })));
  })))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-3"
  }, /*#__PURE__*/React.createElement(Button, {
    type: "button",
    variant: "secondary",
    onClick: onCancel
  }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
    type: "submit"
  }, "Save")));
};

// ==================== Rules List Component ====================
const RulesList = () => {
  const {
    firebaseService
  } = useApp();
  const [rules, setRules] = useState([]);
  const [editingRule, setEditingRule] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!firebaseService.currentInstitution) return;
    const unsubscribe = firebaseService.listenToRules(data => {
      setRules(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [firebaseService.currentInstitution]);
  const handleSave = async ruleData => {
    if (ruleData.id) {
      await firebaseService.updateRule(ruleData.id, ruleData);
      toast.success('Rule updated');
    } else {
      await firebaseService.addRule(ruleData);
      toast.success('Rule added');
    }
    setEditingRule(null);
  };
  const handleDelete = async id => {
    if (!confirm('Delete this rule?')) return;
    await firebaseService.deleteRule(id);
    toast.success('Rule deleted');
  };
  const handleToggleActive = async rule => {
    await firebaseService.updateRule(rule.id, {
      active: !rule.active
    });
    toast.success(`Rule ${rule.active ? 'disabled' : 'enabled'}`);
  };
  if (loading) {
    return /*#__PURE__*/React.createElement(LoadingSpinner, {
      size: "lg",
      className: "py-12"
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-gray-900"
  }, "Scheduling Rules"), /*#__PURE__*/React.createElement("p", {
    className: "text-gray-600"
  }, "Configure automatic scheduling constraints")), /*#__PURE__*/React.createElement(Button, {
    onClick: () => setEditingRule({})
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 16,
    className: "mr-2"
  }), "Add Rule")), /*#__PURE__*/React.createElement("div", {
    className: "grid gap-4"
  }, rules.map(rule => /*#__PURE__*/React.createElement(Card, {
    key: rule.id,
    className: "hover:shadow-lg transition-shadow"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-medium text-gray-900"
  }, rule.name), /*#__PURE__*/React.createElement("span", {
    className: `px-2 py-1 rounded-full text-xs ${rule.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`
  }, rule.active ? 'Active' : 'Inactive'), /*#__PURE__*/React.createElement("span", {
    className: `px-2 py-1 rounded-full text-xs ${rule.type === 'hard' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`
  }, rule.type === 'hard' ? 'Hard Rule' : 'Soft Rule')), /*#__PURE__*/React.createElement("p", {
    className: "text-gray-600 mt-2"
  }, rule.description), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-500 mt-2"
  }, "Conditions: ", rule.conditions)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => handleToggleActive(rule),
    className: "text-gray-600 hover:text-primary-600"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: rule.active ? 'toggle-right' : 'toggle-left',
    size: 20
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditingRule(rule),
    className: "text-primary-600 hover:text-primary-700"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pencil",
    size: 16
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleDelete(rule.id),
    className: "text-red-600 hover:text-red-700"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 16
  }))))))), editingRule && /*#__PURE__*/React.createElement(Modal, {
    isOpen: true,
    onClose: () => setEditingRule(null),
    title: editingRule.id ? 'Edit Rule' : 'Add Rule'
  }, /*#__PURE__*/React.createElement(RuleForm, {
    rule: editingRule,
    onSave: handleSave,
    onCancel: () => setEditingRule(null)
  })));
};

// Rule Form Component
const RuleForm = ({
  rule,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: rule.name || '',
    description: rule.description || '',
    type: rule.type || 'soft',
    conditions: rule.conditions || '',
    active: rule.active !== false,
    ...rule
  });
  return /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onSave(formData);
    },
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.name,
    onChange: e => setFormData({
      ...formData,
      name: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg",
    required: true
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Description"), /*#__PURE__*/React.createElement("textarea", {
    value: formData.description,
    onChange: e => setFormData({
      ...formData,
      description: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg",
    rows: "3",
    required: true
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Type"), /*#__PURE__*/React.createElement("select", {
    value: formData.type,
    onChange: e => setFormData({
      ...formData,
      type: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg"
  }, /*#__PURE__*/React.createElement("option", {
    value: "soft"
  }, "Soft Rule (Preference)"), /*#__PURE__*/React.createElement("option", {
    value: "hard"
  }, "Hard Rule (Constraint)"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Conditions"), /*#__PURE__*/React.createElement("textarea", {
    value: formData.conditions,
    onChange: e => setFormData({
      ...formData,
      conditions: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg",
    rows: "3",
    placeholder: "e.g., Residents must not work more than 3 days in a row",
    required: true
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: formData.active,
    onChange: e => setFormData({
      ...formData,
      active: e.target.checked
    }),
    className: "rounded"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-medium text-gray-700"
  }, "Active"))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-3"
  }, /*#__PURE__*/React.createElement(Button, {
    type: "button",
    variant: "secondary",
    onClick: onCancel
  }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
    type: "submit"
  }, "Save")));
};

// ==================== Members Management Component ====================
const MembersManagement = () => {
  const {
    firebaseService,
    institution,
    user
  } = useApp();
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
      setMembers(members.map(m => m.id === memberId ? {
        ...m,
        role: newRole
      } : m));
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
  const handleRemoveMember = async memberId => {
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
    return /*#__PURE__*/React.createElement(LoadingSpinner, {
      size: "lg",
      className: "py-12"
    });
  }
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-medium text-gray-900"
  }, "Institution Members"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-600"
  }, "Manage users who have access to this institution")), isAdmin && /*#__PURE__*/React.createElement(Button, {
    onClick: generateInviteCode
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user-plus",
    size: 16,
    className: "mr-2"
  }), "Generate Invite")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, members.map(member => /*#__PURE__*/React.createElement("div", {
    key: member.id,
    className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 bg-gradient-to-br from-medical-400 to-medical-600 rounded-full flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user",
    size: 18,
    className: "text-white"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-medium text-gray-900"
  }, member.name || member.email), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-gray-500"
  }, member.email))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("select", {
    value: member.role,
    onChange: e => handleRoleChange(member.id, e.target.value),
    disabled: !isAdmin || member.userId === user.uid,
    className: "px-3 py-1 border rounded-lg text-sm"
  }, /*#__PURE__*/React.createElement("option", {
    value: "member"
  }, "Member"), /*#__PURE__*/React.createElement("option", {
    value: "scheduler"
  }, "Scheduler"), /*#__PURE__*/React.createElement("option", {
    value: "admin"
  }, "Admin")), isAdmin && member.userId !== user.uid && /*#__PURE__*/React.createElement("button", {
    onClick: () => handleRemoveMember(member.id),
    className: "text-red-600 hover:text-red-700"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 16
  })))))), showInviteModal && /*#__PURE__*/React.createElement(Modal, {
    isOpen: true,
    onClose: () => setShowInviteModal(false),
    title: "Invitation Code Generated"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-gray-600"
  }, "Share this code with the person you want to invite. They can use it to join the institution."), /*#__PURE__*/React.createElement("div", {
    className: "p-4 bg-gray-100 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-500 mb-2"
  }, "Invitation Code"), /*#__PURE__*/React.createElement("p", {
    className: "text-2xl font-mono font-bold text-gray-900"
  }, inviteCode))), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-500"
  }, "This code will expire in 7 days."), /*#__PURE__*/React.createElement(Button, {
    onClick: () => {
      navigator.clipboard.writeText(inviteCode);
      toast.success('Code copied to clipboard');
    },
    className: "w-full"
  }, "Copy Code"))));
};

// ==================== Backup & Restore Component ====================
const BackupRestore = () => {
  const {
    firebaseService,
    attendings,
    residents,
    assignments,
    institution
  } = useApp();
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
          const errorMessage = `Validation errors:\n${result.validationErrors.slice(0, 5).join('\n')}${result.validationErrors.length > 5 ? `\n...and ${result.validationErrors.length - 5} more errors` : ''}`;
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
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-medium text-gray-900 mb-4"
  }, "Backup & Restore"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "font-medium text-gray-900"
  }, "Export Data"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-600"
  }, "Create a backup of your institution data"), /*#__PURE__*/React.createElement("select", {
    value: exportType,
    onChange: e => setExportType(e.target.value),
    className: "w-full px-3 py-2 border rounded-lg"
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All Data"), /*#__PURE__*/React.createElement("option", {
    value: "institution"
  }, "Institution Settings Only"), /*#__PURE__*/React.createElement("option", {
    value: "attendings"
  }, "Attendings Only"), /*#__PURE__*/React.createElement("option", {
    value: "residents"
  }, "Residents Only"), /*#__PURE__*/React.createElement("option", {
    value: "assignments"
  }, "Assignments Only")), /*#__PURE__*/React.createElement(Button, {
    onClick: handleExport,
    className: "w-full"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 16,
    className: "mr-2"
  }), "Export ", exportType === 'all' ? 'All Data' : exportType)), /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "font-medium text-gray-900"
  }, "Import Data"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-600"
  }, "Restore data from a backup file"), /*#__PURE__*/React.createElement("div", {
    className: "p-4 bg-yellow-50 rounded-lg border border-yellow-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "alert-triangle",
    size: 16,
    className: "text-yellow-600 mt-0.5"
  }), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-yellow-800"
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-medium"
  }, "Warning"), /*#__PURE__*/React.createElement("p", null, "Importing will add data to your existing records. Duplicate entries may be created.")))), /*#__PURE__*/React.createElement(Button, {
    onClick: handleImport,
    disabled: importing,
    variant: "secondary",
    className: "w-full"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "upload",
    size: 16,
    className: "mr-2"
  }), importing ? 'Importing...' : 'Import from File'))), /*#__PURE__*/React.createElement("div", {
    className: "mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 16,
    className: "text-blue-600 mt-0.5"
  }), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-blue-800"
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-medium"
  }, "Backup Best Practices"), /*#__PURE__*/React.createElement("ul", {
    className: "list-disc list-inside mt-1 space-y-1"
  }, /*#__PURE__*/React.createElement("li", null, "Export your data regularly"), /*#__PURE__*/React.createElement("li", null, "Store backups in a secure location"), /*#__PURE__*/React.createElement("li", null, "Test restore functionality periodically"), /*#__PURE__*/React.createElement("li", null, "Keep multiple versions of backups"))))));
};

// ==================== Settings View Component ====================
const SettingsView = () => {
  const {
    firebaseService,
    institution
  } = useApp();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    institutionName: institution?.name || '',
    timezone: institution?.settings?.timezone || 'America/New_York',
    workDays: institution?.settings?.workDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    autoScheduleEnabled: institution?.settings?.autoScheduleEnabled !== false,
    notificationsEnabled: institution?.settings?.notificationsEnabled !== false,
    sites: institution?.settings?.sites || [{
      id: 'site_1',
      name: 'Main Clinic',
      code: 'MAIN',
      color: '#10b981',
      address: ''
    }],
    rotations: institution?.settings?.rotations || [{
      id: 'rot_1',
      name: 'General',
      code: 'GEN',
      siteIds: ['site_1'],
      isMultiSite: false,
      requirements: {}
    }],
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
  const tabs = [{
    id: 'general',
    name: 'General',
    icon: 'settings'
  }, {
    id: 'sites',
    name: 'Sites',
    icon: 'map-pin'
  }, {
    id: 'rotations',
    name: 'Rotations',
    icon: 'repeat'
  }, {
    id: 'protected',
    name: 'Protected Times',
    icon: 'shield'
  }, {
    id: 'schedule',
    name: 'Schedule',
    icon: 'calendar'
  }, {
    id: 'members',
    name: 'Members',
    icon: 'users'
  }, {
    id: 'backup',
    name: 'Backup',
    icon: 'database'
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-gray-900"
  }, "Settings"), /*#__PURE__*/React.createElement("p", {
    className: "text-gray-600"
  }, "Configure institution preferences")), /*#__PURE__*/React.createElement("div", {
    className: "border-b border-gray-200"
  }, /*#__PURE__*/React.createElement("nav", {
    className: "-mb-px flex space-x-8"
  }, tabs.map(tab => /*#__PURE__*/React.createElement("button", {
    key: tab.id,
    onClick: () => setActiveTab(tab.id),
    className: `py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: tab.icon,
    size: 16
  }), tab.name)))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, activeTab === 'general' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-medium text-gray-900 mb-4"
  }, "Institution Settings"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Institution Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: settings.institutionName,
    onChange: e => setSettings({
      ...settings,
      institutionName: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Timezone"), /*#__PURE__*/React.createElement("select", {
    value: settings.timezone,
    onChange: e => setSettings({
      ...settings,
      timezone: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg"
  }, /*#__PURE__*/React.createElement("option", {
    value: "America/New_York"
  }, "Eastern Time"), /*#__PURE__*/React.createElement("option", {
    value: "America/Chicago"
  }, "Central Time"), /*#__PURE__*/React.createElement("option", {
    value: "America/Denver"
  }, "Mountain Time"), /*#__PURE__*/React.createElement("option", {
    value: "America/Los_Angeles"
  }, "Pacific Time"))))), activeTab === 'sites' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-medium text-gray-900"
  }, "Clinical Sites"), /*#__PURE__*/React.createElement(Button, {
    onClick: () => setEditingSite({}),
    size: "sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 16,
    className: "mr-1"
  }), "Add Site")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, settings.sites.map(site => /*#__PURE__*/React.createElement("div", {
    key: site.id,
    className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-3 h-3 rounded-full",
    style: {
      backgroundColor: site.color
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-medium"
  }, site.name, " (", site.code, ")"), site.address && /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-gray-500"
  }, site.address))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditingSite(site),
    className: "text-blue-600 hover:text-blue-700"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pencil",
    size: 16
  })), settings.sites.length > 1 && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSettings({
        ...settings,
        sites: settings.sites.filter(s => s.id !== site.id)
      });
    },
    className: "text-red-600 hover:text-red-700"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash-2",
    size: 16
  }))))))), activeTab === 'rotations' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-medium text-gray-900"
  }, "Rotation Types"), /*#__PURE__*/React.createElement(Button, {
    onClick: () => setEditingRotation({}),
    size: "sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 16,
    className: "mr-1"
  }), "Add Rotation")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, settings.rotations.map(rotation => /*#__PURE__*/React.createElement("div", {
    key: rotation.id,
    className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-medium"
  }, rotation.name, " (", rotation.code, ")"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-gray-500"
  }, rotation.isMultiSite ? 'Multi-site' : 'Single site', " \u2022", rotation.siteIds?.length || 0, " site(s)")), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditingRotation(rotation),
    className: "text-blue-600 hover:text-blue-700"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pencil",
    size: 16
  })), settings.rotations.length > 1 && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSettings({
        ...settings,
        rotations: settings.rotations.filter(r => r.id !== rotation.id)
      });
    },
    className: "text-red-600 hover:text-red-700"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash-2",
    size: 16
  }))))))), activeTab === 'protected' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-medium text-gray-900"
  }, "Protected Times"), /*#__PURE__*/React.createElement(Button, {
    onClick: () => setEditingProtectedTime({}),
    size: "sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 16,
    className: "mr-1"
  }), "Add Protected Time")), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-600 mb-4"
  }, "Define recurring weekly events like Didactics, Grand Rounds, or protected educational time."), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, settings.protectedTimes.map(pt => /*#__PURE__*/React.createElement("div", {
    key: pt.id,
    className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-medium"
  }, pt.name), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-gray-500"
  }, ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pt.dayOfWeek], " ", pt.timeSlot, pt.appliesTo && pt.appliesTo !== 'all' && ` • ${pt.appliesTo.toUpperCase()}`, pt.mandatory && ' • Mandatory')), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditingProtectedTime(pt),
    className: "text-blue-600 hover:text-blue-700"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pencil",
    size: 16
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSettings({
        ...settings,
        protectedTimes: settings.protectedTimes.filter(p => p.id !== pt.id)
      });
    },
    className: "text-red-600 hover:text-red-700"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash-2",
    size: 16
  }))))), settings.protectedTimes.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "text-center py-8 text-gray-500"
  }, "No protected times defined. Click \"Add Protected Time\" to create one."))), activeTab === 'schedule' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-medium text-gray-900 mb-4"
  }, "Schedule Preferences"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Work Days"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => /*#__PURE__*/React.createElement("label", {
    key: day,
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: settings.workDays.includes(day),
    onChange: e => {
      if (e.target.checked) {
        setSettings({
          ...settings,
          workDays: [...settings.workDays, day]
        });
      } else {
        setSettings({
          ...settings,
          workDays: settings.workDays.filter(d => d !== day)
        });
      }
    },
    className: "rounded"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm capitalize"
  }, day))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: settings.autoScheduleEnabled,
    onChange: e => setSettings({
      ...settings,
      autoScheduleEnabled: e.target.checked
    }),
    className: "rounded"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-medium text-gray-700"
  }, "Enable Auto-Scheduling"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: settings.notificationsEnabled,
    onChange: e => setSettings({
      ...settings,
      notificationsEnabled: e.target.checked
    }),
    className: "rounded"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-medium text-gray-700"
  }, "Enable Notifications"))))), activeTab === 'members' && /*#__PURE__*/React.createElement(MembersManagement, null), activeTab === 'backup' && /*#__PURE__*/React.createElement(BackupRestore, null), activeTab !== 'members' && activeTab !== 'backup' && /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end"
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: handleSave,
    disabled: saving
  }, saving ? 'Saving...' : 'Save Settings')))), editingSite && /*#__PURE__*/React.createElement(Modal, {
    isOpen: true,
    onClose: () => setEditingSite(null),
    title: editingSite.id ? 'Edit Site' : 'Add Site'
  }, /*#__PURE__*/React.createElement(SiteForm, {
    site: editingSite,
    existingSites: settings.sites,
    onSave: siteData => {
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
    },
    onCancel: () => setEditingSite(null)
  })), editingRotation && /*#__PURE__*/React.createElement(Modal, {
    isOpen: true,
    onClose: () => setEditingRotation(null),
    title: editingRotation.id ? 'Edit Rotation' : 'Add Rotation'
  }, /*#__PURE__*/React.createElement(RotationForm, {
    rotation: editingRotation,
    sites: settings.sites,
    existingRotations: settings.rotations,
    onSave: rotationData => {
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
    },
    onCancel: () => setEditingRotation(null)
  })), editingProtectedTime && /*#__PURE__*/React.createElement(Modal, {
    isOpen: true,
    onClose: () => setEditingProtectedTime(null),
    title: editingProtectedTime.id ? 'Edit Protected Time' : 'Add Protected Time'
  }, /*#__PURE__*/React.createElement(ProtectedTimeForm, {
    protectedTime: editingProtectedTime,
    sites: settings.sites,
    onSave: ptData => {
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
    },
    onCancel: () => setEditingProtectedTime(null)
  })));
};

// Site Form Component
const SiteForm = ({
  site,
  existingSites,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: site.name || '',
    code: site.code || '',
    address: site.address || '',
    color: site.color || '#10b981',
    ...site
  });
  return /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onSave(formData);
    },
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Site Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.name,
    onChange: e => setFormData({
      ...formData,
      name: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg",
    placeholder: "e.g., Main Hospital",
    required: true
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Code"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.code,
    onChange: e => setFormData({
      ...formData,
      code: e.target.value.toUpperCase()
    }),
    className: "w-full px-3 py-2 border rounded-lg",
    placeholder: "e.g., MAIN",
    maxLength: "5",
    required: true
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Address"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.address,
    onChange: e => setFormData({
      ...formData,
      address: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg",
    placeholder: "123 Medical Center Dr, City, State 12345"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Color"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: formData.color,
    onChange: e => setFormData({
      ...formData,
      color: e.target.value
    }),
    className: "h-10 w-20"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-gray-600"
  }, formData.color))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: onCancel
  }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
    type: "submit"
  }, "Save Site")));
};

// Rotation Form Component
const RotationForm = ({
  rotation,
  sites,
  existingRotations,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: rotation.name || '',
    code: rotation.code || '',
    siteIds: rotation.siteIds || [],
    isMultiSite: rotation.isMultiSite || false,
    requirements: rotation.requirements || {},
    ...rotation
  });
  return /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onSave(formData);
    },
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Rotation Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.name,
    onChange: e => setFormData({
      ...formData,
      name: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg",
    placeholder: "e.g., Pediatrics",
    required: true
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Code"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.code,
    onChange: e => setFormData({
      ...formData,
      code: e.target.value.toUpperCase()
    }),
    className: "w-full px-3 py-2 border rounded-lg",
    placeholder: "e.g., PEDS",
    maxLength: "10",
    required: true
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: formData.isMultiSite,
    onChange: e => setFormData({
      ...formData,
      isMultiSite: e.target.checked
    }),
    className: "rounded"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-medium text-gray-700"
  }, "Multi-site rotation")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-500 mt-1"
  }, "Check if residents on this rotation work at multiple sites")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Associated Sites"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, sites.map(site => /*#__PURE__*/React.createElement("label", {
    key: site.id,
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: formData.siteIds.includes(site.id),
    onChange: e => {
      if (e.target.checked) {
        setFormData({
          ...formData,
          siteIds: [...formData.siteIds, site.id]
        });
      } else {
        setFormData({
          ...formData,
          siteIds: formData.siteIds.filter(id => id !== site.id)
        });
      }
    },
    className: "rounded"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm"
  }, site.name, " (", site.code, ")"))))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: onCancel
  }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
    type: "submit"
  }, "Save Rotation")));
};

// Protected Time Form Component
const ProtectedTimeForm = ({
  protectedTime,
  sites,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: protectedTime.name || '',
    dayOfWeek: protectedTime.dayOfWeek ?? 3,
    // Default to Wednesday
    timeSlot: protectedTime.timeSlot || 'AM',
    appliesTo: protectedTime.appliesTo || 'all',
    mandatory: protectedTime.mandatory ?? true,
    eventType: protectedTime.eventType || 'didactics',
    siteId: protectedTime.siteId || '',
    ...protectedTime
  });
  const daysOfWeek = [{
    value: 0,
    label: 'Sunday'
  }, {
    value: 1,
    label: 'Monday'
  }, {
    value: 2,
    label: 'Tuesday'
  }, {
    value: 3,
    label: 'Wednesday'
  }, {
    value: 4,
    label: 'Thursday'
  }, {
    value: 5,
    label: 'Friday'
  }, {
    value: 6,
    label: 'Saturday'
  }];
  const pgyLevels = ['all', 'PGY-1', 'PGY-2', 'PGY-3', 'PGY-4', 'PGY-5+'];
  const eventTypes = [{
    value: 'didactics',
    label: 'Didactics'
  }, {
    value: 'grand-rounds',
    label: 'Grand Rounds'
  }, {
    value: 'meeting',
    label: 'Meeting'
  }, {
    value: 'protected',
    label: 'Protected Education'
  }, {
    value: 'other',
    label: 'Other'
  }];
  return /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onSave(formData);
    },
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Event Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: formData.name,
    onChange: e => setFormData({
      ...formData,
      name: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg",
    placeholder: "e.g., Weekly Didactics",
    required: true
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Event Type"), /*#__PURE__*/React.createElement("select", {
    value: formData.eventType,
    onChange: e => setFormData({
      ...formData,
      eventType: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg"
  }, eventTypes.map(type => /*#__PURE__*/React.createElement("option", {
    key: type.value,
    value: type.value
  }, type.label)))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Day of Week"), /*#__PURE__*/React.createElement("select", {
    value: formData.dayOfWeek,
    onChange: e => setFormData({
      ...formData,
      dayOfWeek: parseInt(e.target.value)
    }),
    className: "w-full px-3 py-2 border rounded-lg",
    required: true
  }, daysOfWeek.map(day => /*#__PURE__*/React.createElement("option", {
    key: day.value,
    value: day.value
  }, day.label)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Time Slot"), /*#__PURE__*/React.createElement("select", {
    value: formData.timeSlot,
    onChange: e => setFormData({
      ...formData,
      timeSlot: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg",
    required: true
  }, /*#__PURE__*/React.createElement("option", {
    value: "AM"
  }, "AM"), /*#__PURE__*/React.createElement("option", {
    value: "PM"
  }, "PM")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Applies To"), /*#__PURE__*/React.createElement("select", {
    value: formData.appliesTo,
    onChange: e => setFormData({
      ...formData,
      appliesTo: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg"
  }, pgyLevels.map(level => /*#__PURE__*/React.createElement("option", {
    key: level,
    value: level
  }, level === 'all' ? 'All Residents' : level)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Site (Optional)"), /*#__PURE__*/React.createElement("select", {
    value: formData.siteId,
    onChange: e => setFormData({
      ...formData,
      siteId: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "All Sites"), sites.map(site => /*#__PURE__*/React.createElement("option", {
    key: site.id,
    value: site.id
  }, site.name, " (", site.code, ")")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: formData.mandatory,
    onChange: e => setFormData({
      ...formData,
      mandatory: e.target.checked
    }),
    className: "rounded"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-medium text-gray-700"
  }, "Mandatory Attendance")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-500 mt-1"
  }, "If checked, residents must attend unless explicitly excused")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: onCancel
  }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
    type: "submit"
  }, "Save Protected Time")));
};

// ==================== Auto-Scheduler Component ====================
const AutoScheduler = ({
  onClose
}) => {
  const {
    firebaseService
  } = useApp();
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
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "Start Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: dateRange.start,
    onChange: e => setDateRange({
      ...dateRange,
      start: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg",
    disabled: scheduling
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-2"
  }, "End Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: dateRange.end,
    onChange: e => setDateRange({
      ...dateRange,
      end: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-lg",
    disabled: scheduling
  })), scheduling && /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-sm text-gray-600"
  }, /*#__PURE__*/React.createElement("span", null, "Scheduling in progress..."), /*#__PURE__*/React.createElement("span", null, progress, "%")), /*#__PURE__*/React.createElement("div", {
    className: "w-full bg-gray-200 rounded-full h-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-primary-600 h-2 rounded-full transition-all duration-300",
    style: {
      width: `${progress}%`
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-3"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: onClose,
    disabled: scheduling
  }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
    onClick: handleAutoSchedule,
    disabled: scheduling
  }, scheduling ? 'Scheduling...' : 'Start Auto-Schedule')));
};

// ==================== Main App Component ====================
const App = () => {
  const {
    user,
    loading,
    firebaseService
  } = useApp();
  const [activeView, setActiveView] = useState('dashboard');
  const [scheduleFilterData, setScheduleFilterData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigateToSchedule = (personType, personId) => {
    setScheduleFilterData({
      type: personType,
      id: personId
    });
    setActiveView('schedule');
  };
  const handleNavClick = viewId => {
    setActiveView(viewId);
    setMobileMenuOpen(false); // Close mobile menu on navigation
  };
  if (loading) {
    return /*#__PURE__*/React.createElement("div", {
      className: "min-h-screen flex items-center justify-center"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-center"
    }, /*#__PURE__*/React.createElement(LoadingSpinner, {
      size: "lg"
    }), /*#__PURE__*/React.createElement("p", {
      className: "mt-4 text-gray-600"
    }, "Loading...")));
  }
  if (!user) {
    return /*#__PURE__*/React.createElement(LoginPage, null);
  }
  const navItems = [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'layout-dashboard'
  }, {
    id: 'schedule',
    label: 'Schedule',
    icon: 'calendar'
  }, {
    id: 'attendings',
    label: 'Attendings',
    icon: 'users'
  }, {
    id: 'residents',
    label: 'Residents',
    icon: 'user-check'
  }, {
    id: 'rules',
    label: 'Rules',
    icon: 'shield-check'
  }, {
    id: 'settings',
    label: 'Settings',
    icon: 'settings'
  }];
  const handleSignOut = async () => {
    await firebaseService.signOut();
    toast.success('Signed out successfully');
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen font-body",
    style: {
      background: 'linear-gradient(180deg, #f0fdfa 0%, #ccfbf1 100%)'
    }
  }, /*#__PURE__*/React.createElement(motion.nav, {
    initial: {
      y: -100
    },
    animate: {
      y: 0
    },
    className: "sticky top-0 z-50 glass-card border-b border-medical-200/20 backdrop-blur-xl",
    style: {
      background: 'rgba(255, 255, 255, 0.82)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between h-20"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-gradient-to-br from-medical-400 to-medical-600 rounded-2xl shadow-lg shadow-medical-500/20"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar-days",
    size: 26,
    className: "text-white"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "text-xl font-display font-bold text-medical-900"
  }, "Clinic Scheduler"))), /*#__PURE__*/React.createElement("div", {
    className: "hidden md:flex ml-12 space-x-2"
  }, navItems.map(item => /*#__PURE__*/React.createElement(motion.button, {
    key: item.id,
    onClick: () => handleNavClick(item.id),
    whileHover: {
      scale: 1.05
    },
    whileTap: {
      scale: 0.95
    },
    className: `
                                            px-4 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all relative
                                            ${activeView === item.id ? 'bg-gradient-to-r from-medical-500 to-medical-600 text-white shadow-lg shadow-medical-500/25' : 'text-medical-700 hover:bg-medical-50 hover:text-medical-900'}
                                        `
  }, /*#__PURE__*/React.createElement(Icon, {
    name: item.icon,
    size: 16
  }), item.label, activeView === item.id && /*#__PURE__*/React.createElement(motion.div, {
    layoutId: "activeTab",
    className: "absolute inset-0 bg-gradient-to-r from-medical-500 to-medical-600 rounded-full -z-10",
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.6
    }
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setMobileMenuOpen(!mobileMenuOpen),
    className: "md:hidden p-2 rounded-lg hover:bg-medical-50 transition-colors",
    "aria-label": "Toggle menu"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: mobileMenuOpen ? "x" : "menu",
    size: 24,
    className: "text-medical-700"
  })), /*#__PURE__*/React.createElement(motion.div, {
    initial: {
      scale: 0
    },
    animate: {
      scale: 1
    },
    className: "hidden sm:flex badge-live items-center gap-2 px-4 py-2 rounded-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-2 h-2 bg-white rounded-full animate-pulse"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-white font-bold"
  }, "Live Sync")), /*#__PURE__*/React.createElement(motion.button, {
    whileHover: {
      scale: 1.05,
      rotate: 5
    },
    whileTap: {
      scale: 0.95
    },
    className: "p-3 glass-card rounded-full relative transition-all hover:shadow-lg"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bell",
    size: 20,
    className: "text-medical-700"
  }), /*#__PURE__*/React.createElement(motion.span, {
    initial: {
      scale: 0
    },
    animate: {
      scale: 1
    },
    className: "absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-white font-bold"
  }, "3"))), /*#__PURE__*/React.createElement("div", {
    className: "hidden md:flex items-center gap-3 pl-3 border-l border-medical-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-right"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-semibold text-medical-900"
  }, user.name || user.email), /*#__PURE__*/React.createElement("button", {
    onClick: handleSignOut,
    className: "text-xs text-medical-600 hover:text-medical-800 font-medium transition-colors"
  }, "Sign Out")), /*#__PURE__*/React.createElement(motion.div, {
    whileHover: {
      scale: 1.1
    },
    className: "w-10 h-10 bg-gradient-to-br from-medical-400 to-medical-600 rounded-full flex items-center justify-center shadow-lg shadow-medical-500/20"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user",
    size: 18,
    className: "text-white"
  }))))))), /*#__PURE__*/React.createElement(AnimatePresence, null, mobileMenuOpen && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(motion.div, {
    initial: {
      opacity: 0
    },
    animate: {
      opacity: 1
    },
    exit: {
      opacity: 0
    },
    onClick: () => setMobileMenuOpen(false),
    className: "md:hidden fixed inset-0 bg-black/50 z-40"
  }), /*#__PURE__*/React.createElement(motion.div, {
    initial: {
      x: '100%'
    },
    animate: {
      x: 0
    },
    exit: {
      x: '100%'
    },
    transition: {
      type: 'spring',
      damping: 30,
      stiffness: 300
    },
    className: "md:hidden fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col h-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between p-4 border-b"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold text-medical-900"
  }, "Menu"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setMobileMenuOpen(false),
    className: "p-2 hover:bg-gray-100 rounded-lg transition-colors",
    "aria-label": "Close menu"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 24,
    className: "text-gray-600"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "p-4 bg-gradient-to-br from-medical-50 to-medical-100 border-b"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 bg-gradient-to-br from-medical-400 to-medical-600 rounded-full flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user",
    size: 20,
    className: "text-white"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-semibold text-medical-900"
  }, user.name || 'User'), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-medical-600"
  }, user.email)))), /*#__PURE__*/React.createElement("nav", {
    className: "flex-1 p-4"
  }, /*#__PURE__*/React.createElement("ul", {
    className: "space-y-2"
  }, navItems.map(item => /*#__PURE__*/React.createElement("li", {
    key: item.id
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => handleNavClick(item.id),
    className: `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeView === item.id ? 'bg-gradient-to-r from-medical-500 to-medical-600 text-white shadow-lg' : 'hover:bg-medical-50 text-medical-700'}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: item.icon,
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-medium"
  }, item.label)))))), /*#__PURE__*/React.createElement("div", {
    className: "p-4 border-t"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 px-3 py-2 bg-green-100 rounded-lg mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-2 h-2 bg-green-500 rounded-full animate-pulse"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-green-700 font-medium"
  }, "Live Sync Active")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      handleSignOut();
      setMobileMenuOpen(false);
    },
    className: "w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "log-out",
    size: 20
  }), "Sign Out")))))), /*#__PURE__*/React.createElement("main", {
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative"
  }, activeView === 'dashboard' && /*#__PURE__*/React.createElement(Dashboard, null), activeView === 'schedule' && /*#__PURE__*/React.createElement(ScheduleCalendar, {
    initialFilter: scheduleFilterData,
    onNavigateToPerson: navigateToSchedule
  }), activeView === 'attendings' && /*#__PURE__*/React.createElement(AttendingsList, {
    navigateToSchedule: navigateToSchedule
  }), activeView === 'residents' && /*#__PURE__*/React.createElement(ResidentsList, {
    navigateToSchedule: navigateToSchedule
  }), activeView === 'rules' && /*#__PURE__*/React.createElement(RulesList, null), activeView === 'settings' && /*#__PURE__*/React.createElement(SettingsView, null)), /*#__PURE__*/React.createElement(Toaster, {
    position: "bottom-right",
    toastOptions: {
      className: 'font-medium',
      duration: 3000,
      style: {
        background: '#fff',
        color: '#363636'
      }
    }
  }));
};

// ==================== Root Component ====================
const Root = () => {
  return /*#__PURE__*/React.createElement(ErrorBoundary, null, /*#__PURE__*/React.createElement(ToastProvider, null, /*#__PURE__*/React.createElement(AppProvider, null, /*#__PURE__*/React.createElement(ErrorBoundary, {
    title: "Application Error",
    message: "An error occurred while loading the application. Please try refreshing the page."
  }, /*#__PURE__*/React.createElement(App, null)))));
};

// Render the app
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(Root, null));

//# sourceMappingURL=main.js.map