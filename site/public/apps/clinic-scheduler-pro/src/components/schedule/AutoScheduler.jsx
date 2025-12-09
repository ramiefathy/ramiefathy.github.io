/**
 * AutoScheduler - Automatic schedule generation component
 */

import React, { useState, useEffect } from 'react';

// Contexts
import { useApp } from '../../contexts/AppContext';
import { toast } from '../../contexts/ToastContext';

// Components
import { Button, Icon } from '../shared';

// Utils
import { Scheduler } from '../../utils/scheduler';

const AutoScheduler = ({ onClose }) => {
    const { firebaseService, institution } = useApp();
    const [dateRange, setDateRange] = useState(() => {
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const endNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        return {
            start: nextMonth.toISOString().split('T')[0],
            end: endNextMonth.toISOString().split('T')[0]
        };
    });
    const [scheduling, setScheduling] = useState(false);
    const [progress, setProgress] = useState(0);
    const [previewMode, setPreviewMode] = useState(false);
    const [generatedAssignments, setGeneratedAssignments] = useState([]);
    const [schedulerResult, setSchedulerResult] = useState({ additions: [], deletions: [] });
    const [stats, setStats] = useState(null);
    const [includeWeekends, setIncludeWeekends] = useState(false);
    const [notes, setNotes] = useState([]);

    // Data for scheduler
    const [residents, setResidents] = useState([]);
    const [attendings, setAttendings] = useState([]);
    const [existingAssignments, setExistingAssignments] = useState([]);

    useEffect(() => {
        if (!firebaseService.currentInstitution) return;
        const residentsUnsub = firebaseService.listenToResidents(setResidents);
        const attendingsUnsub = firebaseService.listenToAttendings(setAttendings);
        const assignmentsUnsub = firebaseService.listenToAssignments(setExistingAssignments);
        return () => {
            residentsUnsub?.();
            attendingsUnsub?.();
            assignmentsUnsub?.();
        };
    }, [firebaseService]);

    const handleAutoSchedule = async () => {
        setScheduling(true);
        setProgress(10);

        try {
            // Run client-side scheduler
            setProgress(30);

            // Artificial delay for UX
            await new Promise(resolve => setTimeout(resolve, 500));

            const result = Scheduler.generateSchedule({
                residents,
                attendings,
                existingAssignments,
                startDate: dateRange.start,
                endDate: dateRange.end,
                institution,
                rotations: institution?.settings?.rotations || [],
                options: {
                    includeWeekends: includeWeekends
                }
            });

            setProgress(90);
            setGeneratedAssignments(result.additions);
            setSchedulerResult(result);
            setStats({
                adds: result.additions.length,
                deletes: result.deletions.length,
                residentsUsed: new Set(result.additions.map(a => a.residentId)).size
            });
            setNotes(result.notes || []);
            setPreviewMode(true);
            setScheduling(false);
            setProgress(100);

        } catch (error) {
            console.error('Auto-scheduling error:', error);
            toast.error(error.message || 'Failed to auto-schedule');
            setScheduling(false);
            setProgress(0);
        }
    };

    const applySchedule = async () => {
        setScheduling(true);
        try {
            // Delete dropped unlocked assignments first
            for (const id of schedulerResult.deletions) {
                await firebaseService.deleteAssignment(id);
            }
            await firebaseService.batchAddAssignments(generatedAssignments);
            toast.success(`Applied ${generatedAssignments.length} adds, removed ${schedulerResult.deletions.length} old assignments.`);
            onClose();
        } catch (error) {
            console.error('Error applying schedule:', error);
            toast.error('Failed to save assignments');
        } finally {
            setScheduling(false);
        }
    };

    if (previewMode) {
        return (
            <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-1">
                    <h3 className="font-medium text-green-800 mb-1">Preview changes</h3>
                    <p className="text-sm text-gray-700">Adds: <span className="font-semibold">{stats?.adds}</span> · Removes: <span className="font-semibold">{stats?.deletes}</span> · Residents touched: <span className="font-semibold">{stats?.residentsUsed}</span></p>
                    <p className="text-xs text-gray-500">Locked assignments stay untouched; unlocked ones may be replaced.</p>
                    {notes.length > 0 && (
                        <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                            {notes.map((n, i) => (
                                <li key={i}>{n}</li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-3 py-2 text-left">Date</th>
                                <th className="px-3 py-2 text-left">Resident</th>
                                <th className="px-3 py-2 text-left">Clinic</th>
                            </tr>
                        </thead>
                        <tbody>
                            {generatedAssignments.map((a, i) => (
                                <tr key={i} className="border-t hover:bg-gray-50">
                                    <td className="px-3 py-2">
                                        {new Date(a.date).toLocaleDateString()} ({a.timeSlot})
                                    </td>
                                    <td className="px-3 py-2">{a.residentName}</td>
                                    <td className="px-3 py-2">{a.clinicName}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => setPreviewMode(false)}>
                        Back
                    </Button>
                    <Button onClick={applySchedule} disabled={scheduling}>
                        {scheduling ? 'Saving...' : 'Apply Schedule'}
                    </Button>
                </div>
            </div>
        );
    }

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
                        <span>Generating schedule...</span>
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

            <div className="flex items-center justify-between gap-3">
                <label className="flex items-center text-sm text-gray-700 gap-2">
                    <input
                        type="checkbox"
                        checked={includeWeekends}
                        onChange={(e) => setIncludeWeekends(e.target.checked)}
                        disabled={scheduling}
                    />
                    Include weekends
                </label>
                <Button variant="secondary" onClick={onClose} disabled={scheduling}>
                    Cancel
                </Button>
                <Button onClick={handleAutoSchedule} disabled={scheduling}>
                    {scheduling ? 'Scheduling...' : 'Preview Schedule'}
                </Button>
            </div>
        </div>
    );
};

export default AutoScheduler;
