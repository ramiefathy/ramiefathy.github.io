import authManager from './auth.js';

class ProfileManager {
    constructor() {
        this.modal = document.getElementById('userProfileModal');
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Close modal
        document.getElementById('closeProfileModalBtn').addEventListener('click', () => {
            this.modal.classList.add('hidden');
        });

        // Sign out
        document.getElementById('signOutBtn').addEventListener('click', async () => {
            try {
                await authManager.signOut();
                this.modal.classList.add('hidden');
            } catch (error) {
                console.error('Error signing out:', error);
                alert('Error signing out. Please try again.');
            }
        });

        // Save preferences
        document.getElementById('savePreferencesBtn').addEventListener('click', async () => {
            try {
                const preferences = this.getPreferences();
                await authManager.updatePreferences(preferences);
                alert('Preferences saved successfully!');
            } catch (error) {
                console.error('Error saving preferences:', error);
                alert('Error saving preferences. Please try again.');
            }
        });

        // Edit profile
        document.getElementById('editProfileBtn').addEventListener('click', () => {
            // TODO: Implement profile editing
            alert('Profile editing coming soon!');
        });
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

    showProfile() {
        this.updateProfileDisplay();
        this.modal.classList.remove('hidden');
    }
}

// Create and export a singleton instance
const profileManager = new ProfileManager();
export default profileManager; 