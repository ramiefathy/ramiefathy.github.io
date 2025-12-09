/**
 * FirebaseService - Firebase operations for clinic scheduler
 * Handles authentication, Firestore CRUD, and real-time subscriptions
 */

import { normalizeAttendingRecord } from '../utils/helpers';

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

// Date functions
import { format, addDays } from 'date-fns';

// Helper to get date-fns functions (for compatibility with existing code)
const getDateFns = () => ({ format, addDays });

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
        // Auth listener is managed by AppProvider for proper React lifecycle cleanup
    }

    // Called by AppProvider to keep service in sync with auth state
    setCurrentUser(user) {
        this.currentUser = user;
        if (!user) {
            this.currentInstitution = null;
        }
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
            const userRef = window.firebase.firestore.doc(this.db, 'users', this.currentUser.uid);
            const userDoc = await window.firebase.firestore.getDoc(userRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();

                // Normalize institutions array to simple string IDs
                const rawInstitutions = Array.isArray(userData.institutions) ? userData.institutions : [];
                const normalizedInstitutions = rawInstitutions
                    .map(inst => typeof inst === 'string' ? inst : inst?.id)
                    .filter(id => typeof id === 'string' && id.length > 0);

                if (normalizedInstitutions.length !== rawInstitutions.length) {
                    try {
                        await window.firebase.firestore.updateDoc(userRef, {
                            institutions: normalizedInstitutions
                        });
                    } catch (updateError) {
                        console.warn('Failed to normalize institutions array:', updateError);
                    }
                    userData.institutions = normalizedInstitutions;
                } else {
                    userData.institutions = normalizedInstitutions;
                }

                const preferredInstitution =
                    typeof userData.currentInstitution === 'string' && userData.currentInstitution
                        ? userData.currentInstitution
                        : normalizedInstitutions[0];

                // Ensure member sub-docs exist for institutions this user belongs to
                if (normalizedInstitutions.length > 0) {
                    await this.ensureMembershipDocs(normalizedInstitutions, {
                        name: userData.name || this.currentUser.displayName || this.currentUser.email || '',
                        email: userData.email || this.currentUser.email || ''
                    });
                }

                if (preferredInstitution) {
                    await this.loadInstitution(preferredInstitution);
                }

                return userData;
            } else {
                // Create user document if it doesn't exist
                console.log('Creating new user profile...');
                const newUserData = {
                    email: this.currentUser.email,
                    uid: this.currentUser.uid,
                    institutions: [],
                    createdAt: window.firebase.firestore.serverTimestamp(),
                    updatedAt: window.firebase.firestore.serverTimestamp()
                };

                await window.firebase.firestore.setDoc(userRef, newUserData);
                console.log('User profile created successfully');
                return newUserData;
            }
        } catch (error) {
            console.error('Load user profile error:', error);
            // If permission denied, return minimal user data
            if (error.code === 'permission-denied') {
                console.warn('Permission denied - returning basic user data');
                return {
                    email: this.currentUser.email,
                    uid: this.currentUser.uid,
                    institutions: []
                };
            }
            return null;
        }
    }

    // ===== Institution Management =====
    async createInstitution(name, userData) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            const { format, addDays } = getDateFns();
            const institutionRef = window.firebase.firestore.doc(
                window.firebase.firestore.collection(this.db, 'institutions')
            );

            const institutionData = {
                name,
                createdBy: this.currentUser.uid,
                createdAt: window.firebase.firestore.serverTimestamp(),
                // Initialize members array with the creating user
                members: [{
                    userId: this.currentUser.uid,
                    name: userData.name,
                    email: userData.email,
                    role: 'program_admin',
                    joinedAt: new Date().toISOString()
                }],
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
                        start: format ? format(new Date(), 'yyyy-07-01') : new Date().toISOString().slice(0, 10),
                        end: format && addDays ? format(addDays(new Date(), 365), 'yyyy-06-30') : new Date().toISOString().slice(0, 10)
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
            const memberDocRef = window.firebase.firestore.doc(this.db, 'institutions', institutionId, 'members', this.currentUser.uid);
            const memberDoc = await window.firebase.firestore.getDoc(memberDocRef);

            // Self-heal: if the subcollection doc is missing, create a minimal one so rules pass
            if (!memberDoc.exists()) {
                const fallbackMember = {
                    userId: this.currentUser.uid,
                    email: this.currentUser.email || '',
                    name: this.currentUser.displayName || this.currentUser.email || '',
                    role: 'member',
                    joinedAt: window.firebase.firestore.serverTimestamp()
                };
                await this.syncMemberToSubcollection(institutionId, fallbackMember);
            }

            this.currentInstitution = institutionId;
            this.setupRealtimeListeners();

            // Reconcile members array with subcollection (runs async, non-blocking)
            this.reconcileMembersArray(institutionId).catch(err => {
                console.warn('Member reconciliation skipped:', err.message);
            });

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
            const CHUNK_SIZE = 450; // stay safely below Firestore's 500 op limit
            let committed = 0;

            for (let i = 0; i < assignments.length; i += CHUNK_SIZE) {
                const batch = window.firebase.firestore.writeBatch(this.db);
                const chunk = assignments.slice(i, i + CHUNK_SIZE);

                chunk.forEach(assignment => {
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
                committed += chunk.length;
            }

            await this.addAuditLog('batch_assignments_added', { count: committed });
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

            const CHUNK_SIZE = 450;
            let processed = 0;

            for (let i = 0; i < snapshot.docs.length; i += CHUNK_SIZE) {
                const batch = window.firebase.firestore.writeBatch(this.db);
                const chunk = snapshot.docs.slice(i, i + CHUNK_SIZE);
                chunk.forEach(docItem => {
                    batch.delete(docItem.ref);
                });
                await batch.commit();
                processed += chunk.length;
            }

            await this.addAuditLog('all_assignments_cleared', { count: processed });
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
            return () => { };
        }

        const query = window.firebase.firestore.query(
            window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'attendings'),
            window.firebase.firestore.orderBy('name')
        );

        const unsubscribe = window.firebase.firestore.onSnapshot(
            query,
            (snapshot) => {
                const data = snapshot.docs.map(doc =>
                    normalizeAttendingRecord({
                        id: doc.id,
                        ...doc.data()
                    })
                );
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
            return () => { };
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
            return () => { };
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
            return () => { };
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
            return () => { };
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

    // ===== Member Management =====
    async getInstitutionMembers() {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            const institutionDoc = await window.firebase.firestore.getDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution)
            );

            if (!institutionDoc.exists()) {
                throw new Error('Institution not found');
            }

            const institutionData = institutionDoc.data();
            const members = institutionData.members || [];

            // Fetch user details for each member
            const memberDetails = await Promise.all(
                members.map(async (member) => {
                    try {
                        const userDoc = await window.firebase.firestore.getDoc(
                            window.firebase.firestore.doc(this.db, 'users', member.userId)
                        );

                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            return {
                                id: member.userId,
                                name: userData.name || 'Unknown',
                                email: userData.email,
                                role: member.role || 'member',
                                joinedAt: member.joinedAt
                            };
                        }
                        return null;
                    } catch (error) {
                        console.error('Error fetching member details:', error);
                        return null;
                    }
                })
            );

            // Filter out null entries and return
            return memberDetails.filter(member => member !== null);
        } catch (error) {
            console.error('Error fetching institution members:', error);
            throw error;
        }
    }

    async createInviteCode(inviteData) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            // Generate a cryptographically secure invite code
            // Uses characters that avoid confusion (excludes 0, O, 1, I, L)
            const generateSecureCode = (length = 8) => {
                const array = new Uint8Array(length);
                window.crypto.getRandomValues(array);
                const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
                return Array.from(array, byte => chars[byte % chars.length]).join('');
            };
            const code = generateSecureCode(8);

            // Store invite code in Firestore
            await window.firebase.firestore.setDoc(
                window.firebase.firestore.doc(this.db, 'inviteCodes', code),
                {
                    institutionId: this.currentInstitution,
                    role: inviteData.role || 'member',
                    createdBy: this.currentUser.uid,
                    createdAt: window.firebase.firestore.serverTimestamp(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                    used: false
                }
            );

            // Add audit log
            await this.addAuditLog('INVITE_CODE_CREATED', {
                code,
                role: inviteData.role
            });

            return { success: true, code };
        } catch (error) {
            console.error('Error creating invite code:', error);
            return { success: false, error: error.message };
        }
    }

    async bulkInviteMembers(invites) {
        if (!this.currentInstitution) throw new Error('No institution selected');
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            const bulkInvite = window.firebase.functions.httpsCallable('bulkInviteMembers');
            const result = await bulkInvite({
                institutionId: this.currentInstitution,
                invites
            });
            return result.data || { success: true };
        } catch (error) {
            console.error('Error sending bulk invites:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== Member Subcollection Sync Helpers ====================
    async syncMemberToSubcollection(institutionId, memberData, action = 'set') {
        const memberDocRef = window.firebase.firestore.doc(
            this.db,
            'institutions',
            institutionId,
            'members',
            memberData.userId
        );

        if (action === 'delete') {
            await window.firebase.firestore.deleteDoc(memberDocRef);
        } else {
            await window.firebase.firestore.setDoc(memberDocRef, {
                userId: memberData.userId,
                email: memberData.email || '',
                name: memberData.name || '',
                role: memberData.role || 'member',
                joinedAt: memberData.joinedAt || window.firebase.firestore.serverTimestamp(),
                updatedAt: window.firebase.firestore.serverTimestamp()
            }, { merge: true });
        }
    }

    isAdminRole(role) {
        return ['admin', 'program_admin', 'chief_resident'].includes(role);
    }

    countAdminMembers(members = []) {
            return members.filter(m => this.isAdminRole(m.role)).length;
        }

    async ensureMembershipDocs(institutionIds = [], defaults = {}) {
        if (!this.currentUser || !Array.isArray(institutionIds)) return;
        const name = defaults.name || this.currentUser.displayName || this.currentUser.email || '';
        const email = defaults.email || this.currentUser.email || '';

        for (const instId of institutionIds) {
            const memberDocRef = window.firebase.firestore.doc(this.db, 'institutions', instId, 'members', this.currentUser.uid);
            const memberDoc = await window.firebase.firestore.getDoc(memberDocRef);
            if (!memberDoc.exists()) {
                await window.firebase.firestore.setDoc(memberDocRef, {
                    userId: this.currentUser.uid,
                    name,
                    email,
                    role: 'member',
                    joinedAt: window.firebase.firestore.serverTimestamp(),
                    updatedAt: window.firebase.firestore.serverTimestamp()
                }, { merge: true });
            }
        }
    }

    /**
     * Bidirectional reconciliation of embedded members[] array with members subcollection.
     */
    async reconcileMembersArray(institutionId) {
        if (!this.currentUser || !institutionId) return;

        try {
            const institutionRef = window.firebase.firestore.doc(this.db, 'institutions', institutionId);
            const institutionDoc = await window.firebase.firestore.getDoc(institutionRef);

            if (!institutionDoc.exists()) return;

            const institutionData = institutionDoc.data();
            const embeddedMembers = institutionData.members || [];

            // Check if current user is admin before doing reconciliation
            const currentMember = embeddedMembers.find(m => m.userId === this.currentUser.uid);
            if (!currentMember || !this.isAdminRole(currentMember.role)) {
                return;
            }

            const membersSnapshot = await window.firebase.firestore.getDocs(
                window.firebase.firestore.collection(this.db, 'institutions', institutionId, 'members')
            );

            const subcollectionMembers = new Map();
            membersSnapshot.forEach(doc => {
                subcollectionMembers.set(doc.id, { userId: doc.id, ...doc.data() });
            });

            const embeddedMemberIds = new Set(embeddedMembers.map(m => m.userId));

            const missingFromSubcollection = embeddedMembers.filter(m => !subcollectionMembers.has(m.userId));

            const missingFromArray = [];
            subcollectionMembers.forEach((memberData, memberId) => {
                if (!embeddedMemberIds.has(memberId)) {
                    missingFromArray.push(memberData);
                }
            });

            const batch = window.firebase.firestore.writeBatch(this.db);
            let batchHasOperations = false;

            for (const member of missingFromSubcollection) {
                const memberDocRef = window.firebase.firestore.doc(
                    this.db, 'institutions', institutionId, 'members', member.userId
                );
                batch.set(memberDocRef, {
                    userId: member.userId,
                    email: member.email || '',
                    name: member.name || '',
                    role: member.role || 'member',
                    joinedAt: member.joinedAt || window.firebase.firestore.serverTimestamp(),
                    updatedAt: window.firebase.firestore.serverTimestamp()
                }, { merge: true });
                batchHasOperations = true;
            }

            if (missingFromArray.length > 0) {
                const updatedMembers = [...embeddedMembers];
                for (const member of missingFromArray) {
                    updatedMembers.push({
                        userId: member.userId,
                        email: member.email || '',
                        name: member.name || '',
                        role: member.role || 'member',
                        joinedAt: member.joinedAt || null
                    });
                }
                batch.update(institutionRef, { members: updatedMembers });
                batchHasOperations = true;
                console.log(`Reconciled ${missingFromArray.length} member(s) from subcollection to array`);
            }

            if (batchHasOperations) {
                await batch.commit();
                if (missingFromSubcollection.length > 0) {
                    console.log(`Reconciled ${missingFromSubcollection.length} member(s) to subcollection`);
                }
            }
        } catch (error) {
            console.warn('Member reconciliation warning:', error.message);
        }
    }

    async updateMemberRole(memberId, newRole) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            const institutionDoc = await window.firebase.firestore.getDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution)
            );

            if (!institutionDoc.exists()) {
                throw new Error('Institution not found');
            }

            const institutionData = institutionDoc.data();
            const members = institutionData.members || [];

            const memberToUpdate = members.find(m => m.userId === memberId);
            if (!memberToUpdate) {
                throw new Error('Member not found in institution');
            }

            const adminCount = this.countAdminMembers(members);
            if (this.isAdminRole(memberToUpdate.role) && !this.isAdminRole(newRole) && adminCount <= 1) {
                throw new Error('Cannot demote the last admin-level member');
            }

            const updatedMembers = members.map(member => {
                if (member.userId === memberId) {
                    return { ...member, role: newRole };
                }
                return member;
            });

            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution),
                {
                    members: updatedMembers,
                    updatedAt: window.firebase.firestore.serverTimestamp()
                }
            );

            await this.syncMemberToSubcollection(this.currentInstitution, {
                ...memberToUpdate,
                role: newRole
            });

            await this.addAuditLog('MEMBER_ROLE_UPDATED', {
                memberId,
                newRole
            });

            return { success: true };
        } catch (error) {
            console.error('Error updating member role:', error);
            return { success: false, error: error.message };
        }
    }

    async removeMember(memberId) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            const institutionDoc = await window.firebase.firestore.getDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution)
            );

            if (!institutionDoc.exists()) {
                throw new Error('Institution not found');
            }

            const institutionData = institutionDoc.data();
            const members = institutionData.members || [];

            const memberToRemove = members.find(m => m.userId === memberId);
            if (!memberToRemove) {
                throw new Error('Member not found in institution');
            }

            const adminCount = this.countAdminMembers(members);
            if (memberToRemove && this.isAdminRole(memberToRemove.role) && adminCount <= 1) {
                throw new Error('Cannot remove the last admin-level member');
            }

            const updatedMembers = members.filter(member => member.userId !== memberId);

            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution),
                {
                    members: updatedMembers,
                    updatedAt: window.firebase.firestore.serverTimestamp()
                }
            );

            await this.syncMemberToSubcollection(this.currentInstitution, { userId: memberId }, 'delete');

            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'users', memberId),
                {
                    institutions: window.firebase.firestore.arrayRemove(
                        this.currentInstitution,
                        {
                            id: this.currentInstitution,
                            role: memberToRemove?.role || 'member'
                        }
                    )
                }
            );

            await this.addAuditLog('MEMBER_REMOVED', {
                memberId,
                previousRole: memberToRemove?.role
            });

            return { success: true };
        } catch (error) {
            console.error('Error removing member:', error);
            return { success: false, error: error.message };
        }
    }

    async redeemInviteCode(code) {
        if (!this.currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const inviteDoc = await window.firebase.firestore.getDoc(
                window.firebase.firestore.doc(this.db, 'inviteCodes', code.toUpperCase())
            );

            if (!inviteDoc.exists()) {
                return { success: false, error: 'Invalid invite code' };
            }

            const inviteData = inviteDoc.data();

            // If this invite was created via bulk email flow, enforce email match
            if (inviteData.recipientEmail) {
                const userEmail = (this.currentUser.email || '').toLowerCase().trim();
                const inviteEmail = String(inviteData.recipientEmail || '').toLowerCase().trim();
                if (!userEmail || userEmail !== inviteEmail) {
                    return { success: false, error: 'This invite is tied to a different email address' };
                }
            }

            if (inviteData.expiresAt && inviteData.expiresAt.toDate() < new Date()) {
                return { success: false, error: 'Invite code has expired' };
            }

            if (inviteData.used) {
                return { success: false, error: 'Invite code has already been used' };
            }

            const institutionDoc = await window.firebase.firestore.getDoc(
                window.firebase.firestore.doc(this.db, 'institutions', inviteData.institutionId)
            );

            if (!institutionDoc.exists()) {
                return { success: false, error: 'Institution not found' };
            }

            const institutionData = institutionDoc.data();
            const members = institutionData.members || [];
            const userProfile = await this.loadUserProfile();

            if (members.some(m => m.userId === this.currentUser.uid)) {
                return { success: false, error: 'You are already a member of this institution' };
            }

            const newMemberData = {
                userId: this.currentUser.uid,
                name: userProfile.displayName || this.currentUser.email,
                email: this.currentUser.email,
                role: inviteData.role || 'member',
                joinedAt: window.firebase.firestore.serverTimestamp()
            };

            const batch = window.firebase.firestore.writeBatch(this.db);

            members.push(newMemberData);
            batch.update(
                window.firebase.firestore.doc(this.db, 'institutions', inviteData.institutionId),
                {
                    members: members,
                    updatedAt: window.firebase.firestore.serverTimestamp()
                }
            );

            batch.set(
                window.firebase.firestore.doc(this.db, 'institutions', inviteData.institutionId, 'members', this.currentUser.uid),
                newMemberData,
                { merge: true }
            );

            batch.update(
                window.firebase.firestore.doc(this.db, 'users', this.currentUser.uid),
                {
                    institutions: window.firebase.firestore.arrayUnion(inviteData.institutionId),
                    currentInstitution: inviteData.institutionId
                }
            );

            if (inviteData.singleUse !== false) {
                batch.update(
                    window.firebase.firestore.doc(this.db, 'inviteCodes', code.toUpperCase()),
                    {
                        used: true,
                        usedBy: this.currentUser.uid,
                        usedAt: window.firebase.firestore.serverTimestamp()
                    }
                );
            }

            await batch.commit();

            this.currentInstitution = inviteData.institutionId;
            await this.loadInstitution(inviteData.institutionId);

            await this.addAuditLog('MEMBER_JOINED_VIA_INVITE', {
                inviteCode: code,
                role: inviteData.role || 'member'
            });

            return {
                success: true,
                institutionName: institutionData.name,
                institutionId: inviteData.institutionId
            };
        } catch (error) {
            console.error('Error redeeming invite code:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== Schedule Change Requests ====================

    async addScheduleRequest(request) {
        if (!this.currentInstitution) throw new Error('No institution selected');
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            const payload = {
                ...request,
                status: request.status || 'pending',
                requestedBy: this.currentUser.uid,
                createdAt: window.firebase.firestore.serverTimestamp(),
                updatedAt: window.firebase.firestore.serverTimestamp()
            };

            const docRef = await window.firebase.firestore.addDoc(
                window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'scheduleRequests'),
                payload
            );

            await this.addAuditLog('schedule_request_created', {
                id: docRef.id,
                assignmentId: request.assignmentId,
                requestType: request.requestType
            });

            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error creating schedule request:', error);
            return { success: false, error: error.message };
        }
    }

    listenToScheduleRequests(callback) {
        if (!this.currentInstitution) {
            callback([]);
            return () => {};
        }

        const query = window.firebase.firestore.query(
            window.firebase.firestore.collection(this.db, 'institutions', this.currentInstitution, 'scheduleRequests'),
            window.firebase.firestore.orderBy('createdAt', 'desc')
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
                console.error('Schedule requests listener error:', error);
                callback([]);
            }
        );

        return unsubscribe;
    }

    async updateScheduleRequest(id, updates) {
        if (!this.currentInstitution) throw new Error('No institution selected');

        try {
            await window.firebase.firestore.updateDoc(
                window.firebase.firestore.doc(this.db, 'institutions', this.currentInstitution, 'scheduleRequests', id),
                {
                    ...updates,
                    updatedAt: window.firebase.firestore.serverTimestamp()
                }
            );

            await this.addAuditLog('schedule_request_updated', { id, updates });
            return { success: true };
        } catch (error) {
            console.error('Error updating schedule request:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export singleton instance
export const firebaseService = new FirebaseService();

// Export class for testing
export { FirebaseService };

export default firebaseService;
