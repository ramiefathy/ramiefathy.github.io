import { describe, it, expect } from 'vitest';
import {
    Permissions,
    ROLE_HIERARCHY,
    ADMIN_ROLES,
    SCHEDULER_ROLES
} from './permissions';

describe('permissions', () => {
    describe('ROLE_HIERARCHY', () => {
        it('should have admin as highest privilege', () => {
            expect(ROLE_HIERARCHY[0]).toBe('admin');
        });

        it('should have member as lowest privilege', () => {
            expect(ROLE_HIERARCHY[ROLE_HIERARCHY.length - 1]).toBe('member');
        });

        it('should have 5 roles', () => {
            expect(ROLE_HIERARCHY).toHaveLength(5);
        });
    });

    describe('ADMIN_ROLES', () => {
        it('should include admin, program_admin, and chief_resident', () => {
            expect(ADMIN_ROLES).toContain('admin');
            expect(ADMIN_ROLES).toContain('program_admin');
            expect(ADMIN_ROLES).toContain('chief_resident');
        });

        it('should NOT include scheduler or member', () => {
            expect(ADMIN_ROLES).not.toContain('scheduler');
            expect(ADMIN_ROLES).not.toContain('member');
        });
    });

    describe('SCHEDULER_ROLES', () => {
        it('should include all admin roles plus scheduler', () => {
            expect(SCHEDULER_ROLES).toContain('admin');
            expect(SCHEDULER_ROLES).toContain('program_admin');
            expect(SCHEDULER_ROLES).toContain('chief_resident');
            expect(SCHEDULER_ROLES).toContain('scheduler');
        });

        it('should NOT include member', () => {
            expect(SCHEDULER_ROLES).not.toContain('member');
        });
    });

    describe('Permissions.getUserRole', () => {
        it('should return member role for missing user', () => {
            const institution = { members: [] };
            expect(Permissions.getUserRole(institution, null)).toBe('member');
        });

        it('should return member role for user not in institution', () => {
            const institution = {
                members: [{ userId: 'user1', role: 'admin' }]
            };
            expect(Permissions.getUserRole(institution, 'user2')).toBe('member');
        });

        it('should return correct role for user in institution', () => {
            const institution = {
                members: [
                    { userId: 'user1', role: 'admin' },
                    { userId: 'user2', role: 'scheduler' }
                ]
            };
            expect(Permissions.getUserRole(institution, 'user1')).toBe('admin');
            expect(Permissions.getUserRole(institution, 'user2')).toBe('scheduler');
        });
    });

    describe('Permissions.isAdmin', () => {
        it('should return true for admin roles', () => {
            expect(Permissions.isAdmin('admin')).toBe(true);
            expect(Permissions.isAdmin('program_admin')).toBe(true);
            expect(Permissions.isAdmin('chief_resident')).toBe(true);
        });

        it('should return false for non-admin roles', () => {
            expect(Permissions.isAdmin('scheduler')).toBe(false);
            expect(Permissions.isAdmin('member')).toBe(false);
        });
    });

    describe('Permissions.canSchedule', () => {
        it('should return true for scheduler roles', () => {
            expect(Permissions.canSchedule('admin')).toBe(true);
            expect(Permissions.canSchedule('program_admin')).toBe(true);
            expect(Permissions.canSchedule('chief_resident')).toBe(true);
            expect(Permissions.canSchedule('scheduler')).toBe(true);
        });

        it('should return false for member role', () => {
            expect(Permissions.canSchedule('member')).toBe(false);
        });
    });

    describe('Permissions.isMember', () => {
        it('should return true only for member role', () => {
            expect(Permissions.isMember('member')).toBe(true);
        });

        it('should return false for other roles', () => {
            expect(Permissions.isMember('admin')).toBe(false);
            expect(Permissions.isMember('scheduler')).toBe(false);
        });
    });

    describe('Permissions.hasRole', () => {
        it('should return true when user has required role or higher', () => {
            expect(Permissions.hasRole('admin', 'scheduler')).toBe(true);
            expect(Permissions.hasRole('admin', 'admin')).toBe(true);
            expect(Permissions.hasRole('scheduler', 'member')).toBe(true);
        });

        it('should return false when user has lower role', () => {
            expect(Permissions.hasRole('member', 'admin')).toBe(false);
            expect(Permissions.hasRole('scheduler', 'admin')).toBe(false);
        });
    });

    describe('Permissions.countAdminMembers', () => {
        it('should count admin-level members correctly', () => {
            const members = [
                { userId: '1', role: 'admin' },
                { userId: '2', role: 'program_admin' },
                { userId: '3', role: 'scheduler' },
                { userId: '4', role: 'member' }
            ];
            expect(Permissions.countAdminMembers(members)).toBe(2);
        });

        it('should return 0 for empty array', () => {
            expect(Permissions.countAdminMembers([])).toBe(0);
        });
    });
});
