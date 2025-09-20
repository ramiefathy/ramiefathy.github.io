/**
 * Spaced Repetition System for Dermpath DDXs
 * Implements SM-2 algorithm similar to Anki
 */

export class SpacedRepetitionSystem {
    constructor() {
        this.cards = new Map(); // Map of cardId -> CardData
        this.loadFromStorage();
    }

    /**
     * Card data structure
     * @typedef {Object} CardData
     * @property {string} id - Unique identifier for the card
     * @property {string} finding - The finding/category
     * @property {string} diagnosis - The diagnosis name
     * @property {number} easeFactor - Ease factor (2.5 default, min 1.3)
     * @property {number} interval - Current interval in days
     * @property {number} repetitions - Number of successful repetitions
     * @property {Date} nextReviewDate - When the card is due for review
     * @property {Date} lastReviewDate - When the card was last reviewed
     * @property {number} lapses - Number of times the card was forgotten
     * @property {Array} reviewHistory - Array of review records
     * @property {string} status - 'new', 'learning', 'review', 'relearning'
     */

    /**
     * Initialize a new card
     */
    createCard(finding, diagnosis) {
        const cardId = `${finding}_${diagnosis}`.replace(/\s+/g, '_');
        
        if (!this.cards.has(cardId)) {
            const cardData = {
                id: cardId,
                finding: finding,
                diagnosis: diagnosis,
                easeFactor: 2.5,
                interval: 0,
                repetitions: 0,
                nextReviewDate: new Date(),
                lastReviewDate: null,
                lapses: 0,
                reviewHistory: [],
                status: 'new'
            };
            
            this.cards.set(cardId, cardData);
            this.saveToStorage();
        }
        
        return this.cards.get(cardId);
    }

    /**
     * SM-2 Algorithm Implementation
     * @param {string} cardId - Card identifier
     * @param {number} quality - Quality of recall (0-5)
     *   5 - Perfect response
     *   4 - Correct response after hesitation
     *   3 - Correct response with difficulty
     *   2 - Incorrect response; correct one seemed easy to recall
     *   1 - Incorrect response; correct one remembered
     *   0 - Complete blackout
     */
    reviewCard(cardId, quality) {
        const card = this.cards.get(cardId);
        if (!card) return null;

        const now = new Date();
        const review = {
            date: now,
            quality: quality,
            interval: card.interval,
            easeFactor: card.easeFactor
        };

        // Update review history
        card.reviewHistory.push(review);
        card.lastReviewDate = now;

        if (quality < 3) {
            // Failed card - reset to learning
            card.repetitions = 0;
            card.interval = 0;
            card.lapses++;
            card.status = card.lapses > 0 ? 'relearning' : 'learning';
            
            // Schedule for 10 minutes later
            card.nextReviewDate = new Date(now.getTime() + 10 * 60 * 1000);
        } else {
            // Successful review
            card.repetitions++;

            // Calculate new ease factor
            const newEaseFactor = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
            card.easeFactor = Math.max(1.3, newEaseFactor);

            // Calculate new interval
            if (card.repetitions === 1) {
                // First successful review - 1 day
                card.interval = 1;
                card.status = 'learning';
            } else if (card.repetitions === 2) {
                // Second successful review - 6 days
                card.interval = 6;
                card.status = 'learning';
            } else {
                // Subsequent reviews - multiply by ease factor
                card.interval = Math.round(card.interval * card.easeFactor);
                card.status = 'review';
            }

            // Apply some randomness to prevent clustering (fuzz factor)
            const fuzz = this.getFuzzFactor(card.interval);
            card.interval = Math.max(1, card.interval + fuzz);

            // Set next review date
            card.nextReviewDate = new Date(now.getTime() + card.interval * 24 * 60 * 60 * 1000);
        }

        this.saveToStorage();
        return card;
    }

    /**
     * Get fuzz factor to add some randomness to intervals
     */
    getFuzzFactor(interval) {
        if (interval < 7) return 0;
        if (interval < 30) return Math.floor(Math.random() * 3) - 1;
        return Math.floor(Math.random() * 7) - 3;
    }

    /**
     * Get cards due for review
     */
    getDueCards(finding = null) {
        const now = new Date();
        const dueCards = [];

        for (const [cardId, card] of this.cards) {
            if (finding && card.finding !== finding) continue;
            if (card.nextReviewDate <= now) {
                dueCards.push(card);
            }
        }

        // Sort by priority: failed cards first, then by interval (shorter first)
        dueCards.sort((a, b) => {
            if (a.status === 'relearning' && b.status !== 'relearning') return -1;
            if (b.status === 'relearning' && a.status !== 'relearning') return 1;
            if (a.status === 'learning' && b.status === 'review') return -1;
            if (b.status === 'learning' && a.status === 'review') return 1;
            return a.interval - b.interval;
        });

        return dueCards;
    }

