// Source for Clinic Scheduler Pro browser bundle. Run `npm run clinic:scheduler:build` after editing.
const { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } = React;
const { createPortal } = ReactDOM;
// Framer Motion Integration
const { motion, AnimatePresence } = window['framer-motion'] || {
    motion: { div: 'div', button: 'button' },
    AnimatePresence: ({ children }) => children
};
const ToastDispatchContext = createContext(null);
const ToastStateContext = createContext([]);

let externalToastDispatch = null;

const toast = {
    success: (message) => externalToastDispatch?.({ type: 'success', message }),
    error: (message) => externalToastDispatch?.({ type: 'error', message })
};

const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const publish = useCallback(({ type, message }) => {
        if (!message) return;
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setToasts((prev) => [...prev, { id, type, message }]);
    }, []);

    useEffect(() => {
        externalToastDispatch = publish;
        return () => {
            if (externalToastDispatch === publish) {
                externalToastDispatch = null;
            }
        };
    }, [publish]);

    return (
        <ToastDispatchContext.Provider value={removeToast}>
            <ToastStateContext.Provider value={toasts}>
                {children}
                <ToastViewport />
            </ToastStateContext.Provider>
        </ToastDispatchContext.Provider>
    );
};

const ToastViewport = () => {
    const toasts = useContext(ToastStateContext);
    const dismiss = useContext(ToastDispatchContext);

    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                position: 'fixed',
                bottom: '1.5rem',
                right: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                zIndex: 9999,
                maxWidth: '20rem'
            }}
        >
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
        </div>
    );
};

const ToastItem = ({ toast, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 3500);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    const palette = toast.type === 'success'
        ? { bg: '#dcfce7', border: '#86efac', text: '#065f46' }
        : { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' };

    return (
        <div
            role="alert"
            onClick={() => onDismiss(toast.id)}
            style={{
                borderRadius: '1rem',
                padding: '0.85rem 1rem',
                background: palette.bg,
                border: `1px solid ${palette.border}`,
                color: palette.text,
                fontWeight: 600,
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.15)',
                cursor: 'pointer'
            }}
        >
            {toast.message}
        </div>
    );
};

const Toaster = () => null;
const { format, parseISO, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, getDay, addDays } = window['date-fns'];
const { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = window.Recharts;

// Wait for Firebase to be available
const waitForFirebase = () => {
    return new Promise((resolve) => {
        const checkFirebase = () => {
            if (window.firebase) {
                resolve();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    });
};

// ==================== Firebase Service ====================
class FirebaseService {
    constructor() {
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.currentInstitution = null;
        this.listeners = [];
        this.unsubscribers = [];
    }

    async initialize() {
        await waitForFirebase();
        this.auth = window.firebaseAuth;
        this.db = window.firebaseDb;

        // Set up auth listener
        window.firebase.auth.onAuthStateChanged(this.auth, async (user) => {
            this.currentUser = user;
            if (user) {
                await this.loadUserProfile();
            } else {
                this.currentInstitution = null;
                this.cleanup();
            }
        });
    }

    cleanup() {
        // Unsubscribe from all listeners
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
    }

    // ===== Authentication =====
    async signUp(email, password, name) {
        try {
            const userCredential = await window.firebase.auth.createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;

            // Ensure current user is available immediately for subsequent operations
            this.currentUser = user;

            // Create user profile
            await window.firebase.firestore.setDoc(
                window.firebase.firestore.doc(this.db, 'users', user.uid),
                {
                    email,
                    name,
                    createdAt: window.firebase.firestore.serverTimestamp(),
                    institutions: []
                }
            );

            return { success: true, user };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const userCredential = await window.firebase.auth.signInWithEmailAndPassword(this.auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            this.cleanup();
            await window.firebase.auth.signOut(this.auth);
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    async resetPassword(email) {
        try {
            await window.firebase.auth.sendPasswordResetEmail(this.auth, email);
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== User Management =====
    async loadUserProfile() {
        if (!this.currentUser) return null;

        try {
            const userDoc = await window.firebase.firestore.getDoc(
                window.firebase.firestore.doc(this.db, 'users', this.currentUser.uid)
            );

            if (userDoc.exists()) {
                const userData = userDoc.data();
                // Load first institution if available
                if (userData.institutions && userData.institutions.length > 0) {
                    await this.loadInstitution(userData.institutions[0]);
                }
                return userData;
            }
            return null;
        } catch (error) {
            console.error('Load user profile error:', error);
            return null;
        }
    }

    // ===== Institution Management =====
    async createInstitution(name, userData) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            const institutionRef = window.firebase.firestore.doc(
                window.firebase.firestore.collection(this.db, 'institutions')
            );

            const institutionData = {
                name,
                createdBy: this.currentUser.uid,
                createdAt: window.firebase.firestore.serverTimestamp(),
                settings: {
                    sites: [
                        { id: 'site_1', name: 'Main Clinic', code: 'MAIN', color: '#10b981' }
                    ],
                    rotations: [
                        { id: 'rot_1', name: 'General', code: 'GEN', minSessions: 4 }
                    ],
                    protectedTimes: [
                        {
                            id: 'pt_1',
                            name: 'Didactics',
                            dayOfWeek: 3,
                            timeSlot: 'AM',
                            mandatory: true
                        }
                    ],
                    academicYear: {
                        start: format(new Date(), 'yyyy-07-01'),
                        end: format(addDays(new Date(), 365), 'yyyy-06-30')
                    }
                }
            };

            // Create institution
            await window.firebase.firestore.setDoc(institutionRef, institutionData);

            // Add user as admin member
            await window.firebase.firestore.setDoc(
                window.firebase.firestore.doc(this.db, 'institutions', institutionRef.id, 'members', this.currentUser.uid),
                {
                    userId: this.currentUser.uid,
                    name: userData.name,
                    email: userData.email,
                    role: 'program_admin',
                    joinedAt: window.firebase.firestore.serverTimestamp()
                }
            );

            // Update user's institutions list
            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'users', this.currentUser.uid),
                {
                    institutions: window.firebase.firestore.arrayUnion(institutionRef.id)
                }
            );

            this.currentInstitution = institutionRef.id;
            return { success: true, institutionId: institutionRef.id };
        } catch (error) {
            console.error('Create institution error:', error);
            return { success: false, error: error.message };
        }
    }

    async loadInstitution(institutionId) {
        if (!this.currentUser) return null;

        try {
            // Check if user is a member
            const memberDoc = await window.firebase.firestore.getDoc(
                window.firebase.firestore.doc(this.db, 'institutions', institutionId, 'members', this.currentUser.uid)
            );

            if (!memberDoc.exists()) {
                throw new Error('Not a member of this institution');
            }

            this.currentInstitution = institutionId;
            this.setupRealtimeListeners();

            return { success: true };
        } catch (error) {
            console.error('Load institution error:', error);
            return { success: false, error: error.message };
        }
    }

    setupRealtimeListeners() {
        if (!this.currentInstitution) return;

        this.cleanup();

        // Listen to institution settings
        const institutionUnsub = window.firebase.firestore.onSnapshot(
            window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution),
            (doc) => {
                if (doc.exists()) {
                    this.notifyListeners('institution', doc.data());
                }
            }
        );
        this.unsubscribers.push(institutionUnsub);

        // Listen to attendings
        const attendingsUnsub = window.firebase.firestore.onSnapshot(
            window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'attendings'),
            (snapshot) => {
                const attendings = [];
                snapshot.forEach(doc => {
                    attendings.push({ id: doc.id, ...doc.data() });
                });
                this.notifyListeners('attendings', attendings);
            }
        );
        this.unsubscribers.push(attendingsUnsub);

        // Listen to residents
        const residentsUnsub = window.firebase.firestore.onSnapshot(
            window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'residents'),
            (snapshot) => {
                const residents = [];
                snapshot.forEach(doc => {
                    residents.push({ id: doc.id, ...doc.data() });
                });
                this.notifyListeners('residents', residents);
            }
        );
        this.unsubscribers.push(residentsUnsub);

        // Listen to assignments
        const assignmentsUnsub = window.firebase.firestore.onSnapshot(
            window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'assignments'),
            (snapshot) => {
                const assignments = {};
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const key = `${data.date}_${data.timeSlot}`;
                    if (!assignments[key]) assignments[key] = [];
                    assignments[key].push({ id: doc.id, ...data });
                });
                this.notifyListeners('assignments', assignments);
            }
        );
        this.unsubscribers.push(assignmentsUnsub);

        // Listen to rules
        const rulesUnsub = window.firebase.firestore.onSnapshot(
            window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'rules'),
            (snapshot) => {
                const rules = [];
                snapshot.forEach(doc => {
                    rules.push({ id: doc.id, ...doc.data() });
                });
                this.notifyListeners('rules', rules);
            }
        );
        this.unsubscribers.push(rulesUnsub);
    }

    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    notifyListeners(type, data) {
        this.listeners.forEach(listener => listener(type, data));
    }

    // ===== CRUD Operations =====
    async addAttending(attending) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            const docRef = await window.firebase.firestore.addDoc(
                window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'attendings'),
                {
                    ...attending,
                    createdAt: window.firebase.firestore.serverTimestamp(),
                    createdBy: this.currentUser.uid
                }
            );

            await this.addAuditLog('attending_added', { id: docRef.id, ...attending });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Add attending error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateAttending(id, updates) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'attendings', id),
                {
                    ...updates,
                    updatedAt: window.firebase.firestore.serverTimestamp()
                }
            );

            await this.addAuditLog('attending_updated', { id, updates });
            return { success: true };
        } catch (error) {
            console.error('Update attending error:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteAttending(id) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            await window.firebase.firestore.deleteDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'attendings', id)
            );

            await this.addAuditLog('attending_deleted', { id });
            return { success: true };
        } catch (error) {
            console.error('Delete attending error:', error);
            return { success: false, error: error.message };
        }
    }

    async addResident(resident) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            const docRef = await window.firebase.firestore.addDoc(
                window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'residents'),
                {
                    ...resident,
                    createdAt: window.firebase.firestore.serverTimestamp(),
                    createdBy: this.currentUser.uid
                }
            );

            await this.addAuditLog('resident_added', { id: docRef.id, ...resident });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Add resident error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateResident(id, updates) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'residents', id),
                {
                    ...updates,
                    updatedAt: window.firebase.firestore.serverTimestamp()
                }
            );

            await this.addAuditLog('resident_updated', { id, updates });
            return { success: true };
        } catch (error) {
            console.error('Update resident error:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteResident(id) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            await window.firebase.firestore.deleteDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'residents', id)
            );

            await this.addAuditLog('resident_deleted', { id });
            return { success: true };
        } catch (error) {
            console.error('Delete resident error:', error);
            return { success: false, error: error.message };
        }
    }

    async addAssignment(assignment) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            const docRef = await window.firebase.firestore.addDoc(
                window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'assignments'),
                {
                    ...assignment,
                    createdAt: window.firebase.firestore.serverTimestamp(),
                    createdBy: this.currentUser.uid
                }
            );

            await this.addAuditLog('assignment_added', { id: docRef.id, ...assignment });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Add assignment error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateAssignment(id, updates) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'assignments', id),
                {
                    ...updates,
                    updatedAt: window.firebase.firestore.serverTimestamp()
                }
            );

            await this.addAuditLog('assignment_updated', { id, updates });
            return { success: true };
        } catch (error) {
            console.error('Update assignment error:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteAssignment(id) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            await window.firebase.firestore.deleteDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'assignments', id)
            );

            await this.addAuditLog('assignment_deleted', { id });
            return { success: true };
        } catch (error) {
            console.error('Delete assignment error:', error);
            return { success: false, error: error.message };
        }
    }

    async addRule(rule) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            const docRef = await window.firebase.firestore.addDoc(
                window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'rules'),
                {
                    ...rule,
                    createdAt: window.firebase.firestore.serverTimestamp(),
                    createdBy: this.currentUser.uid
                }
            );

            await this.addAuditLog('rule_added', { id: docRef.id, ...rule });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Add rule error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateRule(id, updates) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'rules', id),
                {
                    ...updates,
                    updatedAt: window.firebase.firestore.serverTimestamp()
                }
            );

            await this.addAuditLog('rule_updated', { id, updates });
            return { success: true };
        } catch (error) {
            console.error('Update rule error:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteRule(id) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            await window.firebase.firestore.deleteDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'rules', id)
            );

            await this.addAuditLog('rule_deleted', { id });
            return { success: true };
        } catch (error) {
            console.error('Delete rule error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateInstitutionSettings(updates) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution),
                {
                    settings: updates,
                    updatedAt: window.firebase.firestore.serverTimestamp()
                }
            );

            await this.addAuditLog('settings_updated', updates);
            return { success: true };
        } catch (error) {
            console.error('Update settings error:', error);
            return { success: false, error: error.message };
        }
    }

    async addAuditLog(action, data) {
        if (!this.currentInstitution) return;

        try {
            await window.firebase.firestore.addDoc(
                window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'auditLogs'),
                {
                    action,
                    data,
                    userId: this.currentUser?.uid,
                    timestamp: window.firebase.firestore.serverTimestamp()
                }
            );
        } catch (error) {
            console.error('Add audit log error:', error);
        }
    }

    // Batch operations for efficiency
    async batchAddAssignments(assignments) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            const batch = window.firebase.firestore.writeBatch(this.db);

            assignments.forEach(assignment => {
                const docRef = window.firebase.firestore.doc(
                    window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'assignments')
                );
                batch.set(docRef, {
                    ...assignment,
                    createdAt: window.firebase.firestore.serverTimestamp(),
                    createdBy: this.currentUser.uid
                });
            });

            await batch.commit();
            await this.addAuditLog('batch_assignments_added', { count: assignments.length });
            return { success: true };
        } catch (error) {
            console.error('Batch add assignments error:', error);
            return { success: false, error: error.message };
        }
    }

    async clearAllAssignments() {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            const snapshot = await window.firebase.firestore.getDocs(
                window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'assignments')
            );

            const batch = window.firebase.firestore.writeBatch(this.db);
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            await this.addAuditLog('all_assignments_cleared', { count: snapshot.size });
            return { success: true };
        } catch (error) {
            console.error('Clear assignments error:', error);
            return { success: false, error: error.message };
        }
    }

    // Real-time listeners
    listenToAttendings(callback) {
        if (!this.currentInstitution) {
            callback([]);
            return () => {};
        }

        const query = window.firebase.firestore.query(
            window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'attendings'),
            window.firebase.firestore.orderBy('name')
        );

        const unsubscribe = window.firebase.firestore.onSnapshot(
            query,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(data);
            },
            (error) => {
                console.error('Attendings listener error:', error);
                callback([]);
            }
        );

        return unsubscribe;
    }

    listenToResidents(callback) {
        if (!this.currentInstitution) {
            callback([]);
            return () => {};
        }

        const query = window.firebase.firestore.query(
            window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'residents'),
            window.firebase.firestore.orderBy('name')
        );

        const unsubscribe = window.firebase.firestore.onSnapshot(
            query,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(data);
            },
            (error) => {
                console.error('Residents listener error:', error);
                callback([]);
            }
        );

        return unsubscribe;
    }

    listenToAssignments(callback) {
        if (!this.currentInstitution) {
            callback([]);
            return () => {};
        }

        const query = window.firebase.firestore.query(
            window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'assignments'),
            window.firebase.firestore.orderBy('date')
        );

        const unsubscribe = window.firebase.firestore.onSnapshot(
            query,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(data);
            },
            (error) => {
                console.error('Assignments listener error:', error);
                callback([]);
            }
        );

        return unsubscribe;
    }

    listenToRules(callback) {
        if (!this.currentInstitution) {
            callback([]);
            return () => {};
        }

        const query = window.firebase.firestore.query(
            window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'rules'),
            window.firebase.firestore.orderBy('name')
        );

        const unsubscribe = window.firebase.firestore.onSnapshot(
            query,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(data);
            },
            (error) => {
                console.error('Rules listener error:', error);
                callback([]);
            }
        );

        return unsubscribe;
    }

    listenToInstitution(callback) {
        if (!this.currentInstitution) {
            callback(null);
            return () => {};
        }

        const unsubscribe = window.firebase.firestore.onSnapshot(
            window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution),
            (doc) => {
                if (doc.exists) {
                    callback({ id: doc.id, ...doc.data() });
                } else {
                    callback(null);
                }
            },
            (error) => {
                console.error('Institution listener error:', error);
                callback(null);
            }
        );

        return unsubscribe;
    }
}

