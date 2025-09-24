function initializeMindMapApp(appConfig) {
    const {
        data,
        initialTab,
        theme = {},
        searchEnabled = true,
        storageKey = 'mindMapExpansionState'
    } = appConfig;

    // --- DOM Elements ---
    const elements = {
        tabBar: document.getElementById('tab-bar'),
        mindMapContainer: document.getElementById('mind-map-view-container'),
        searchInput: document.getElementById('search-input'),
        searchResultsContainer: document.getElementById('search-results-container'),
        clearSearchBtn: document.getElementById('clear-search'),
        zoomInBtn: document.getElementById('zoom-in'),
        zoomOutBtn: document.getElementById('zoom-out'),
        zoomResetBtn: document.getElementById('zoom-reset'),
        expandAllBtn: document.getElementById('expand-all'),
        collapseAllBtn: document.getElementById('collapse-all'),
    };

    // --- Critical: Validate container exists and has dimensions ---
    if (!elements.mindMapContainer) {
        console.error('Critical Error: mind-map-view-container not found');
        showError('Mind map container not found. Please check the page structure.');
        return;
    }

    // Ensure container has dimensions before D3 initialization
    function ensureContainerDimensions() {
        const rect = elements.mindMapContainer.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            // Force container to have minimum dimensions
            elements.mindMapContainer.style.width = elements.mindMapContainer.style.width || '800px';
            elements.mindMapContainer.style.height = elements.mindMapContainer.style.height || '600px';
            console.warn('Container had zero dimensions, applied fallback sizing');
        }
    }

    function showError(message) {
        if (elements.mindMapContainer) {
            elements.mindMapContainer.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center p-8">
                        <div class="text-red-500 text-xl mb-4">⚠️ Mind Map Error</div>
                        <div class="text-gray-600">${message}</div>
                        <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            Retry
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // --- Application State ---
    let state = {
        activeTab: initialTab || Object.keys(data)[0],
        activeRenderer: null,
        expansionState: {},
        searchTimeout: null,
    };

    // --- CORE FUNCTIONS ---
    function switchTab(tabName) {
        try {
            state.activeTab = tabName;
            
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            const mainTabId = `tab-${tabName.split('-')[0]}`;
            document.getElementById(mainTabId)?.classList.add('active');

            elements.mindMapContainer.innerHTML = '<div class="loading-indicator">Loading Interactive Map...</div>';
            
            setTimeout(() => {
                try {
                    elements.mindMapContainer.innerHTML = '';
                    const viewData = data[tabName];
                    
                    if (!viewData) {
                        showError(`No data found for tab: ${tabName}`);
                        return;
                    }

                    // Ensure container has proper dimensions
                    ensureContainerDimensions();
                    
                    // Check if MindMapRenderer is available
                    if (typeof MindMapRenderer !== 'function') {
                        showError('MindMapRenderer not loaded. Please check if d3-renderer.js loaded correctly.');
                        return;
                    }

                    state.activeRenderer = MindMapRenderer(elements.mindMapContainer, viewData, {
                        onNodeClick: saveCurrentExpansionState,
                        theme: theme
                    });
                    
                    if (!state.activeRenderer) {
                        showError('Failed to initialize mind map renderer. Container may have invalid dimensions.');
                        return;
                    }
                    
                    const savedState = state.expansionState[tabName];
                    if (savedState && state.activeRenderer.applyExpansionState) {
                        state.activeRenderer.applyExpansionState(savedState);
                    }
                } catch (error) {
                    console.error('Error in tab switch setTimeout:', error);
                    showError(`Failed to render mind map: ${error.message}`);
                }
                saveStateToLocalStorage();
            }, 10);
        } catch (error) {
            console.error('Error in switchTab:', error);
            showError(`Failed to switch tab: ${error.message}`);
        }
    }

    // --- STATE PERSISTENCE ---
    function loadStateFromLocalStorage() {
        const savedTab = localStorage.getItem(`${storageKey}_activeTab`);
        const savedExpansion = localStorage.getItem(`${storageKey}_expansionState`);
        
        state.activeTab = savedTab || initialTab || Object.keys(data)[0];
        state.expansionState = savedExpansion ? JSON.parse(savedExpansion) : {};
    }

    function saveStateToLocalStorage() {
        localStorage.setItem(`${storageKey}_activeTab`, state.activeTab);
        localStorage.setItem(`${storageKey}_expansionState`, JSON.stringify(state.expansionState));
    }

    function saveCurrentExpansionState() {
        if (state.activeRenderer) {
            state.expansionState[state.activeTab] = state.activeRenderer.getExpansionState();
            saveStateToLocalStorage();
        }
    }

    // --- GLOBAL SEARCH ---
    function handleSearch(query) {
        if (!query || query.length < 2) {
            clearSearchResults();
            return;
        }

        const lowerQuery = query.toLowerCase();
        let results = [];
        
        function findInNode(node, path, tabKey, tabDisplayName) {
            if (node.name.toLowerCase().includes(lowerQuery) || (node.tooltip && node.tooltip.content.toLowerCase().includes(lowerQuery))) {
                results.push({
                    name: node.name,
                    path: [...path, node.id],
                    tab: tabKey,
                    tabName: tabDisplayName
                });
            }
            if (node.children) {
                node.children.forEach(child => findInNode(child, [...path, node.id], tabKey, tabDisplayName));
            }
        }

        Object.entries(data).forEach(([tabKey, tabData]) => {
            const tabEl = document.querySelector(`.tab[data-tab="${tabKey}"], .dropdown-item[data-tab="${tabKey}"]`);
            const tabDisplayName = tabEl ? tabEl.textContent.trim().replace('▾','').trim() : tabKey;
            findInNode(tabData, [], tabKey, tabDisplayName);
        });

        renderSearchResults(results, query);
    }
    
    function renderSearchResults(results, query) {
        clearSearchResults();
        if (results.length === 0) return;

        const list = document.createElement('div');
        list.className = 'search-results-list';
        
        const regex = new RegExp(`(${query})`, 'gi');

        results.slice(0, 15).forEach(result => {
            const item = document.createElement('a');
            item.className = 'search-result-item';
            item.innerHTML = `
                <span class="match-text">${result.name.replace(regex, `<mark>$1</mark>`)}</span>
                <span class="tab-name">in ${result.tabName}</span>
            `;
            item.onclick = (e) => {
                e.preventDefault();
                navigateToNode(result.tab, result.path);
                clearSearchResults();
                elements.searchInput.value = result.name;
            };
            list.appendChild(item);
        });
        elements.searchResultsContainer.appendChild(list);
    }

    function clearSearchResults() {
        if (elements.searchResultsContainer) {
            elements.searchResultsContainer.innerHTML = '';
        }
    }

    function navigateToNode(tab, path) {
        if (state.activeTab !== tab) {
            switchTab(tab);
            setTimeout(() => {
                state.activeRenderer?.expandToNode(path);
            }, 200);
        } else {
            state.activeRenderer?.expandToNode(path);
        }
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        if (elements.tabBar) {
            elements.tabBar.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target;
                const dropdownItem = target.closest('.dropdown-item');
                const targetTab = target.closest('.tab');
                const treatmentTab = document.getElementById('tab-treatment');

                if (dropdownItem?.dataset.tab) {
                    switchTab(dropdownItem.dataset.tab);
                    if (treatmentTab) treatmentTab.classList.remove('dropdown-active');
                } else if (targetTab && targetTab.querySelector('.dropdown')) {
                    // Handle tabs with dropdowns
                    targetTab.classList.toggle('dropdown-active');
                    // Position the dropdown properly when using position: fixed
                    if (targetTab.classList.contains('dropdown-active')) {
                        const dropdown = targetTab.querySelector('.dropdown');
                        if (dropdown) {
                            const tabRect = targetTab.getBoundingClientRect();
                            dropdown.style.top = (tabRect.bottom) + 'px';
                            dropdown.style.left = tabRect.left + 'px';
                        }
                    }
                } else if (targetTab?.dataset.tab) {
                    switchTab(targetTab.dataset.tab);
                }
            });
        }

        window.addEventListener('click', (e) => {
            // Close any open dropdown tabs when clicking outside
            document.querySelectorAll('.tab.dropdown-active').forEach(tab => {
                if (!tab.contains(e.target)) {
                    tab.classList.remove('dropdown-active');
                }
            });
            if (elements.searchResultsContainer && !elements.searchResultsContainer.contains(e.target) && e.target !== elements.searchInput) {
                 clearSearchResults();
            }
        });
        
        if (searchEnabled && elements.searchInput) {
            elements.searchInput.addEventListener('input', (e) => {
                clearTimeout(state.searchTimeout);
                state.searchTimeout = setTimeout(() => handleSearch(e.target.value), 300);
            });
            elements.clearSearchBtn.addEventListener('click', () => {
                elements.searchInput.value = '';
                clearSearchResults();
            });
        } else if (elements.searchInput) {
            elements.searchInput.parentElement.style.display = 'none';
        }

        if (elements.zoomInBtn) elements.zoomInBtn.addEventListener('click', () => state.activeRenderer?.svg.transition().call(state.activeRenderer.zoom.scaleBy, 1.2));
        if (elements.zoomOutBtn) elements.zoomOutBtn.addEventListener('click', () => state.activeRenderer?.svg.transition().call(state.activeRenderer.zoom.scaleBy, 0.8));
        if (elements.zoomResetBtn) elements.zoomResetBtn.addEventListener('click', () => state.activeRenderer?.svg.transition().call(state.activeRenderer.zoom.transform, d3.zoomIdentity));
        if (elements.expandAllBtn) elements.expandAllBtn.addEventListener('click', () => {
            state.activeRenderer?.expandAll();
            saveCurrentExpansionState();
        });
        if (elements.collapseAllBtn) elements.collapseAllBtn.addEventListener('click', () => {
            state.activeRenderer?.collapseAll();
            saveCurrentExpansionState();
        });
    }

    // --- INITIALIZATION ---
    function init() {
        loadStateFromLocalStorage();
        setupEventListeners();
        switchTab(state.activeTab);
    }

    init();
}