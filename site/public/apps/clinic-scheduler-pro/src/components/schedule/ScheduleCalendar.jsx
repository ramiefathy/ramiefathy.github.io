/**
 * ScheduleCalendar - Main schedule calendar component with related helpers
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';

// Contexts
import { useApp } from '../../contexts/AppContext';
import { toast } from '../../contexts/ToastContext';

// Components
import { Icon, Button, Card, LoadingSpinner, Modal } from '../shared';
import AutoScheduler from './AutoScheduler';

// Utils
import { ExportUtils } from '../../utils/export';
import { generateId, normalizeAttendingRecord } from '../../utils/helpers';
import { ConflictDetection } from '../../utils/conflictDetection';
import {
    normalizeDate,
    getStartOfWeekSunday,
    getEndOfWeekSaturday,
    getStartOfMonthDate,
    getEndOfMonthDate
} from '../../utils/dateUtils';

// Constants
const TIME_SLOTS = ['AM', 'PM'];

// ==================== Assignment Form Component ====================
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

// ==================== Attending Schedule Adjuster Component ====================
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
        return day === 0 || day === 6;
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

        setDeletingIds(prev => new Set(prev).add(assignmentId));

        try {
            await firebaseService.deleteAssignment(assignmentId);
            toast.success('Assignment deleted');
        } catch (error) {
            console.error('Error deleting assignment:', error);
            toast.error('Failed to delete assignment');
        } finally {
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
                                const errorMessages = conflictCheck.conflicts
                                    .filter(c => c.severity === 'error')
                                    .map(c => c.message)
                                    .join('\n');

                                if (!confirm(`Conflicts detected:\n\n${errorMessages}\n\nDo you want to override and continue?`)) {
                                    return;
                                }
                            } else if (conflictCheck.hasWarnings) {
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

export default ScheduleCalendar;
