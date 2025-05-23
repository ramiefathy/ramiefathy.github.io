import { askLLM } from './ask-llm.js';

class QuestionReviewer {
    constructor() {
        this.reviewHistory = new Map(); // Track review history for each question
        this.qualityMetrics = {
            clarity: 0,
            accuracy: 0,
            difficulty: 0,
            relevance: 0,
            overall: 0
        };
    }

    /**
     * Reviews a question using LLM and suggests improvements
     * @param {Object} question - The question to review
     * @param {Object} context - Additional context for the review
     * @returns {Promise<Object>} Review results with suggested improvements
     */
    async reviewQuestion(question, context = {}) {
        const prompt = this._createReviewPrompt(question, context);
        
        try {
            const review = await askLLM(prompt, {
                type: 'question_review',
                question: question,
                context: context
            });

            // Parse the LLM response into structured review data
            const reviewData = this._parseReviewResponse(review);
            
            // Store review history
            this._updateReviewHistory(question, reviewData);

            return reviewData;
        } catch (error) {
            console.error('Error reviewing question:', error);
            throw error;
        }
    }

    /**
     * Enhances a question based on review feedback
     * @param {Object} question - The original question
     * @param {Object} review - The review feedback
     * @returns {Promise<Object>} Enhanced question
     */
    async enhanceQuestion(question, review) {
        const prompt = this._createEnhancementPrompt(question, review);
        
        try {
            const enhancedQuestion = await askLLM(prompt, {
                type: 'question_enhancement',
                question: question,
                review: review
            });

            // Parse the enhanced question
            const enhancedData = this._parseEnhancedQuestion(enhancedQuestion);
            
            // Validate the enhanced question
            const validation = await this.reviewQuestion(enhancedData);
            
            // If quality hasn't improved, return original
            if (validation.qualityMetrics.overall <= review.qualityMetrics.overall) {
                console.warn('Enhancement did not improve question quality');
                return question;
            }

            return enhancedData;
        } catch (error) {
            console.error('Error enhancing question:', error);
            return question; // Return original if enhancement fails
        }
    }

    /**
     * Creates a prompt for reviewing a question
     * @private
     */
    _createReviewPrompt(question, context) {
        return `
            Please review this medical question for a dermatology board exam:
            
            Question Type: ${question.type}
            Topic: ${question.topic}
            Difficulty: ${question.difficulty}
            
            ${this._formatQuestionForReview(question)}
            
            Please evaluate the question on the following criteria:
            1. Clarity: Is the question clear and unambiguous?
            2. Accuracy: Is the medical information accurate and up-to-date?
            3. Difficulty: Is the difficulty level appropriate?
            4. Relevance: Is the question relevant to dermatology board exam?
            5. Technical Quality: Are there any technical flaws?
            
            For each criterion, provide:
            - A score (1-5)
            - Specific feedback
            - Suggested improvements
            
            Also identify any:
            - Absolute terms that should be modified
            - Negative phrasing that could be improved
            - Inconsistent option lengths
            - Other technical issues
            
            Format your response as a JSON object with the following structure:
            {
                "qualityMetrics": {
                    "clarity": number,
                    "accuracy": number,
                    "difficulty": number,
                    "relevance": number,
                    "overall": number
                },
                "feedback": {
                    "clarity": string,
                    "accuracy": string,
                    "difficulty": string,
                    "relevance": string,
                    "technical": string
                },
                "suggestedImprovements": [
                    {
                        "aspect": string,
                        "current": string,
                        "suggested": string,
                        "reason": string
                    }
                ],
                "technicalIssues": [
                    {
                        "type": string,
                        "location": string,
                        "description": string
                    }
                ]
            }
        `;
    }

    /**
     * Creates a prompt for enhancing a question
     * @private
     */
    _createEnhancementPrompt(question, review) {
        return `
            Please enhance this medical question based on the following review feedback:
            
            Original Question:
            ${this._formatQuestionForReview(question)}
            
            Review Feedback:
            ${JSON.stringify(review, null, 2)}
            
            Please provide an enhanced version of the question that addresses all the feedback points.
            Maintain the same question type, topic, and difficulty level.
            Ensure the enhanced version is more clear, accurate, and technically sound.
            
            Format your response as a JSON object with the same structure as the original question.
        `;
    }

    /**
     * Formats a question for review
     * @private
     */
    _formatQuestionForReview(question) {
        if (question.type === 'TYPE_A') {
            return `
                Stem: ${question.stem.vignette}
                Question: ${question.stem.question}
                Options:
                ${question.options.map(opt => `${opt.id}. ${opt.text}`).join('\n')}
                Correct Answer: ${question.correctAnswer}
                Explanation: ${question.explanation}
            `;
        } else if (question.type === 'TYPE_B' || question.type === 'TYPE_R') {
            return `
                Theme: ${question.theme}
                Lead-in: ${question.leadIn}
                Options:
                ${question.options.map(opt => `${opt.id}. ${opt.text}`).join('\n')}
                Items:
                ${question.items.map((item, i) => `${i + 1}. ${item.stem} (Correct: ${item.correctAnswer})`).join('\n')}
            `;
        }
        return JSON.stringify(question, null, 2);
    }

    /**
     * Parses the LLM review response
     * @private
     */
    _parseReviewResponse(response) {
        try {
            return JSON.parse(response);
        } catch (error) {
            console.error('Error parsing review response:', error);
            return {
                qualityMetrics: this.qualityMetrics,
                feedback: {},
                suggestedImprovements: [],
                technicalIssues: []
            };
        }
    }

    /**
     * Parses the enhanced question response
     * @private
     */
    _parseEnhancedQuestion(response) {
        try {
            return JSON.parse(response);
        } catch (error) {
            console.error('Error parsing enhanced question:', error);
            return null;
        }
    }

    /**
     * Updates the review history
     * @private
     */
    _updateReviewHistory(question, reviewData) {
        const questionId = question.id || Date.now().toString();
        if (!this.reviewHistory.has(questionId)) {
            this.reviewHistory.set(questionId, []);
        }
        this.reviewHistory.get(questionId).push({
            timestamp: new Date(),
            review: reviewData
        });
    }

    /**
     * Gets the review history for a question
     * @param {string} questionId - The question ID
     * @returns {Array} Review history
     */
    getReviewHistory(questionId) {
        return this.reviewHistory.get(questionId) || [];
    }

    /**
     * Gets the latest review for a question
     * @param {string} questionId - The question ID
     * @returns {Object} Latest review
     */
    getLatestReview(questionId) {
        const history = this.getReviewHistory(questionId);
        return history.length > 0 ? history[history.length - 1].review : null;
    }
}

// Create and export a singleton instance
const questionReviewer = new QuestionReviewer();
export default questionReviewer; 