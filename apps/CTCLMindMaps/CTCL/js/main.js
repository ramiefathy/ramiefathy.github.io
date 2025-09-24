const ctclConfig = {
    data: dataMap, // from CTCL/js/data.js
    initialTab: 'question',
    storageKey: 'ctclMap', // Unique key for localStorage
    theme: {
        colors: {
            nodes: ['#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff', '#f8fafc'],
            collapsible: '#1d4ed8'
        }
    },
    searchEnabled: true
};
// Call the global function from shared/app.js
initializeMindMapApp(ctclConfig);
