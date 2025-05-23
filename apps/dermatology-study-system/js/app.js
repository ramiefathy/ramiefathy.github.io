import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { generateQuiz } from './quiz.js';
import profileManager from './profile-manager.js';
import chatManager from './chat.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBBbyHyAxTOwFu4q-Mh0jDuJq5ZPVAy2V0",
    authDomain: "dermai-e69a5.firebaseapp.com",
    projectId: "dermai-e69a5",
    storageBucket: "dermai-e69a5.firebasestorage.app",
    messagingSenderId: "940424189728",
    appId: "1:940424189728:web:8a6769a48b742055046945",
    measurementId: "G-YM5MFVJZBY"
};

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
            return this.user;
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        }
    }

    async signUp(email, password, displayName) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            await user.updateProfile({ displayName });
            await this.createUserProfile(user, displayName);
            return user;
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
        // Simplified question generation
        return Array(count).fill().map((_, i) => ({
            id: i + 1,
            question: `Sample question ${i + 1} about ${topics[0]}`,
            options: ['A', 'B', 'C', 'D', 'E'],
            correctAnswer: 'A',
            explanation: 'Sample explanation'
        }));
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
        // Simplified AI response
        return `AI response to: ${message}`;
    }
}

// Initialize managers
const authManager = new AuthManager();
const quizManager = new QuizManager();

// Export managers
export { authManager, quizManager, chatManager };

// Initialize application
async function initializeApplication() {
    try {
        // Initialize authentication
        await authManager.initialize();

        // Initialize chat manager
        await chatManager.initialize();

        // Add login modal to page
        const loginModal = await fetch('/apps/dermatology-study-system/components/login-modal.html').then(r => r.text());
        document.body.insertAdjacentHTML('beforeend', loginModal);

        // Add user profile component to page
        const userProfile = await fetch('/apps/dermatology-study-system/components/user-profile.html').then(r => r.text());
        const userProfileContainer = document.getElementById('userProfileComponent');
        if (userProfileContainer) {
            userProfileContainer.innerHTML = userProfile;
        } else {
            // If container doesn't exist, create it
            const container = document.createElement('div');
            container.id = 'userProfileComponent';
            container.innerHTML = userProfile;
            document.body.appendChild(container);
        }

        // Wait for DOM to update
        await new Promise(resolve => setTimeout(resolve, 500));

        // Initialize profile manager after modal is added to DOM
        await profileManager.initialize();

        // Initialize all event listeners
        initializeEventListeners();

    } catch (error) {
        console.error('Error initializing app:', error);
        alert('Error initializing application. Please refresh the page.');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApplication);

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
            const questionCount = parseInt(document.getElementById('questionCount')?.value || '10', 10);
            const topic = document.getElementById('quizTopic')?.value || 'general';
            generateQuiz({
                questionCount,
                topics: [topic],
                difficulty: 'medium'
            });
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
            const questionCount = parseInt(document.getElementById('questionCount')?.value || '10', 10);
            const topic = document.getElementById('quizTopic')?.value || 'general';
            generateQuiz({
                questionCount,
                topics: [topic],
                difficulty: 'medium'
            });
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
            chatManager.showChat();
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

// Add retry mechanism for API calls
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function callWithRetry(fn, ...args) {
    let lastError;
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            return await fn(...args);
        } catch (error) {
            lastError = error;
            console.warn(`Attempt ${i + 1} failed:`, error);
            if (i < MAX_RETRIES - 1) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
            }
        }
    }
    throw lastError;
}

// Enhanced error handling for API calls
async function callGeminiAPI(prompt, imageBase64 = null, imageMimeType = null) {
    try {
        const modelName = modelNameInput.value || "models/gemini-2.5-flash-preview-05-20";
        const parts = [{ text: prompt }];
        
        if (imageBase64 && imageMimeType && modelName.includes("vision")) {
            parts.push({ inlineData: { mimeType: imageMimeType, data: imageBase64 } });
        } else if (imageBase64 && !modelName.includes("vision")) {
            console.warn("Image provided but non-vision model selected");
        }

        const payload = {
            model: modelName,
            contents: [{ role: "user", parts }],
            generationConfig: {
                temperature: 0.2,
                topK: 1,
                topP: 1,
                maxOutputTokens: 4096
            },
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ]
        };

        return await callWithRetry(async () => {
            const json = await callViaWorker("generateContent", payload);
            if (!json || !json.response) {
                throw new Error("Invalid response from API");
            }
            return json.response.text();
        });
    } catch (error) {
        console.error("Error in callGeminiAPI:", error);
        throw new Error(`AI service error: ${error.message}`);
    }
}

