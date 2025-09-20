// This file loads the deduplicated data and makes it available globally
// It's a wrapper to handle the ES module export from the deduplicated data file

(async function() {
    try {
        // Dynamically import the deduplicated ES module
        const module = await import('./dermatopathology-differentials-data-deduplicated.js');

        // Make the deduplicated data available globally
        window.dermDifferentialData = module.dermDifferentialDataDeduplicated;

        // Also make the summary available
        window.deduplicationSummary = module.deduplicationSummary;

        // Log summary info
        console.log('Loaded deduplicated data:', window.deduplicationSummary);

        // Dispatch event to notify that data is loaded
        window.dispatchEvent(new Event('dermDataLoaded'));
    } catch (error) {
        console.error('Failed to load deduplicated data, falling back to original:', error);

        // Fallback to original data
        try {
            const originalModule = await import('../dermatopathology-differentials-data.js');
            window.dermDifferentialData = originalModule.dermDifferentialData;
            console.log('Loaded original data as fallback');
            window.dispatchEvent(new Event('dermDataLoaded'));
        } catch (fallbackError) {
            console.error('Failed to load any data:', fallbackError);
            // Use minimal fallback data
            window.dermDifferentialData = [
                {
                    finding: "Regular acanthosis",
                    sources: ["Ko Ch 1, p25-28"],
                    diagnoses: [
                        { name: "Psoriasis", keyFeatures: "Neutrophils in stratum corneum (Munro's microabscesses), hypogranulosis, thinned suprapapillary plates, dilated papillary dermal vessels." },
                        { name: "Clear cell acanthoma", keyFeatures: "Sharply demarcated clear/pale keratinocytes, parakeratosis above clear cells, neutrophils in stratum corneum." },
                        { name: "Bowen disease", keyFeatures: "Full-thickness epidermal disorder, atypical keratinocytes and mitoses, basal layer may appear focally normal ('eyeliner' sign)." }
                    ]
                }
            ];
            window.dispatchEvent(new Event('dermDataLoaded'));
        }
    }
})();