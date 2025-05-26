import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from './firebase-config.js'; // Import the configuration
// import { generateQuiz } from './quiz.js'; // Will use internal QuizManager.generateQuestions for now
// import profileManager from './profile-manager.js'; // Stubbed out for now
// import chatManager from './chat.js'; // Will use internal ChatManager for now

// Firebase configuration is now imported from firebase-config.js

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth Manager
class AuthManager {
    constructor() {
        this.user = null;
        this.userProfile = null;
    }

    async signIn(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            this.user = userCredential.user;
            await this.loadUserProfile();
            updateUIAfterAuthStateChange(this.user); // Update UI
            return this.user;
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        }
    }

    async signUp(email, password, displayName) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            this.user = userCredential.user; // Assign to this.user
            await this.user.updateProfile({ displayName });
            await this.createUserProfile(this.user, displayName);
            updateUIAfterAuthStateChange(this.user); // Update UI
            return this.user;
        } catch (error) {
            console.error('Error signing up:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            await auth.signOut();
            this.user = null;
            this.userProfile = null;
            updateUIAfterAuthStateChange(null); // Update UI
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
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

    async createUserProfile(user, displayName) {
        try {
            const userProfile = {
                email: user.email,
                displayName: displayName || user.email.split('@')[0],
                createdAt: new Date(),
                preferences: {
                    theme: 'light',
                    notifications: true
                },
                stats: {
                    quizzesCompleted: 0,
                    averageScore: 0
                }
            };
            await db.collection('users').doc(user.uid).set(userProfile);
            this.userProfile = userProfile;
        } catch (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }
    }
}

// Quiz Manager
class QuizManager {
    constructor() {
        this.currentQuiz = null;
        this.questions = [];
    }

    async generateQuiz(options) {
        try {
            const { questionCount = 10, topics = ['general'], difficulty = 'medium' } = options;
            // Generate questions using AI
            const questions = await this.generateQuestions(questionCount, topics, difficulty);
            this.questions = questions;
            return questions;
        } catch (error) {
            console.error('Error generating quiz:', error);
            throw error;
        }
    }

    async generateQuestions(count, topics, difficulty) {
        const prompt = `Generate ${count} quiz questions about ${topics[0]} (difficulty: ${difficulty}). Each question should have 4 options and a correct answer.`;
        try {
            const aiResponse = await callGeminiAPI(prompt);
            // Basic parsing of a simple string response (assuming one question per line, or just using the whole response for each question's text for now)
            // This will be improved when callGeminiAPI returns structured data.
            // For now, creating placeholder questions based on a simple transformation of aiResponse:
            return Array(count).fill().map((_, i) => ({
                id: i + 1,
                question: `AI Question ${i + 1}: ${aiResponse.substring(0, 100)} (topic: ${topics[0]})`, // Example transformation
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: 'Option A',
                explanation: `Explanation from AI for Q${i+1} (placeholder based on: ${aiResponse.substring(0,30)}...)`
            }));
        } catch (error) {
            console.error('Error generating AI questions:', error);
            // Fallback to simple sample questions if AI call fails
            return Array(count).fill().map((_, i) => ({
                id: i + 1,
                question: `Fallback Sample question ${i + 1} about ${topics[0]}`,
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 'A',
                explanation: 'Sample explanation (fallback)'
            }));
        }
    }
}

// Chat Manager
class ChatManager {
    constructor() {
        this.messages = [];
    }

    async sendMessage(message) {
        try {
            // Add user message
            this.addMessage('user', message);
            
            // Get AI response
            const response = await this.getAIResponse(message);
            
            // Add AI response
            this.addMessage('assistant', response);
            
            return response;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    addMessage(role, content) {
        this.messages.push({ role, content, timestamp: new Date() });
    }

    async getAIResponse(message) {
        try {
            const aiResponse = await callGeminiAPI(message);
            return aiResponse; // Directly return the string from the dummy callGeminiAPI
        } catch (error) {
            console.error('Error getting AI response:', error);
            return "Sorry, I couldn't get a response from the AI at this moment.";
        }
    }
}

// Initialize managers
const authManager = new AuthManager();
const quizManager = new QuizManager();
const chatManager = new ChatManager(); // Using the internal ChatManager

// Stubbed profileManager
const profileManager = {
    initialize: async () => { console.log("ProfileManager initialize (stubbed)"); },
    showProfile: async () => {
        console.log("ProfileManager showProfile (stubbed)");
        alert("Profile feature is currently under development.");
        // Potentially show a basic modal or redirect, for now, just an alert.
        // Example:
        // const userProfileModal = document.getElementById('userProfileModal'); // Assuming you add such a modal
        // if (userProfileModal) userProfileModal.classList.remove('hidden');
    }
};

// Export managers
export { authManager, quizManager, chatManager };

// Initialize application
async function initializeApplication() {
    try {
        // Listen for authentication state changes
        auth.onAuthStateChanged(user => {
            if (user) {
                // User is signed in.
                authManager.user = user; // Update AuthManager's user
                authManager.loadUserProfile().then(() => {
                    updateUIAfterAuthStateChange(user);
                });
            } else {
                // User is signed out.
                authManager.user = null;
                authManager.userProfile = null;
                updateUIAfterAuthStateChange(null);
            }
        });
        
        // Initialize profile manager (stubbed)
        await profileManager.initialize();

        // Initialize all event listeners
        initializeEventListeners();

    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApplication);

// --- UI Helper Functions ---

function showLoadingOverlay(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    const messageEl = document.getElementById('loadingMessage');
    if (messageEl) messageEl.textContent = message;
    if (overlay) overlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('hidden');
}

function showError(message) {
    const errorOverlay = document.getElementById('errorOverlay');
    const errorMessageEl = document.getElementById('errorMessage');
    if (errorMessageEl) errorMessageEl.textContent = message;
    if (errorOverlay) errorOverlay.classList.remove('hidden');
}

function hideError() {
    const errorOverlay = document.getElementById('errorOverlay');
    if (errorOverlay) errorOverlay.classList.add('hidden');
}

function updateUIAfterAuthStateChange(user) {
    const loginButton = document.getElementById('loginBtn');
    const userProfileButton = document.getElementById('userProfileBtn');

    if (user) {
        // User is signed in
        if (loginButton) loginButton.classList.add('hidden');
        if (userProfileButton) userProfileButton.classList.remove('hidden');
        // Potentially update userProfileButton text with user's name/initials if available
        // if (userProfileButton && authManager.userProfile) {
        //     userProfileButton.textContent = authManager.userProfile.displayName || 'Profile';
        // } else if (userProfileButton && authManager.user) {
        //     userProfileButton.textContent = authManager.user.displayName || authManager.user.email || 'Profile';
        // }
    } else {
        // User is signed out
        if (loginButton) loginButton.classList.remove('hidden');
        if (userProfileButton) userProfileButton.classList.add('hidden');
    }
}


function initializeEventListeners() {
    // Get all DOM elements from index.html
    const loginBtn = document.getElementById('loginBtn'); // For showing login modal
    const userProfileBtn = document.getElementById('userProfileBtn'); // For showing profile (stubbed)
    
    // Buttons for main dashboard actions
    const quizBtn = document.getElementById('quizBtn'); // Matches index.html
    const casesBtn = document.getElementById('casesBtn'); // Matches index.html
    const differentialBtn = document.getElementById('differentialBtn'); // Matches index.html
    const studyPlanBtn = document.getElementById('studyPlanBtn'); // Matches index.html
    const flashcardsBtn = document.getElementById('flashcardsBtn'); // Matches index.html
    const chatBtn = document.getElementById('chatBtn'); // Matches index.html

    // Quiz Modal elements
    const closeQuizModalBtn = document.getElementById('closeQuizModalBtn'); // Matches index.html
    const startQuizConfirmBtn = document.getElementById('startQuizConfirmBtn'); // Matches index.html
    const quizModal = document.getElementById('quizModal'); // Matches index.html
    const questionCountInput = document.getElementById('questionCount'); // Matches index.html
    const quizTopicSelect = document.getElementById('quizTopic'); // Matches index.html

    // Chat Modal elements (from index.html)
    const chatModal = document.getElementById('chatModal');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const chatInput = document.getElementById('chatInput');
    const chatMessagesDiv = document.getElementById('chatMessages');


    // Initialize login modal events
    initializeLoginModal(); 

    // Close error overlay button
    const closeErrorBtn = document.getElementById('closeErrorBtn');
    if (closeErrorBtn) {
        closeErrorBtn.addEventListener('click', hideError);
    }

    // Event Listeners
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const loginModalEl = document.getElementById('loginModal'); 
            if (loginModalEl) {
                loginModalEl.classList.remove('hidden'); 
            } else {
                console.error("Login modal element (#loginModal) not found!");
            }
        });
    }

    if (quizBtn) { 
        quizBtn.addEventListener('click', () => {
            if (!authManager.user) {
                alert('Please sign in to start a quiz.');
                const loginModalEl = document.getElementById('loginModal');
                if (loginModalEl) loginModalEl.classList.remove('hidden');
                return;
            }
            if (quizModal) quizModal.classList.remove('hidden'); 
        });
    }

    if (closeQuizModalBtn) {
        closeQuizModalBtn.addEventListener('click', () => {
            if (quizModal) quizModal.classList.add('hidden');
        });
    }

    if (startQuizConfirmBtn) {
        startQuizConfirmBtn.addEventListener('click', async () => { 
            if (!authManager.user) {
                alert('Please sign in to start a quiz.');
                const loginModalEl = document.getElementById('loginModal');
                if (loginModalEl) loginModalEl.classList.remove('hidden');
                return;
            }
            const count = parseInt(questionCountInput?.value || '10', 10);
            const topic = quizTopicSelect?.value || 'general';
            
            showLoadingOverlay('Generating quiz...');
            try {
                const questions = await quizManager.generateQuiz({ 
                    questionCount: count,
                    topics: [topic],
                    difficulty: 'medium'
                });
                console.log("Generated quiz questions:", questions);
                if (quizModal) quizModal.classList.add('hidden');
                // alert(`Quiz generated with ${questions.length} questions on ${topic}. (Check console for questions)`);
                // TODO: Implement displayQuiz function
                displayQuiz(questions); // Placeholder for actual quiz display
            } catch (error) {
                console.error("Error generating quiz:", error);
                showError(`Failed to generate quiz: ${error.message}`);
            } finally {
                hideLoadingOverlay();
            }
        });
    }

    if (casesBtn) { 
        casesBtn.addEventListener('click', () => {
            if (!authManager.user) {
                alert('Please sign in to access clinical cases.');
                const loginModalEl = document.getElementById('loginModal');
                if (loginModalEl) loginModalEl.classList.remove('hidden');
                return;
            }
            window.location.href = 'clinical-cases.html';
        });
    }

    if (differentialBtn) { 
        differentialBtn.addEventListener('click', () => {
            if (!authManager.user) {
                alert('Please sign in to access the DDx tool.');
                const loginModalEl = document.getElementById('loginModal');
                if (loginModalEl) loginModalEl.classList.remove('hidden');
                return;
            }
            window.location.href = 'differential-diagnosis.html';
        });
    }

    if (studyPlanBtn) { 
        studyPlanBtn.addEventListener('click', () => {
            if (!authManager.user) {
                alert('Please sign in to access the study planner.');
                const loginModalEl = document.getElementById('loginModal');
                if (loginModalEl) loginModalEl.classList.remove('hidden');
                return;
            }
            window.location.href = 'study-plan.html';
        });
    }

    if (flashcardsBtn) { 
        flashcardsBtn.addEventListener('click', () => {
            if (!authManager.user) {
                alert('Please sign in to access flashcards.');
                const loginModalEl = document.getElementById('loginModal');
                if (loginModalEl) loginModalEl.classList.remove('hidden');
                return;
            }
            window.location.href = 'flashcards.html';
        });
    }

    if (chatBtn) { 
        chatBtn.addEventListener('click', () => {
            if (!authManager.user) {
                alert('Please sign in to access the AI assistant.');
                const loginModalEl = document.getElementById('loginModal');
                if (loginModalEl) loginModalEl.classList.remove('hidden');
                return;
            }
            if (chatModal) chatModal.classList.remove('hidden');
        });
    }
    
    if(closeChatBtn) {
        closeChatBtn.addEventListener('click', () => {
            if (chatModal) chatModal.classList.add('hidden');
        });
    }

    if(sendMessageBtn && chatInput && chatMessagesDiv) { //Ensure all chat elements exist
        sendMessageBtn.addEventListener('click', async () => {
            const messageText = chatInput.value.trim();
            if (!messageText) return;

            if (!authManager.user) {
                // This case should ideally be prevented by the chatBtn listener,
                // but as a safeguard:
                showError('Please sign in to chat.');
                const loginModalEl = document.getElementById('loginModal');
                if (loginModalEl) loginModalEl.classList.remove('hidden');
                return;
            }
            
            addMessageToUI(messageText, 'user');
            chatInput.value = '';
            showLoadingOverlay('Getting AI response...');

            try {
                const aiResponse = await chatManager.sendMessage(messageText); 
                addMessageToUI(aiResponse, 'assistant');
            } catch (error) {
                console.error("Error sending chat message:", error);
                showError(`Failed to send message: ${error.message}`);
                addMessageToUI('Error: Could not get AI response.', 'error'); // Show error in chat UI
            } finally {
                hideLoadingOverlay();
            }
        });
         // Also allow sending message with Enter key
         chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessageBtn.click();
            }
        });
    }


    if (userProfileBtn) {
        userProfileBtn.addEventListener('click', async () => {
            if (!authManager.user) {
                alert('Please sign in to view your profile.');
                 const loginModalEl = document.getElementById('loginModal');
                if (loginModalEl) loginModalEl.classList.remove('hidden');
                return;
            }
            await profileManager.showProfile(); 
        });
    }
}