    /**
     * Get new cards (never reviewed)
     */
    getNewCards(finding = null, limit = 20) {
        const newCards = [];

        for (const [cardId, card] of this.cards) {
            if (finding && card.finding !== finding) continue;
            if (card.status === 'new' && card.repetitions === 0) {
                newCards.push(card);
                if (newCards.length >= limit) break;
            }
        }

        return newCards;
    }

    /**
     * Get statistics for a finding or overall
     */
    getStatistics(finding = null) {
        let totalCards = 0;
        let newCards = 0;
        let learningCards = 0;
        let reviewCards = 0;
        let dueCards = 0;
        let totalReviews = 0;
        let correctReviews = 0;

        const now = new Date();

        for (const [cardId, card] of this.cards) {
            if (finding && card.finding !== finding) continue;

            totalCards++;

            switch (card.status) {
                case 'new': newCards++; break;
                case 'learning':
                case 'relearning': learningCards++; break;
                case 'review': reviewCards++; break;
            }

            if (card.nextReviewDate <= now) {
                dueCards++;
            }

            // Count reviews
            card.reviewHistory.forEach(review => {
                totalReviews++;
                if (review.quality >= 3) correctReviews++;
            });
        }

        const retention = totalReviews > 0 ? (correctReviews / totalReviews * 100).toFixed(1) : 0;

        return {
            totalCards,
            newCards,
            learningCards,
            reviewCards,
            dueCards,
            totalReviews,
            retention: `${retention}%`,
            averageEase: this.getAverageEase(finding)
        };
    }

    /**
     * Get average ease factor
     */
    getAverageEase(finding = null) {
        let totalEase = 0;
        let count = 0;

        for (const [cardId, card] of this.cards) {
            if (finding && card.finding !== finding) continue;
            if (card.repetitions > 0) {
                totalEase += card.easeFactor;
                count++;
            }
        }

        return count > 0 ? (totalEase / count).toFixed(2) : 2.5;
    }

    /**
     * Get review forecast
     */
    getForecast(days = 30, finding = null) {
        const forecast = [];
        const now = new Date();

        for (let i = 0; i < days; i++) {
            const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
            let dueCount = 0;

            for (const [cardId, card] of this.cards) {
                if (finding && card.finding !== finding) continue;
                const reviewDate = new Date(card.nextReviewDate);
                if (reviewDate.toDateString() === date.toDateString()) {
                    dueCount++;
                }
            }

            forecast.push({
                date: date.toISOString().split('T')[0],
                due: dueCount
            });
        }

        return forecast;
    }

    /**
     * Reset card progress
     */
    resetCard(cardId) {
        const card = this.cards.get(cardId);
        if (!card) return null;

        card.easeFactor = 2.5;
        card.interval = 0;
        card.repetitions = 0;
        card.nextReviewDate = new Date();
        card.lastReviewDate = null;
        card.lapses = 0;
        card.reviewHistory = [];
        card.status = 'new';

        this.saveToStorage();
        return card;
    }

    /**
     * Save to localStorage
     */
    saveToStorage() {
        try {
            const data = Array.from(this.cards.entries()).map(([id, card]) => ({
                ...card,
                nextReviewDate: card.nextReviewDate.toISOString(),
                lastReviewDate: card.lastReviewDate ? card.lastReviewDate.toISOString() : null,
                reviewHistory: card.reviewHistory.map(r => ({
                    ...r,
                    date: r.date.toISOString()
                }))
            }));
            
            localStorage.setItem('dermpath_srs_data', JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save SRS data:', e);
        }
    }

    /**
     * Load from localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('dermpath_srs_data');
            if (stored) {
                const data = JSON.parse(stored);
                data.forEach(card => {
                    card.nextReviewDate = new Date(card.nextReviewDate);
                    card.lastReviewDate = card.lastReviewDate ? new Date(card.lastReviewDate) : null;
                    card.reviewHistory = card.reviewHistory.map(r => ({
                        ...r,
                        date: new Date(r.date)
                    }));
                    this.cards.set(card.id, card);
                });
            }
        } catch (e) {
            console.error('Failed to load SRS data:', e);
        }
    }

    /**
     * Export data as JSON
     */
    exportData() {
        const data = Array.from(this.cards.entries()).map(([id, card]) => card);
        return JSON.stringify(data, null, 2);
    }

    /**
     * Import data from JSON
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            data.forEach(card => {
                card.nextReviewDate = new Date(card.nextReviewDate);
                card.lastReviewDate = card.lastReviewDate ? new Date(card.lastReviewDate) : null;
                card.reviewHistory = card.reviewHistory.map(r => ({
                    ...r,
                    date: new Date(r.date)
                }));
                this.cards.set(card.id, card);
            });
            this.saveToStorage();
            return true;
        } catch (e) {
            console.error('Failed to import SRS data:', e);
            return false;
        }
    }
}
