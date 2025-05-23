import { db } from './firebase-config.js';
import questionReviewer from './question-reviewer.js';
import { askLLM } from './ask-llm.js';

class QuestionGenerator {
    constructor() {
        console.log('[QuestionGenerator] Initializing with configuration:', {
            maxEnhancementAttempts: this.MAX_ENHANCEMENT_ATTEMPTS,
            minQualityScore: this.MIN_QUALITY_SCORE,
            cacheTTL: this.CACHE_TTL,
            maxQuizGenerationAttempts: this.MAX_QUIZ_GENERATION_ATTEMPTS,
            quizGenerationBackoff: this.QUIZ_GENERATION_BACKOFF
        });
        this.questionTypes = {
            TYPE_A: 'TYPE_A', // One-best-answer
            TYPE_B: 'TYPE_B', // Matching
            TYPE_R: 'TYPE_R'  // Extended matching
        };
        this.MAX_ENHANCEMENT_ATTEMPTS = 3;
        this.MIN_QUALITY_SCORE = 4; // Minimum acceptable quality score (out of 5)
        this.questionCache = new Map();
        this.CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
        this.MAX_QUIZ_GENERATION_ATTEMPTS = 3;
        this.QUIZ_GENERATION_BACKOFF = 30000; // 30 seconds
    }

