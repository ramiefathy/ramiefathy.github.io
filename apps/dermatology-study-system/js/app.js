// Import Firebase instances
import { app, db, auth } from './firebase-config.js';
import { generateQuiz } from './quiz.js';
import authManager from './auth.js';
import profileManager from './profile-manager.js';

// Initialize application
async function initializeApp() {
    try {
        // Initialize authentication
        await authManager.initialize();

        // Add login modal to page
        const loginModal = await fetch('components/login-modal.html').then(r => r.text());
        document.body.insertAdjacentHTML('beforeend', loginModal);

        // Add user profile component to page
        const userProfile = await fetch('components/user-profile.html').then(r => r.text());
        document.body.insertAdjacentHTML('beforeend', userProfile);

        // Wait for DOM to update
        await new Promise(resolve => setTimeout(resolve, 200));

        // Initialize all event listeners
        initializeEventListeners();

        // Initialize profile manager after modal is added to DOM
        await profileManager.initialize();

    } catch (error) {
        console.error('Error initializing app:', error);
        alert('Error initializing application. Please refresh the page.');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeEventListeners() {
    // Get all DOM elements
    const startQuizBtn = document.getElementById('startQuizBtn');
    const startCaseBtn = document.getElementById('startCaseBtn');
    const startDDxBtn = document.getElementById('startDDxBtn');
    const viewPlanBtn = document.getElementById('viewPlanBtn');
    const startFlashcardsBtn = document.getElementById('startFlashcardsBtn');
    const startChatBtn = document.getElementById('startChatBtn');
    const userProfileBtn = document.getElementById('userProfileBtn');
    const loginBtn = document.getElementById('loginBtn');
    const closeQuizModalBtn = document.getElementById('closeQuizModalBtn');
    const startQuizConfirmBtn = document.getElementById('startQuizConfirmBtn');

    // Initialize login modal
    initializeLoginModal();

    // Event Listeners
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const loginModal = document.getElementById('loginModal');
            if (loginModal) loginModal.classList.remove('hidden');
        });
    }

    if (startQuizBtn) {
        startQuizBtn.addEventListener('click', () => {
            if (!authManager.user) {
                alert('Please sign in to start a quiz.');
                return;
            }
            const questionCount = document.getElementById('questionCount')?.value;
            const topic = document.getElementById('quizTopic')?.value;
            if (questionCount && topic) {
                generateQuiz(questionCount, topic);
            }
        });
    }

    if (closeQuizModalBtn) {
        closeQuizModalBtn.addEventListener('click', () => {
            const quizModal = document.getElementById('quizModal');
            if (quizModal) quizModal.classList.add('hidden');
        });
    }

    if (startQuizConfirmBtn) {
        startQuizConfirmBtn.addEventListener('click', () => {
            if (!authManager.user) {
                alert('Please sign in to start a quiz.');
                return;
            }
            const questionCount = document.getElementById('questionCount')?.value;
            const topic = document.getElementById('quizTopic')?.value;
            if (questionCount && topic) {
                generateQuiz(questionCount, topic);
            }
        });
    }

    if (startCaseBtn) {
        startCaseBtn.addEventListener('click', () => {
            if (!authManager.user) {
                alert('Please sign in to access clinical cases.');
                return;
            }
            alert('Clinical Cases feature coming soon!');
        });
    }

    if (startDDxBtn) {
        startDDxBtn.addEventListener('click', () => {
            if (!authManager.user) {
                alert('Please sign in to access the DDx tool.');
                return;
            }
            alert('Differential Diagnosis tool coming soon!');
        });
    }

    if (viewPlanBtn) {
        viewPlanBtn.addEventListener('click', () => {
            if (!authManager.user) {
                alert('Please sign in to access the study planner.');
                return;
            }
            alert('Study Planner feature coming soon!');
        });
    }

    if (startFlashcardsBtn) {
        startFlashcardsBtn.addEventListener('click', () => {
            if (!authManager.user) {
                alert('Please sign in to access flashcards.');
                return;
            }
            alert('Flashcards feature coming soon!');
        });
    }

    if (startChatBtn) {
        startChatBtn.addEventListener('click', () => {
            if (!authManager.user) {
                alert('Please sign in to access the AI assistant.');
                return;
            }
            alert('AI Assistant feature coming soon!');
        });
    }

    if (userProfileBtn) {
        userProfileBtn.addEventListener('click', async () => {
            await profileManager.showProfile();
        });
    }
}

function initializeLoginModal() {
    const loginModal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const toggleFormsBtn = document.getElementById('toggleFormsBtn');
    const closeLoginModalBtn = document.getElementById('closeLoginModalBtn');

    if (!loginModal || !loginForm || !signupForm || !toggleFormsBtn || !closeLoginModalBtn) {
        console.warn('Some login modal elements not found');
        return;
    }

    // Toggle between login and signup forms
    toggleFormsBtn.addEventListener('click', () => {
        const isLoginForm = loginForm.classList.contains('hidden');
        loginForm.classList.toggle('hidden');
        signupForm.classList.toggle('hidden');
        toggleFormsBtn.textContent = isLoginForm ? 'Already have an account? Sign in' : 'Don\'t have an account? Sign up';
    });

    // Close modal
    closeLoginModalBtn.addEventListener('click', () => {
        loginModal.classList.add('hidden');
    });

    // Handle login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;

        if (!email || !password) {
            alert('Please enter both email and password');
            return;
        }

        try {
            await authManager.signIn(email, password);
            loginModal.classList.add('hidden');
        } catch (error) {
            console.error('Error signing in:', error);
            alert('Error signing in. Please check your credentials and try again.');
        }
    });

    // Handle signup
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signupEmail')?.value;
        const password = document.getElementById('signupPassword')?.value;
        const displayName = document.getElementById('signupName')?.value;

        if (!email || !password || !displayName) {
            alert('Please fill in all fields');
            return;
        }

        try {
            await authManager.signUp(email, password, displayName);
            loginModal.classList.add('hidden');
        } catch (error) {
            console.error('Error signing up:', error);
            alert('Error creating account. Please try again.');
        }
    });
} 