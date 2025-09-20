// This file loads the data and makes it available globally
// It's a wrapper to handle the ES module export from the data file

(async function() {
    try {
        // Dynamically import the ES module
        const module = await import('../dermatopathology-differentials-data.js');
        // Make the data available globally
        window.dermDifferentialData = module.dermDifferentialData;
        // Dispatch event to notify that data is loaded
        window.dispatchEvent(new Event('dermDataLoaded'));
    } catch (error) {
        console.error('Failed to load differential data:', error);
        // Fallback: try to load a sample dataset
        window.dermDifferentialData = [
            {
                finding: "Regular acanthosis",
                sources: ["Ko Ch 1, p25-28"],
                diagnoses: [
                    { name: "Psoriasis", keyFeatures: "Neutrophils in stratum corneum (Munro's microabscesses), hypogranulosis, thinned suprapapillary plates, dilated papillary dermal vessels." },
                    { name: "Clear cell acanthoma", keyFeatures: "Sharply demarcated clear/pale keratinocytes, parakeratosis above clear cells, neutrophils in stratum corneum." },
                    { name: "Bowen disease", keyFeatures: "Full-thickness epidermal disorder, atypical keratinocytes and mitoses, basal layer may appear focally normal ('eyeliner' sign)." }
                ]
            },
            {
                finding: "Lobular proliferation",
                sources: ["Ko Ch 1, p29-34"],
                diagnoses: [
                    { name: "Seborrheic keratosis", keyFeatures: "Acanthosis of epidermis, pseudohorn cysts, no ducts." },
                    { name: "Poroma", keyFeatures: "Uniform blue cells, interspersed ducts, fibrotic or hyalinized stroma with dilated vessels." },
                    { name: "Trichilemmoma", keyFeatures: "Proliferation of pale/clear cells, peripheral palisading, thickened basement membrane." }
                ]
            }
        ];
        window.dispatchEvent(new Event('dermDataLoaded'));
    }
})();