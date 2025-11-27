// js/app.js - CTCL Mind Maps

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const elements = {
        tabBar: document.getElementById('tab-bar'),
        subtypesTab: document.getElementById('tab-subtypes'),
        treatmentTab: document.getElementById('tab-treatment'),
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

    // --- Application State ---
    let state = {
        activeTab: 'question',
        activeRenderer: null,
        expansionState: {},
        searchTimeout: null,
    };

    // --- CORE FUNCTIONS ---

    function switchTab(tabName) {
        state.activeTab = tabName;

        // Update tab UI
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        let mainTabId;
        if (tabName.startsWith('subtypes')) {
            mainTabId = 'tab-subtypes';
        } else if (tabName.startsWith('treatment')) {
            mainTabId = 'tab-treatment';
        } else {
            mainTabId = `tab-${tabName}`;
        }
        document.getElementById(mainTabId)?.classList.add('active');

        // Clear container and show loading
        elements.mindMapContainer.innerHTML = '<div class="loading-indicator">Loading Interactive Map...</div>';

        setTimeout(() => {
            elements.mindMapContainer.innerHTML = '';
            const data = mindMapData[tabName];
            if (data) {
                state.activeRenderer = MindMapRenderer(elements.mindMapContainer, data, {
                    onNodeClick: saveCurrentExpansionState
                });

                const savedState = state.expansionState[tabName];
                if (savedState) {
                    state.activeRenderer.applyExpansionState(savedState);
                }
            }
            saveStateToLocalStorage();
        }, 10);
    }

    // --- STATE PERSISTENCE ---

    function loadStateFromLocalStorage() {
        const savedTab = localStorage.getItem('ctclMap_activeTab');
        const savedExpansion = localStorage.getItem('ctclMap_expansionState');

        state.activeTab = savedTab || 'question';
        state.expansionState = savedExpansion ? JSON.parse(savedExpansion) : {};
    }

    function saveStateToLocalStorage() {
        localStorage.setItem('ctclMap_activeTab', state.activeTab);
        localStorage.setItem('ctclMap_expansionState', JSON.stringify(state.expansionState));
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

        Object.entries(mindMapData).forEach(([tabKey, data]) => {
            const tabEl = document.querySelector(`.tab[data-tab="${tabKey}"], .dropdown-item[data-tab="${tabKey}"]`);
            const tabDisplayName = tabEl ? tabEl.textContent.trim().replace('▾','').trim() : tabKey;
            findInNode(data, [], tabKey, tabDisplayName);
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
        elements.searchResultsContainer.innerHTML = '';
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
        // Tab navigation
        elements.tabBar.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target;
            const dropdownItem = target.closest('.dropdown-item');
            const targetTab = target.closest('.tab');

            if (dropdownItem?.dataset.tab) {
                switchTab(dropdownItem.dataset.tab);
                elements.subtypesTab?.classList.remove('dropdown-active');
                elements.treatmentTab?.classList.remove('dropdown-active');
            } else if (targetTab && targetTab.id === 'tab-subtypes') {
                targetTab.classList.toggle('dropdown-active');
                elements.treatmentTab?.classList.remove('dropdown-active');
            } else if (targetTab && targetTab.id === 'tab-treatment') {
                targetTab.classList.toggle('dropdown-active');
                elements.subtypesTab?.classList.remove('dropdown-active');
            } else if (targetTab?.dataset.tab) {
                switchTab(targetTab.dataset.tab);
            }
        });

        // Close dropdowns on outside click
        window.addEventListener('click', (e) => {
            if (elements.subtypesTab && !elements.subtypesTab.contains(e.target)) {
                elements.subtypesTab.classList.remove('dropdown-active');
            }
            if (elements.treatmentTab && !elements.treatmentTab.contains(e.target)) {
                elements.treatmentTab.classList.remove('dropdown-active');
            }
            if (elements.searchResultsContainer && !elements.searchResultsContainer.contains(e.target) && e.target !== elements.searchInput) {
                 clearSearchResults();
            }
        });

        // Search
        elements.searchInput.addEventListener('input', (e) => {
            clearTimeout(state.searchTimeout);
            state.searchTimeout = setTimeout(() => handleSearch(e.target.value), 300);
        });
        elements.clearSearchBtn.addEventListener('click', () => {
            elements.searchInput.value = '';
            clearSearchResults();
        });

        // Zoom and view controls
        elements.zoomInBtn.addEventListener('click', () => state.activeRenderer?.svg.transition().call(state.activeRenderer.zoom.scaleBy, 1.2));
        elements.zoomOutBtn.addEventListener('click', () => state.activeRenderer?.svg.transition().call(state.activeRenderer.zoom.scaleBy, 0.8));
        elements.zoomResetBtn.addEventListener('click', () => state.activeRenderer?.svg.transition().call(state.activeRenderer.zoom.transform, d3.zoomIdentity));
        elements.expandAllBtn.addEventListener('click', () => {
            state.activeRenderer?.expandAll();
            saveCurrentExpansionState();
        });
        elements.collapseAllBtn.addEventListener('click', () => {
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
});
