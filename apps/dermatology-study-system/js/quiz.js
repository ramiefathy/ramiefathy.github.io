// Import Firebase instances
import { app, db } from './firebase-config.js';

// Quiz Generation Multi-Agent System (QG-MAS)
class QuizGenerator {
    constructor() {
        this.apiEndpoint = 'YOUR_CLOUDFLARE_WORKER_ENDPOINT';
    }

    // Topic Selection Agent (TSA)
    async selectTopics(topic, count) {
        try {
            const response = await fetch(`${this.apiEndpoint}/select-topics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic,
                    count,
                }),
            });
            return await response.json();
        } catch (error) {
            console.error('Error selecting topics:', error);
            throw error;
        }
    }

    // Question Stem Generation Agent (QSGA)
    async generateQuestionStem(topic) {
        try {
            const response = await fetch(`${this.apiEndpoint}/generate-stem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic,
                }),
            });
            return await response.json();
        } catch (error) {
            console.error('Error generating question stem:', error);
            throw error;
        }
    }

    // Correct Answer Generation Agent (CAGA)
    async generateCorrectAnswer(stem, topic) {
        try {
            const response = await fetch(`${this.apiEndpoint}/generate-answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    stem,
                    topic,
                }),
            });
            return await response.json();
        } catch (error) {
            console.error('Error generating correct answer:', error);
            throw error;
        }
    }

    // Distractor Generation Agent (DGA)
    async generateDistractors(stem, correctAnswer, topic) {
        try {
            const response = await fetch(`${this.apiEndpoint}/generate-distractors`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    stem,
                    correctAnswer,
                    topic,
                }),
            });
            return await response.json();
        } catch (error) {
            console.error('Error generating distractors:', error);
            throw error;
        }
    }

    // Explanation Generation Agent (EGA)
    async generateExplanation(stem, correctAnswer, distractors, topic) {
        try {
            const response = await fetch(`${this.apiEndpoint}/generate-explanation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    stem,
                    correctAnswer,
                    distractors,
                    topic,
                }),
            });
            return await response.json();
        } catch (error) {
            console.error('Error generating explanation:', error);
            throw error;
        }
    }

    // Generate a complete question
    async generateQuestion(topic) {
        try {
            // Generate question stem
            const stem = await this.generateQuestionStem(topic);
            
            // Generate correct answer
            const correctAnswer = await this.generateCorrectAnswer(stem, topic);
            
            // Generate distractors
            const distractors = await this.generateDistractors(stem, correctAnswer, topic);
            
            // Generate explanation
            const explanation = await this.generateExplanation(stem, correctAnswer, distractors, topic);
            
            // Combine all components
            return {
                stem,
                options: [correctAnswer, ...distractors].sort(() => Math.random() - 0.5), // Shuffle options
                correctAnswer,
                explanation,
            };
        } catch (error) {
            console.error('Error generating question:', error);
            throw error;
        }
    }

    // Generate multiple questions
    async generateQuiz(topic, count) {
        try {
            const questions = [];
            for (let i = 0; i < count; i++) {
                const question = await this.generateQuestion(topic);
                questions.push(question);
            }
            return questions;
        } catch (error) {
            console.error('Error generating quiz:', error);
            throw error;
        }
    }
}

// Quiz Display and Interaction
class QuizDisplay {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentQuestionIndex = 0;
        this.questions = [];
        this.score = 0;
    }

    // Display a question
    displayQuestion(question) {
        const questionHtml = `
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-lg font-medium text-gray-900 mb-4">${question.stem}</h3>
                <div class="space-y-3">
                    ${question.options.map((option, index) => `
                        <button
                            class="w-full text-left p-3 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            data-option="${index}"
                        >
                            ${option}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        this.container.innerHTML = questionHtml;

        // Add event listeners to options
        const optionButtons = this.container.querySelectorAll('button[data-option]');
        optionButtons.forEach(button => {
            button.addEventListener('click', () => this.handleAnswer(button, question));
        });
    }

    // Handle user's answer
    handleAnswer(selectedButton, question) {
        const selectedOption = selectedButton.textContent.trim();
        const isCorrect = selectedOption === question.correctAnswer;

        // Update score
        if (isCorrect) {
            this.score++;
        }

        // Show explanation
        this.showExplanation(question, isCorrect, selectedOption);

        // Move to next question after delay
        setTimeout(() => {
            this.currentQuestionIndex++;
            if (this.currentQuestionIndex < this.questions.length) {
                this.displayQuestion(this.questions[this.currentQuestionIndex]);
            } else {
                this.showResults();
            }
        }, 3000);
    }

    // Show explanation for a question
    showExplanation(question, isCorrect, selectedOption) {
        const explanationHtml = `
            <div class="mt-4 p-4 rounded-md ${isCorrect ? 'bg-green-50' : 'bg-red-50'}">
                <p class="text-sm ${isCorrect ? 'text-green-800' : 'text-red-800'}">
                    ${isCorrect ? 'Correct!' : 'Incorrect.'} The correct answer is: ${question.correctAnswer}
                </p>
                <p class="mt-2 text-sm text-gray-600">
                    ${question.explanation}
                </p>
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', explanationHtml);
    }

    // Show final results
    showResults() {
        const resultsHtml = `
            <div class="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Quiz Complete!</h3>
                <p class="text-2xl font-bold text-blue-600">
                    Score: ${this.score} / ${this.questions.length}
                </p>
                <button
                    class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    onclick="location.reload()"
                >
                    Try Another Quiz
                </button>
            </div>
        `;
        this.container.innerHTML = resultsHtml;
    }

    // Start a new quiz
    async startQuiz(topic, count) {
        try {
            const quizGenerator = new QuizGenerator();
            this.questions = await quizGenerator.generateQuiz(topic, count);
            this.currentQuestionIndex = 0;
            this.score = 0;
            this.displayQuestion(this.questions[0]);
        } catch (error) {
            console.error('Error starting quiz:', error);
            this.container.innerHTML = `
                <div class="bg-red-50 p-4 rounded-md">
                    <p class="text-red-800">Error loading quiz. Please try again.</p>
                </div>
            `;
        }
    }
}

// Export classes for use in other modules
export { QuizGenerator, QuizDisplay }; 