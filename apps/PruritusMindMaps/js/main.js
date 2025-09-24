const pruritusConfig = {
    data: mindMapData,
    initialTab: 'approach',
    storageKey: 'pruritusMap',
    theme: { 
        colors: {
            nodes: ['#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff', '#f8fafc'],
            collapsible: '#1d4ed8'
        }
    },
    searchEnabled: true
};
initializeMindMapApp(pruritusConfig);