// ==================== App Context ====================
const firebaseService = new FirebaseService();
const AppContext = createContext();

const AppProvider = ({ children }) => {
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
        const initFirebase = async () => {
            await firebaseService.initialize();

            // Subscribe to Firebase updates
            firebaseService.subscribe((type, data) => {
                setState(prev => ({
                    ...prev,
                    [type === 'institution' ? 'institution' : type]: data
                }));
            });

            // Listen to auth state
            window.firebase.auth.onAuthStateChanged(window.firebaseAuth, async (user) => {
                if (user) {
                    const profile = await firebaseService.loadUserProfile();
                    setState(prev => ({
                        ...prev,
                        user: { ...user, ...profile },
                        loading: false
                    }));
                } else {
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
    }, []);

    const value = {
        ...state,
        firebaseService
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const useApp = () => useContext(AppContext);

// ==================== Shared Components ====================
const Icon = ({ name, size = 20, className = "" }) => {
    useEffect(() => {
        if (lucide?.createIcons) {
            const icons = lucide.icons;
            icons ? lucide.createIcons({ icons }) : lucide.createIcons();
        }
    }, []);
    return <i data-lucide={name} className={className} style={{ width: size, height: size }}></i>;
};

const Button = ({ children, variant = 'primary', size = 'md', className = "", icon, loading = false, ...props }) => {
    const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ease-in-out focus-ring transform";
    const variants = {
        primary: "bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/20 hover:-translate-y-0.5 active:scale-95 focus:ring-primary-500",
        secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md hover:-translate-y-0.5 active:scale-95 focus:ring-primary-500",
        ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 focus:ring-gray-500",
        danger: "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20 hover:-translate-y-0.5 active:scale-95 focus:ring-red-500",
        success: "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/20 hover:-translate-y-0.5 active:scale-95 focus:ring-green-500"
    };
    const sizes = {
        sm: "px-3 py-1.5 text-sm gap-1.5",
        md: "px-4 py-2 text-sm gap-2",
        lg: "px-6 py-3 text-base gap-2"
    };

    return (
        <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`}
            disabled={loading}
            {...props}
        >
            {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : icon ? (
                <Icon name={icon} size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} />
            ) : null}
            {children}
        </motion.button>
    );
};

const Card = ({ children, className = "", padding = true, hover = false, ...motionProps }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
        className={`bg-white rounded-xl card-shadow border border-gray-200 transition-all duration-200 ease-in-out ${
            hover ? 'hover:card-shadow-hover' : ''
        } ${padding ? 'p-6' : ''} ${className}`}
        {...motionProps}
    >
        {children}
    </motion.div>
);

// Enhanced Loading Components
const LoadingSpinner = ({ size = 'md', className = "" }) => {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    return (
        <div className={`flex justify-center py-8 ${className}`}>
            <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizes[size]}`}></div>
        </div>
    );
};

const SkeletonCard = ({ lines = 3, className = "" }) => (
    <Card className={`animate-pulse ${className}`}>
        <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded shimmer"></div>
            {Array.from({ length: lines - 1 }).map((_, i) => (
                <div key={i} className={`h-4 bg-gray-200 rounded shimmer ${i === lines - 2 ? 'w-3/4' : ''}`}></div>
            ))}
        </div>
    </Card>
);

const SkeletonText = ({ lines = 2, className = "" }) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className={`h-4 bg-gray-200 rounded shimmer ${i === lines - 1 ? 'w-3/4' : ''}`}></div>
        ))}
    </div>
);

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl'
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 overflow-y-auto"
            >
                <div className="flex items-center justify-center min-h-screen p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`relative bg-white rounded-2xl shadow-2xl ${sizes[size]} w-full max-h-[90vh] overflow-hidden`}
                    >
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Icon name="x" size={20} />
                            </motion.button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                            {children}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>,
        document.getElementById('modal-root')
    );
};

