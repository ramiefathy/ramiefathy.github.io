import { db } from './firebase-config.js';
import userProfile from './user-profile.js';
import questionGenerator from './question-generator.js';
import authManager from './auth-manager.js';
import askLLM from './ask-llm.js';
import uiManager from './ui-manager.js';

class QuizState {
    constructor() {
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.timer = null;
        this.timeRemaining = 0;
        this.eventListeners = new Map();
        this.isLoading = false;
    }

    reset() {
        // Clear timer
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        // Remove all event listeners
        this.cleanupEventListeners();

        // Reset state
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.timeRemaining = 0;
        this.isLoading = false;
    }

    cleanupEventListeners() {
        this.eventListeners.forEach((listener, element) => {
            if (element && element.removeEventListener) {
                element.removeEventListener(listener.type, listener.handler);
            }
        });
        this.eventListeners.clear();
    }

    addEventListener(element, type, handler) {
        if (!element) return;
        element.addEventListener(type, handler);
        this.eventListeners.set(element, { type, handler });
    }

    async saveProgress() {
        if (!this.currentQuiz) return;

        try {
            const progress = {
                quizId: this.currentQuiz.id,
                currentQuestionIndex: this.currentQuestionIndex,
                score: this.score,
                timeRemaining: this.timeRemaining,
                answers: this.currentQuiz.questions.map((q, index) => ({
                    questionId: q.id,
                    selectedAnswer: q.selectedAnswer,
                    isCorrect: q.isCorrect
                }))
            };

            // Save to localStorage
            localStorage.setItem('quizProgress', JSON.stringify(progress));

            // Save to database if user is logged in
            if (authManager.user) {
                await db.collection('users')
                    .doc(authManager.user.uid)
                    .collection('quizProgress')
                    .doc(this.currentQuiz.id)
                    .set(progress);
            }
        } catch (error) {
            console.error('Error saving quiz progress:', error);
            // Continue even if save fails - at least we have localStorage
        }
    }

    async loadProgress(quizId) {
        try {
            this.isLoading = true;

            // Try to load from localStorage first
            const savedProgress = localStorage.getItem('quizProgress');
            if (savedProgress) {
                const progress = JSON.parse(savedProgress);
                if (progress.quizId === quizId) {
                    return progress;
                }
            }

            // If not in localStorage, try database
            if (authManager.user) {
                const progressDoc = await db.collection('users')
                    .doc(authManager.user.uid)
                    .collection('quizProgress')
                    .doc(quizId)
                    .get();
                
                if (progressDoc.exists) {
                    return progressDoc.data();
                }
            }
        } catch (error) {
            console.error('Error loading quiz progress:', error);
            throw new Error('Failed to load quiz progress');
        } finally {
            this.isLoading = false;
        }
        return null;
    }

