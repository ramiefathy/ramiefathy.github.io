import { generateQuiz } from './quiz.js';
import { auth } from './firebase-config.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase-config.js';

// Quiz topics data structure
const quizTopics = {
    "Foundational Sciences & Skin Principles": {
        "Anatomy & Histology of the Skin, Hair, and Nails": [],
        "Physiology & Biochemistry of the Skin": [],
        "Cutaneous Immunology & Embryology": [],
        "Basic Dermatopathology Principles & Stains": [],
        "Genetics in Dermatology & Genodermatoses Overview": [],
        "Pharmacology: Topical & Systemic Agents (General Principles)": [],
        "Wound Healing & Repair Mechanisms": []
    },
    "Inflammatory Dermatoses": {
        "Eczematous Dermatitis": ["Atopic", "Contact", "Seborrheic", "Nummular"],
        "Papulosquamous Disorders": ["Psoriasis", "Lichen Planus", "Pityriasis Rosea", "Pityriasis Rubra Pilaris"],
        "Urticaria, Angioedema, & Mast Cell Disorders": [],
        "Erythemas": ["Erythema Multiforme", "Figurate Erythemas"],
        "Vasculitis & Other Vaso-occlusive Disorders": [],
        "Neutrophilic Dermatoses": ["Sweet's Syndrome", "Pyoderma Gangrenosum"],
        "Granulomatous Disorders": ["Sarcoidosis", "Granuloma Annulare"]
    },
    // ... Add all other categories and subcategories
};

class QuizConfigManager {
    constructor() {
        this.selectedTopics = new Set();
        this.quizConfig = {
            questionCount: 10,
            timerEnabled: false,
            navigationMode: 'sequential'
        };
        this.questions = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Topic selection modal
        document.getElementById('closeTopicSelectionBtn').addEventListener('click', () => this.hideTopicSelection());
        document.getElementById('cancelTopicSelectionBtn').addEventListener('click', () => this.hideTopicSelection());
        document.getElementById('confirmTopicSelectionBtn').addEventListener('click', () => this.showQuizConfig());

        // Quiz config modal
        document.getElementById('closeQuizConfigBtn').addEventListener('click', () => this.hideQuizConfig());
        document.getElementById('backToTopicsBtn').addEventListener('click', () => this.showTopicSelection());
        document.getElementById('startQuizBtn').addEventListener('click', () => this.startQuiz());

        // Quiz configuration inputs
        document.getElementById('questionCount').addEventListener('change', (e) => {
            this.quizConfig.questionCount = parseInt(e.target.value);
        });

        document.getElementById('timerEnabled').addEventListener('change', (e) => {
            this.quizConfig.timerEnabled = e.target.checked;
        });

        document.getElementById('sequentialNav').addEventListener('change', (e) => {
            this.quizConfig.navigationMode = e.target.checked ? 'sequential' : 'free';
        });

        // Add validation for missed questions percentage
        document.getElementById('missedQuestionsPercentage').addEventListener('change', (e) => {
            let value = parseInt(e.target.value);
            if (isNaN(value) || value < 0) value = 0;
            if (value > 100) value = 100;
            e.target.value = value;
            this.quizConfig.missedQuestionsPercentage = value;
        });

        // Add event listeners for new options
        document.getElementById('includeMissedQuestions').addEventListener('change', (e) => {
            this.quizConfig.includeMissedQuestions = e.target.checked;
            const percentageInput = document.getElementById('missedQuestionsPercentage');
            percentageInput.disabled = !e.target.checked;
        });

        document.getElementById('includeWeakTopics').addEventListener('change', (e) => {
            this.quizConfig.includeWeakTopics = e.target.checked;
        });
    }

    showTopicSelection() {
        const modal = document.getElementById('topicSelectionModal');
        modal.classList.remove('hidden');
        this.populateTopicCategories();
    }

    hideTopicSelection() {
        const modal = document.getElementById('topicSelectionModal');
        modal.classList.add('hidden');
    }

    showQuizConfig() {
        if (this.selectedTopics.size === 0) {
            alert('Please select at least one topic');
            return;
        }

        this.hideTopicSelection();
        const modal = document.getElementById('quizConfigModal');
        modal.classList.remove('hidden');
        this.updateSelectedTopicsSummary();
        
        // Start generating questions in the background
        this.generateQuestions();
    }

    hideQuizConfig() {
        const modal = document.getElementById('quizConfigModal');
        modal.classList.add('hidden');
    }