// ==================== Auth Components ====================
const LoginPage = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        confirmPassword: ''
    });
    const { firebaseService } = useApp();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                if (formData.password !== formData.confirmPassword) {
                    toast.error('Passwords do not match');
                    setLoading(false);
                    return;
                }

                const result = await firebaseService.signUp(formData.email, formData.password, formData.name);
                if (result.success) {
                    toast.success('Account created successfully!');
                    // Create first institution
                    const instResult = await firebaseService.createInstitution(
                        `${formData.name}'s Institution`,
                        { name: formData.name, email: formData.email }
                    );
                    if (instResult.success) {
                        toast.success('Institution created!');
                    }
                } else {
                    toast.error(result.error);
                }
            } else {
                const result = await firebaseService.signIn(formData.email, formData.password);
                if (result.success) {
                    toast.success('Welcome back!');
                } else {
                    toast.error(result.error);
                }
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!formData.email) {
            toast.error('Please enter your email address');
            return;
        }

        const result = await firebaseService.resetPassword(formData.email);
        if (result.success) {
            toast.success('Password reset email sent!');
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card>
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-xl mb-4">
                            <Icon name="calendar-days" size={32} className="text-primary-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Clinic Scheduler</h1>
                        <p className="text-gray-600 mt-2">
                            {isSignUp ? 'Create your account' : 'Sign in to continue'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {isSignUp && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        )}

                        <Button type="submit" className="w-full" loading={loading}>
                            {isSignUp ? 'Create Account' : 'Sign In'}
                        </Button>

                        {!isSignUp && (
                            <button
                                type="button"
                                onClick={handleResetPassword}
                                className="w-full text-sm text-primary-600 hover:text-primary-700"
                            >
                                Forgot Password?
                            </button>
                        )}

                        <div className="text-center pt-4 border-t">
                            <p className="text-sm text-gray-600">
                                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                                <button
                                    type="button"
                                    onClick={() => setIsSignUp(!isSignUp)}
                                    className="ml-1 text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    {isSignUp ? 'Sign In' : 'Sign Up'}
                                </button>
                            </p>
                        </div>
                    </form>
                </Card>

                <p className="text-center text-xs text-gray-500 mt-4">
                    Protected by Firebase Authentication • Real-time Sync Enabled
                </p>
            </div>
        </div>
    );
};