// Add rate limiting
const RATE_LIMIT = {
    maxRequests: 10,
    timeWindow: 60000, // 1 minute
    requests: []
};

function checkRateLimit() {
    const now = Date.now();
    RATE_LIMIT.requests = RATE_LIMIT.requests.filter(time => now - time < RATE_LIMIT.timeWindow);
    if (RATE_LIMIT.requests.length >= RATE_LIMIT.maxRequests) {
        throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
    }
    RATE_LIMIT.requests.push(now);
}

// Add input sanitization
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .trim();
}

// Add session management
const SESSION = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    startTime: Date.now(),
    lastActivity: Date.now(),
    autoSaveInterval: null,
    data: {
        transcript: '',
        draftNote: '',
        aiAnalysis: '',
        imageData: null
    }
};

function updateSessionActivity() {
    SESSION.lastActivity = Date.now();
}

function startAutoSave() {
    if (SESSION.autoSaveInterval) {
        clearInterval(SESSION.autoSaveInterval);
    }
    SESSION.autoSaveInterval = setInterval(() => {
        saveSessionData();
    }, 30000); // Auto-save every 30 seconds
}

function saveSessionData() {
    try {
        SESSION.data = {
            transcript: fullTranscript,
            draftNote: currentDraftNote,
            aiAnalysis: currentAiAnalysis,
            imageData: currentImageBase64 ? {
                base64: currentImageBase64,
                mimeType: currentImageMimeType
            } : null
        };
        localStorage.setItem(`session_${SESSION.id}`, JSON.stringify(SESSION.data));
    } catch (error) {
        console.error("Error saving session data:", error);
    }
}

function loadSessionData() {
    try {
        const savedData = localStorage.getItem(`session_${SESSION.id}`);
        if (savedData) {
            const data = JSON.parse(savedData);
            fullTranscript = data.transcript || '';
            currentDraftNote = data.draftNote || '';
            currentAiAnalysis = data.aiAnalysis || '';
            if (data.imageData) {
                currentImageBase64 = data.imageData.base64;
                currentImageMimeType = data.imageData.mimeType;
            }
            updateUIFromSessionData();
        }
    } catch (error) {
        console.error("Error loading session data:", error);
    }
}

function updateUIFromSessionData() {
    if (fullTranscript) {
        transcriptionOutput.innerHTML = fullTranscript;
    }
    if (currentDraftNote) {
        displayFormattedNotes(currentDraftNote, 'aiNotesOutput');
    }
    if (currentAiAnalysis) {
        displayFormattedNotes(currentAiAnalysis, 'aiAnalysisContentOutput');
    }
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 's':
                e.preventDefault();
                saveButton.click();
                break;
            case 'r':
                e.preventDefault();
                if (!isRecording) {
                    startRecording();
                } else {
                    stopRecording();
                }
                break;
            case 'd':
                e.preventDefault();
                discussMicButton.click();
                break;
        }
    }
});

// Initialize session management
document.addEventListener('DOMContentLoaded', () => {
    loadSessionData();
    startAutoSave();
    document.addEventListener('click', updateSessionActivity);
    document.addEventListener('keydown', updateSessionActivity);
});

// Add caching mechanism
const CACHE = {
    maxSize: 100,
    data: new Map(),
    timestamps: new Map(),
    maxAge: 3600000, // 1 hour
};

function addToCache(key, value) {
    if (CACHE.data.size >= CACHE.maxSize) {
        const oldestKey = CACHE.timestamps.entries().next().value[0];
        CACHE.data.delete(oldestKey);
        CACHE.timestamps.delete(oldestKey);
    }
    CACHE.data.set(key, value);
    CACHE.timestamps.set(key, Date.now());
}

function getFromCache(key) {
    const timestamp = CACHE.timestamps.get(key);
    if (!timestamp || Date.now() - timestamp > CACHE.maxAge) {
        CACHE.data.delete(key);
        CACHE.timestamps.delete(key);
        return null;
    }
    return CACHE.data.get(key);
}

