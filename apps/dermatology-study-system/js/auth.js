import { auth, db } from './firebase-config.js';

class AuthManager {
    constructor() {
        this.user = null;
        this.userProfile = null;
        this.authStateChanged = this.authStateChanged.bind(this);
    }

    async initialize() {
        // Listen for auth state changes
        auth.onAuthStateChanged(this.authStateChanged);
    }

    async authStateChanged(user) {
        this.user = user;
        if (user) {
            // Get user profile from Firestore
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                this.userProfile = userDoc.data();
            } else {
                // Create new user profile
                this.userProfile = {
                    email: user.email,
                    displayName: user.displayName || '',
                    preferences: {
                        quizDifficulty: 'medium',
                        studyFocus: [],
                        notifications: true
                    },
                    progress: {
                        quizzesCompleted: 0,
                        averageScore: 0,
                        topicsMastered: []
                    },
                    createdAt: new Date()
                };
                await db.collection('users').doc(user.uid).set(this.userProfile);
            }
            this.updateUI(true);
        } else {
            this.userProfile = null;
            this.updateUI(false);
        }
    }

    updateUI(isLoggedIn) {
        const loginBtn = document.getElementById('loginBtn');
        const profileBtn = document.getElementById('userProfileBtn');
        
        if (isLoggedIn) {
            loginBtn.classList.add('hidden');
            profileBtn.classList.remove('hidden');
        } else {
            loginBtn.classList.remove('hidden');
            profileBtn.classList.add('hidden');
        }
    }

    async signIn(email, password) {
        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        }
    }

    async signUp(email, password, displayName) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({ displayName });
        } catch (error) {
            console.error('Error signing up:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    }

    async updateProfile(updates) {
        if (!this.user) throw new Error('No user logged in');
        
        try {
            await db.collection('users').doc(this.user.uid).update(updates);
            this.userProfile = { ...this.userProfile, ...updates };
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    async updatePreferences(preferences) {
        await this.updateProfile({ preferences });
    }

    async updateProgress(progress) {
        await this.updateProfile({ progress });
    }
}

// Create and export a singleton instance
const authManager = new AuthManager();
export default authManager; 