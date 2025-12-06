/**
 * ScheduleRequests - Review and manage schedule change requests
 */

import React, { useEffect, useState } from 'react';
import { useApp, usePermissions } from '../../contexts/AppContext';
import { toast } from '../../contexts/ToastContext';
import { Card, LoadingSpinner, Button, Icon } from '../shared';

const ScheduleRequests = () => {
    const { firebaseService, institution, residents, attendings } = useApp();
    const { canSchedule } = usePermissions();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingIds, setUpdatingIds] = useState(new Set());

    useEffect(() => {
        if (!firebaseService.currentInstitution || !canSchedule) {
            setRequests([]);
            setLoading(false);
            return;
        }

        const unsubscribe = firebaseService.listenToScheduleRequests((data) => {
            setRequests(data);
            setLoading(false);
        });

        return unsubscribe;
    }, [firebaseService.currentInstitution, canSchedule]);

    if (!canSchedule) {
        return (
            <div className="py-12 text-center text-gray-600">
                You do not have permission to review schedule change requests.
            </div>
        );
    }

    if (loading) {
        return <LoadingSpinner size="lg" className="py-12" />;
    }

    const getResidentName = (residentId) => {
        const resident = residents.find(r => r.id === residentId);
        return resident?.name || 'Unassigned';
    };

    const getAttendingName = (attendingId) => {
        const attending = attendings.find(a => a.id === attendingId);
        return attending?.name || 'Unassigned';
    };

    const getSiteName = (siteId) => {
        const sites = institution?.settings?.sites || [];
        const site = sites.find(s => s.id === siteId);
        return site?.name || '';
    };

    const handleUpdateStatus = async (requestId, status) => {
        setUpdatingIds(prev => new Set(prev).add(requestId));

        try {
            const result = await firebaseService.updateScheduleRequest(requestId, { status });
            if (result.success) {
                toast.success(`Request marked as ${status}`);
            } else {
                toast.error(result.error || 'Failed to update request');
            }
        } catch (error) {
            console.error('Error updating request status:', error);
            toast.error('Failed to update request');
        } finally {
            setUpdatingIds(prev => {
                const next = new Set(prev);
                next.delete(requestId);
                return next;
            });
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                        <Icon name="check" size={12} className="mr-1" />
                        Approved
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                        <Icon name="x" size={12} className="mr-1" />
                        Rejected
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
                        <Icon name="alert-triangle" size={12} className="mr-1" />
                        Pending
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Schedule Change Requests</h2>
                    <p className="text-gray-600">
                        Review and act on change requests submitted by residents and physicians.
                    </p>
                </div>
            </div>

            <Card>
                {requests.length === 0 ? (
                    <div className="py-10 text-center text-gray-500 text-sm">
                        No schedule change requests at the moment.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {requests.map(request => {
                            const isUpdating = updatingIds.has(request.id);
                            const residentName = getResidentName(request.residentId);
                            const attendingName = getAttendingName(request.attendingId);
                            const siteName = getSiteName(request.siteId);

                            return (
                                <div key={request.id} className="py-4 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                    <div className="space-y-1 text-sm text-gray-800">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">
                                                {request.assignmentDate} · {request.timeSlot}
                                            </span>
                                            {getStatusBadge(request.status || 'pending')}
                                        </div>
                                        <div className="text-gray-700">
                                            <span className="font-medium">Resident:</span> {residentName}
                                        </div>
                                        <div className="text-gray-700">
                                            <span className="font-medium">Attending:</span> {attendingName}
                                        </div>
                                        {siteName && (
                                            <div className="text-gray-700">
                                                <span className="font-medium">Site:</span> {siteName}
                                            </div>
                                        )}
                                        <div className="text-gray-700">
                                            <span className="font-medium">Request Type:</span>{' '}
                                            {request.requestType || 'change'}
                                        </div>
                                        <div className="text-gray-700">
                                            <span className="font-medium">Requested By:</span>{' '}
                                            {request.requestedByName || request.requestedByEmail || 'Unknown'}
                                        </div>
                                        {request.note && (
                                            <div className="mt-1 text-gray-700">
                                                <span className="font-medium">Note:</span>{' '}
                                                <span className="whitespace-pre-wrap">{request.note}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 md:justify-end">
                                        <Button
                                            variant="secondary"
                                            onClick={() => handleUpdateStatus(request.id, 'approved')}
                                            disabled={isUpdating || request.status === 'approved'}
                                        >
                                            {isUpdating && request.status !== 'approved' ? 'Updating...' : 'Mark Approved'}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => handleUpdateStatus(request.id, 'rejected')}
                                            disabled={isUpdating || request.status === 'rejected'}
                                        >
                                            {isUpdating && request.status !== 'rejected' ? 'Updating...' : 'Mark Rejected'}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ScheduleRequests;

