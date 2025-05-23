import { db } from './firebase-config.js';
import questionReviewer from './question-reviewer.js';

class QuestionGenerator {
    constructor() {
        this.questionTypes = {
            TYPE_A: 'TYPE_A', // One-best-answer
            TYPE_B: 'TYPE_B', // Matching
            TYPE_R: 'TYPE_R'  // Extended matching
        };
        this.MAX_ENHANCEMENT_ATTEMPTS = 3;
        this.MIN_QUALITY_SCORE = 4; // Minimum acceptable quality score (out of 5)
    }

    /**
     * Generates a Type A (one-best-answer) question
     * @param {Object} options - Question generation options
     * @returns {Object} Generated question
     */
    generateTypeAQuestion(options = {}) {
        const {
            topic = 'general',
            difficulty = 'medium',
            focusOn = 'diagnosis' // diagnosis, treatment, mechanism, etc.
        } = options;

        // TODO: Implement AI-based question generation
        // For now, return a sample question
        const question = {
            type: this.questionTypes.TYPE_A,
            stem: {
                vignette: `A 45-year-old woman presents with a 2-week history of pruritic, erythematous papules and plaques on her elbows and knees. The lesions are well-demarcated and covered with silvery scales. She reports no previous similar episodes.`,
                question: `Which of the following is the most likely diagnosis?`
            },
            options: [
                { id: 'A', text: 'Psoriasis vulgaris' },
                { id: 'B', text: 'Atopic dermatitis' },
                { id: 'C', text: 'Contact dermatitis' },
                { id: 'D', text: 'Nummular eczema' },
                { id: 'E', text: 'Lichen planus' }
            ],
            correctAnswer: 'A',
            explanation: `The clinical presentation is classic for psoriasis vulgaris, characterized by well-demarcated, erythematous plaques with silvery scales, typically affecting extensor surfaces. The distribution on elbows and knees is characteristic.`,
            topic: topic,
            difficulty: difficulty,
            focusArea: focusOn
        };

        // Validate the generated question
        if (!this._validateQuestionStructure(question)) {
            console.error('Generated invalid Type A question structure');
            throw new Error('Failed to generate valid Type A question');
        }

        return question;
    }

    /**
     * Validates the basic structure of a question
     * @private
     */
    _validateQuestionStructure(question) {
        if (!question || typeof question !== 'object') return false;
        if (!question.type || !Object.values(this.questionTypes).includes(question.type)) return false;

        if (question.type === this.questionTypes.TYPE_A) {
            return (
                question.stem &&
                typeof question.stem === 'object' &&
                typeof question.stem.vignette === 'string' &&
                typeof question.stem.question === 'string' &&
                Array.isArray(question.options) &&
                question.options.length > 0 &&
                question.options.every(opt => opt && opt.id && opt.text) &&
                typeof question.correctAnswer === 'string' &&
                typeof question.explanation === 'string'
            );
        }

        return false;
    }

    /**
     * Generates a Type B (matching) question set
     * @param {Object} options - Question generation options
     * @returns {Object} Generated question set
     */
    generateTypeBQuestionSet(options = {}) {
        const {
            topic = 'general',
            difficulty = 'medium',
            theme = 'diagnosis'
        } = options;

        // TODO: Implement AI-based question generation
        // For now, return a sample question set
        return {
            type: this.questionTypes.TYPE_B,
            theme: 'Autoimmune blistering diseases',
            leadIn: 'For each patient described below, select the most likely diagnosis from the list (A-E).',
            options: [
                { id: 'A', text: 'Bullous pemphigoid' },
                { id: 'B', text: 'Pemphigus vulgaris' },
                { id: 'C', text: 'Dermatitis herpetiformis' },
                { id: 'D', text: 'Linear IgA bullous dermatosis' },
                { id: 'E', text: 'Epidermolysis bullosa acquisita' }
            ],
            items: [
                {
                    stem: 'A 75-year-old man presents with tense bullae on erythematous plaques. Direct immunofluorescence shows linear C3 and IgG at the dermal-epidermal junction.',
                    correctAnswer: 'A'
                },
                {
                    stem: 'A 45-year-old woman has painful oral erosions and flaccid bullae that rupture easily. Direct immunofluorescence shows intercellular IgG and C3.',
                    correctAnswer: 'B'
                }
            ],
            topic: 'autoimmune',
            difficulty: 'medium',
            focusArea: 'diagnosis'
        };
    }

