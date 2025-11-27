// js/main.js - CTCL Mind Maps Configuration
const ctclConfig = {
    data: mindMapData,
    initialTab: 'question',
    storageKey: 'ctclMap',
    theme: {
        colors: {
            // Indigo/purple theme for CTCL
            nodes: ['#a5b4fc', '#c7d2fe', '#e0e7ff', '#eef2ff', '#f9fafb'],
            collapsible: '#4338ca'
        }
    },
    searchEnabled: true
};
initializeMindMapApp(ctclConfig);
