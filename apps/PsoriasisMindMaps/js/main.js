// js/main.js - Psoriasis Mind Maps Configuration
const psoriasisConfig = {
    data: mindMapData,
    initialTab: 'patho',
    storageKey: 'psoriasisMap',
    theme: {
        colors: {
            // Sky blue theme for psoriasis
            nodes: ['#7dd3fc', '#bae6fd', '#e0f2fe', '#f0f9ff', '#f8fafc'],
            collapsible: '#0369a1'
        }
    },
    searchEnabled: true
};
initializeMindMapApp(psoriasisConfig);
