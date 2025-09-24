// Validate data before initialization
if (typeof mindMapData === 'undefined') {
    console.error('mindMapData is not defined. Check if data.js loaded correctly.');
    document.getElementById('mind-map-view-container').innerHTML = `
        <div class="flex items-center justify-center h-full">
            <div class="text-center p-8">
                <div class="text-red-500 text-xl mb-4">⚠️ Data Loading Error</div>
                <div class="text-gray-600">Mind map data could not be loaded. Please check if data.js is available.</div>
            </div>
        </div>
    `;
} else {
    const alopeciaConfig = {
        data: mindMapData,
        initialTab: 'approach',
        storageKey: 'alopeciaMap',
        theme: { 
            colors: {
                nodes: ['#c4b5fd', '#ddd6fe', '#e9d5ff', '#f3e8ff', '#faf5ff'],
                collapsible: '#3730a3'
            }
        },
        searchEnabled: true
    };

    // Validate that initializeMindMapApp is available
    if (typeof initializeMindMapApp === 'function') {
        initializeMindMapApp(alopeciaConfig);
    } else {
        console.error('initializeMindMapApp is not available. Check if app.js loaded correctly.');
        document.getElementById('mind-map-view-container').innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="text-center p-8">
                    <div class="text-red-500 text-xl mb-4">⚠️ App Loading Error</div>
                    <div class="text-gray-600">Mind map application could not initialize. Please check if app.js is available.</div>
                </div>
            </div>
        `;
    }
}