    startTimer(duration) {
        if (this.timer) {
            clearInterval(this.timer);
        }

        this.timeRemaining = duration;
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            if (this.timeRemaining <= 0) {
                clearInterval(this.timer);
                this.timer = null;
                this.handleTimeUp();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const timerElement = document.getElementById('quizTimer');
        if (!timerElement) return;

        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Update visual indicator
        const progress = (this.timeRemaining / this.currentQuiz.duration) * 100;
        timerElement.style.setProperty('--progress', `${progress}%`);

        // Add warning class when time is running low
        if (this.timeRemaining <= 30) {
            timerElement.classList.add('warning');
        } else {
            timerElement.classList.remove('warning');
        }
    }

    handleTimeUp() {
        // Save final progress
        this.saveProgress();

        // Show time up message
        const quizContainer = document.getElementById('quizContainer');
        if (quizContainer) {
            quizContainer.innerHTML = `
                <div class="text-center p-8">
                    <h2 class="text-2xl font-bold text-red-600 mb-4">Time's Up!</h2>
                    <p class="mb-4">Your quiz has ended due to time expiration.</p>
                    <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" 
                            onclick="showResults()">
                        View Results
                    </button>
                </div>
            `;
        }

        // Update user profile
        if (authManager.user) {
            authManager.updateQuizHistory(this.currentQuiz.id, {
                completed: true,
                score: this.score,
                timeExpired: true
            });
        }
    }
}

const quizState = new QuizState();

/**
 * Generates and starts a new quiz
 * @param {number} questionCount - Number of questions
 * @param {string[]} topics - Selected topics
 * @param {Object} config - Quiz configuration
 */
export async function generateQuiz(questionCount, topics, config = {}) {
    const loadingId = uiManager.showLoading('quiz_loading', 'Generating your quiz...');
    
    try {
        // Reset previous state
        quizState.reset();

        // Create quiz container if it doesn't exist
        let quizContainer = document.getElementById('quizContainer');
        if (!quizContainer) {
            quizContainer = document.createElement('div');
            quizContainer.id = 'quizContainer';
            quizContainer.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full';
            document.body.appendChild(quizContainer);
        }
        
        // Generate questions with retry mechanism
        let questions;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                questions = await questionGenerator.generateQuiz(questionCount, topics, 'medium');
                break;
            } catch (error) {
                retryCount++;
                if (retryCount === maxRetries) {
                    throw new Error('Failed to generate questions after multiple attempts');
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
        }
        
        // Initialize quiz state
        const quizId = `quiz_${Date.now()}`;
        quizState.currentQuiz = {
            id: quizId,
            questions,
            startTime: new Date(),
            topics,
            questionCount,
            config
        };

        // Load saved progress if exists
        const savedProgress = await quizState.loadProgress(quizId);
        if (savedProgress) {
            quizState.currentQuestionIndex = savedProgress.currentQuestionIndex;
            quizState.score = savedProgress.score;
            quizState.timeRemaining = savedProgress.timeRemaining;
            
            // Restore answers
            savedProgress.answers.forEach(answer => {
                const question = quizState.currentQuiz.questions.find(q => q.id === answer.questionId);
                if (question) {
                    question.selectedAnswer = answer.selectedAnswer;
                    question.isCorrect = answer.isCorrect;
                }
            });
        }

        // Initialize timer if enabled
        if (config.timerEnabled) {
            quizState.timeRemaining = config.timerDuration || 3600;
            startTimer();
        }

        // Start auto-save
        quizState.autoSaveInterval = setInterval(() => {
            quizState.saveProgress();
        }, 30000); // Save every 30 seconds

        // Show first question
        showQuestion();

        // Add keyboard shortcuts
        addKeyboardShortcuts();

        uiManager.showNotification('Quiz generated successfully!', 'success');
    } catch (error) {
        console.error('Error generating quiz:', error);
        uiManager.showErrorWithRetry('Failed to generate quiz. Please try again.', () => {
            generateQuiz(questionCount, topics, config);
        });
    } finally {
        uiManager.hideLoading(loadingId);
    }
}

/**
 * Starts the quiz timer
 */
function startTimer() {
    if (quizState.timer) {
        clearInterval(quizState.timer);
    }

    quizState.timer = setInterval(() => {
        quizState.timeRemaining--;
        updateTimerDisplay();

        if (quizState.timeRemaining <= 0) {
            clearInterval(quizState.timer);
            showResults();
        }
    }, 1000);
}

/**
 * Updates the timer display
 */
function updateTimerDisplay() {
    const timerDisplay = document.getElementById('quizTimer');
    if (timerDisplay) {
        const minutes = Math.floor(quizState.timeRemaining / 60);
        const seconds = quizState.timeRemaining % 60;
        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

/**
 * Displays the current question
 */
function showQuestion() {
    const question = quizState.currentQuiz.questions[quizState.currentQuestionIndex];
    const quizContainer = document.getElementById('quizContainer');
    
    if (!quizContainer) {
        console.error('Quiz container not found');
        return;
    }

    // Generate question HTML
    let questionHTML = '';
    
    if (question.type === 'TYPE_A') {
        questionHTML = generateTypeAQuestionHTML(question);
    } else if (question.type === 'TYPE_B') {
        questionHTML = generateTypeBQuestionHTML(question);
    } else if (question.type === 'TYPE_R') {
        questionHTML = generateTypeRQuestionHTML(question);
    }

    // Calculate progress percentage
    const progress = Math.round((quizState.currentQuestionIndex / quizState.currentQuiz.questionCount) * 100);

    // Update quiz container
    quizContainer.innerHTML = `
        <div class="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg rounded-md bg-white">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h3 class="text-lg font-medium text-gray-900">
                        Question ${quizState.currentQuestionIndex + 1} of ${quizState.currentQuiz.questionCount}
                    </h3>
                    ${quizState.currentQuiz.config.timerEnabled ? `
                        <div class="text-sm text-gray-500">
                            Time Remaining: 
                            <span id="quizTimer" class="font-medium">${Math.floor(quizState.timeRemaining / 60)}:${(quizState.timeRemaining % 60).toString().padStart(2, '0')}</span>
                        </div>
                    ` : ''}
                </div>
                <button id="closeQuizBtn" class="text-gray-400 hover:text-gray-500">
                    <span class="sr-only">Close</span>
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <!-- Progress bar -->
            <div class="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${progress}%"></div>
            </div>

            <!-- Timer visual indicator -->
            ${quizState.currentQuiz.config.timerEnabled ? `
                <div class="w-full bg-gray-200 rounded-full h-1 mb-4">
                    <div class="bg-red-600 h-1 rounded-full transition-all duration-1000" 
                         style="width: ${(quizState.timeRemaining / (quizState.currentQuiz.config.timerDuration || 3600)) * 100}%">
                    </div>
                </div>
            ` : ''}

            ${questionHTML}
            ${quizState.currentQuiz.config.navigationMode === 'free' ? generateNavigationButtons() : ''}

            <!-- Keyboard shortcuts help -->
            <div class="mt-4 text-sm text-gray-500">
                <p>Keyboard shortcuts: ← → to navigate, 1-5 to select answer, Esc to exit</p>
            </div>
        </div>
    `;

    // Add event listeners
    document.getElementById('closeQuizBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to exit the quiz? Your progress will be saved.')) {
            quizState.saveProgress();
            closeQuiz();
        }
    });