    /**
     * Generates a Type R (extended matching) question set
     * @param {Object} options - Question generation options
     * @returns {Object} Generated question set
     */
    generateTypeRQuestionSet(options = {}) {
        const {
            topic = 'general',
            difficulty = 'medium',
            theme = 'diagnosis'
        } = options;

        // TODO: Implement AI-based question generation
        // For now, return a sample question set
        return {
            type: this.questionTypes.TYPE_R,
            theme: 'Inflammatory skin conditions',
            leadIn: 'For each patient described below, select the most likely diagnosis from the list (A-H).',
            options: [
                { id: 'A', text: 'Psoriasis' },
                { id: 'B', text: 'Atopic dermatitis' },
                { id: 'C', text: 'Contact dermatitis' },
                { id: 'D', text: 'Seborrheic dermatitis' },
                { id: 'E', text: 'Lichen planus' },
                { id: 'F', text: 'Pityriasis rosea' },
                { id: 'G', text: 'Tinea corporis' },
                { id: 'H', text: 'Nummular eczema' }
            ],
            items: [
                {
                    stem: 'A 35-year-old man presents with well-demarcated, erythematous plaques with silvery scales on his elbows and knees. The lesions have been present for 3 months.',
                    correctAnswer: 'A'
                },
                {
                    stem: 'A 25-year-old woman has pruritic, erythematous papules and plaques in the flexural areas. She has a history of asthma and seasonal allergies.',
                    correctAnswer: 'B'
                }
            ],
            topic: 'inflammatory',
            difficulty: 'medium',
            focusArea: 'diagnosis'
        };
    }

    /**
     * Validates a generated question against the guidelines
     * @param {Object} question - The question to validate
     * @returns {Object} Validation results
     */
    validateQuestion(question) {
        const validationResults = {
            isValid: true,
            issues: []
        };

        // First check if question is valid
        if (!question || typeof question !== 'object') {
            validationResults.isValid = false;
            validationResults.issues.push('Invalid question object');
            return validationResults;
        }

        // Check question type
        if (!question.type || !Object.values(this.questionTypes).includes(question.type)) {
            validationResults.isValid = false;
            validationResults.issues.push('Invalid question type');
            return validationResults;
        }

        // Validate based on question type
        if (question.type === this.questionTypes.TYPE_A) {
            // Validate Type A question structure
            if (!question.stem || !question.stem.vignette || !question.stem.question) {
                validationResults.isValid = false;
                validationResults.issues.push('Missing or incomplete stem for Type A question');
            }

            // Check options for Type A
            if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
                validationResults.isValid = false;
                validationResults.issues.push('Missing or invalid options for Type A question');
            } else {
                // Check options homogeneity
                const firstOptionType = this.getOptionType(question.options[0].text);
                for (let i = 1; i < question.options.length; i++) {
                    if (this.getOptionType(question.options[i].text) !== firstOptionType) {
                        validationResults.isValid = false;
                        validationResults.issues.push('Options are not homogeneous');
                        break;
                    }
                }
            }
        } else if (question.type === this.questionTypes.TYPE_B || question.type === this.questionTypes.TYPE_R) {
            // Validate Type B/R question structure
            if (!question.leadIn || typeof question.leadIn !== 'string') {
                validationResults.isValid = false;
                validationResults.issues.push('Missing or invalid lead-in text');
            }

            // Check options for Type B/R
            if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
                validationResults.isValid = false;
                validationResults.issues.push('Missing or invalid options');
            }

