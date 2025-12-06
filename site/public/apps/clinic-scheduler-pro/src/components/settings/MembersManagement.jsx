/**
 * MembersManagement - Institution member management component
 */

import React, { useState, useEffect } from 'react';

// Contexts
import { useApp } from '../../contexts/AppContext';
import { toast } from '../../contexts/ToastContext';

// Components
import { Icon, Button, LoadingSpinner, Modal } from '../shared';
import { ValidationUtils } from '../../utils/validation';

const createEmptyInviteRow = () => ({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    programRole: 'resident',
    accountType: 'resident',
    email: ''
});

const MembersManagement = () => {
    const { firebaseService, institution, user } = useApp();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviteCode, setInviteCode] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [updatingRoles, setUpdatingRoles] = useState(new Set());
    const [removingMembers, setRemovingMembers] = useState(new Set());
    const [showBulkInviteModal, setShowBulkInviteModal] = useState(false);
    const [bulkInvites, setBulkInvites] = useState([createEmptyInviteRow()]);
    const [sendingBulkInvites, setSendingBulkInvites] = useState(false);

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

    const generateInviteCode = async () => {
        try {
            // createInviteCode generates a secure 8-char code using crypto.getRandomValues
            // and stores it in Firestore, returning { success: true, code } on success
            const result = await firebaseService.createInviteCode({
                institutionId: firebaseService.currentInstitution,
                institutionName: institution.name,
                role: 'member'
            });

            if (result.success) {
                setInviteCode(result.code); // Use the crypto-secure 8-char code
                setShowInviteModal(true);
                toast.success('Invite code generated');
            } else {
                toast.error(result.error || 'Failed to generate invite code');
            }
        } catch (error) {
            toast.error('Error generating invite code');
        }
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
                    <div className="flex items-center gap-2">
                        <Button onClick={generateInviteCode}>
                            <Icon name="user-plus" size={16} className="mr-2" />
                            Generate Invite
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setShowBulkInviteModal(true)}
                        >
                            <Icon name="send" size={16} className="mr-2" />
                            Bulk Invite
                        </Button>
                    </div>
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

            {/* Bulk Invite Modal */}
            {showBulkInviteModal && (
                <Modal
                    isOpen={true}
                    onClose={() => {
                        setShowBulkInviteModal(false);
                        setBulkInvites([createEmptyInviteRow()]);
                    }}
                    title="Bulk Invite Members"
                >
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            Add one row per person you want to invite. Each person will receive a unique, single-use invite code via email.
                        </p>
                        <div className="space-y-3">
                            {bulkInvites.map((row, index) => (
                                <div
                                    key={row.id}
                                    className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_2fr_auto] gap-2 items-center"
                                >
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            value={row.name}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setBulkInvites(current =>
                                                    current.map(r => r.id === row.id ? { ...r, name: value } : r)
                                                );
                                            }}
                                            className="w-full px-2 py-1.5 border rounded-lg text-sm"
                                            placeholder="Dr. Jane Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Role
                                        </label>
                                        <select
                                            value={row.programRole}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setBulkInvites(current =>
                                                    current.map(r => r.id === row.id ? { ...r, programRole: value } : r)
                                                );
                                            }}
                                            className="w-full px-2 py-1.5 border rounded-lg text-sm"
                                        >
                                            <option value="resident">Resident</option>
                                            <option value="physician">Physician</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Account Type
                                        </label>
                                        <select
                                            value={row.accountType}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setBulkInvites(current =>
                                                    current.map(r => r.id === row.id ? { ...r, accountType: value } : r)
                                                );
                                            }}
                                            className="w-full px-2 py-1.5 border rounded-lg text-sm"
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="program_coordinator">Program Coordinator</option>
                                            <option value="chief_resident">Chief Resident</option>
                                            <option value="physician">Physician (read-only)</option>
                                            <option value="resident">Resident (read-only)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={row.email}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setBulkInvites(current =>
                                                    current.map(r => r.id === row.id ? { ...r, email: value } : r)
                                                );
                                            }}
                                            className="w-full px-2 py-1.5 border rounded-lg text-sm"
                                            placeholder="user@example.com"
                                            required
                                        />
                                    </div>
                                    <div className="flex items-center justify-end pt-5">
                                        <button
                                            type="button"
                                            className="text-gray-400 hover:text-red-600"
                                            onClick={() => {
                                                setBulkInvites(current =>
                                                    current.length > 1
                                                        ? current.filter(r => r.id !== row.id)
                                                        : current
                                                );
                                            }}
                                            disabled={bulkInvites.length === 1}
                                            title="Remove row"
                                        >
                                            <Icon name="trash" size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <button
                                type="button"
                                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                onClick={() => setBulkInvites(current => [...current, createEmptyInviteRow()])}
                            >
                                <Icon name="plus" size={14} />
                                Add another row
                            </button>
                            <div className="text-xs text-gray-500">
                                {bulkInvites.length} invite{bulkInvites.length === 1 ? '' : 's'} configured
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    setShowBulkInviteModal(false);
                                    setBulkInvites([createEmptyInviteRow()]);
                                }}
                                disabled={sendingBulkInvites}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={async () => {
                                    const nonEmptyRows = bulkInvites.filter(row => row.email && row.email.trim());
                                    if (nonEmptyRows.length === 0) {
                                        toast.error('Add at least one invite with an email');
                                        return;
                                    }

                                    // Basic validation per row
                                    for (let index = 0; index < nonEmptyRows.length; index += 1) {
                                        const row = nonEmptyRows[index];
                                        const emailResult = ValidationUtils.validateEmail(row.email);
                                        if (!emailResult.isValid) {
                                            toast.error(`Row ${index + 1}: ${emailResult.error}`);
                                            return;
                                        }
                                        const nameResult = ValidationUtils.trimAndValidate(row.name, 100, 'Name');
                                        if (!nameResult.isValid) {
                                            toast.error(`Row ${index + 1}: ${nameResult.error}`);
                                            return;
                                        }
                                    }

                                    setSendingBulkInvites(true);
                                    try {
                                        const invitesPayload = nonEmptyRows.map(row => ({
                                            name: row.name?.trim() || '',
                                            email: row.email.trim(),
                                            programRole: row.programRole,
                                            accountType: row.accountType
                                        }));

                                        const result = await firebaseService.bulkInviteMembers(invitesPayload);
                                        if (result.success) {
                                            const sent = result.sent ?? invitesPayload.length;
                                            const failed = Array.isArray(result.failed) ? result.failed.length : 0;
                                            if (failed === 0) {
                                                toast.success(`Invites sent to ${sent} user${sent === 1 ? '' : 's'}`);
                                            } else {
                                                toast.warning(`Invites sent to ${sent} users; ${failed} failed`);
                                            }
                                            setShowBulkInviteModal(false);
                                            setBulkInvites([createEmptyInviteRow()]);
                                        } else {
                                            toast.error(result.error || 'Failed to send invites');
                                        }
                                    } catch (error) {
                                        console.error('Bulk invite error:', error);
                                        toast.error('Error sending invites');
                                    } finally {
                                        setSendingBulkInvites(false);
                                    }
                                }}
                                disabled={sendingBulkInvites}
                            >
                                {sendingBulkInvites ? 'Sending...' : 'Send Invites'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default MembersManagement;
