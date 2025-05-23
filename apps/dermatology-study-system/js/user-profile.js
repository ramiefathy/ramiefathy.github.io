import { auth, db } from './firebase-config.js';

class UserProfile {
    constructor() {
        this.user = null;
        this.profile = null;
        this.learningHistory = [];
        this.preferences = {
            theme: 'light',
            notifications: true,
            autoSave: true,
            defaultQuestionCount: 10,
            defaultDifficulty: 'medium'
        };
        this.isLoading = false;
        this.retryCount = 0;
        this.MAX_RETRIES = 3;
    }

    // Initialize user profile
    async initialize() {
        try {
            this.isLoading = true;
            
            // Listen for auth state changes
            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.user = user;
                    await this.loadProfile();
                    await this.loadLearningHistory();
                } else {
                    this.reset();
                }
            });
        } catch (error) {
            console.error('Error initializing user profile:', error);
            throw new Error('Failed to initialize user profile');
        } finally {
            this.isLoading = false;
        }
    }

    reset() {
        this.user = null;
        this.profile = null;
        this.learningHistory = [];
        this.retryCount = 0;
    }

    // Load user profile from Firestore
    async loadProfile() {
        try {
            this.isLoading = true;
            this.retryCount = 0;

            while (this.retryCount < this.MAX_RETRIES) {
                try {
                    const profileDoc = await db.collection('users').doc(this.user.uid).get();
                    if (profileDoc.exists) {
                        this.profile = profileDoc.data();
                        this.preferences = this.profile.preferences || this.preferences;
                        return;
                    } else {
                        // Create new profile if it doesn't exist
                        await this.createProfile();
                        return;
                    }
                } catch (error) {
                    this.retryCount++;
                    if (this.retryCount >= this.MAX_RETRIES) {
                        throw error;
                    }
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            throw new Error('Failed to load user profile');
        } finally {
            this.isLoading = false;
        }
    }

    // Create new user profile
    async createProfile() {
        try {
            this.isLoading = true;
            this.retryCount = 0;

            const newProfile = {
                email: this.user.email,
                displayName: this.user.displayName || this.user.email.split('@')[0],
                createdAt: new Date(),
                preferences: this.preferences,
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

            while (this.retryCount < this.MAX_RETRIES) {
                try {
                    await db.collection('users').doc(this.user.uid).set(newProfile);
                    this.profile = newProfile;
                    return;
                } catch (error) {
                    this.retryCount++;
                    if (this.retryCount >= this.MAX_RETRIES) {
                        throw error;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
                }
            }
        } catch (error) {
            console.error('Error creating profile:', error);
            throw new Error('Failed to create user profile');
        } finally {
            this.isLoading = false;
        }
    }

    // Load learning history
    async loadLearningHistory() {
        try {
            const historySnapshot = await db.collection('users')
                .doc(this.user.uid)
                .collection('learningHistory')
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();

            this.learningHistory = historySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error loading learning history:', error);
            throw error;
        }
    }

    // Update user preferences
    async updatePreferences(newPreferences) {
        try {
            this.preferences = { ...this.preferences, ...newPreferences };
            await db.collection('users').doc(this.user.uid).update({
                preferences: this.preferences
            });
        } catch (error) {
            console.error('Error updating preferences:', error);
            throw error;
        }
    }

    // Add learning activity
    async addLearningActivity(activity) {
        try {
            const activityData = {
                ...activity,
                timestamp: new Date(),
                userId: this.user.uid
            };

            await db.collection('users')
                .doc(this.user.uid)
                .collection('learningHistory')
                .add(activityData);

            this.learningHistory.unshift(activityData);

            // Update user stats
            await this.updateUserStats(activity);
        } catch (error) {
            console.error('Error adding learning activity:', error);
            throw error;
        }
    }

    // Update user stats
    async updateUserStats(activity) {
        try {
            const stats = this.profile.stats;
            
            if (activity.type === 'quiz') {
                stats.quizzesCompleted++;
                stats.totalScore += activity.score;
                stats.averageScore = stats.totalScore / stats.quizzesCompleted;

                // Update topics mastered
                if (activity.score >= 80) { // 80% threshold for mastery
                    if (!stats.topicsMastered.includes(activity.topic)) {
                        stats.topicsMastered.push(activity.topic);
                    }
                }
            }

            await db.collection('users').doc(this.user.uid).update({
                stats: stats
            });

            this.profile.stats = stats;
        } catch (error) {
            console.error('Error updating user stats:', error);
            throw error;
        }
    }

    // Get user progress
    getProgress() {
        return {
            quizzesCompleted: this.profile?.stats.quizzesCompleted || 0,
            averageScore: this.profile?.stats.averageScore || 0,
            topicsMastered: this.profile?.stats.topicsMastered || [],
            recentActivity: this.learningHistory.slice(0, 5)
        };
    }

    // Get recommended topics
    getRecommendedTopics() {
        const masteredTopics = this.profile?.stats.topicsMastered || [];
        const allTopics = ['general', 'pathology', 'surgery', 'pediatric'];
        return allTopics.filter(topic => !masteredTopics.includes(topic));
    }

    // Update user profile
    async updateProfile(updates) {
        if (!this.user) throw new Error('No user logged in');
        if (!updates || typeof updates !== 'object') {
            throw new Error('Invalid update data');
        }

        try {
            this.isLoading = true;
            this.retryCount = 0;

            // Validate updates
            const validatedUpdates = this.validateProfileUpdates(updates);
            if (!validatedUpdates) {
                throw new Error('Invalid profile updates');
            }

            while (this.retryCount < this.MAX_RETRIES) {
                try {
                    await db.collection('users').doc(this.user.uid).update({
                        ...validatedUpdates,
                        lastUpdated: new Date()
                    });
                    this.profile = { ...this.profile, ...validatedUpdates };
                    return;
                } catch (error) {
                    this.retryCount++;
                    if (this.retryCount >= this.MAX_RETRIES) {
                        throw error;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
                }
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            throw new Error('Failed to update user profile');
        } finally {
            this.isLoading = false;
        }
    }

    // Validate profile updates
    validateProfileUpdates(updates) {
        const validFields = {
            displayName: 'string',
            preferences: 'object',
            stats: 'object',
            progress: 'object'
        };

        const validatedUpdates = {};

        for (const [key, value] of Object.entries(updates)) {
            if (!validFields[key]) continue;
            
            if (typeof value !== validFields[key]) {
                console.warn(`Invalid type for ${key}: expected ${validFields[key]}, got ${typeof value}`);
                continue;
            }

            // Additional validation for specific fields
            switch (key) {
                case 'displayName':
                    if (value.length < 2 || value.length > 50) continue;
                    break;
                case 'preferences':
                    if (!this.validatePreferences(value)) continue;
                    break;
                case 'stats':
                    if (!this.validateStats(value)) continue;
                    break;
                case 'progress':
                    if (!this.validateProgress(value)) continue;
                    break;
            }

            validatedUpdates[key] = value;
        }

        return Object.keys(validatedUpdates).length > 0 ? validatedUpdates : null;
    }

    // Validate preferences object
    validatePreferences(preferences) {
        const requiredPreferences = {
            theme: ['light', 'dark'],
            notifications: 'boolean',
            autoSave: 'boolean',
            defaultQuestionCount: 'number',
            defaultDifficulty: ['easy', 'medium', 'hard']
        };

        for (const [key, value] of Object.entries(preferences)) {
            if (!requiredPreferences[key]) return false;
            
            if (Array.isArray(requiredPreferences[key])) {
                if (!requiredPreferences[key].includes(value)) return false;
            } else if (typeof value !== requiredPreferences[key]) {
                return false;
            }
        }

        return true;
    }

    // Validate stats object
    validateStats(stats) {
        const requiredStats = {
            quizzesCompleted: 'number',
            totalScore: 'number',
            averageScore: 'number',
            topicsMastered: 'array',
            lastActive: 'date'
        };

        for (const [key, value] of Object.entries(stats)) {
            if (!requiredStats[key]) return false;
            
            switch (requiredStats[key]) {
                case 'number':
                    if (typeof value !== 'number' || isNaN(value)) return false;
                    break;
                case 'array':
                    if (!Array.isArray(value)) return false;
                    break;
                case 'date':
                    if (!(value instanceof Date) && isNaN(Date.parse(value))) return false;
                    break;
            }
        }

        return true;
    }

    // Validate progress object
    validateProgress(progress) {
        const requiredProgress = {
            topicPerformance: 'object',
            missedQuestions: 'array',
            questionHistory: 'array'
        };

        for (const [key, value] of Object.entries(progress)) {
            if (!requiredProgress[key]) return false;
            
            if (typeof value !== requiredProgress[key]) return false;
        }

        return true;
    }
}

// Create and export a singleton instance
const userProfile = new UserProfile();
export default userProfile; 