    // Add option selection handlers
    const optionButtons = document.querySelectorAll('.quiz-option');
    optionButtons.forEach(button => {
        button.addEventListener('click', () => handleOptionSelection(button));
    });

    // Add navigation button handlers if in free navigation mode
    if (quizState.currentQuiz.config.navigationMode === 'free') {
        document.getElementById('prevQuestionBtn')?.addEventListener('click', showPreviousQuestion);
        document.getElementById('nextQuestionBtn')?.addEventListener('click', showNextQuestion);
    }
}

/**
 * Generates navigation buttons for free navigation mode
 */
function generateNavigationButtons() {
    return `
        <div class="flex justify-between mt-4">
            <button id="prevQuestionBtn" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    ${quizState.currentQuestionIndex === 0 ? 'disabled' : ''}>
                Previous
            </button>
            <button id="nextQuestionBtn" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    ${quizState.currentQuestionIndex === quizState.currentQuiz.questions.length - 1 ? 'disabled' : ''}>
                Next
            </button>
        </div>
    `;
}

/**
 * Shows the previous question
 */
function showPreviousQuestion() {
    if (quizState.currentQuestionIndex > 0) {
        quizState.currentQuestionIndex--;
        showQuestion();
    }
}

/**
 * Shows the next question
 */
function showNextQuestion() {
    if (quizState.currentQuestionIndex < quizState.currentQuiz.questions.length - 1) {
        quizState.currentQuestionIndex++;
        showQuestion();
    }
}

/**
 * Generates HTML for a Type A question
 * @param {Object} question - The question object
 * @returns {string} HTML for the question
 */
function generateTypeAQuestionHTML(question) {
    return `
        <div class="quiz-question">
            <div class="mb-4">
                <p class="text-gray-700">${question.stem.vignette}</p>
                <p class="mt-2 font-medium text-gray-900">${question.stem.question}</p>
            </div>
            <div class="space-y-2">
                ${question.options.map(option => `
                    <button class="quiz-option w-full text-left p-3 rounded-md border border-gray-300 hover:bg-gray-50"
                            data-option="${option.id}">
                        ${option.id}. ${option.text}
                    </button>
                `).join('')}
            </div>
            ${generateRatingSystem(question.id)}
        </div>
    `;
}

/**
 * Generates HTML for a Type B question set
 * @param {Object} question - The question set object
 * @returns {string} HTML for the question set
 */