            // Check items for Type B/R
            if (!question.items || !Array.isArray(question.items) || question.items.length === 0) {
                validationResults.isValid = false;
                validationResults.issues.push('Missing or invalid items');
            } else {
                // Validate each item
                question.items.forEach((item, index) => {
                    if (!item.stem || !item.correctAnswer) {
                        validationResults.isValid = false;
                        validationResults.issues.push(`Invalid item at index ${index}`);
                    }
                });
            }
        }

        // Check for technical flaws
        if (this.hasTechnicalFlaws(question)) {
            validationResults.isValid = false;
            validationResults.issues.push('Question contains technical flaws');
        }

        return validationResults;
    }

    /**
     * Determines the type of an option (diagnosis, treatment, etc.)
     * @param {string} optionText - The option text to analyze
     * @returns {string} The type of option
     */
    getOptionType(optionText) {
        if (!optionText) return 'unknown';
        
        const optionTextLower = optionText.toLowerCase();
        
        // Check for diagnosis-related terms
        if (optionTextLower.includes('diagnosis') || 
            optionTextLower.includes('disease') || 
            optionTextLower.includes('condition') ||
            optionTextLower.includes('syndrome')) {
            return 'diagnosis';
        }
        
        // Check for treatment-related terms
        if (optionTextLower.includes('treatment') || 
            optionTextLower.includes('therapy') || 
            optionTextLower.includes('medication') ||
            optionTextLower.includes('drug')) {
            return 'treatment';
        }
        
        // Check for mechanism-related terms
        if (optionTextLower.includes('mechanism') || 
            optionTextLower.includes('pathophysiology') || 
            optionTextLower.includes('cause')) {
            return 'mechanism';
        }
        
        return 'other';
    }

    /**
     * Checks for technical flaws in the question
     * @param {Object} question - The question to check
     * @returns {boolean} Whether the question has technical flaws
     */
    hasTechnicalFlaws(question) {
        // First check if question is valid
        if (!question || typeof question !== 'object') {
            console.warn('Invalid question object provided to hasTechnicalFlaws');
            return true;
        }

        // Check for absolute terms
        const absoluteTerms = ['always', 'never', 'all', 'none'];
        
        // Handle different question types
        if (question.type === this.questionTypes.TYPE_A) {
            // Validate required properties for Type A questions
            if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
                console.warn('Type A question missing valid options array');
                return true;
            }
            if (!question.stem || typeof question.stem !== 'object') {
                console.warn('Type A question missing valid stem object');
                return true;
            }
            if (!question.stem.question || typeof question.stem.question !== 'string') {
                console.warn('Type A question missing valid question text');
                return true;
            }

            const hasAbsoluteTerms = question.options.some(option => 
                option && option.text && absoluteTerms.some(term => 
                    option.text.toLowerCase().includes(term)
                )
            );

            const hasNegativePhrasing = question.stem.question.toLowerCase().includes('except') ||
                                      question.stem.question.toLowerCase().includes('not');

            const optionLengths = question.options
                .filter(opt => opt && opt.text)
                .map(opt => opt.text.length);
            
            const hasInconsistentLengths = optionLengths.length > 0 && 
                (Math.max(...optionLengths) - Math.min(...optionLengths) > 50);

            return hasAbsoluteTerms || hasNegativePhrasing || hasInconsistentLengths;
        } else if (question.type === this.questionTypes.TYPE_B || question.type === this.questionTypes.TYPE_R) {
            // Validate required properties for Type B and R questions
            if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
                console.warn('Type B/R question missing valid options array');
                return true;
            }
            if (!question.items || !Array.isArray(question.items) || question.items.length === 0) {
                console.warn('Type B/R question missing valid items array');
                return true;
            }
            if (!question.leadIn || typeof question.leadIn !== 'string') {
                console.warn('Type B/R question missing valid leadIn text');
                return true;
            }

            const hasAbsoluteTerms = question.options.some(option => 
                option && option.text && absoluteTerms.some(term => 
                    option.text.toLowerCase().includes(term)
                )
            );

            const hasNegativePhrasing = question.leadIn.toLowerCase().includes('except') ||
                                      question.leadIn.toLowerCase().includes('not');

            const optionLengths = question.options
                .filter(opt => opt && opt.text)
                .map(opt => opt.text.length);
            
            const hasInconsistentLengths = optionLengths.length > 0 && 
                (Math.max(...optionLengths) - Math.min(...optionLengths) > 50);

            return hasAbsoluteTerms || hasNegativePhrasing || hasInconsistentLengths;
        }

        console.warn('Unknown question type:', question.type);
        return true; // Invalid question type
    }

    /**
     * Validates topic input
     * @param {string|Array} topics - Topic(s) to validate
     * @returns {boolean} Whether the topic(s) are valid
     */
    validateTopics(topics) {
        if (!topics) return false;
        if (Array.isArray(topics)) {
            return topics.length > 0 && topics.every(topic => typeof topic === 'string' && topic.trim().length > 0);
        }
        return typeof topics === 'string' && topics.trim().length > 0;
    }

    /**
     * Generates a quiz with the specified number of questions
     * @param {number} questionCount - Number of questions to generate
     * @param {string|Array} topics - Topic(s) to focus on
     * @param {string} difficulty - Difficulty level
     * @returns {Promise<Array>} Array of generated questions
     * @throws {Error} If generation fails
     */
    async generateQuiz(questionCount, topics, difficulty = 'medium') {
        // Validate inputs
        if (!Number.isInteger(questionCount) || questionCount <= 0) {
            throw new Error('Invalid question count');
        }
        if (!this.validateTopics(topics)) {
            throw new Error('Invalid topic(s)');
        }
        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            throw new Error('Invalid difficulty level');
        }

        const questions = [];
        const typeDistribution = {
            [this.questionTypes.TYPE_A]: 0.7,
            [this.questionTypes.TYPE_B]: 0.15,
            [this.questionTypes.TYPE_R]: 0.15
        };

        // Handle multiple topics
        const topic = Array.isArray(topics) ? topics[Math.floor(Math.random() * topics.length)] : topics;
        const MAX_RETRIES = 3;
        let retryCount = 0;

        for (let i = 0; i < questionCount; i++) {
            let question;
            let isValid = false;
            let attempts = 0;

            while (!isValid && attempts < MAX_RETRIES) {
                const random = Math.random();
                try {
                    // Generate initial question
                    if (random < typeDistribution[this.questionTypes.TYPE_A]) {
                        question = this.generateTypeAQuestion({ topic, difficulty });
                    } else if (random < typeDistribution[this.questionTypes.TYPE_A] + typeDistribution[this.questionTypes.TYPE_B]) {
                        question = this.generateTypeBQuestionSet({ topic, difficulty });
                    } else {
                        question = this.generateTypeRQuestionSet({ topic, difficulty });
                    }

                    // Log the generated question for debugging
                    console.log('Generated question:', JSON.stringify(question, null, 2));

                    // Review and enhance the question
                    question = await this._reviewAndEnhanceQuestion(question);

                    // Log the enhanced question for debugging
                    console.log('Enhanced question:', JSON.stringify(question, null, 2));

                    // Validate the enhanced question
                    const validation = this.validateQuestion(question);
                    if (validation.isValid) {
                        isValid = true;
                        questions.push(question);
                    } else {
                        console.warn('Invalid question generated:', validation.issues);
                        attempts++;
                    }
                } catch (error) {
                    console.error('Error in question generation/validation:', error);
                    console.error('Question state:', question);
                    attempts++;
                }
            }

            if (!isValid) {
                retryCount++;
                if (retryCount >= MAX_RETRIES) {
                    throw new Error(`Failed to generate valid questions after ${MAX_RETRIES} attempts`);
                }
                i--; // Try again with a different topic
                continue;
            }
        }

        if (questions.length === 0) {
            throw new Error('Failed to generate any valid questions');
        }

        return questions;
    }

    /**
     * Reviews and enhances a question iteratively
     * @private
     */
    async _reviewAndEnhanceQuestion(question) {
        if (!question) {
            console.error('No question provided for review and enhancement');
            throw new Error('Invalid question object');
        }

        let currentQuestion = question;
        let attempts = 0;

        while (attempts < this.MAX_ENHANCEMENT_ATTEMPTS) {
            try {
                // Review the question
                const review = await questionReviewer.reviewQuestion(currentQuestion);
                
                // Check if quality meets minimum threshold
                if (review.qualityMetrics.overall >= this.MIN_QUALITY_SCORE) {
                    console.log('Question quality meets threshold:', review.qualityMetrics.overall);
                    return currentQuestion;
                }

                // Enhance the question
                const enhancedQuestion = await questionReviewer.enhanceQuestion(currentQuestion, review);
                
                // If enhancement didn't improve quality, return current version
                if (enhancedQuestion === currentQuestion) {
                    console.warn('Question enhancement did not improve quality');
                    return currentQuestion;
                }

                currentQuestion = enhancedQuestion;
                attempts++;
            } catch (error) {
                console.error('Error in review/enhancement process:', error);
                return currentQuestion; // Return current version if enhancement fails
            }
        }

        console.warn(`Reached maximum enhancement attempts (${this.MAX_ENHANCEMENT_ATTEMPTS})`);
        return currentQuestion;
    }
}

// Create and export a singleton instance
const questionGenerator = new QuestionGenerator();
export default questionGenerator; 