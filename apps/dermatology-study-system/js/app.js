// Import Firebase instances
import { app, db, auth } from './firebase-config.js';
import { generateQuiz } from './quiz.js';
import authManager from './auth.js';
import profileManager from './profile-manager.js';

// DOM Elements
const startQuizBtn = document.getElementById('startQuizBtn');
const startCaseBtn = document.getElementById('startCaseBtn');
const startDDxBtn = document.getElementById('startDDxBtn');
const viewPlanBtn = document.getElementById('viewPlanBtn');
const startFlashcardsBtn = document.getElementById('startFlashcardsBtn');
const startChatBtn = document.getElementById('startChatBtn');
const userProfileBtn = document.getElementById('userProfileBtn');
const loginBtn = document.getElementById('loginBtn');

// Initialize application
async function initializeApp() {
    try {
        // Initialize authentication
        await authManager.initialize();

        // Add login modal to page
        const loginModal = await fetch('components/login-modal.html').then(r => r.text());
        document.body.insertAdjacentHTML('beforeend', loginModal);

        // Initialize login modal event listeners
        initializeLoginModal();

        // Add user profile component to page
        const userProfile = await fetch('components/user-profile.html').then(r => r.text());
        document.body.insertAdjacentHTML('beforeend', userProfile);

    } catch (error) {
        console.error('Error initializing app:', error);
        alert('Error initializing application. Please refresh the page.');
    }
}

function initializeLoginModal() {
    const loginModal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const toggleFormsBtn = document.getElementById('toggleFormsBtn');
    const closeLoginModalBtn = document.getElementById('closeLoginModalBtn');

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
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

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
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const displayName = document.getElementById('signupName').value;

        try {
            await authManager.signUp(email, password, displayName);
            loginModal.classList.add('hidden');
        } catch (error) {
            console.error('Error signing up:', error);
            alert('Error creating account. Please try again.');
        }
    });
}

// Event Listeners
loginBtn.addEventListener('click', () => {
    const loginModal = document.getElementById('loginModal');
    loginModal.classList.remove('hidden');
});

startQuizBtn.addEventListener('click', () => {
    if (!authManager.user) {
        alert('Please sign in to start a quiz.');
        return;
    }
    const questionCount = document.getElementById('questionCount').value;
    const topic = document.getElementById('quizTopic').value;
    generateQuiz(questionCount, topic);
});

// Close Quiz Modal
document.getElementById('closeQuizModalBtn').addEventListener('click', () => {
    const quizModal = document.getElementById('quizModal');
    quizModal.classList.add('hidden');
});

// Start Quiz Confirmation
document.getElementById('startQuizConfirmBtn').addEventListener('click', () => {
    if (!authManager.user) {
        alert('Please sign in to start a quiz.');
        return;
    }
    const questionCount = document.getElementById('questionCount').value;
    const topic = document.getElementById('quizTopic').value;
    generateQuiz(questionCount, topic);
});

// Clinical Cases
startCaseBtn.addEventListener('click', () => {
    if (!authManager.user) {
        alert('Please sign in to access clinical cases.');
        return;
    }
    alert('Clinical Cases feature coming soon!');
});

// DDx Tool
startDDxBtn.addEventListener('click', () => {
    if (!authManager.user) {
        alert('Please sign in to access the DDx tool.');
        return;
    }
    alert('Differential Diagnosis tool coming soon!');
});

// Study Planner
viewPlanBtn.addEventListener('click', () => {
    if (!authManager.user) {
        alert('Please sign in to access the study planner.');
        return;
    }
    alert('Study Planner feature coming soon!');
});

// Flashcards
startFlashcardsBtn.addEventListener('click', () => {
    if (!authManager.user) {
        alert('Please sign in to access flashcards.');
        return;
    }
    alert('Flashcards feature coming soon!');
});

// Chatbot
startChatBtn.addEventListener('click', () => {
    if (!authManager.user) {
        alert('Please sign in to access the AI assistant.');
        return;
    }
    alert('AI Assistant feature coming soon!');
});

// User Profile
userProfileBtn.addEventListener('click', () => {
    profileManager.showProfile();
});

// Initialize the application
initializeApp(); 