// Add debouncing for real-time suggestions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimize image processing
async function optimizeImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 1024;
                let width = img.width;
                let height = img.height;
                
                if (width > height && width > MAX_SIZE) {
                    height = Math.round((height * MAX_SIZE) / width);
                    width = MAX_SIZE;
                } else if (height > MAX_SIZE) {
                    width = Math.round((width * MAX_SIZE) / height);
                    height = MAX_SIZE;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                const optimizedBase64 = canvas.toDataURL(file.type, 0.8);
                resolve({
                    base64: optimizedBase64.split(',')[1],
                    mimeType: file.type
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Optimize real-time suggestions with debouncing
const debouncedFetchSuggestions = debounce(async (transcriptSegment) => {
    if (!isRecording || isPaused || isFetchingSuggestion) return;
    
    const currentTranscriptWordCount = transcriptSegment.split(' ').filter(Boolean).length;
    if (currentTranscriptWordCount < SUGGESTION_WORD_THRESHOLD || 
        (currentTranscriptWordCount - lastTranscriptLengthForSuggestion < SUGGESTION_NEW_WORDS_INTERVAL && lastTranscriptLengthForSuggestion > 0)) {
        return;
    }
    
    try {
        checkRateLimit();
        isFetchingSuggestion = true;
        lastTranscriptLengthForSuggestion = currentTranscriptWordCount;
        
        const cacheKey = `suggestion_${transcriptSegment}`;
        const cachedSuggestion = getFromCache(cacheKey);
        
        if (cachedSuggestion) {
            displaySuggestion(cachedSuggestion);
            return;
        }
        
        const prompt = REALTIME_SUGGESTION_PROMPT_TEMPLATE(transcriptSegment, Array.from(shownSuggestionTexts));
        const suggestion = await callGeminiAPI(prompt);
        
        if (suggestion) {
            addToCache(cacheKey, suggestion);
            displaySuggestion(suggestion);
        }
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        displayError("Error fetching suggestions. Please try again.", 'realtimeSuggestionsOutput');
    } finally {
        isFetchingSuggestion = false;
    }
}, 1000);

// Update image upload handler to use optimized image processing
imageUploadInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        try {
            const optimized = await optimizeImage(file);
            currentImageBase64 = optimized.base64;
            currentImageMimeType = optimized.mimeType;
            
            imagePreview.src = `data:${optimized.mimeType};base64,${optimized.base64}`;
            imagePreviewContainer.classList.remove('hidden');
            analyzeImageBtn.disabled = false;
            imageAnalysisResult.innerHTML = '<p class="text-slate-400 italic">AI description of image findings will appear here...</p>';
            imageApprovalControls.classList.add('hidden');
        } catch (error) {
            console.error("Error processing image:", error);
            displayError("Error processing image. Please try again.", 'imageAnalysisResult');
        }
    } else {
        imagePreviewContainer.classList.add('hidden');
        imagePreview.src = "#";
        analyzeImageBtn.disabled = true;
        currentImageBase64 = null;
        currentImageMimeType = null;
    }
});

// Update recognition events to use debounced suggestions
function setupRecognitionEvents(recInstance, outputElement, isDiscussionMic = false) {
    if (!recInstance) return;
    let currentLineElement = null;
    let tempTranscript = "";

    recInstance.onstart = () => {
        console.log(`Speech recognition started (${isDiscussionMic ? 'discussion' : 'main'}).`);
        if (isDiscussionMic) {
            isDiscussing = true;
            tempTranscript = "";
            discussMicButton.classList.add('text-red-500', 'animate-pulse');
            physicianFeedbackInput.disabled = true;
            sendFeedbackButton.disabled = true;
        } else {
            isRecording = true;
            isPaused = false;
            startTimer();
            clearAllPlaceholders();
        }
        updateUIForRecordingState();
    };

    recInstance.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscriptSegment = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                const segment = event.results[i][0].transcript;
                finalTranscriptSegment += segment;
                if (!isDiscussionMic) {
                    transcriptWordCount += segment.split(' ').filter(Boolean).length;
                    debouncedFetchSuggestions(fullTranscript + finalTranscriptSegment);
                }
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        // ... rest of the existing onresult code ...
    };

    // ... rest of the existing setupRecognitionEvents code ...
}

// Toast notification system
const TOAST = {
    queue: [],
    isProcessing: false,
    duration: 3000
};

function showToast(message, type = 'info') {
    TOAST.queue.push({ message, type });
    if (!TOAST.isProcessing) {
        processToastQueue();
    }
}

function processToastQueue() {
    if (TOAST.queue.length === 0) {
        TOAST.isProcessing = false;
        return;
    }

    TOAST.isProcessing = true;
    const { message, type } = TOAST.queue.shift();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(toast);
            processToastQueue();
        }, 300);
    }, TOAST.duration);
}

