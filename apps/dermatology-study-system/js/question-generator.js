import { db } from './firebase-config.js';

class QuestionGenerator {
    constructor() {
        this.questionTypes = {
            TYPE_A: 'TYPE_A', // One-best-answer
            TYPE_B: 'TYPE_B', // Matching
            TYPE_R: 'TYPE_R'  // Extended matching
        };
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
        return {
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
            topic: 'psoriasis',
            difficulty: 'medium',
            focusArea: 'diagnosis'
        };
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

        // Check stem clarity and focus
        if (!question.stem || !question.stem.vignette || !question.stem.question) {
            validationResults.isValid = false;
            validationResults.issues.push('Missing or incomplete stem');
        }

        // Check options homogeneity
        if (question.options && question.options.length > 0) {
            const firstOptionType = this.getOptionType(question.options[0].text);
            for (let i = 1; i < question.options.length; i++) {
                if (this.getOptionType(question.options[i].text) !== firstOptionType) {
                    validationResults.isValid = false;
                    validationResults.issues.push('Options are not homogeneous');
                    break;
                }
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
        // TODO: Implement more sophisticated option type detection
        return 'diagnosis'; // Placeholder
    }

    /**
     * Checks for technical flaws in the question
     * @param {Object} question - The question to check
     * @returns {boolean} Whether the question has technical flaws
     */
    hasTechnicalFlaws(question) {
        // Check for absolute terms
        const absoluteTerms = ['always', 'never', 'all', 'none'];
        const hasAbsoluteTerms = question.options.some(option => 
            absoluteTerms.some(term => option.text.toLowerCase().includes(term))
        );

        // Check for negative phrasing
        const hasNegativePhrasing = question.stem.question.toLowerCase().includes('except') ||
                                  question.stem.question.toLowerCase().includes('not');

        // Check for option length consistency
        const optionLengths = question.options.map(opt => opt.text.length);
        const hasInconsistentLengths = Math.max(...optionLengths) - Math.min(...optionLengths) > 50;

        return hasAbsoluteTerms || hasNegativePhrasing || hasInconsistentLengths;
    }

    /**
     * Generates a quiz with the specified number of questions
     * @param {number} questionCount - Number of questions to generate
     * @param {string} topic - Topic to focus on
     * @param {string} difficulty - Difficulty level
     * @returns {Array} Array of generated questions
     */
    async generateQuiz(questionCount, topic, difficulty) {
        const questions = [];
        const typeDistribution = {
            [this.questionTypes.TYPE_A]: 0.7, // 70% Type A
            [this.questionTypes.TYPE_B]: 0.15, // 15% Type B
            [this.questionTypes.TYPE_R]: 0.15  // 15% Type R
        };

        for (let i = 0; i < questionCount; i++) {
            let question;
            const random = Math.random();

            if (random < typeDistribution[this.questionTypes.TYPE_A]) {
                question = this.generateTypeAQuestion({ topic, difficulty });
            } else if (random < typeDistribution[this.questionTypes.TYPE_A] + typeDistribution[this.questionTypes.TYPE_B]) {
                question = this.generateTypeBQuestionSet({ topic, difficulty });
            } else {
                question = this.generateTypeRQuestionSet({ topic, difficulty });
            }

            const validation = this.validateQuestion(question);
            if (validation.isValid) {
                questions.push(question);
            } else {
                console.warn('Invalid question generated:', validation.issues);
                i--; // Try again
            }
        }

        return questions;
    }
}

// Create and export a singleton instance
const questionGenerator = new QuestionGenerator();
export default questionGenerator; 