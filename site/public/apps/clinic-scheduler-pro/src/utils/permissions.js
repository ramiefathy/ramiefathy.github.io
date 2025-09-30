/**
 * Permission utilities for clinic scheduler
 * Role-based access control (RBAC) helpers
 */

// Role hierarchy from highest to lowest privilege
export const ROLE_HIERARCHY = ['admin', 'program_admin', 'chief_resident', 'scheduler', 'member'];

// Admin-level roles that can manage institution settings and members
export const ADMIN_ROLES = ['admin', 'program_admin', 'chief_resident'];

// Roles that can create/modify assignments
export const SCHEDULER_ROLES = ['admin', 'program_admin', 'chief_resident', 'scheduler'];

/**
 * Permission helper functions
 */
export const Permissions = {
    /**
     * Get user's role in an institution
     */
    getUserRole: (institution, userId) => {
        if (!institution?.members || !userId) return 'member';
        const member = institution.members.find(m => m.userId === userId);
        return member?.role || 'member';
    },

    /**
     * Check if role has admin-level privileges
     */
    isAdmin: (role) => ADMIN_ROLES.includes(role),

    /**
     * Check if role can schedule (create/modify assignments)
     */
    canSchedule: (role) => SCHEDULER_ROLES.includes(role),

    /**
     * Check if role is read-only member
     */
    isMember: (role) => role === 'member',

    /**
     * Check if user has at least the required role level
     */
    hasRole: (userRole, requiredRole) => {
        const userIndex = ROLE_HIERARCHY.indexOf(userRole);
        const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);

        // Lower index = higher privilege
        return userIndex !== -1 && userIndex <= requiredIndex;
    },

    /**
     * Check if role is an admin-level role
     */
    isAdminRole: (role) => ADMIN_ROLES.includes(role),

    /**
     * Count admin-level members in a list
     */
    countAdminMembers: (members = []) => {
        return members.filter(m => ADMIN_ROLES.includes(m.role)).length;
    },

    /**
     * Get role display name
     */
    getRoleDisplayName: (role) => {
        const names = {
            admin: 'Admin',
            program_admin: 'Program Admin',
            chief_resident: 'Chief Resident',
            scheduler: 'Scheduler',
            member: 'Member (Read-only)'
        };
        return names[role] || 'Member';
    },

    /**
     * Get all available roles for assignment
     */
    getAvailableRoles: () => [
        { value: 'member', label: 'Member (Read-only)', description: 'Can view schedules' },
        { value: 'scheduler', label: 'Scheduler', description: 'Can create and modify assignments' },
        { value: 'chief_resident', label: 'Chief Resident', description: 'Can manage schedules and some settings' },
        { value: 'program_admin', label: 'Program Admin', description: 'Can manage most institution settings' },
        { value: 'admin', label: 'Admin', description: 'Full access to all features' }
    ]
};

export default Permissions;