function generateTypeBQuestionHTML(question) {
    return `
        <div class="quiz-question">
            <div class="mb-4">
                <p class="font-medium text-gray-900">${question.theme}</p>
                <p class="mt-2 text-gray-700">${question.leadIn}</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-4">
                    ${question.items.map((item, index) => `
                        <div class="p-3 border border-gray-300 rounded-md">
                            <p class="text-gray-700">${index + 1}. ${item.stem}</p>
                            <select class="mt-2 w-full p-2 border border-gray-300 rounded-md quiz-option"
                                    data-item="${index}">
                                <option value="">Select an answer</option>
                                ${question.options.map(option => `
                                    <option value="${option.id}">${option.id}. ${option.text}</option>
                                `).join('')}
                            </select>
                        </div>
                    `).join('')}
                </div>
                <div class="space-y-2">
                    <p class="font-medium text-gray-900">Options:</p>
                    ${question.options.map(option => `
                        <p class="text-gray-700">${option.id}. ${option.text}</p>
                    `).join('')}
                </div>
            </div>
            ${generateRatingSystem(question.id)}
        </div>
    `;
}

/**
 * Generates HTML for a Type R question set
 * @param {Object} question - The question set object
 * @returns {string} HTML for the question set
 */
function generateTypeRQuestionHTML(question) {
    return `
        <div class="quiz-question">
            <div class="mb-4">
                <p class="font-medium text-gray-900">${question.theme}</p>
                <p class="mt-2 text-gray-700">${question.leadIn}</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-4">
                    ${question.items.map((item, index) => `
                        <div class="p-3 border border-gray-300 rounded-md">
                            <p class="text-gray-700">${index + 1}. ${item.stem}</p>
                            <select class="mt-2 w-full p-2 border border-gray-300 rounded-md quiz-option"
                                    data-item="${index}">
                                <option value="">Select an answer</option>
                                ${question.options.map(option => `
                                    <option value="${option.id}">${option.id}. ${option.text}</option>
                                `).join('')}
                            </select>
                        </div>
                    `).join('')}
                </div>
                <div class="space-y-2">
                    <p class="font-medium text-gray-900">Options:</p>
                    ${question.options.map(option => `
                        <p class="text-gray-700">${option.id}. ${option.text}</p>
                    `).join('')}
                </div>
            </div>
            ${generateRatingSystem(question.id)}
        </div>
    `;
}

/**
 * Generates the rating system HTML
 * @param {string} questionId - The question ID
 * @returns {string} HTML for the rating system
 */
