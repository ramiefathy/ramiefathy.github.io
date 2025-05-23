import authManager from './auth.js';

class ProfileManager {
    constructor() {
        this.modal = null;
        this.initialized = false;
        this.initializationAttempts = 0;
        this.MAX_INITIALIZATION_ATTEMPTS = 10;
        this.INITIALIZATION_DELAY = 200;
    }

    async initialize() {
        if (this.initialized) return;

        // Try to find the modal
        this.modal = document.getElementById('userProfileModal');
        
        if (!this.modal) {
            this.initializationAttempts++;
            if (this.initializationAttempts < this.MAX_INITIALIZATION_ATTEMPTS) {
                console.warn(`Profile modal not found. Retrying initialization (attempt ${this.initializationAttempts}/${this.MAX_INITIALIZATION_ATTEMPTS})...`);
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, this.INITIALIZATION_DELAY));
                return this.initialize();
            } else {
                console.error('Failed to find profile modal after multiple attempts');
                return;
            }
        }

        // Wait a bit to ensure all elements are in the DOM
        await new Promise(resolve => setTimeout(resolve, 100));

        this.initializeEventListeners();
        this.initialized = true;
        console.log('Profile manager initialized successfully');
    }

    initializeEventListeners() {
        if (!this.modal) {
            console.warn('Cannot initialize event listeners: modal not found');
            return;
        }

        // Close modal
        const closeBtn = document.getElementById('closeProfileModalBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.modal.classList.add('hidden');
            });
        }

        // Sign out
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', async () => {
                try {
                    await authManager.signOut();
                    this.modal.classList.add('hidden');
                } catch (error) {
                    console.error('Error signing out:', error);
                    alert('Error signing out. Please try again.');
                }
            });
        }

        // Save preferences
        const savePrefsBtn = document.getElementById('savePreferencesBtn');
        if (savePrefsBtn) {
            savePrefsBtn.addEventListener('click', async () => {
                try {
                    const preferences = this.getPreferences();
                    await authManager.updatePreferences(preferences);
                    alert('Preferences saved successfully!');
                } catch (error) {
                    console.error('Error saving preferences:', error);
                    alert('Error saving preferences. Please try again.');
                }
            });
        }

        // Edit profile
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                // TODO: Implement profile editing
                alert('Profile editing coming soon!');
            });
        }
    }

    getPreferences() {
        return {
            quizDifficulty: document.getElementById('quizDifficulty').value,
            studyFocus: Array.from(document.querySelectorAll('input[type="checkbox"][value]'))
                .filter(cb => cb.checked)
                .map(cb => cb.value),
            notifications: document.getElementById('notifications').checked
        };
    }

    updateProfileDisplay() {
        const profile = authManager.userProfile;
        if (!profile) return;

        // Update basic info
        document.getElementById('profileName').textContent = profile.displayName || 'Anonymous User';
        document.getElementById('profileEmail').textContent = profile.email;
        document.getElementById('profileInitials').textContent = this.getInitials(profile.displayName);

        // Update progress
        document.getElementById('quizzesCompleted').textContent = profile.progress.quizzesCompleted;
        document.getElementById('averageScore').textContent = `${profile.progress.averageScore}%`;

        // Update topics mastered
        const topicsContainer = document.getElementById('topicsMastered');
        topicsContainer.innerHTML = profile.progress.topicsMastered
            .map(topic => `
                <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    ${topic}
                </span>
            `).join('');

        // Update preferences
        document.getElementById('quizDifficulty').value = profile.preferences.quizDifficulty;
        document.getElementById('notifications').checked = profile.preferences.notifications;

        // Update study focus checkboxes
        const checkboxes = document.querySelectorAll('input[type="checkbox"][value]');
        checkboxes.forEach(cb => {
            cb.checked = profile.preferences.studyFocus.includes(cb.value);
        });
    }

    getInitials(name) {
        if (!name) return 'AU';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    async showProfile() {
        // Ensure modal is initialized
        await this.initialize();
        
        if (!this.modal) {
            console.error('Profile modal not found');
            return;
        }

        this.updateProfileDisplay();
        this.modal.classList.remove('hidden');
    }
}

// Create and export a singleton instance
const profileManager = new ProfileManager();
export default profileManager; 