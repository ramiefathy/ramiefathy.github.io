import { auth, db } from './firebase-config.js';

class AuthManager {
    constructor() {
        this.user = null;
        this.userProfile = null;
        this.authStateChanged = this.authStateChanged.bind(this);
        this.sessionTimeout = null;
        this.SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
        this.loginAttempts = new Map();
        this.MAX_LOGIN_ATTEMPTS = 5;
        this.LOGIN_TIMEOUT = 15 * 60 * 1000; // 15 minutes
    }

    async initialize() {
        try {
            // Set up auth state listener
            auth.onAuthStateChanged(this.authStateChanged);

            // Check for existing session
            const session = localStorage.getItem('authSession');
            if (session) {
                const { timestamp } = JSON.parse(session);
                if (Date.now() - timestamp < this.SESSION_DURATION) {
                    // Session is still valid
                    this.startSessionTimer();
                    // Try to restore the user session
                    const user = auth.currentUser;
                    if (user) {
                        this.user = user;
                        await this.loadUserProfile();
                    }
                } else {
                    // Session expired
                    await this.signOut();
                }
            }
        } catch (error) {
            console.error('Error initializing auth:', error);
            throw new Error('Failed to initialize authentication');
        }
    }

    async authStateChanged(user) {
        if (user) {
            this.user = user;
            this.startSessionTimer();
            localStorage.setItem('authSession', JSON.stringify({
                timestamp: Date.now(),
                uid: user.uid
            }));
            await this.loadUserProfile();
        } else {
            this.user = null;
            this.userProfile = null;
            this.clearSessionTimer();
            localStorage.removeItem('authSession');
        }
    }

    async loadUserProfile() {
        if (!this.user) return;
        
        try {
            const userDoc = await db.collection('users').doc(this.user.uid).get();
            if (userDoc.exists) {
                this.userProfile = userDoc.data();
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    startSessionTimer() {
        this.clearSessionTimer();
        this.sessionTimeout = setTimeout(() => {
            this.handleSessionTimeout();
        }, this.SESSION_DURATION);
    }

    clearSessionTimer() {
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
            this.sessionTimeout = null;
        }
    }

    async handleSessionTimeout() {
        await this.signOut();
        this.showSessionTimeoutMessage();
    }

    showSessionTimeoutMessage() {
        const message = document.createElement('div');
        message.className = 'fixed top-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-lg';
        message.innerHTML = `
            <p class="font-bold">Session Expired</p>
            <p>Your session has expired. Please sign in again.</p>
        `;
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 5000);
    }

    isRateLimited(email) {
        const attempts = this.loginAttempts.get(email);
        if (!attempts) return false;

        if (attempts.count >= this.MAX_LOGIN_ATTEMPTS) {
            const timeSinceLastAttempt = Date.now() - attempts.timestamp;
            if (timeSinceLastAttempt < this.LOGIN_TIMEOUT) {
                return true;
            }
            // Reset attempts if timeout has passed
            this.loginAttempts.delete(email);
            return false;
        }
        return false;
    }

    recordLoginAttempt(email, success) {
        const attempts = this.loginAttempts.get(email) || { count: 0, timestamp: Date.now() };
        if (!success) {
            attempts.count++;
            attempts.timestamp = Date.now();
        } else {
            this.loginAttempts.delete(email);
            return;
        }
        this.loginAttempts.set(email, attempts);
    }

    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const errors = [];
        if (password.length < minLength) errors.push(`Password must be at least ${minLength} characters long`);
        if (!hasUpperCase) errors.push('Password must contain at least one uppercase letter');
        if (!hasLowerCase) errors.push('Password must contain at least one lowercase letter');
        if (!hasNumbers) errors.push('Password must contain at least one number');
        if (!hasSpecialChar) errors.push('Password must contain at least one special character');

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    async signIn(email, password) {
        try {
            if (this.isRateLimited(email)) {
                throw new Error('Too many login attempts. Please try again later.');
            }

            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            this.recordLoginAttempt(email, true);
            return userCredential.user;
        } catch (error) {
            this.recordLoginAttempt(email, false);
            console.error('Error signing in:', error);
            
            let errorMessage = 'Error signing in. Please check your credentials and try again.';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email. Please sign up first.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later.';
            }
            
            throw new Error(errorMessage);
        }
    }

    async signUp(email, password, displayName) {
        try {
            // Validate password
            const passwordValidation = this.validatePassword(password);
            if (!passwordValidation.isValid) {
                throw new Error(`Invalid password: ${passwordValidation.errors.join(', ')}`);
            }

            // Try to create the account
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update display name
            await user.updateProfile({ displayName });
            
            // Create user profile
            await this.createUserProfile(user, displayName);
            
            return user;
        } catch (error) {
            console.error('Error signing up:', error);
            
            let errorMessage = 'Error creating account. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'An account with this email already exists. Please sign in instead.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address. Please enter a valid email.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please use a stronger password.';
            }
            
            throw new Error(errorMessage);
        }
    }

    async signOut() {
        try {
            await auth.signOut();
            this.clearSessionTimer();
            localStorage.removeItem('authSession');
        } catch (error) {
            console.error('Error signing out:', error);
            throw new Error('Failed to sign out. Please try again.');
        }
    }

    async createUserProfile(user, displayName) {
        try {
            const userProfile = {
                email: user.email,
                displayName: displayName || user.email.split('@')[0],
                createdAt: new Date(),
                preferences: {
                    theme: 'light',
                    notifications: true,
                    autoSave: true,
                    defaultQuestionCount: 10,
                    defaultDifficulty: 'medium'
                },
                stats: {
                    quizzesCompleted: 0,
                    totalScore: 0,
                    averageScore: 0,
                    topicsMastered: [],
                    lastActive: new Date()
                },
                progress: {
                    topicPerformance: {},
                    missedQuestions: [],
                    questionHistory: []
                }
            };

            await db.collection('users').doc(user.uid).set(userProfile);
            this.userProfile = userProfile;
        } catch (error) {
            console.error('Error creating user profile:', error);
            throw new Error('Failed to create user profile. Please try again.');
        }
    }
}

// Create and export a singleton instance
const authManager = new AuthManager();
export default authManager; 