import { auth, db } from './firebase-config.js';

class UserProfile {
    constructor() {
        this.user = null;
        this.profile = null;
        this.learningHistory = [];
        this.preferences = {
            difficulty: 'medium',
            topics: [],
            dailyGoal: 10,
            notifications: true
        };
    }

    // Initialize user profile
    async initialize() {
        try {
            // Listen for auth state changes
            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.user = user;
                    await this.loadProfile();
                    await this.loadLearningHistory();
                } else {
                    this.user = null;
                    this.profile = null;
                    this.learningHistory = [];
                }
            });
        } catch (error) {
            console.error('Error initializing user profile:', error);
            throw error;
        }
    }

    // Load user profile from Firestore
    async loadProfile() {
        try {
            const profileDoc = await db.collection('users').doc(this.user.uid).get();
            if (profileDoc.exists) {
                this.profile = profileDoc.data();
                this.preferences = this.profile.preferences || this.preferences;
            } else {
                // Create new profile if it doesn't exist
                await this.createProfile();
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            throw error;
        }
    }

    // Create new user profile
    async createProfile() {
        try {
            const newProfile = {
                email: this.user.email,
                displayName: this.user.displayName || this.user.email.split('@')[0],
                createdAt: new Date(),
                preferences: this.preferences,
                stats: {
                    quizzesCompleted: 0,
                    totalScore: 0,
                    averageScore: 0,
                    topicsMastered: []
                }
            };

            await db.collection('users').doc(this.user.uid).set(newProfile);
            this.profile = newProfile;
        } catch (error) {
            console.error('Error creating profile:', error);
            throw error;
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
}

// Create and export a singleton instance
const userProfile = new UserProfile();
export default userProfile; 