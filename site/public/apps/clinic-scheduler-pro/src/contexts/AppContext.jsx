/**
 * App context - Firebase state and permissions
 * Provides firebaseService, user, institution, and data across the app
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { firebaseService } from '../services/FirebaseService';
import { Permissions } from '../utils/permissions';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [state, setState] = useState({
        user: null,
        institution: null,
        attendings: [],
        residents: [],
        assignments: {},
        rules: [],
        loading: true
    });

    useEffect(() => {
        let unsubscribeAuth;
        let unsubscribeService;

        const initFirebase = async () => {
            await firebaseService.initialize();

            // Subscribe to Firebase updates (capture unsubscribe)
            unsubscribeService = firebaseService.subscribe((type, data) => {
                setState(prev => ({
                    ...prev,
                    [type === 'institution' ? 'institution' : type]: data
                }));
            });

            // Listen to auth state (capture unsubscribe)
            unsubscribeAuth = window.firebase.auth.onAuthStateChanged(window.firebaseAuth, async (user) => {
                // Keep service in sync with auth state
                firebaseService.setCurrentUser(user);

                if (user) {
                    const profile = await firebaseService.loadUserProfile();
                    setState(prev => ({
                        ...prev,
                        user: { ...user, ...profile },
                        loading: false
                    }));
                } else {
                    firebaseService.cleanup();
                    setState(prev => ({
                        ...prev,
                        user: null,
                        institution: null,
                        attendings: [],
                        residents: [],
                        assignments: {},
                        rules: [],
                        loading: false
                    }));
                }
            });
        };

        initFirebase();

        // Cleanup on unmount
        return () => {
            unsubscribeAuth?.();
            unsubscribeService?.();
        };
    }, []);

    const value = {
        ...state,
        firebaseService
    };

    // Expose for dev tools / seed scripts
    if (typeof window !== 'undefined') {
        window.__APP__ = value;
    }

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);

// ==================== Role-Based Permissions Hook ====================
export const usePermissions = () => {
    const { user, institution } = useApp();
    const userRole = Permissions.getUserRole(institution, user?.uid);

    return {
        userRole,
        isAdmin: Permissions.isAdmin(userRole),
        canSchedule: Permissions.canSchedule(userRole),
        isMember: Permissions.isMember(userRole),
        hasRole: (requiredRole) => Permissions.hasRole(userRole, requiredRole)
    };
};

export default AppContext;
