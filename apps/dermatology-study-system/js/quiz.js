import { db } from './firebase-config.js';
import userProfile from './user-profile.js';
import questionGenerator from './question-generator.js';

// Quiz state
let currentQuiz = null;
let currentQuestionIndex = 0;
let score = 0;

/**
 * Generates and starts a new quiz
 * @param {number} questionCount - Number of questions
 * @param {string} topic - Quiz topic
 */
export async function generateQuiz(questionCount, topic) {
    try {
        // Show loading state
        const quizModal = document.getElementById('quizModal');
        quizModal.classList.add('hidden');
        
        // Generate questions
        const questions = await questionGenerator.generateQuiz(questionCount, topic, 'medium');
        
        // Initialize quiz state
        currentQuiz = {
            questions,
            startTime: new Date(),
            topic,
            questionCount
        };
        currentQuestionIndex = 0;
        score = 0;

        // Show first question
        showQuestion();
    } catch (error) {
        console.error('Error generating quiz:', error);
        alert('Error generating quiz. Please try again.');
    }
}

/**
 * Displays the current question
 */
function showQuestion() {
    const question = currentQuiz.questions[currentQuestionIndex];
    const quizContainer = document.getElementById('quizContainer');
    
    if (!quizContainer) {
        // Create quiz container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'quizContainer';
        container.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full';
        document.body.appendChild(container);
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

    // Update quiz container
    quizContainer.innerHTML = `
        <div class="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg rounded-md bg-white">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">
                    Question ${currentQuestionIndex + 1} of ${currentQuiz.questionCount}
                </h3>
                <button id="closeQuizBtn" class="text-gray-400 hover:text-gray-500">
                    <span class="sr-only">Close</span>
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            ${questionHTML}
        </div>
    `;

    // Add event listeners
    document.getElementById('closeQuizBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to exit the quiz? Your progress will be lost.')) {
            closeQuiz();
        }
    });

    // Add option selection handlers
    const optionButtons = document.querySelectorAll('.quiz-option');
    optionButtons.forEach(button => {
        button.addEventListener('click', () => handleOptionSelection(button));
    });
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
        </div>
    `;
}

/**
 * Handles option selection for the current question
 * @param {HTMLElement} selectedOption - The selected option element
 */
function handleOptionSelection(selectedOption) {
    const question = currentQuiz.questions[currentQuestionIndex];
    const selectedAnswer = selectedOption.dataset.option;
    
    // Disable all options
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(option => option.disabled = true);

    // Check if answer is correct
    const isCorrect = selectedAnswer === question.correctAnswer;
    if (isCorrect) {
        score++;
        selectedOption.classList.add('bg-green-100', 'border-green-500');
    } else {
        selectedOption.classList.add('bg-red-100', 'border-red-500');
        // Highlight correct answer
        const correctOption = document.querySelector(`[data-option="${question.correctAnswer}"]`);
        if (correctOption) {
            correctOption.classList.add('bg-green-100', 'border-green-500');
        }
    }

    // Show explanation if available
    if (question.explanation) {
        const explanationDiv = document.createElement('div');
        explanationDiv.className = 'mt-4 p-3 bg-blue-50 rounded-md';
        explanationDiv.innerHTML = `<p class="text-blue-700">${question.explanation}</p>`;
        selectedOption.parentElement.appendChild(explanationDiv);
    }

    // Move to next question after delay
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuiz.questions.length) {
            showQuestion();
        } else {
            showResults();
        }
    }, 2000);
}

/**
 * Shows the quiz results
 */
async function showResults() {
    const quizContainer = document.getElementById('quizContainer');
    const percentage = Math.round((score / currentQuiz.questionCount) * 100);

    quizContainer.innerHTML = `
        <div class="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg rounded-md bg-white">
            <div class="text-center">
                <h3 class="text-2xl font-medium text-gray-900 mb-4">Quiz Results</h3>
                <p class="text-4xl font-bold text-blue-600 mb-4">${percentage}%</p>
                <p class="text-gray-700 mb-4">
                    You got ${score} out of ${currentQuiz.questionCount} questions correct.
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
        currentQuestionIndex = 0;
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
                topic: currentQuiz.topic,
                score: percentage,
                questionCount: currentQuiz.questionCount,
                completedAt: new Date()
            });
        } catch (error) {
            console.error('Error recording quiz activity:', error);
        }
    }
}

/**
 * Closes the quiz and cleans up
 */
function closeQuiz() {
    const quizContainer = document.getElementById('quizContainer');
    if (quizContainer) {
        quizContainer.remove();
    }
    currentQuiz = null;
    currentQuestionIndex = 0;
    score = 0;
} 