/**
 * Export utilities for clinic scheduler
 * CSV/JSON generation and file download helpers
 */

import { normalizeDate } from './dateUtils';
import { ValidationUtils } from './validation';

export const ExportUtils = {
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
    // Note: onError callback replaces direct toast dependency
    selectFile: (accept = '.json', onFileSelected, onError = null) => {
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
                if (onError) {
                    onError('Failed to read file');
                }
            };
            reader.readAsText(file);
        };

        input.click();
    }
};

export default ExportUtils;
