const psoriasisConfig = {
    data: dataMap, // Note: data object is named dataMap here
    initialTab: 'patho',
    storageKey: 'psoriasisMap',
    theme: { 
        colors: {
            nodes: ['#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe', '#f0f9ff'],
            collapsible: '#0284c7'
        }
    },
    searchEnabled: true
};
initializeMindMapApp(psoriasisConfig);