// Loading state management
const LOADING = {
    states: new Map(),
    
    start(elementId, message = 'Loading...') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.classList.add('loading');
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        element.appendChild(spinner);
        
        if (message) {
            const messageElement = document.createElement('div');
            messageElement.className = 'loading-message';
            messageElement.textContent = message;
            element.appendChild(messageElement);
        }
        
        this.states.set(elementId, { spinner, messageElement: message ? element.lastChild : null });
    },
    
    stop(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const state = this.states.get(elementId);
        if (state) {
            if (state.spinner) element.removeChild(state.spinner);
            if (state.messageElement) element.removeChild(state.messageElement);
            this.states.delete(elementId);
        }
        
        element.classList.remove('loading');
    }
};

// Update existing functions to use loading states and toasts
async function generateInitialNoteAndAnalysis(transcriptToProcess) {
    if (!transcriptToProcess.trim()) {
        showToast("Transcript is empty. No notes to generate.", 'error');
        return;
    }
    
    LOADING.start('aiNotesOutput', 'Generating clinical note...');
    LOADING.start('aiAnalysisContentOutput', 'Generating analysis & workup...');
    saveButton.disabled = true;

    try {
        const prompt = INITIAL_GENERATION_PROMPT_TEMPLATE(transcriptToProcess);
        const fullResponseText = await callGeminiAPI(prompt);

        const parts = fullResponseText.split("AI_ANALYSIS_SEPARATOR_V2");
        const notesText = parts[0] || "";
        const analysisText = parts[1] || "";

        currentDraftNote = notesText.trim();
        currentAiAnalysis = analysisText.trim();

        displayFormattedNotes(currentDraftNote, 'aiNotesOutput'); 
        displayFormattedNotes(currentAiAnalysis, 'aiAnalysisContentOutput');
        
        switchTab('right', 'draftedNote'); 
        switchTab('left', 'aiAnalysis');
        
        showToast("Note and analysis generated successfully", 'success');
    } catch (error) {
        console.error("Error generating note and analysis:", error);
        showToast("Error generating note and analysis. Please try again.", 'error');
    } finally {
        LOADING.stop('aiNotesOutput');
        LOADING.stop('aiAnalysisContentOutput');
        saveButton.disabled = false;
    }
}

// Update image analysis to use loading states
analyzeImageBtn.addEventListener('click', async () => {
    if (!currentImageBase64) {
        showToast("Please upload an image first", 'error');
        return;
    }
    
    LOADING.start('imageAnalysisResult', 'Analyzing image...');
    try {
        const prompt = IMAGE_ANALYSIS_PROMPT_TEMPLATE;
        const description = await callGeminiAPI(prompt, currentImageBase64, currentImageMimeType);
        
        if (description) {
            currentImageDescription = description;
            imageAnalysisResult.innerHTML = `<p class="text-slate-700">${description}</p>`;
            imageApprovalControls.classList.remove('hidden');
            showToast("Image analysis complete", 'success');
        }
    } catch (error) {
        console.error("Error analyzing image:", error);
        showToast("Error analyzing image. Please try again.", 'error');
        imageAnalysisResult.innerHTML = '<p class="text-red-500">Error analyzing image. Please try again.</p>';
    } finally {
        LOADING.stop('imageAnalysisResult');
    }
});

// Update real-time suggestions to use loading states
async function fetchAndDisplayAiSuggestions() {
    if (!isRecording || isPaused || isFetchingSuggestion) return;
    
    const currentTranscriptWordCount = fullTranscript.split(' ').filter(Boolean).length;
    if (currentTranscriptWordCount < SUGGESTION_WORD_THRESHOLD || 
        (currentTranscriptWordCount - lastTranscriptLengthForSuggestion < SUGGESTION_NEW_WORDS_INTERVAL && lastTranscriptLengthForSuggestion > 0)) {
        return;
    }
    
    LOADING.start('realtimeSuggestionsOutput', 'Thinking of suggestions...');
    isFetchingSuggestion = true;
    lastTranscriptLengthForSuggestion = currentTranscriptWordCount;
    
    try {
        checkRateLimit();
        const prompt = REALTIME_SUGGESTION_PROMPT_TEMPLATE(fullTranscript, Array.from(shownSuggestionTexts));
        const suggestion = await callGeminiAPI(prompt);
        
        if (suggestion) {
            displaySuggestion(suggestion);
            showToast("New suggestion available", 'info');
        }
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        showToast("Error fetching suggestions. Please try again.", 'error');
    } finally {
        LOADING.stop('realtimeSuggestionsOutput');
        isFetchingSuggestion = false;
    }
} 