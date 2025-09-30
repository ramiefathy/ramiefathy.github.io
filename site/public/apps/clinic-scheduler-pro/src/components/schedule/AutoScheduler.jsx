/**
 * AutoScheduler - Automatic schedule generation component
 */

import React, { useState } from 'react';

// Contexts
import { useApp } from '../../contexts/AppContext';
import { toast } from '../../contexts/ToastContext';

// Components
import { Button } from '../shared';

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

export default AutoScheduler;
