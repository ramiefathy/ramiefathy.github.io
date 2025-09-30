/**
 * AttendingsList - Attending physicians management component
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Contexts
import { useApp } from '../../contexts/AppContext';
import { toast } from '../../contexts/ToastContext';

// Components
import { Icon, Button, Card, LoadingSpinner, Modal } from '../shared';

// Utils
import { ExportUtils } from '../../utils/export';
import { generateId, normalizeAttendingRecord } from '../../utils/helpers';

// Constants
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

export default AttendingsList;
