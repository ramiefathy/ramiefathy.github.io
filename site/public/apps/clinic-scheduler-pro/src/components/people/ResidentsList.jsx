/**
 * ResidentsList - Resident physicians management component
 */

import React, { useState, useEffect } from 'react';

// Contexts
import { useApp } from '../../contexts/AppContext';
import { toast } from '../../contexts/ToastContext';

// Components
import { Icon, Button, Card, LoadingSpinner, Modal } from '../shared';

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

export default ResidentsList;