    populateTopicCategories() {
        const container = document.getElementById('topicCategories');
        container.innerHTML = '';

        Object.entries(quizTopics).forEach(([category, subcategories]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'border rounded-md p-4';
            
            // Category header with checkbox
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'flex items-center mb-2';
            
            const categoryCheckbox = document.createElement('input');
            categoryCheckbox.type = 'checkbox';
            categoryCheckbox.className = 'h-4 w-4 text-blue-600 focus:ring-blue-500';
            categoryCheckbox.dataset.category = category;
            categoryCheckbox.addEventListener('change', (e) => this.handleCategorySelection(e, category, subcategories));
            
            const categoryLabel = document.createElement('label');
            categoryLabel.className = 'ml-2 text-lg font-medium text-gray-900';
            categoryLabel.textContent = category;
            
            categoryHeader.appendChild(categoryCheckbox);
            categoryHeader.appendChild(categoryLabel);
            categoryDiv.appendChild(categoryHeader);

            // Subcategories
            const subcategoriesDiv = document.createElement('div');
            subcategoriesDiv.className = 'ml-6 space-y-2';
            
            Object.entries(subcategories).forEach(([subcategory, specificTopics]) => {
                const subcategoryDiv = document.createElement('div');
                subcategoryDiv.className = 'flex items-center';
                
                const subcategoryCheckbox = document.createElement('input');
                subcategoryCheckbox.type = 'checkbox';
                subcategoryCheckbox.className = 'h-4 w-4 text-blue-600 focus:ring-blue-500';
                subcategoryCheckbox.dataset.subcategory = subcategory;
                subcategoryCheckbox.addEventListener('change', (e) => this.handleSubcategorySelection(e, category, subcategory));
                
                const subcategoryLabel = document.createElement('label');
                subcategoryLabel.className = 'ml-2 text-sm text-gray-700';
                subcategoryLabel.textContent = subcategory;
                
                subcategoryDiv.appendChild(subcategoryCheckbox);
                subcategoryDiv.appendChild(subcategoryLabel);
                subcategoriesDiv.appendChild(subcategoryDiv);

                // Specific topics if any
                if (specificTopics.length > 0) {
                    const specificTopicsDiv = document.createElement('div');
                    specificTopicsDiv.className = 'ml-6 space-y-1';
                    
                    specificTopics.forEach(topic => {
                        const topicDiv = document.createElement('div');
                        topicDiv.className = 'flex items-center';
                        
                        const topicCheckbox = document.createElement('input');
                        topicCheckbox.type = 'checkbox';
                        topicCheckbox.className = 'h-4 w-4 text-blue-600 focus:ring-blue-500';
                        topicCheckbox.dataset.topic = topic;
                        topicCheckbox.addEventListener('change', (e) => this.handleTopicSelection(e, category, subcategory, topic));
                        
                        const topicLabel = document.createElement('label');
                        topicLabel.className = 'ml-2 text-sm text-gray-600';
                        topicLabel.textContent = topic;
                        
                        topicDiv.appendChild(topicCheckbox);
                        topicDiv.appendChild(topicLabel);
                        specificTopicsDiv.appendChild(topicDiv);
                    });
                    
                    subcategoriesDiv.appendChild(specificTopicsDiv);
                }
            });
            
            categoryDiv.appendChild(subcategoriesDiv);
            container.appendChild(categoryDiv);
        });
    }

    handleCategorySelection(event, category, subcategories) {
        const isChecked = event.target.checked;
        const categoryCheckbox = event.target;
        const categoryDiv = categoryCheckbox.closest('.border');
        
        // Update all subcategory and topic checkboxes
        categoryDiv.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = isChecked;
            if (checkbox !== categoryCheckbox) {
                const subcategory = checkbox.dataset.subcategory;
                const topic = checkbox.dataset.topic;
                
                if (subcategory) {
                    this.handleSubcategorySelection({ target: checkbox }, category, subcategory);
                } else if (topic) {
                    this.handleTopicSelection({ target: checkbox }, category, subcategory, topic);
                }
            }
        });
    }

    handleSubcategorySelection(event, category, subcategory) {
        const isChecked = event.target.checked;
        const topicKey = `${category} > ${subcategory}`;
        
        if (isChecked) {
            this.selectedTopics.add(topicKey);
        } else {
            this.selectedTopics.delete(topicKey);
        }
    }

    handleTopicSelection(event, category, subcategory, topic) {
        const isChecked = event.target.checked;
        const topicKey = `${category} > ${subcategory} > ${topic}`;
        
        if (isChecked) {
            this.selectedTopics.add(topicKey);
        } else {
            this.selectedTopics.delete(topicKey);
        }
    }

    updateSelectedTopicsSummary() {
        const summaryDiv = document.getElementById('selectedTopicsSummary');
        const topicsList = Array.from(this.selectedTopics).map(topic => {
            return `<div class="text-sm text-gray-600">${topic}</div>`;
        }).join('');
        
        summaryDiv.innerHTML = topicsList || '<div class="text-sm text-gray-500">No topics selected</div>';
    }

    async generateQuestions() {
        try {
            // Start generating questions in the background
            this.questions = await generateQuiz(
                this.quizConfig.questionCount,
                Array.from(this.selectedTopics)
            );
        } catch (error) {
            console.error('Error generating questions:', error);
            alert('Error generating questions. Please try again.');
        }
    }

    async startQuiz() {
        if (!this.questions) {
            alert('Please wait while questions are being generated...');
            return;
        }

        // Ensure user profile exists if user is logged in
        const user = auth.currentUser;
        if (user) {
            try {
                const userProfileRef = doc(db, 'users', user.uid);
                const userProfileDoc = await getDoc(userProfileRef);
                
                if (!userProfileDoc.exists()) {
                    // Create basic user profile if it doesn't exist
                    await setDoc(userProfileRef, {
                        displayName: user.displayName || 'User',
                        email: user.email,
                        createdAt: new Date(),
                        preferences: {
                            quizDifficulty: 'medium',
                            focusAreas: [],
                            notifications: true
                        },
                        progress: {
                            quizzesCompleted: 0,
                            averageScore: 0,
                            topicsMastered: []
                        }
                    });
                }
            } catch (error) {
                console.error('Error ensuring user profile:', error);
                // Continue with quiz even if profile creation fails
            }
        }

        this.hideQuizConfig();
        // Start the quiz with the generated questions
        await generateQuiz(this.questions, this.quizConfig);
    }
}

// Create and export a singleton instance
const quizConfigManager = new QuizConfigManager();
export default quizConfigManager; 