/**
 * MembersManagement - Institution member management component
 */

import React, { useState, useEffect } from 'react';

// Contexts
import { useApp } from '../../contexts/AppContext';
import { toast } from '../../contexts/ToastContext';

// Components
import { Icon, Button, LoadingSpinner, Modal } from '../shared';

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

export default MembersManagement;