// ==================== Dashboard Component ====================
const Dashboard = () => {
    const { attendings, residents, assignments, rules, institution } = useApp();

    const stats = useMemo(() => {
        const totalAssignments = Object.values(assignments).flat().length;
        const thisWeek = Object.entries(assignments)
            .filter(([key]) => {
                const [date] = key.split('_');
                const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
                const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
                const assignmentDate = parseISO(date);
                return assignmentDate >= weekStart && assignmentDate <= weekEnd;
            })
            .reduce((sum, [, items]) => sum + items.length, 0);

        return [
            { label: 'Total Attendings', value: attendings.length, icon: 'users', color: 'blue' },
            { label: 'Total Residents', value: residents.length, icon: 'user-check', color: 'green' },
            { label: 'This Week', value: thisWeek, icon: 'calendar', color: 'purple' },
            { label: 'Active Rules', value: rules.filter(r => r.isActive).length, icon: 'shield-check', color: 'amber' }
        ];
    }, [attendings, residents, assignments, rules]);

    const getColorClasses = (color) => {
        const colors = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            amber: 'bg-amber-100 text-amber-600'
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                    <p className="text-gray-600">Real-time overview of your scheduling system</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={async () => {
                            try {
                                const calculateAnalytics = window.firebase.functions.httpsCallable('calculateAnalytics');
                                const startDate = new Date();
                                startDate.setMonth(startDate.getMonth() - 1);
                                const result = await calculateAnalytics({
                                    institutionId: useApp().firebaseService.currentInstitution,
                                    startDate: startDate.toISOString().split('T')[0],
                                    endDate: new Date().toISOString().split('T')[0]
                                });
                                console.log('Analytics:', result.data);
                                toast.success('Analytics calculated - check console');
                            } catch (error) {
                                toast.error('Failed to calculate analytics');
                            }
                        }}
                    >
                        <Icon name="bar-chart" size={16} className="mr-2" />
                        Analytics
                    </Button>
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={async () => {
                            try {
                                const generatePDF = window.firebase.functions.httpsCallable('generateSchedulePDF');
                                const startDate = new Date();
                                const endDate = new Date();
                                endDate.setDate(endDate.getDate() + 30);
                                const result = await generatePDF({
                                    institutionId: useApp().firebaseService.currentInstitution,
                                    startDate: startDate.toISOString().split('T')[0],
                                    endDate: endDate.toISOString().split('T')[0]
                                });
                                // Download the PDF
                                const blob = new Blob([atob(result.data.pdf)], { type: 'application/pdf' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = result.data.filename;
                                a.click();
                                toast.success('PDF generated and downloaded');
                            } catch (error) {
                                toast.error('Failed to generate PDF');
                            }
                        }}
                    >
                        <Icon name="download" size={16} className="mr-2" />
                        Export PDF
                    </Button>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-700 font-medium">Live Sync</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                    >
                        <Card hover className="card-shadow-hover">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">{stat.label}</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                                    <Icon name={stat.icon} size={24} />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

// ==================== Schedule Calendar Component ====================
const ScheduleCalendar = ({ initialFilter, onNavigateToPerson }) => {
    const { firebaseService, institution } = useApp();
    const [viewMode, setViewMode] = useState(() => {
        return localStorage.getItem('scheduleViewMode') || 'month';
    });
    const [currentDate, setCurrentDate] = useState(() => {
        const startOfWeekFunc = window.dateFns ? window.dateFns.startOfWeek : (d) => d;
        const startOfMonthFunc = window.dateFns ? window.dateFns.startOfMonth : (d) => new Date(d.getFullYear(), d.getMonth(), 1);
        return viewMode === 'week' ? startOfWeekFunc(new Date(), { weekStartsOn: 0 }) : startOfMonthFunc(new Date());
    });
    const [assignments, setAssignments] = useState([]);
    const [attendings, setAttendings] = useState([]);
    const [residents, setResidents] = useState([]);
    const [draggedItem, setDraggedItem] = useState(null);
    const [showAutoScheduler, setShowAutoScheduler] = useState(false);
    const [selectedCell, setSelectedCell] = useState(null);
    const [loading, setLoading] = useState(true);

    // Individual schedule view states
    const [scheduleFilter, setScheduleFilter] = useState(initialFilter?.type || 'all');
    const [selectedPersonId, setSelectedPersonId] = useState(initialFilter?.id || null);
    const [showPersonSelector, setShowPersonSelector] = useState(false);

    // Update filter when prop changes
    useEffect(() => {
        if (initialFilter) {
            setScheduleFilter(initialFilter.type);
            setSelectedPersonId(initialFilter.id);
        }
    }, [initialFilter]);

    // Save view mode preference
    useEffect(() => {
        localStorage.setItem('scheduleViewMode', viewMode);
    }, [viewMode]);

    // Generate virtual assignments for continuity clinics and protected times
    const generateVirtualAssignments = (residents, protectedTimes) => {
        const virtual = [];
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + 30 * 86400000);

        // Generate continuity clinic assignments
        residents.forEach(resident => {
            if (resident.continuityDay && resident.continuityTime && resident.continuitySiteId) {
                const dayMap = {
                    sunday: 0,
                    monday: 1,
                    tuesday: 2,
                    wednesday: 3,
                    thursday: 4,
                    friday: 5,
                    saturday: 6
                };
                const targetDay = dayMap[resident.continuityDay];

                // Generate for next 4 weeks
                for (let week = 0; week < 4; week++) {
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay() + week * 7);
                    const targetDate = new Date(weekStart);
                    targetDate.setDate(weekStart.getDate() + targetDay);

                    if (targetDate >= today && targetDate <= thirtyDaysFromNow) {
                        virtual.push({
                            id: `continuity_${resident.id}_${targetDate.toISOString().split('T')[0]}`,
                            residentId: resident.id,
                            attendingId: null,
                            date: targetDate.toISOString().split('T')[0],
                            timeSlot: resident.continuityTime,
                            type: 'continuity',
                            siteId: resident.continuitySiteId,
                            virtual: true
                        });
                    }
                }
            }
        });

        // Generate protected time assignments
        if (protectedTimes) {
            protectedTimes.forEach(pt => {
                // Generate for next 4 weeks
                for (let week = 0; week < 4; week++) {
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay() + week * 7);
                    const targetDate = new Date(weekStart);
                    targetDate.setDate(weekStart.getDate() + pt.dayOfWeek);

                    if (targetDate >= today && targetDate <= thirtyDaysFromNow) {
                        // Create assignments for all applicable residents
                        residents.forEach(resident => {
                            const residentPGY = resident.pgyStatus || 'PGY-1';
                            if (pt.appliesTo === 'all' || pt.appliesTo === residentPGY) {
                                virtual.push({
                                    id: `protected_${pt.id}_${resident.id}_${targetDate.toISOString().split('T')[0]}`,
                                    residentId: resident.id,
                                    attendingId: null,
                                    date: targetDate.toISOString().split('T')[0],
                                    timeSlot: pt.timeSlot,
                                    type: 'protected',
                                    eventName: pt.name,
                                    eventType: pt.eventType,
                                    siteId: pt.siteId,
                                    mandatory: pt.mandatory,
                                    virtual: true
                                });
                            }
                        });
                    }
                }
            });
        }

        return virtual;
    };

    useEffect(() => {
        if (!firebaseService.currentInstitution) return;

        // Set up real-time listeners
        const unsubscribeAssignments = firebaseService.listenToAssignments((data) => {
            // Merge real assignments with virtual ones
            const virtualAssignments = generateVirtualAssignments(residents, institution?.settings?.protectedTimes);
            const mergedAssignments = [...data, ...virtualAssignments];
            setAssignments(mergedAssignments);
            setLoading(false);
        });

        const unsubscribeAttendings = firebaseService.listenToAttendings((data) => {
            setAttendings(data);
        });

        const unsubscribeResidents = firebaseService.listenToResidents((data) => {
            setResidents(data);
            // Regenerate assignments when residents change
            const virtualAssignments = generateVirtualAssignments(data, institution?.settings?.protectedTimes);
            setAssignments(prev => {
                const realAssignments = prev.filter(a => !a.virtual);
                return [...realAssignments, ...virtualAssignments];
            });
        });

        return () => {
            unsubscribeAssignments();
            unsubscribeAttendings();
            unsubscribeResidents();
        };
    }, [firebaseService.currentInstitution, institution?.settings?.protectedTimes]);

    const weekDays = useMemo(() => {
        const days = [];
        const addDaysFunc = window.dateFns ? window.dateFns.addDays : (d, n) => new Date(d.getTime() + n * 86400000);
        const startOfWeekFunc = window.dateFns ? window.dateFns.startOfWeek : (d) => d;
        const weekStart = viewMode === 'week' ? currentDate : startOfWeekFunc(currentDate, { weekStartsOn: 0 });
        // Show full week (7 days) instead of just weekdays
        for (let i = 0; i < 7; i++) {
            days.push(addDaysFunc(weekStart, i));
        }
        return days;
    }, [currentDate, viewMode]);

    const getDayName = (date) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    };

    const isWeekend = (date) => {
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
    };

    const monthDays = useMemo(() => {
        if (viewMode !== 'month') return [];

        const days = [];
        const startOfMonthFunc = window.dateFns ? window.dateFns.startOfMonth : (d) => new Date(d.getFullYear(), d.getMonth(), 1);
        const endOfMonthFunc = window.dateFns ? window.dateFns.endOfMonth : (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const startOfWeekFunc = window.dateFns ? window.dateFns.startOfWeek : (d) => d;
        const endOfWeekFunc = window.dateFns ? window.dateFns.endOfWeek : (d) => d;
        const eachDayOfIntervalFunc = window.dateFns ? window.dateFns.eachDayOfInterval : (interval) => {
            const days = [];
            const current = new Date(interval.start);
            while (current <= interval.end) {
                days.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
            return days;
        };

        const monthStart = startOfMonthFunc(currentDate);
        const monthEnd = endOfMonthFunc(currentDate);
        const calendarStart = startOfWeekFunc(monthStart);
        const calendarEnd = endOfWeekFunc(monthEnd);

        return eachDayOfIntervalFunc({ start: calendarStart, end: calendarEnd });
    }, [currentDate, viewMode]);

    const timeSlots = ['AM', 'PM'];

    const getAssignmentsForSlot = (date, timeSlot) => {
        const dateStr = window.dateFns ? window.dateFns.format(date, 'yyyy-MM-dd') : date.toISOString().split('T')[0];
        return assignments.filter(a => a.date === dateStr && a.timeSlot === timeSlot);
    };

    const handleDragStart = (e, assignment) => {
        setDraggedItem(assignment);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, date, timeSlot) => {
        e.preventDefault();
        if (!draggedItem) return;

        const dateStr = window.dateFns ? window.dateFns.format(date, 'yyyy-MM-dd') : date.toISOString().split('T')[0];

        await firebaseService.updateAssignment(draggedItem.id, {
            date: dateStr,
            timeSlot
        });

        toast.success('Assignment moved successfully');
        setDraggedItem(null);
    };

    const handleQuickAdd = async (date, timeSlot) => {
        const dateStr = window.dateFns ? window.dateFns.format(date, 'yyyy-MM-dd') : date.toISOString().split('T')[0];
        setSelectedCell({ date: dateStr, timeSlot });
    };

    const handleDeleteAssignment = async (assignmentId) => {
        if (!confirm('Delete this assignment?')) return;
        await firebaseService.deleteAssignment(assignmentId);
        toast.success('Assignment deleted');
    };

    const navigate = (direction) => {
        if (viewMode === 'week') {
            const addWeeksFunc = window.dateFns ? window.dateFns.addWeeks : (d, n) => new Date(d.getTime() + n * 7 * 86400000);
            setCurrentDate(prev => addWeeksFunc(prev, direction));
        } else {
            const addMonthsFunc = window.dateFns ? window.dateFns.addMonths : (d, n) => {
                const newDate = new Date(d);
                newDate.setMonth(newDate.getMonth() + n);
                return newDate;
            };
            setCurrentDate(prev => addMonthsFunc(prev, direction));
        }
    };

    const switchViewMode = (mode) => {
        setViewMode(mode);
        if (mode === 'week') {
            const startOfWeekFunc = window.dateFns ? window.dateFns.startOfWeek : (d) => d;
            setCurrentDate(startOfWeekFunc(currentDate, { weekStartsOn: 0 }));
        } else {
            const startOfMonthFunc = window.dateFns ? window.dateFns.startOfMonth : (d) => new Date(d.getFullYear(), d.getMonth(), 1);
            setCurrentDate(startOfMonthFunc(currentDate));
        }
    };

    const getAssignmentCount = (date) => {
        const dateStr = window.dateFns ? window.dateFns.format(date, 'yyyy-MM-dd') : date.toISOString().split('T')[0];
        return assignments.filter(a => a.date === dateStr).length;
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    const isCurrentMonth = (date) => {
        return date.getMonth() === currentDate.getMonth();
    };

    // Filter assignments based on selected person
    const getFilteredAssignments = () => {
        if (scheduleFilter === 'all' || !selectedPersonId) {
            return assignments;
        }

        if (scheduleFilter === 'resident') {
            return assignments.filter(a => a.residentId === selectedPersonId);
        }

        if (scheduleFilter === 'attending') {
            return assignments.filter(a => a.attendingId === selectedPersonId);
        }

        return assignments;
    };

    const getFilteredAssignmentsForSlot = (date, timeSlot) => {
        const dateStr = window.dateFns ? window.dateFns.format(date, 'yyyy-MM-dd') : date.toISOString().split('T')[0];
        const filtered = getFilteredAssignments();
        return filtered.filter(a => a.date === dateStr && a.timeSlot === timeSlot);
    };

    const selectPerson = (type, personId) => {
        setScheduleFilter(type);
        setSelectedPersonId(personId);
        setShowPersonSelector(false);
    };

    const clearFilter = () => {
        setScheduleFilter('all');
        setSelectedPersonId(null);
    };

    const getSelectedPersonName = () => {
        if (scheduleFilter === 'resident' && selectedPersonId) {
            const resident = residents.find(r => r.id === selectedPersonId);
            return resident?.name || 'Unknown';
        }
        if (scheduleFilter === 'attending' && selectedPersonId) {
            const attending = attendings.find(a => a.id === selectedPersonId);
            return attending?.name || 'Unknown';
        }
        return null;
    };

    if (loading) {
        return <LoadingSpinner size="lg" className="py-12" />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Schedule Calendar
                        {getSelectedPersonName() && (
                            <span className="ml-2 text-lg font-normal text-gray-600">
                                - {getSelectedPersonName()}
                            </span>
                        )}
                    </h2>
                    <p className="text-gray-600">
                        {scheduleFilter === 'all'
                            ? 'Drag and drop to manage assignments'
                            : `Viewing ${scheduleFilter} schedule`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Person Selector Dropdown */}
                    <div className="relative">
                        <Button
                            variant="secondary"
                            onClick={() => setShowPersonSelector(!showPersonSelector)}
                        >
                            <Icon name="user" size={16} className="mr-2" />
                            {scheduleFilter === 'all' ? 'All Schedules' : getSelectedPersonName()}
                            <Icon name="chevron-down" size={16} className="ml-2" />
                        </Button>

                        {showPersonSelector && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                                <button
                                    onClick={clearFilter}
                                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${scheduleFilter === 'all' ? 'bg-primary-50 text-primary-700' : ''}`}
                                >
                                    <Icon name="users" size={16} className="inline mr-2" />
                                    All Schedules
                                </button>

                                {residents.length > 0 && (
                                    <>
                                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                                            RESIDENTS
                                        </div>
                                        {residents.map(resident => (
                                            <button
                                                key={resident.id}
                                                onClick={() => selectPerson('resident', resident.id)}
                                                className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                                                    scheduleFilter === 'resident' && selectedPersonId === resident.id
                                                        ? 'bg-primary-50 text-primary-700'
                                                        : ''
                                                }`}
                                            >
                                                <Icon name="user" size={16} className="inline mr-2" />
                                                {resident.name}
                                                <span className="text-xs text-gray-500 ml-1">
                                                    ({resident.pgyStatus || `PGY-${resident.year || 1}`})
                                                </span>
                                            </button>
                                        ))}
                                    </>
                                )}

                                {attendings.length > 0 && (
                                    <>
                                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                                            ATTENDINGS
                                        </div>
                                        {attendings.map(attending => (
                                            <button
                                                key={attending.id}
                                                onClick={() => selectPerson('attending', attending.id)}
                                                className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                                                    scheduleFilter === 'attending' && selectedPersonId === attending.id
                                                        ? 'bg-primary-50 text-primary-700'
                                                        : ''
                                                }`}
                                            >
                                                <Icon name="user-check" size={16} className="inline mr-2" />
                                                {attending.name}
                                            </button>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    {/* View Mode Toggle */}
                    <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-white">
                        <button
                            onClick={() => switchViewMode('month')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                viewMode === 'month'
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => switchViewMode('week')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                viewMode === 'week'
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Week
                        </button>
                    </div>

                    {/* Navigation */}
                    <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
                        <Icon name="chevron-left" size={16} />
                    </Button>
                    <span className="font-medium text-gray-700 min-w-[150px] text-center">
                        {viewMode === 'month'
                            ? (window.dateFns ? window.dateFns.format(currentDate, 'MMMM yyyy') : `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`)
                            : (window.dateFns ? window.dateFns.format(currentDate, 'MMM d, yyyy') : currentDate.toLocaleDateString())
                        }
                    </span>
                    <Button variant="secondary" size="sm" onClick={() => navigate(1)}>
                        <Icon name="chevron-right" size={16} />
                    </Button>
                    <Button onClick={() => setShowAutoScheduler(true)}>
                        <Icon name="sparkles" size={16} className="mr-2" />
                        Auto-Schedule
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <Card className="overflow-hidden">
                {viewMode === 'week' ? (
                    /* Week View */
                    <div className="calendar-grid-week">
                        {/* Header Row with Day Names */}
                        <div className="bg-gray-50 p-2 font-medium text-gray-700">Time</div>
                        {weekDays.map(day => (
                            <div
                                key={day}
                                className={`p-2 font-medium text-center ${
                                    isWeekend(day) ? 'bg-gray-200 text-gray-500' : 'bg-gray-50'
                                } ${isToday(day) ? 'bg-primary-50 text-primary-700' : isWeekend(day) ? 'text-gray-500' : 'text-gray-700'}`}
                            >
                                <div className="text-sm font-semibold">{getDayName(day)}</div>
                                <div className="text-xs">
                                    {window.dateFns ? window.dateFns.format(day, 'MMM d') : day.toLocaleDateString()}
                                </div>
                            </div>
                        ))}

                        {/* Time Slots */}
                        {timeSlots.map(timeSlot => (
                            <React.Fragment key={timeSlot}>
                                <div className="bg-gray-50 p-4 font-medium text-gray-700">
                                    {timeSlot}
                                </div>
                                {weekDays.map(day => {
                                    const slotAssignments = getFilteredAssignmentsForSlot(day, timeSlot);
                                    const isWeekendDay = isWeekend(day);
                                    const isTodaySlot = isToday(day);

                                    return (
                                        <div
                                            key={`${day}-${timeSlot}`}
                                            className={`time-slot ${isWeekendDay ? 'weekend-slot' : ''} ${isTodaySlot ? 'today-slot' : ''}`}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, day, timeSlot)}
                                            onClick={() => handleQuickAdd(day, timeSlot)}
                                        >
                                            {slotAssignments.map(assignment => {
                                                const resident = residents.find(r => r.id === assignment.residentId);
                                                const attending = attendings.find(a => a.id === assignment.attendingId);

                                                return (
                                                    <div
                                                        key={assignment.id}
                                                        draggable={assignment.type !== 'protected'}
                                                        onDragStart={(e) => handleDragStart(e, assignment)}
                                                        className={`assignment-card ${
                                                            assignment.type === 'protected' ? 'bg-gray-100 border-gray-300 opacity-75' :
                                                            assignment.type === 'continuity' ? 'bg-amber-50 border-amber-200' :
                                                            ''
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                {assignment.type === 'protected' ? (
                                                                    <>
                                                                        <div className="font-medium text-gray-700">
                                                                            {assignment.eventName || 'Protected Time'}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">
                                                                            {resident?.name || 'All Residents'}
                                                                        </div>
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-700">
                                                                            <Icon name="shield" size={10} className="mr-1" />
                                                                            Protected
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (resident && onNavigateToPerson) {
                                                                                    onNavigateToPerson('resident', assignment.residentId);
                                                                                }
                                                                            }}
                                                                            className="font-medium text-gray-900 hover:text-blue-600 text-left"
                                                                        >
                                                                            {resident?.name || 'Unknown Resident'}
                                                                        </button>
                                                                        {assignment.type === 'continuity' ? (
                                                                            <>
                                                                                <div className="text-sm text-gray-600">
                                                                                    Continuity Clinic
                                                                                </div>
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
                                                                                    <Icon name="repeat" size={10} className="mr-1" />
                                                                                    Continuity
                                                                                </span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        if (attending && onNavigateToPerson) {
                                                                                            onNavigateToPerson('attending', assignment.attendingId);
                                                                                        }
                                                                                    }}
                                                                                    className="text-gray-600 hover:text-blue-600 block text-left"
                                                                                >
                                                                                    {attending?.name || 'Unknown Attending'}
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                            {!assignment.virtual && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteAssignment(assignment.id);
                                                                    }}
                                                                    className="text-gray-400 hover:text-red-600"
                                                                >
                                                                    <Icon name="x" size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                ) : (
                    /* Month View */
                    <div className="calendar-grid-month">
                        {/* Day Headers */}
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                            <div key={day} className={`p-2 text-center font-medium text-sm ${
                                index === 0 || index === 6
                                    ? 'bg-gray-100 text-gray-500'
                                    : 'bg-gray-50 text-gray-700'
                            }`}>
                                {day}
                            </div>
                        ))}

                        {/* Month Days */}
                        {monthDays.map(day => {
                            const dateStr = window.dateFns ? window.dateFns.format(day, 'yyyy-MM-dd') : day.toISOString().split('T')[0];
                            const filtered = getFilteredAssignments();
                            const dayAssignments = filtered.filter(a => a.date === dateStr);
                            const amAssignments = dayAssignments.filter(a => a.timeSlot === 'AM');
                            const pmAssignments = dayAssignments.filter(a => a.timeSlot === 'PM');

                            return (
                                <div
                                    key={dateStr}
                                    className={`month-day-cell ${!isCurrentMonth(day) ? 'opacity-50' : ''} ${isToday(day) ? 'ring-2 ring-primary-500' : ''} ${isWeekend(day) ? 'weekend-slot' : ''}`}
                                    onClick={() => {
                                        if (isCurrentMonth(day)) {
                                            // Switch to week view for this day
                                            const startOfWeekFunc = window.dateFns ? window.dateFns.startOfWeek : (d) => d;
                                            setCurrentDate(startOfWeekFunc(day, { weekStartsOn: 0 }));
                                            setViewMode('week');
                                        }
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-sm font-medium ${!isCurrentMonth(day) ? 'text-gray-400' : 'text-gray-700'}`}>
                                            {day.getDate()}
                                        </span>
                                        {dayAssignments.length > 0 && (
                                            <span className="bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded-full">
                                                {dayAssignments.length}
                                            </span>
                                        )}
                                    </div>

                                    {/* AM Slot */}
                                    <div
                                        className={`mb-1 ${amAssignments.length > 0 ? '' : 'min-h-[30px]'}`}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, day, 'AM')}
                                    >
                                        {amAssignments.length > 0 && (
                                            <>
                                                <div className="text-xs font-medium text-gray-500">AM</div>
                                                <div className="space-y-0.5">
                                                    {amAssignments.slice(0, 2).map(assignment => {
                                                        const resident = residents.find(r => r.id === assignment.residentId);
                                                        return (
                                                            <div
                                                                key={assignment.id}
                                                                draggable
                                                                onDragStart={(e) => handleDragStart(e, assignment)}
                                                                className="text-xs bg-blue-50 rounded px-1 py-0.5 truncate cursor-move hover:bg-blue-100"
                                                                title={resident?.name}
                                                            >
                                                                {resident?.name?.split(' ').map(n => n[0]).join('') || '??'}
                                                            </div>
                                                        );
                                                    })}
                                                    {amAssignments.length > 2 && (
                                                        <div className="text-xs text-gray-500">+{amAssignments.length - 2}</div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* PM Slot */}
                                    <div
                                        className={`${pmAssignments.length > 0 ? '' : 'min-h-[30px]'}`}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, day, 'PM')}
                                    >
                                        {pmAssignments.length > 0 && (
                                            <>
                                                <div className="text-xs font-medium text-gray-500">PM</div>
                                                <div className="space-y-0.5">
                                                    {pmAssignments.slice(0, 2).map(assignment => {
                                                        const resident = residents.find(r => r.id === assignment.residentId);
                                                        return (
                                                            <div
                                                                key={assignment.id}
                                                                draggable
                                                                onDragStart={(e) => handleDragStart(e, assignment)}
                                                                className="text-xs bg-green-50 rounded px-1 py-0.5 truncate cursor-move hover:bg-green-100"
                                                                title={resident?.name}
                                                            >
                                                                {resident?.name?.split(' ').map(n => n[0]).join('') || '??'}
                                                            </div>
                                                        );
                                                    })}
                                                    {pmAssignments.length > 2 && (
                                                        <div className="text-xs text-gray-500">+{pmAssignments.length - 2}</div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Quick Add Modal */}
            {selectedCell && (
                <Modal
                    isOpen={true}
                    onClose={() => setSelectedCell(null)}
                    title="Add Assignment"
                >
                    <AssignmentForm
                        date={selectedCell.date}
                        timeSlot={selectedCell.timeSlot}
                        residents={residents}
                        attendings={attendings}
                        onSave={async (data) => {
                            await firebaseService.addAssignment(data);
                            toast.success('Assignment added');
                            setSelectedCell(null);
                        }}
                        onCancel={() => setSelectedCell(null)}
                    />
                </Modal>
            )}

            {/* Auto-Scheduler Modal */}
            {showAutoScheduler && (
                <Modal
                    isOpen={true}
                    onClose={() => setShowAutoScheduler(false)}
                    title="Auto-Schedule Assignments"
                >
                    <AutoScheduler
                        onClose={() => setShowAutoScheduler(false)}
                    />
                </Modal>
            )}
        </div>
    );
};

// Assignment Form Component
const AssignmentForm = ({ date, timeSlot, residents, attendings, onSave, onCancel }) => {
    const { institution } = useApp();
    const sites = institution?.settings?.sites || [];
    const rotations = institution?.settings?.rotations || [];

    const [formData, setFormData] = useState({
        date,
        timeSlot,
        residentId: '',
        attendingId: '',
        type: 'clinical',
        siteId: '',
        rotationId: ''
    });

    // Get resident's current rotation for the month
    const getResidentRotation = (residentId) => {
        if (!residentId) return null;
        const resident = residents.find(r => r.id === residentId);
        if (!resident) return null;

        const monthStr = new Date(date).toISOString().slice(0, 7);
        const assignment = resident.rotationAssignments?.find(ra => ra.month === monthStr);
        if (!assignment) return null;

        return rotations.find(r => r.id === assignment.rotationId);
    };

    // Get available attendings based on rotation and time slot
    const getAvailableAttendings = () => {
        if (!formData.residentId) return attendings;

        const rotation = getResidentRotation(formData.residentId);
        if (!rotation) return attendings;

        const dayOfWeek = new Date(date).getDay();

        // Filter attendings who:
        // 1. Support this rotation
        // 2. Have clinic sessions on this day/time
        return attendings.filter(attending => {
            const supportsRotation = attending.rotationIds?.includes(rotation.id);
            const hasClinicSession = attending.clinicSchedule?.some(session =>
                session.dayOfWeek === dayOfWeek &&
                session.timeSlot === timeSlot
            );
            return supportsRotation && hasClinicSession;
        });
    };

    const availableAttendings = getAvailableAttendings();

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resident</label>
                <select
                    value={formData.residentId}
                    onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                >
                    <option value="">Select Resident</option>
                    {residents.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attending
                    {availableAttendings.length === 0 && formData.residentId && (
                        <span className="text-red-500 text-xs ml-2">No attendings available for this rotation/time</span>
                    )}
                </label>
                <select
                    value={formData.attendingId}
                    onChange={(e) => {
                        const attendingId = e.target.value;
                        const attending = attendings.find(a => a.id === attendingId);
                        const dayOfWeek = new Date(date).getDay();
                        const session = attending?.clinicSchedule?.find(s =>
                            s.dayOfWeek === dayOfWeek && s.timeSlot === timeSlot
                        );
                        setFormData({
                            ...formData,
                            attendingId,
                            siteId: session?.siteId || '',
                            rotationId: getResidentRotation(formData.residentId)?.id || ''
                        });
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                >
                    <option value="">Select Attending</option>
                    {availableAttendings.map(a => {
                        const dayOfWeek = new Date(date).getDay();
                        const session = a.clinicSchedule?.find(s =>
                            s.dayOfWeek === dayOfWeek && s.timeSlot === timeSlot
                        );
                        const site = sites.find(s => s.id === session?.siteId);
                        return (
                            <option key={a.id} value={a.id}>
                                {a.name} {site && `(${site.name})`}
                            </option>
                        );
                    })}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                >
                    <option value="clinical">Clinical</option>
                    <option value="continuity">Continuity</option>
                </select>
            </div>
            <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};

// ==================== Attendings List Component ====================
const AttendingsList = ({ navigateToSchedule }) => {
    const { firebaseService } = useApp();
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
                <Button onClick={() => setEditingAttending({})}>
                    <Icon name="plus" size={16} className="mr-2" />
                    Add Attending
                </Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4">Name</th>
                                <th className="text-left py-3 px-4">Clinic Sessions</th>
                                <th className="text-left py-3 px-4">Total Capacity</th>
                                <th className="text-left py-3 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendings.map(attending => {
                                const sessionCount = attending.clinicSchedule?.length || 0;
                                const totalCapacity = attending.clinicSchedule?.reduce((sum, s) => sum + (s.maxResidents || 0), 0) || 0;
                                return (
                                <tr key={attending.id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4">{attending.name}</td>
                                    <td className="py-3 px-4">{sessionCount} sessions/week</td>
                                    <td className="py-3 px-4">{totalCapacity} residents</td>
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
                                                onClick={() => setEditingAttending(attending)}
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

// Attending Form Component
const AttendingForm = ({ attending, onSave, onCancel }) => {
    const { institution } = useApp();
    const sites = institution?.settings?.sites || [];
    const rotations = institution?.settings?.rotations || [];

    const [formData, setFormData] = useState({
        name: attending.name || '',
        clinicSchedule: attending.clinicSchedule || [],
        rotationIds: attending.rotationIds || [],
        ...attending
    });

    const daysOfWeek = [
        { id: 0, name: 'Sunday', short: 'Sun' },
        { id: 1, name: 'Monday', short: 'Mon' },
        { id: 2, name: 'Tuesday', short: 'Tue' },
        { id: 3, name: 'Wednesday', short: 'Wed' },
        { id: 4, name: 'Thursday', short: 'Thu' },
        { id: 5, name: 'Friday', short: 'Fri' },
        { id: 6, name: 'Saturday', short: 'Sat' }
    ];

    const timeSlots = ['AM', 'PM'];

    const toggleClinicSession = (siteId, dayOfWeek, timeSlot) => {
        const scheduleIndex = formData.clinicSchedule.findIndex(
            s => s.siteId === siteId && s.dayOfWeek === dayOfWeek && s.timeSlot === timeSlot
        );

        if (scheduleIndex >= 0) {
            // Remove session
            setFormData({
                ...formData,
                clinicSchedule: formData.clinicSchedule.filter((_, i) => i !== scheduleIndex)
            });
        } else {
            // Add session
            setFormData({
                ...formData,
                clinicSchedule: [...formData.clinicSchedule, {
                    siteId,
                    dayOfWeek,
                    timeSlot,
                    maxResidents: 2
                }]
            });
        }
    };

    const updateSessionResidents = (siteId, dayOfWeek, timeSlot, maxResidents) => {
        setFormData({
            ...formData,
            clinicSchedule: formData.clinicSchedule.map(session =>
                session.siteId === siteId && session.dayOfWeek === dayOfWeek && session.timeSlot === timeSlot
                    ? { ...session, maxResidents: parseInt(maxResidents) || 1 }
                    : session
            )
        });
    };

    const getSession = (siteId, dayOfWeek, timeSlot) => {
        return formData.clinicSchedule.find(
            s => s.siteId === siteId && s.dayOfWeek === dayOfWeek && s.timeSlot === timeSlot
        );
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Supported Rotations</label>
                <p className="text-xs text-gray-500 mb-2">Select rotations this attending supports</p>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                    {rotations.map(rotation => (
                        <label key={rotation.id} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.rotationIds?.includes(rotation.id)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFormData({
                                            ...formData,
                                            rotationIds: [...(formData.rotationIds || []), rotation.id]
                                        });
                                    } else {
                                        setFormData({
                                            ...formData,
                                            rotationIds: formData.rotationIds?.filter(id => id !== rotation.id) || []
                                        });
                                    }
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Clinic Schedule</label>
                <p className="text-xs text-gray-500 mb-3">Click cells to add/remove clinic sessions. Enter resident capacity for each session.</p>

                {sites.map(site => (
                    <div key={site.id} className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: site.color }}
                            />
                            <span className="font-medium text-sm">{site.name}</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="w-16"></th>
                                        {daysOfWeek.map(day => (
                                            <th key={day.id} className="text-xs font-medium text-gray-600 p-1">
                                                {day.short}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {timeSlots.map(timeSlot => (
                                        <tr key={timeSlot}>
                                            <td className="text-xs font-medium text-gray-600 p-1">{timeSlot}</td>
                                            {daysOfWeek.map(day => {
                                                const session = getSession(site.id, day.id, timeSlot);
                                                const isWeekend = day.id === 0 || day.id === 6;
                                                return (
                                                    <td key={`${day.id}-${timeSlot}`} className="p-1">
                                                        <div
                                                            onClick={() => toggleClinicSession(site.id, day.id, timeSlot)}
                                                            className={`border rounded cursor-pointer transition-colors ${
                                                                session
                                                                    ? 'bg-primary-100 border-primary-300'
                                                                    : isWeekend
                                                                    ? 'bg-gray-50 border-gray-200'
                                                                    : 'bg-white border-gray-300 hover:bg-gray-50'
                                                            } p-1`}
                                                        >
                                                            {session && (
                                                                <input
                                                                    type="number"
                                                                    value={session.maxResidents}
                                                                    onChange={(e) => {
                                                                        e.stopPropagation();
                                                                        updateSessionResidents(site.id, day.id, timeSlot, e.target.value);
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="w-full text-center text-xs p-0 border-0 bg-transparent"
                                                                    min="1"
                                                                    max="9"
                                                                />
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};

// ==================== Residents List Component ====================
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
                                        const primarySite = rotation?.isMultiSite ? null : (rotation?.siteIds?.[0] || sites[0]?.id);
                                        setRotationForMonth(month, e.target.value, primarySite);
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
                                    return !rotation?.isMultiSite && (
                                        <select
                                            value={assignment.primarySiteId || ''}
                                            onChange={(e) => setRotationForMonth(month, assignment.rotationId, e.target.value)}
                                            className="w-32 px-2 py-1 border rounded text-sm"
                                        >
                                            <option value="">Select Site</option>
                                            {sites
                                                .filter(s => rotation?.siteIds?.includes(s.id))
                                                .map(s => (
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
                                <option value="sunday">Sunday</option>
                                <option value="monday">Monday</option>
                                <option value="tuesday">Tuesday</option>
                                <option value="wednesday">Wednesday</option>
                                <option value="thursday">Thursday</option>
                                <option value="friday">Friday</option>
                                <option value="saturday">Saturday</option>
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

            <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};

// ==================== Rules List Component ====================
const RulesList = () => {
    const { firebaseService } = useApp();
    const [rules, setRules] = useState([]);
    const [editingRule, setEditingRule] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firebaseService.currentInstitution) return;

        const unsubscribe = firebaseService.listenToRules((data) => {
            setRules(data);
            setLoading(false);
        });

        return unsubscribe;
    }, [firebaseService.currentInstitution]);

    const handleSave = async (ruleData) => {
        if (ruleData.id) {
            await firebaseService.updateRule(ruleData.id, ruleData);
            toast.success('Rule updated');
        } else {
            await firebaseService.addRule(ruleData);
            toast.success('Rule added');
        }
        setEditingRule(null);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this rule?')) return;
        await firebaseService.deleteRule(id);
        toast.success('Rule deleted');
    };

    const handleToggleActive = async (rule) => {
        await firebaseService.updateRule(rule.id, { active: !rule.active });
        toast.success(`Rule ${rule.active ? 'disabled' : 'enabled'}`);
    };

    if (loading) {
        return <LoadingSpinner size="lg" className="py-12" />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Scheduling Rules</h2>
                    <p className="text-gray-600">Configure automatic scheduling constraints</p>
                </div>
                <Button onClick={() => setEditingRule({})}>
                    <Icon name="plus" size={16} className="mr-2" />
                    Add Rule
                </Button>
            </div>

            <div className="grid gap-4">
                {rules.map(rule => (
                    <Card key={rule.id} className="hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-medium text-gray-900">{rule.name}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        rule.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                        {rule.active ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        rule.type === 'hard' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {rule.type === 'hard' ? 'Hard Rule' : 'Soft Rule'}
                                    </span>
                                </div>
                                <p className="text-gray-600 mt-2">{rule.description}</p>
                                <p className="text-sm text-gray-500 mt-2">Conditions: {rule.conditions}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleToggleActive(rule)}
                                    className="text-gray-600 hover:text-primary-600"
                                >
                                    <Icon name={rule.active ? 'toggle-right' : 'toggle-left'} size={20} />
                                </button>
                                <button
                                    onClick={() => setEditingRule(rule)}
                                    className="text-primary-600 hover:text-primary-700"
                                >
                                    <Icon name="pencil" size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(rule.id)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Icon name="trash" size={16} />
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {editingRule && (
                <Modal
                    isOpen={true}
                    onClose={() => setEditingRule(null)}
                    title={editingRule.id ? 'Edit Rule' : 'Add Rule'}
                >
                    <RuleForm
                        rule={editingRule}
                        onSave={handleSave}
                        onCancel={() => setEditingRule(null)}
                    />
                </Modal>
            )}
        </div>
    );
};

// Rule Form Component
const RuleForm = ({ rule, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: rule.name || '',
        description: rule.description || '',
        type: rule.type || 'soft',
        conditions: rule.conditions || '',
        active: rule.active !== false,
        ...rule
    });

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
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                >
                    <option value="soft">Soft Rule (Preference)</option>
                    <option value="hard">Hard Rule (Constraint)</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Conditions</label>
                <textarea
                    value={formData.conditions}
                    onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                    placeholder="e.g., Residents must not work more than 3 days in a row"
                    required
                />
            </div>
            <div>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
            </div>
            <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};

// ==================== Settings View Component ====================
const SettingsView = () => {
    const { firebaseService, institution } = useApp();
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState({
        institutionName: institution?.name || '',
        timezone: institution?.settings?.timezone || 'America/New_York',
        workDays: institution?.settings?.workDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        autoScheduleEnabled: institution?.settings?.autoScheduleEnabled !== false,
        notificationsEnabled: institution?.settings?.notificationsEnabled !== false,
        sites: institution?.settings?.sites || [
            { id: 'site_1', name: 'Main Clinic', code: 'MAIN', color: '#10b981', address: '' }
        ],
        rotations: institution?.settings?.rotations || [
            { id: 'rot_1', name: 'General', code: 'GEN', siteIds: ['site_1'], isMultiSite: false, requirements: {} }
        ],
        protectedTimes: institution?.settings?.protectedTimes || []
    });
    const [saving, setSaving] = useState(false);
    const [editingSite, setEditingSite] = useState(null);
    const [editingRotation, setEditingRotation] = useState(null);
    const [editingProtectedTime, setEditingProtectedTime] = useState(null);

    const handleSave = async () => {
        setSaving(true);
        await firebaseService.updateInstitutionSettings(settings);
        toast.success('Settings saved');
        setSaving(false);
    };

    const tabs = [
        { id: 'general', name: 'General', icon: 'settings' },
        { id: 'sites', name: 'Sites', icon: 'map-pin' },
        { id: 'rotations', name: 'Rotations', icon: 'repeat' },
        { id: 'protected', name: 'Protected Times', icon: 'shield' },
        { id: 'schedule', name: 'Schedule', icon: 'calendar' }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <p className="text-gray-600">Configure institution preferences</p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <Icon name={tab.icon} size={16} />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            <Card>
                <div className="space-y-6">
                    {activeTab === 'general' && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Institution Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Institution Name</label>
                                <input
                                    type="text"
                                    value={settings.institutionName}
                                    onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                                <select
                                    value={settings.timezone}
                                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="America/New_York">Eastern Time</option>
                                    <option value="America/Chicago">Central Time</option>
                                    <option value="America/Denver">Mountain Time</option>
                                    <option value="America/Los_Angeles">Pacific Time</option>
                                </select>
                            </div>
                        </div>
                        </div>
                    )}

                    {activeTab === 'sites' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Clinical Sites</h3>
                                <Button
                                    onClick={() => setEditingSite({})}
                                    size="sm"
                                >
                                    <Icon name="plus" size={16} className="mr-1" />
                                    Add Site
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {settings.sites.map(site => (
                                    <div key={site.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: site.color }}
                                            />
                                            <div>
                                                <div className="font-medium">{site.name} ({site.code})</div>
                                                {site.address && (
                                                    <div className="text-sm text-gray-500">{site.address}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingSite(site)}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <Icon name="pencil" size={16} />
                                            </button>
                                            {settings.sites.length > 1 && (
                                                <button
                                                    onClick={() => {
                                                        setSettings({
                                                            ...settings,
                                                            sites: settings.sites.filter(s => s.id !== site.id)
                                                        });
                                                    }}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Icon name="trash-2" size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'rotations' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Rotation Types</h3>
                                <Button
                                    onClick={() => setEditingRotation({})}
                                    size="sm"
                                >
                                    <Icon name="plus" size={16} className="mr-1" />
                                    Add Rotation
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {settings.rotations.map(rotation => (
                                    <div key={rotation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <div className="font-medium">{rotation.name} ({rotation.code})</div>
                                            <div className="text-sm text-gray-500">
                                                {rotation.isMultiSite ? 'Multi-site' : 'Single site'} •
                                                {rotation.siteIds?.length || 0} site(s)
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingRotation(rotation)}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <Icon name="pencil" size={16} />
                                            </button>
                                            {settings.rotations.length > 1 && (
                                                <button
                                                    onClick={() => {
                                                        setSettings({
                                                            ...settings,
                                                            rotations: settings.rotations.filter(r => r.id !== rotation.id)
                                                        });
                                                    }}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Icon name="trash-2" size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'protected' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Protected Times</h3>
                                <Button
                                    onClick={() => setEditingProtectedTime({})}
                                    size="sm"
                                >
                                    <Icon name="plus" size={16} className="mr-1" />
                                    Add Protected Time
                                </Button>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Define recurring weekly events like Didactics, Grand Rounds, or protected educational time.
                            </p>
                            <div className="space-y-2">
                                {settings.protectedTimes.map(pt => (
                                    <div key={pt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <div className="font-medium">{pt.name}</div>
                                            <div className="text-sm text-gray-500">
                                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pt.dayOfWeek]} {pt.timeSlot}
                                                {pt.appliesTo && pt.appliesTo !== 'all' && ` • ${pt.appliesTo.toUpperCase()}`}
                                                {pt.mandatory && ' • Mandatory'}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingProtectedTime(pt)}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <Icon name="pencil" size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSettings({
                                                        ...settings,
                                                        protectedTimes: settings.protectedTimes.filter(p => p.id !== pt.id)
                                                    });
                                                }}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Icon name="trash-2" size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {settings.protectedTimes.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        No protected times defined. Click "Add Protected Time" to create one.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Preferences</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Work Days</label>
                                    <div className="space-y-2">
                                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                                            <label key={day} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.workDays.includes(day)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSettings({ ...settings, workDays: [...settings.workDays, day] });
                                                        } else {
                                                            setSettings({ ...settings, workDays: settings.workDays.filter(d => d !== day) });
                                                        }
                                                    }}
                                                    className="rounded"
                                                />
                                                <span className="text-sm capitalize">{day}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={settings.autoScheduleEnabled}
                                            onChange={(e) => setSettings({ ...settings, autoScheduleEnabled: e.target.checked })}
                                            className="rounded"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Enable Auto-Scheduling</span>
                                    </label>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={settings.notificationsEnabled}
                                            onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                                            className="rounded"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Enable Notifications</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Site Edit Modal */}
            {editingSite && (
                <Modal
                    isOpen={true}
                    onClose={() => setEditingSite(null)}
                    title={editingSite.id ? 'Edit Site' : 'Add Site'}
                >
                    <SiteForm
                        site={editingSite}
                        existingSites={settings.sites}
                        onSave={(siteData) => {
                            if (siteData.id) {
                                setSettings({
                                    ...settings,
                                    sites: settings.sites.map(s => s.id === siteData.id ? siteData : s)
                                });
                            } else {
                                const newSite = {
                                    ...siteData,
                                    id: `site_${Date.now()}`
                                };
                                setSettings({
                                    ...settings,
                                    sites: [...settings.sites, newSite]
                                });
                            }
                            setEditingSite(null);
                        }}
                        onCancel={() => setEditingSite(null)}
                    />
                </Modal>
            )}

            {/* Rotation Edit Modal */}
            {editingRotation && (
                <Modal
                    isOpen={true}
                    onClose={() => setEditingRotation(null)}
                    title={editingRotation.id ? 'Edit Rotation' : 'Add Rotation'}
                >
                    <RotationForm
                        rotation={editingRotation}
                        sites={settings.sites}
                        existingRotations={settings.rotations}
                        onSave={(rotationData) => {
                            if (rotationData.id) {
                                setSettings({
                                    ...settings,
                                    rotations: settings.rotations.map(r => r.id === rotationData.id ? rotationData : r)
                                });
                            } else {
                                const newRotation = {
                                    ...rotationData,
                                    id: `rot_${Date.now()}`
                                };
                                setSettings({
                                    ...settings,
                                    rotations: [...settings.rotations, newRotation]
                                });
                            }
                            setEditingRotation(null);
                        }}
                        onCancel={() => setEditingRotation(null)}
                    />
                </Modal>
            )}

            {/* Protected Time Edit Modal */}
            {editingProtectedTime && (
                <Modal
                    isOpen={true}
                    onClose={() => setEditingProtectedTime(null)}
                    title={editingProtectedTime.id ? 'Edit Protected Time' : 'Add Protected Time'}
                >
                    <ProtectedTimeForm
                        protectedTime={editingProtectedTime}
                        sites={settings.sites}
                        onSave={(ptData) => {
                            if (ptData.id) {
                                setSettings({
                                    ...settings,
                                    protectedTimes: settings.protectedTimes.map(pt => pt.id === ptData.id ? ptData : pt)
                                });
                            } else {
                                const newPT = {
                                    ...ptData,
                                    id: `pt_${Date.now()}`
                                };
                                setSettings({
                                    ...settings,
                                    protectedTimes: [...settings.protectedTimes, newPT]
                                });
                            }
                            setEditingProtectedTime(null);
                        }}
                        onCancel={() => setEditingProtectedTime(null)}
                    />
                </Modal>
            )}
        </div>
    );
};

// Site Form Component
const SiteForm = ({ site, existingSites, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: site.name || '',
        code: site.code || '',
        address: site.address || '',
        color: site.color || '#10b981',
        ...site
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Main Hospital"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., MAIN"
                    maxLength="5"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="123 Medical Center Dr, City, State 12345"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="h-10 w-20"
                    />
                    <span className="text-sm text-gray-600">{formData.color}</span>
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Site</Button>
            </div>
        </form>
    );
};

// Rotation Form Component
const RotationForm = ({ rotation, sites, existingRotations, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: rotation.name || '',
        code: rotation.code || '',
        siteIds: rotation.siteIds || [],
        isMultiSite: rotation.isMultiSite || false,
        requirements: rotation.requirements || {},
        ...rotation
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rotation Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Pediatrics"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., PEDS"
                    maxLength="10"
                    required
                />
            </div>
            <div>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={formData.isMultiSite}
                        onChange={(e) => setFormData({ ...formData, isMultiSite: e.target.checked })}
                        className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Multi-site rotation</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">Check if residents on this rotation work at multiple sites</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Associated Sites</label>
                <div className="space-y-2">
                    {sites.map(site => (
                        <label key={site.id} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.siteIds.includes(site.id)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFormData({ ...formData, siteIds: [...formData.siteIds, site.id] });
                                    } else {
                                        setFormData({ ...formData, siteIds: formData.siteIds.filter(id => id !== site.id) });
                                    }
                                }}
                                className="rounded"
                            />
                            <span className="text-sm">{site.name} ({site.code})</span>
                        </label>
                    ))}
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Rotation</Button>
            </div>
        </form>
    );
};

// Protected Time Form Component
const ProtectedTimeForm = ({ protectedTime, sites, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: protectedTime.name || '',
        dayOfWeek: protectedTime.dayOfWeek ?? 3, // Default to Wednesday
        timeSlot: protectedTime.timeSlot || 'AM',
        appliesTo: protectedTime.appliesTo || 'all',
        mandatory: protectedTime.mandatory ?? true,
        eventType: protectedTime.eventType || 'didactics',
        siteId: protectedTime.siteId || '',
        ...protectedTime
    });

    const daysOfWeek = [
        { value: 0, label: 'Sunday' },
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' }
    ];

    const pgyLevels = ['all', 'PGY-1', 'PGY-2', 'PGY-3', 'PGY-4', 'PGY-5+'];
    const eventTypes = [
        { value: 'didactics', label: 'Didactics' },
        { value: 'grand-rounds', label: 'Grand Rounds' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'protected', label: 'Protected Education' },
        { value: 'other', label: 'Other' }
    ];

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Weekly Didactics"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                >
                    {eventTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                    <select
                        value={formData.dayOfWeek}
                        onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                    >
                        {daysOfWeek.map(day => (
                            <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                    <select
                        value={formData.timeSlot}
                        onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                    >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Applies To</label>
                <select
                    value={formData.appliesTo}
                    onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                >
                    {pgyLevels.map(level => (
                        <option key={level} value={level}>
                            {level === 'all' ? 'All Residents' : level}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site (Optional)</label>
                <select
                    value={formData.siteId}
                    onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                >
                    <option value="">All Sites</option>
                    {sites.map(site => (
                        <option key={site.id} value={site.id}>
                            {site.name} ({site.code})
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={formData.mandatory}
                        onChange={(e) => setFormData({ ...formData, mandatory: e.target.checked })}
                        className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Mandatory Attendance</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                    If checked, residents must attend unless explicitly excused
                </p>
            </div>

            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Protected Time</Button>
            </div>
        </form>
    );
};

// ==================== Auto-Scheduler Component ====================
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

// ==================== Main App Component ====================
const App = () => {
    const { user, loading } = useApp();
    const [activeView, setActiveView] = useState('dashboard');
    const [scheduleFilterData, setScheduleFilterData] = useState(null);

    const navigateToSchedule = (personType, personId) => {
        setScheduleFilterData({ type: personType, id: personId });
        setActiveView('schedule');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
        { id: 'schedule', label: 'Schedule', icon: 'calendar' },
        { id: 'attendings', label: 'Attendings', icon: 'users' },
        { id: 'residents', label: 'Residents', icon: 'user-check' },
        { id: 'rules', label: 'Rules', icon: 'shield-check' },
        { id: 'settings', label: 'Settings', icon: 'settings' }
    ];

    const handleSignOut = async () => {
        const { firebaseService } = useApp();
        await firebaseService.signOut();
        toast.success('Signed out successfully');
    };

    return (
        <div className="min-h-screen font-body" style={{ background: 'linear-gradient(180deg, #f0fdfa 0%, #ccfbf1 100%)' }}>
            {/* Premium Navigation Header */}
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="sticky top-0 z-50 glass-card border-b border-medical-200/20 backdrop-blur-xl"
                style={{ background: 'rgba(255, 255, 255, 0.82)' }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20">
                        <div className="flex items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-medical-400 to-medical-600 rounded-2xl shadow-lg shadow-medical-500/20">
                                    <Icon name="calendar-days" size={26} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-display font-bold text-medical-900">Clinic Scheduler</h1>
                                </div>
                            </div>

                            <div className="hidden md:flex ml-12 space-x-2">
                                {navItems.map(item => (
                                    <motion.button
                                        key={item.id}
                                        onClick={() => setActiveView(item.id)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`
                                            px-4 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all relative
                                            ${activeView === item.id
                                                ? 'bg-gradient-to-r from-medical-500 to-medical-600 text-white shadow-lg shadow-medical-500/25'
                                                : 'text-medical-700 hover:bg-medical-50 hover:text-medical-900'
                                            }
                                        `}
                                    >
                                        <Icon name={item.icon} size={16} />
                                        {item.label}
                                        {activeView === item.id && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-gradient-to-r from-medical-500 to-medical-600 rounded-full -z-10"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="badge-live flex items-center gap-2 px-4 py-2 rounded-full"
                            >
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                <span className="text-sm text-white font-bold">Live Sync</span>
                            </motion.div>

                            <motion.button
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-3 glass-card rounded-full relative transition-all hover:shadow-lg"
                            >
                                <Icon name="bell" size={20} className="text-medical-700" />
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg"
                                >
                                    <span className="text-xs text-white font-bold">3</span>
                                </motion.span>
                            </motion.button>

                            <div className="flex items-center gap-3 pl-3 border-l border-medical-200">
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-medical-900">{user.name || user.email}</p>
                                    <button
                                        onClick={handleSignOut}
                                        className="text-xs text-medical-600 hover:text-medical-800 font-medium transition-colors"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    className="w-10 h-10 bg-gradient-to-br from-medical-400 to-medical-600 rounded-full flex items-center justify-center shadow-lg shadow-medical-500/20"
                                >
                                    <Icon name="user" size={18} className="text-white" />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Main Content with Glass Background */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
                {activeView === 'dashboard' && <Dashboard />}
                {activeView === 'schedule' && <ScheduleCalendar initialFilter={scheduleFilterData} onNavigateToPerson={navigateToSchedule} />}
                {activeView === 'attendings' && <AttendingsList navigateToSchedule={navigateToSchedule} />}
                {activeView === 'residents' && <ResidentsList navigateToSchedule={navigateToSchedule} />}
                {activeView === 'rules' && <RulesList />}
                {activeView === 'settings' && <SettingsView />}
            </main>

            <Toaster
                position="bottom-right"
                toastOptions={{
                    className: 'font-medium',
                    duration: 3000,
                    style: {
                        background: '#fff',
                        color: '#363636',
                    },
                }}
            />
        </div>
    );
};

// ==================== Root Component ====================
const Root = () => {
    return (
        <ToastProvider>
            <AppProvider>
                <App />
            </AppProvider>
        </ToastProvider>
    );
};

// Render the app
ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