function generateRatingSystem(questionId) {
    return `
        <div class="mt-6 border-t pt-4">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-700">Rate this question:</p>
                    <div class="flex items-center mt-1">
                        ${[1, 2, 3, 4, 5].map(rating => `
                            <button class="question-rating p-1 text-gray-400 hover:text-yellow-400"
                                    data-rating="${rating}" data-question="${questionId}">
                                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-700">Rate the explanation:</p>
                    <div class="flex items-center mt-1">
                        ${[1, 2, 3, 4, 5].map(rating => `
                            <button class="explanation-rating p-1 text-gray-400 hover:text-yellow-400"
                                    data-rating="${rating}" data-question="${questionId}">
                                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Handles option selection for the current question
 * @param {HTMLElement} selectedOption - The selected option element
 */
async function handleOptionSelection(selectedOption) {
    const question = quizState.currentQuiz.questions[quizState.currentQuestionIndex];
    const selectedAnswer = selectedOption.dataset.option;
    
    // Disable all options
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(option => option.disabled = true);

    // Check if answer is correct
    const isCorrect = selectedAnswer === question.correctAnswer;
    if (isCorrect) {
        quizState.score++;
        selectedOption.classList.add('bg-green-100', 'border-green-500');
        uiManager.showNotification('Correct answer!', 'success');
    } else {
        selectedOption.classList.add('bg-red-100', 'border-red-500');
        // Highlight correct answer
        const correctOption = document.querySelector(`[data-option="${question.correctAnswer}"]`);
        if (correctOption) {
            correctOption.classList.add('bg-green-100', 'border-green-500');
        }
        uiManager.showNotification('Incorrect answer. The correct answer is highlighted.', 'error');

        // Show reason input for incorrect answers
        const reasonInput = document.createElement('div');
        reasonInput.className = 'mt-4 p-3 bg-gray-50 rounded-md';
        reasonInput.innerHTML = `
            <p class="text-sm font-medium text-gray-700 mb-2">Why do you think you missed this question?</p>
            <textarea class="w-full p-2 border border-gray-300 rounded-md" rows="3" 
                      placeholder="Enter your reason (e.g., misunderstood question, forgot key information, etc.)"></textarea>
            <button class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 submit-reason">
                Submit Reason
            </button>
        `;
        selectedOption.parentElement.appendChild(reasonInput);

        // Add event listener for reason submission
        reasonInput.querySelector('.submit-reason').addEventListener('click', async () => {
            const reason = reasonInput.querySelector('textarea').value;
            if (reason.trim()) {
                try {
                    await authManager.addMissedQuestion(question, reason);
                    uiManager.showNotification('Reason submitted successfully!', 'success');
                    reasonInput.remove();
                } catch (error) {
                    console.error('Error submitting reason:', error);
                    uiManager.showNotification('Failed to submit reason. Please try again.', 'error');
                }
            }
        });
    }

    // Show explanation if available
    if (question.explanation) {
        const explanationDiv = document.createElement('div');
        explanationDiv.className = 'mt-4 p-3 bg-blue-50 rounded-md';
        explanationDiv.innerHTML = `
            <p class="text-blue-700">${question.explanation}</p>
            <div class="mt-4">
                <p class="text-sm font-medium text-gray-700 mb-2">Ask a question about this topic:</p>
                <div class="flex space-x-2">
                    <input type="text" class="flex-1 p-2 border border-gray-300 rounded-md" 
                           placeholder="e.g., Why is C wrong? or Can you explain more about...">
                    <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ask-question">
                        Ask
                    </button>
                </div>
                <div class="mt-2 chat-responses"></div>
            </div>
        `;
        selectedOption.parentElement.appendChild(explanationDiv);

        // Add event listener for chat
        const chatInput = explanationDiv.querySelector('input');
        const askButton = explanationDiv.querySelector('.ask-question');
        const chatResponses = explanationDiv.querySelector('.chat-responses');

        askButton.addEventListener('click', async () => {
            const question = chatInput.value.trim();
            if (question) {
                // Disable input and button while processing
                chatInput.disabled = true;
                askButton.disabled = true;
                askButton.textContent = 'Thinking...';

                // Show loading state
                const loadingId = Date.now();
                chatResponses.innerHTML += `
                    <div class="p-2 bg-gray-100 rounded-md mb-2">
                        <p class="text-sm text-gray-700">${question}</p>
                    </div>
                    <div id="loading-${loadingId}" class="p-2 bg-blue-100 rounded-md mb-2">
                        <p class="text-sm text-gray-700">Thinking...</p>
                    </div>
                `;

                try {
                    // Call your LLM API here
                    const response = await askLLM(question, quizState.currentQuiz.questions[quizState.currentQuestionIndex]);
                    document.getElementById(`loading-${loadingId}`).innerHTML = `
                        <p class="text-sm text-gray-700">${response}</p>
                    `;
                } catch (error) {
                    console.error('Error getting LLM response:', error);
                    uiManager.showErrorWithRetry('Failed to get response. Please try again.', () => {
                        askButton.click();
                    });
                } finally {
                    // Re-enable input and button
                    chatInput.disabled = false;
                    askButton.disabled = false;
                    askButton.textContent = 'Ask';
                    chatInput.value = '';
                    chatInput.focus();
                }
            }
        });

        // Add enter key support
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                askButton.click();
            }
        });
    }

    // Add rating event listeners
    addRatingEventListeners(question.id);

    // Update topic performance
    if (authManager.user) {
        try {
            await authManager.updateTopicPerformance(question.topic, question.subtopic, isCorrect);
        } catch (error) {
            console.error('Error updating topic performance:', error);
            uiManager.showNotification('Failed to update topic performance.', 'error');
        }
    }

    // Move to next question after delay if in sequential mode
    if (quizState.currentQuiz.config.navigationMode === 'sequential') {
        setTimeout(() => {
            quizState.currentQuestionIndex++;
            if (quizState.currentQuestionIndex < quizState.currentQuiz.questions.length) {
                showQuestion();
            } else {
                showResults();
            }
        }, 2000);
    }
}

/**
 * Adds event listeners for the rating system
 * @param {string} questionId - The question ID
 */
function addRatingEventListeners(questionId) {
    // Question rating
    document.querySelectorAll(`.question-rating[data-question="${questionId}"]`).forEach(button => {
        button.addEventListener('click', (e) => {
            const rating = parseInt(e.target.closest('button').dataset.rating);
            updateRating(questionId, 'question', rating);
        });
    });

    // Explanation rating
    document.querySelectorAll(`.explanation-rating[data-question="${questionId}"]`).forEach(button => {
        button.addEventListener('click', (e) => {
            const rating = parseInt(e.target.closest('button').dataset.rating);
            updateRating(questionId, 'explanation', rating);
        });
    });
}

/**
 * Updates the rating for a question or explanation
 * @param {string} questionId - The question ID
 * @param {string} type - The rating type ('question' or 'explanation')
 * @param {number} rating - The rating value
 */
async function updateRating(questionId, type, rating) {
    // Update UI
    const ratingButtons = document.querySelectorAll(`.${type}-rating[data-question="${questionId}"]`);
    ratingButtons.forEach((button, index) => {
        if (index < rating) {
            button.classList.remove('text-gray-400');
            button.classList.add('text-yellow-400');
        } else {
            button.classList.remove('text-yellow-400');
            button.classList.add('text-gray-400');
        }
    });

    // Store rating
    if (!quizState.currentQuiz.ratings) {
        quizState.currentQuiz.ratings = {};
    }
    if (!quizState.currentQuiz.ratings[questionId]) {
        quizState.currentQuiz.ratings[questionId] = {};
    }
    quizState.currentQuiz.ratings[questionId][type] = rating;

    // If rating is low, show feedback form
    if (rating < 4) {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'mt-2 p-3 bg-gray-50 rounded-md';
        feedbackDiv.innerHTML = `
            <p class="text-sm font-medium text-gray-700 mb-2">What could be improved?</p>
            <div class="space-y-2">
                <div class="flex items-center">
                    <input type="checkbox" id="inaccurate" class="h-4 w-4 text-blue-600 focus:ring-blue-500">
                    <label for="inaccurate" class="ml-2 text-sm text-gray-700">Inaccurate information</label>
                </div>
                <div class="flex items-center">
                    <input type="checkbox" id="missingInfo" class="h-4 w-4 text-blue-600 focus:ring-blue-500">
                    <label for="missingInfo" class="ml-2 text-sm text-gray-700">Missing key information</label>
                </div>
                <div class="flex items-center">
                    <input type="checkbox" id="misleading" class="h-4 w-4 text-blue-600 focus:ring-blue-500">
                    <label for="misleading" class="ml-2 text-sm text-gray-700">Misleading</label>
                </div>
                <div class="flex items-center">
                    <input type="checkbox" id="poorlyWritten" class="h-4 w-4 text-blue-600 focus:ring-blue-500">
                    <label for="poorlyWritten" class="ml-2 text-sm text-gray-700">Poorly written</label>
                </div>
                <div class="flex items-center">
                    <input type="checkbox" id="tooLong" class="h-4 w-4 text-blue-600 focus:ring-blue-500">
                    <label for="tooLong" class="ml-2 text-sm text-gray-700">Too long</label>
                </div>
                <div class="flex items-center">
                    <input type="checkbox" id="tooShort" class="h-4 w-4 text-blue-600 focus:ring-blue-500">
                    <label for="tooShort" class="ml-2 text-sm text-gray-700">Too short</label>
                </div>
                <div class="mt-2">
                    <textarea class="w-full p-2 border border-gray-300 rounded-md" rows="2" 
                              placeholder="Other feedback (optional)"></textarea>
                </div>
                <button class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 submit-feedback">
                    Submit Feedback
                </button>
            </div>
        `;

        // Replace existing feedback if any
        const existingFeedback = document.querySelector('.feedback-form');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        feedbackDiv.classList.add('feedback-form');
        ratingButtons[0].parentElement.parentElement.appendChild(feedbackDiv);

        // Add event listener for feedback submission
        feedbackDiv.querySelector('.submit-feedback').addEventListener('click', async () => {
            const feedback = {
                type,
                rating,
                issues: [],
                otherFeedback: feedbackDiv.querySelector('textarea').value
            };

            // Collect checked issues
            feedbackDiv.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
                feedback.issues.push(checkbox.id);
            });

            // Store feedback
            if (!quizState.currentQuiz.feedback) {
                quizState.currentQuiz.feedback = {};
            }
            if (!quizState.currentQuiz.feedback[questionId]) {
                quizState.currentQuiz.feedback[questionId] = {};
            }
            quizState.currentQuiz.feedback[questionId][type] = feedback;

            // Remove feedback form
            feedbackDiv.remove();
        });
    }
}

/**
 * Shows the quiz results
 */
async function showResults() {
    if (quizState.timer) {
        clearInterval(quizState.timer);
    }

    const quizContainer = document.getElementById('quizContainer');
    const percentage = Math.round((quizState.score / quizState.currentQuiz.questionCount) * 100);

    quizContainer.innerHTML = `
        <div class="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg rounded-md bg-white">
            <div class="text-center">
                <h3 class="text-2xl font-medium text-gray-900 mb-4">Quiz Results</h3>
                <p class="text-4xl font-bold text-blue-600 mb-4">${percentage}%</p>
                <p class="text-gray-700 mb-4">
                    You got ${quizState.score} out of ${quizState.currentQuiz.questionCount} questions correct.
                </p>
                <div class="space-x-4">
                    <button id="reviewQuizBtn" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        Review Questions
                    </button>
                    <button id="newQuizBtn" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                        Start New Quiz
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add event listeners
    document.getElementById('reviewQuizBtn').addEventListener('click', () => {
        quizState.currentQuestionIndex = 0;
        showQuestion();
    });

    document.getElementById('newQuizBtn').addEventListener('click', () => {
        closeQuiz();
        document.getElementById('quizModal').classList.remove('hidden');
    });

    // Record quiz activity if user is logged in
    if (userProfile.user) {
        try {
            await userProfile.addLearningActivity({
                type: 'quiz',
                topics: quizState.currentQuiz.topics,
                score: percentage,
                questionCount: quizState.currentQuiz.questionCount,
                completedAt: new Date(),
                ratings: quizState.currentQuiz.ratings
            });
            uiManager.showNotification('Quiz results saved successfully!', 'success');
        } catch (error) {
            console.error('Error recording quiz activity:', error);
            uiManager.showNotification('Failed to save quiz results.', 'error');
        }
    }
}

/**
 * Closes the quiz and cleans up
 */
function closeQuiz() {
    if (quizState.timer) {
        clearInterval(quizState.timer);
    }
    const quizContainer = document.getElementById('quizContainer');
    if (quizContainer) {
        quizContainer.remove();
    }
    quizState.currentQuiz = null;
    quizState.currentQuestionIndex = 0;
    quizState.score = 0;
    quizState.timeRemaining = 0;
}

function addKeyboardShortcuts() {
    const shortcuts = {
        'ArrowLeft': () => {
            if (quizState.currentQuiz.config.navigationMode === 'free') {
                showPreviousQuestion();
            }
        },
        'ArrowRight': () => {
            if (quizState.currentQuiz.config.navigationMode === 'free') {
                showNextQuestion();
            }
        },
        '1': () => selectOption(0),
        '2': () => selectOption(1),
        '3': () => selectOption(2),
        '4': () => selectOption(3),
        '5': () => selectOption(4),
        'Escape': async () => {
            const confirmed = await uiManager.showConfirmation(
                'Are you sure you want to exit the quiz? Your progress will be saved.',
                'Exit Quiz',
                'Continue'
            );
            if (confirmed) {
                quizState.saveProgress();
                closeQuiz();
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        const handler = shortcuts[e.key];
        if (handler) {
            e.preventDefault();
            handler();
        }
    };

    document.addEventListener('keydown', handleKeyPress);
    quizState.eventListeners.set(document, { type: 'keydown', handler: handleKeyPress });
}

function selectOption(index) {
    const options = document.querySelectorAll('.quiz-option');
    if (options[index]) {
        options[index].click();
    }
} 