function initializeLoginModal() {
    // This function now assumes the login modal structure is IN index.html
    // It will handle the form submissions and toggling visibility.
    const loginModal = document.getElementById('loginModal'); // From index.html
    const loginForm = document.getElementById('loginForm'); // From index.html
    const signupForm = document.getElementById('signupForm'); // From index.html
    const toggleFormsBtn = document.getElementById('toggleFormsBtn'); // From index.html
    const closeLoginModalBtn = document.getElementById('closeLoginModalBtn'); // From index.html

    // The original initializeLoginModal checked if elements were found and warned.
    // We should maintain that or ensure index.html is correctly providing these.
    // For now, we assume index.html has these elements.
    if (!loginModal || !loginForm || !signupForm || !toggleFormsBtn || !closeLoginModalBtn) {
        console.warn('One or more login modal elements not found. Login/Signup functionality may be impaired.');
        return;
    }

    if (toggleFormsBtn) {
        toggleFormsBtn.addEventListener('click', () => {
            loginForm.classList.toggle('hidden');
            signupForm.classList.toggle('hidden');
            const isLoginFormHidden = loginForm.classList.contains('hidden');
            toggleFormsBtn.textContent = isLoginFormHidden ? 'Already have an account? Sign in' : "Don't have an account? Sign up";
        });
    }

    if (closeLoginModalBtn) {
        closeLoginModalBtn.addEventListener('click', () => {
            if (loginModal) loginModal.classList.add('hidden');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoadingOverlay('Signing in...');
            const emailInput = document.getElementById('loginEmail'); 
            const passwordInput = document.getElementById('loginPassword'); 
            
            const email = emailInput?.value;
            const password = passwordInput?.value;

            if (!email || !password) {
                hideLoadingOverlay(); // Hide loading before showing alert
                showError('Please enter both email and password');
                return;
            }

            try {
                // authManager.signIn will call updateUIAfterAuthStateChange
                await authManager.signIn(email, password); 
                if (loginModal) loginModal.classList.add('hidden');
                // alert('Login successful!'); // Already handled by updateUIAfterAuthStateChange
            } catch (error) {
                console.error('Error signing in:', error);
                showError(`Error signing in: ${error.message}. Please check your credentials and try again.`);
            } finally {
                hideLoadingOverlay();
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoadingOverlay('Signing up...');
            const emailInput = document.getElementById('signupEmail'); 
            const passwordInput = document.getElementById('signupPassword'); 
            const displayNameInput = document.getElementById('signupName'); 

            const email = emailInput?.value;
            const password = passwordInput?.value;
            const displayName = displayNameInput?.value;

            if (!email || !password || !displayName) {
                hideLoadingOverlay();
                showError('Please fill in all fields');
                return;
            }

            try {
                // authManager.signUp will call updateUIAfterAuthStateChange
                await authManager.signUp(email, password, displayName);
                if (loginModal) loginModal.classList.add('hidden');
                // alert('Signup successful! You are now logged in.'); // Already handled
            } catch (error) {
                console.error('Error signing up:', error);
                showError(`Error creating account: ${error.message}. Please try again.`);
            } finally {
                hideLoadingOverlay();
            }
        });
    }
}

// Placeholder for displaying quiz questions
function displayQuiz(questions) {
    console.log("Attempting to display quiz with questions:", questions);
    // For now, just alert the number of questions.
    // In a real app, you'd render these to the DOM.
    alert(`Quiz generated with ${questions.length} questions. See console for details. UI display is a TODO.`);
    // Example: Render to a specific div
    // const quizDisplayArea = document.getElementById('quizDisplayArea'); // Assuming such an element exists
    // if (quizDisplayArea) {
    //     quizDisplayArea.innerHTML = ''; // Clear previous quiz
    //     questions.forEach(q => {
    //         const questionEl = document.createElement('div');
    //         questionEl.innerHTML = `<h4>${q.question}</h4><p>Options: ${q.options.join(', ')}</p>`;
    //         quizDisplayArea.appendChild(questionEl);
    //     });
    // } else {
    //     console.warn("#quizDisplayArea not found. Cannot display quiz questions in UI.");
    // }
}

// Function to add messages to the chat UI
function addMessageToUI(message, role) {
    const chatMessagesDiv = document.getElementById('chatMessages');
    if (!chatMessagesDiv) {
        console.error("#chatMessages element not found in the DOM.");
        return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.textContent = message; // For 'error' role, it's just the message text
    
    if (role === 'user') {
        messageDiv.textContent = `You: ${message}`;
        messageDiv.classList.add('text-right', 'mb-2', 'p-2', 'rounded-lg', 'bg-blue-100');
    } else if (role === 'assistant') {
        messageDiv.textContent = `AI: ${message}`;
        messageDiv.classList.add('text-left', 'mb-2', 'p-2', 'rounded-lg', 'bg-gray-100');
    } else if (role === 'error') { // For displaying errors directly in chat
        messageDiv.classList.add('text-left', 'mb-2', 'text-red-500', 'p-2');
    } else { // Generic message if role is not specific
         messageDiv.classList.add('text-left', 'mb-2', 'p-2');
    }
    
    chatMessagesDiv.appendChild(messageDiv);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight; // Scroll to bottom
}


// const MAX_RETRIES = 3; // Removed as callWithRetry is removed
// const RETRY_DELAY = 1000; // Removed as callWithRetry is removed

// async function callWithRetry(fn, ...args) { // This function is no longer used
//     let lastError;
//     for (let i = 0; i < MAX_RETRIES; i++) {
//         try {
//             return await fn(...args);
//         } catch (error) {
//             lastError = error;
//             console.warn(`Attempt ${i + 1} failed:`, error);
//             if (i < MAX_RETRIES - 1) {
//                 await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
//             }
//         }
//     }
//     throw lastError;
// }

// Enhanced error handling for API calls (Simplified - callWithRetry removed)
async function callGeminiAPI(prompt, imageBase64 = null, imageMimeType = null) {
    try {
        // const modelName = modelNameInput.value || "models/gemini-2.5-flash-preview-05-20"; // modelNameInput does not exist
        const modelName = "models/gemini-pro"; // Using a hardcoded model as per instructions
        const parts = [{ text: prompt }];
        
        if (imageBase64 && imageMimeType && modelName.includes("vision")) { // Simple check for vision model
            parts.push({ inlineData: { mimeType: imageMimeType, data: imageBase64 } });
        } else if (imageBase64 && !modelName.includes("vision")) {
            console.warn("Image provided but non-vision model selected. Image will be ignored.");
        }

        const payload = {
            model: modelName,
            contents: [{ role: "user", parts }],
            generationConfig: { // Simplified config
                temperature: 0.7, // Adjusted for general purpose
                maxOutputTokens: 1024 // Reduced for study app context
            },
            // safetySettings: [ // Simplified or removed if not strictly necessary for basic function
            //     { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            //     { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            //     { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            //     { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            // ]
        };
        
        // Assuming callViaWorker is a globally available function or needs to be defined/imported.
        // For now, this will likely cause an error if callViaWorker is not defined.
        // This function is not defined in the provided code.
        // This will need to be replaced with a direct fetch or similar mechanism if callViaWorker is not available.
        // For now, let's assume it's a placeholder that needs to be replaced.
        // To make progress, I will comment this out and return a dummy response.
        console.warn("callGeminiAPI: 'callViaWorker' is not defined. Using dummy response.");
        // const json = await callViaWorker("generateContent", payload); // This line would cause an error
        // if (!json || !json.response || typeof json.response.text !== 'function') { // Check if text is a function
        //     throw new Error("Invalid response from API or response.text is not a function");
        // }
        // return json.response.text(); // This would be the ideal return if callViaWorker worked
        return Promise.resolve(`Dummy AI response for prompt: "${prompt.substring(0, 50)}..."`); // Dummy response wrapped in Promise

    } catch (error) {
        console.error("Error in callGeminiAPI:", error);
        throw new Error(`AI service error: ${error.message}`);
    }
}

// Remove rate limiting, input sanitization, session management, keyboard shortcuts, caching,
// image processing, real-time suggestions, toast notifications, loading states
// as they are mostly related to the more complex features not present in index.html
// or refer to elements not available.

// Session management (SESSION object and related functions) - REMOVED
// Keyboard shortcuts - REMOVED
// Caching mechanism (CACHE object and functions) - REMOVED
// Debouncing for real-time suggestions - REMOVED
// Optimize image processing - REMOVED
// Optimize real-time suggestions with debouncing - REMOVED
// Update image upload handler - REMOVED (no imageUploadInput)
// Update recognition events - REMOVED (no speech recognition elements)
// Toast notification system - REMOVED
// Loading state management - REMOVED
// generateInitialNoteAndAnalysis - REMOVED (references removed elements)
// analyzeImageBtn event listener - REMOVED (no analyzeImageBtn)
// fetchAndDisplayAiSuggestions - REMOVED (real-time suggestions)
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

// Add retry mechanism for API calls
// All the complex features like session management, advanced image processing,
// real-time suggestions, toast notifications, loading states, extensive keyboard shortcuts,
// caching, etc., have been removed or commented out above.
// The file is now significantly shorter and focused on the core UI interactions.