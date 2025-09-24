const bullousConfig = {
    data: dataMap,
    initialTab: 'classification',
    storageKey: 'bullousMap',
    theme: { 
        colors: {
            nodes: ['#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#ecfdf5'],
            collapsible: '#059669'
        }
    },
    searchEnabled: false
};
initializeMindMapApp(bullousConfig);