    /**
     * Generates a Type A (one-best-answer) question
     * @param {Object} options - Question generation options
     * @returns {Promise<Object>} Generated question
     */
    async generateTypeAQuestion(options = {}) {
        console.log('[QuestionGenerator] Starting Type A question generation:', {
            topic: options.topic,
            difficulty: options.difficulty,
            focusOn: options.focusOn,
            timestamp: new Date().toISOString()
        });

        const {
            topic = 'general',
            difficulty = 'medium',
            focusOn = 'diagnosis'
        } = options;

        // Create cache key
        const cacheKey = JSON.stringify({ type: 'TYPE_A', topic, difficulty, focusOn });
        console.log('[QuestionGenerator] Cache key:', cacheKey);
        
        // Check cache first
        const cachedQuestion = this.questionCache.get(cacheKey);
        if (cachedQuestion && Date.now() - cachedQuestion.timestamp < this.CACHE_TTL) {
            console.log('[QuestionGenerator] Using cached question:', {
                cacheAge: Date.now() - cachedQuestion.timestamp,
                cacheTTL: this.CACHE_TTL
            });
            return cachedQuestion.question;
        }

        try {
            console.log('[QuestionGenerator] Constructing prompt for LLM');
            const prompt = `You are an expert medical educator specializing in dermatology board exam question writing.
                Generate a Type A (one-best-answer) question for a dermatology board exam with the following specifications:
                - Topic: ${topic}
                - Difficulty: ${difficulty}
                - Focus: ${focusOn}
                
                The question should include:
                1. A clinical vignette
                2. A clear question stem
                3. Five answer options (A-E)
                4. The correct answer
                5. A detailed explanation
                
                IMPORTANT: Your response must be a valid JSON object with exactly this structure:
                {
                    "type": "TYPE_A",
                    "stem": {
                        "vignette": "detailed clinical scenario",
                        "question": "clear question asking for the best answer"
                    },
                    "options": [
                        {"id": "A", "text": "first option"},
                        {"id": "B", "text": "second option"},
                        {"id": "C", "text": "third option"},
                        {"id": "D", "text": "fourth option"},
                        {"id": "E", "text": "fifth option"}
                    ],
                    "correctAnswer": "A",
                    "explanation": "detailed explanation of why this is correct",
                    "topic": "${topic}",
                    "difficulty": "${difficulty}",
                    "focusArea": "${focusOn}"
                }

                Do not include any text before or after the JSON object. The response must be parseable JSON.`;

            console.log('[QuestionGenerator] Calling LLM with prompt length:', prompt.length);
            const response = await askLLM(prompt, { 
                type: 'question_generation',
                systemMessage: 'You are an expert medical educator specializing in dermatology board exam question writing. Your task is to generate high-quality, clinically relevant questions in the exact JSON format specified.'
            });
            console.log('[QuestionGenerator] Received response from LLM, length:', response.length);

            // Try to extract JSON from the response
            let jsonStr = response;
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                console.log('[QuestionGenerator] Found JSON match in response');
                jsonStr = jsonMatch[0];
            } else {
                console.warn('[QuestionGenerator] No JSON match found in response');
            }

            let question;
            try {
                console.log('[QuestionGenerator] Attempting to parse JSON response');
                question = JSON.parse(jsonStr);
                console.log('[QuestionGenerator] Successfully parsed JSON response');
            } catch (parseError) {
                console.error('[QuestionGenerator] JSON parse error:', {
                    error: parseError.message,
                    responsePreview: response.substring(0, 200) + '...'
                });
                throw new Error('Invalid JSON response from LLM');
            }

            // Validate the generated question
            console.log('[QuestionGenerator] Validating question structure');
            if (!this._validateQuestionStructure(question)) {
                console.error('[QuestionGenerator] Invalid question structure:', {
                    type: question.type,
                    hasStem: !!question.stem,
                    optionsCount: question.options?.length,
                    hasCorrectAnswer: !!question.correctAnswer,
                    hasExplanation: !!question.explanation
                });
                throw new Error('Failed to generate valid Type A question structure');
            }

            // Cache the question
            console.log('[QuestionGenerator] Caching valid question');
            this.questionCache.set(cacheKey, {
                question,
                timestamp: Date.now()
            });

            return question;
        } catch (error) {
            console.error('[QuestionGenerator] Error in generateTypeAQuestion:', {
                error: error.message,
                stack: error.stack,
                topic,
                difficulty,
                focusOn
            });
            throw new Error('Failed to generate Type A question: ' + error.message);
        }
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
        console.log('[QuestionGenerator] Validating question:', question);
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
    async generateQuiz({ questionCount, topics, difficulty }) {
        console.log('[QuestionGenerator] Starting quiz generation:', { questionCount, topics, difficulty });
        const questions = [];
        let attempts = 0;
        const maxAttempts = questionCount * 3;
        const topicArray = Array.isArray(topics) ? topics : [topics];
        
        // Pre-generate some questions for each topic to have in cache
        await this._preGenerateQuestions(topicArray, difficulty);

        while (questions.length < questionCount && attempts < maxAttempts) {
            attempts++;
            let topic = topicArray[questions.length % topicArray.length];
            let question;
            try {
                console.log(`[QuestionGenerator] Generating question #${questions.length + 1} (Attempt ${attempts}) for topic:`, topic);
                question = await this.generateTypeAQuestion({ topic, difficulty });
                console.log('[QuestionGenerator] Raw question from LLM:', question);
            } catch (err) {
                console.error(`[QuestionGenerator] Error during LLM question generation (Attempt ${attempts}):`, err);
                // If we hit rate limit or any other error, stop immediately
                throw new Error(`Failed to generate question: ${err.message}`);
            }

            try {
                const isValid = this.validateQuestion(question);
                console.log(`[QuestionGenerator] Validation result for question #${questions.length + 1}:`, isValid);
                if (isValid) {
                    questions.push(question);
                    console.log(`[QuestionGenerator] Question #${questions.length} added to quiz.`);
                } else {
                    console.warn(`[QuestionGenerator] Invalid question (Attempt ${attempts}):`, question);
                }
            } catch (validationErr) {
                console.error(`[QuestionGenerator] Error during question validation (Attempt ${attempts}):`, validationErr);
                throw new Error(`Failed to validate question: ${validationErr.message}`);
            }
        }

        if (questions.length < questionCount) {
            throw new Error(`Failed to generate enough valid questions (${questions.length}/${questionCount})`);
        }

        return questions;
    }

    /**
     * Pre-generates questions for each topic to have in cache
     * @private
     */
    async _preGenerateQuestions(topics, difficulty) {
        console.log('[QuestionGenerator] Pre-generating questions for topics:', topics);
        const preGeneratePromises = topics.map(async (topic) => {
            try {
                await this.generateTypeAQuestion({ topic, difficulty });
            } catch (error) {
                console.warn(`[QuestionGenerator] Failed to pre-generate question for topic ${topic}:`, error);
            }
        });
        await Promise.all(preGeneratePromises);
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