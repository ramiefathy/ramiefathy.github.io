// js/app.js - Psoriasis Mind Maps

document.addEventListener('DOMContentLoaded', () => {
    function safeParseJson(rawValue, fallbackValue) {
        if (!rawValue) return fallbackValue;
        try {
            return JSON.parse(rawValue);
        } catch (error) {
            console.warn('Failed to parse stored JSON payload, using fallback.', error);
            return fallbackValue;
        }
    }

    function escapeRegExp(value) {
        return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // --- DOM Elements ---
    const elements = {
        tabBar: document.getElementById('tab-bar'),
        treatmentTab: document.getElementById('tab-treatment'),
        mindMapContainer: document.getElementById('mind-map-view-container'),
        searchInput: document.getElementById('search-input'),
        searchResultsContainer: document.getElementById('search-results-container'),
        searchNextBtn: document.getElementById('search-next'),
        searchPrevBtn: document.getElementById('search-prev'),
        clearSearchBtn: document.getElementById('clear-search'),
        zoomInBtn: document.getElementById('zoom-in'),
        zoomOutBtn: document.getElementById('zoom-out'),
        zoomResetBtn: document.getElementById('zoom-reset'),
        fitScreenBtn: document.getElementById('fit-screen'),
        expandAllBtn: document.getElementById('expand-all'),
        collapseAllBtn: document.getElementById('collapse-all'),
        selectedNodeTitle: document.getElementById('selected-node-title'),
        selectedNodeContent: document.getElementById('selected-node-content'),
        selectedNodeBreadcrumb: document.getElementById('selected-node-breadcrumb')
    };

    // --- Application State ---
    let state = {
        activeTab: 'patho',
        activeRenderer: null,
        expansionState: {},
        searchTimeout: null,
        searchResults: [],
        activeSearchIndex: -1
    };

    // --- CORE FUNCTIONS ---

    function switchTab(tabName) {
        state.activeTab = tabName;

        // Update tab UI
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        const mainTabId = `tab-${tabName.startsWith('treatment') ? 'treatment' : tabName}`;
        document.getElementById(mainTabId)?.classList.add('active');

        // Clear container and show loading
        elements.mindMapContainer.innerHTML = '<div class="loading-indicator">Loading Interactive Map...</div>';

        setTimeout(() => {
            elements.mindMapContainer.innerHTML = '';
            const data = mindMapData[tabName];
            if (data) {
                state.activeRenderer = MindMapRenderer(elements.mindMapContainer, data, {
                    onNodeClick: saveCurrentExpansionState,
                    onNodeSelect: renderSelectedNode
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
        const savedTab = localStorage.getItem('psoriasisMap_activeTab');
        const savedExpansion = localStorage.getItem('psoriasisMap_expansionState');

        state.activeTab = savedTab || 'patho';
        state.expansionState = safeParseJson(savedExpansion, {});
    }

    function saveStateToLocalStorage() {
        localStorage.setItem('psoriasisMap_activeTab', state.activeTab);
        localStorage.setItem('psoriasisMap_expansionState', JSON.stringify(state.expansionState));
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
        state.searchResults = results.slice(0, 15);
        state.activeSearchIndex = state.searchResults.length ? 0 : -1;
        if (state.searchResults.length === 0) {
            updateSearchNavigation();
            return;
        }

        const list = document.createElement('div');
        list.className = 'search-results-list';
        list.setAttribute('role', 'listbox');

        const escapedQuery = escapeRegExp(query);
        const regex = new RegExp(`(${escapedQuery})`, 'gi');

        state.searchResults.forEach((result, index) => {
            const item = document.createElement('a');
            item.className = 'search-result-item';
            item.setAttribute('role', 'option');
            item.dataset.searchIndex = String(index);
            if (index === state.activeSearchIndex) {
                item.classList.add('search-result-item-active');
            }
            item.innerHTML = `
                <span class="match-text">${result.name.replace(regex, `<mark>$1</mark>`)}</span>
                <span class="tab-name">in ${result.tabName}</span>
            `;
            item.onclick = (e) => {
                e.preventDefault();
                activateSearchResult(index, true);
                clearSearchResults();
                elements.searchInput.value = result.name;
            };
            list.appendChild(item);
        });
        elements.searchResultsContainer.appendChild(list);
        updateSearchNavigation();
    }

    function clearSearchResults() {
        elements.searchResultsContainer.innerHTML = '';
        state.searchResults = [];
        state.activeSearchIndex = -1;
        updateSearchNavigation();
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

    function renderSelectedNode(node) {
        if (!node) return;
        if (elements.selectedNodeTitle) {
            elements.selectedNodeTitle.textContent = node.name || 'Selected node';
        }
        if (elements.selectedNodeContent) {
            const content = String(node.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            elements.selectedNodeContent.textContent = content || 'No details available for this node.';
        }
        if (elements.selectedNodeBreadcrumb) {
            elements.selectedNodeBreadcrumb.textContent = Array.isArray(node.breadcrumb) ? node.breadcrumb.join(' › ') : '';
        }
    }

    function updateSearchNavigation() {
        const hasResults = state.searchResults.length > 0;
        if (elements.searchNextBtn) elements.searchNextBtn.disabled = !hasResults;
        if (elements.searchPrevBtn) elements.searchPrevBtn.disabled = !hasResults;
    }

    function activateSearchResult(index, navigate = false) {
        if (!state.searchResults.length) return;
        const normalized = (index + state.searchResults.length) % state.searchResults.length;
        state.activeSearchIndex = normalized;
        const result = state.searchResults[normalized];
        const optionNodes = elements.searchResultsContainer.querySelectorAll('.search-result-item');
        optionNodes.forEach((node) => node.classList.remove('search-result-item-active'));
        const activeNode = elements.searchResultsContainer.querySelector(`.search-result-item[data-search-index="${normalized}"]`);
        activeNode?.classList.add('search-result-item-active');
        activeNode?.scrollIntoView({ block: 'nearest' });
        if (navigate && result) {
            navigateToNode(result.tab, result.path);
            elements.searchInput.value = result.name;
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
                elements.treatmentTab?.classList.remove('dropdown-active');
            } else if (targetTab && targetTab.id === 'tab-treatment') {
                targetTab.classList.toggle('dropdown-active');
            } else if (targetTab?.dataset.tab) {
                switchTab(targetTab.dataset.tab);
            }
        });

        // Close dropdowns on outside click
        window.addEventListener('click', (e) => {
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
        elements.searchInput.addEventListener('keydown', (e) => {
            if (!state.searchResults.length) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activateSearchResult(state.activeSearchIndex + 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activateSearchResult(state.activeSearchIndex - 1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                activateSearchResult(state.activeSearchIndex, true);
            } else if (e.key === 'Escape') {
                clearSearchResults();
            }
        });
        elements.clearSearchBtn.addEventListener('click', () => {
            elements.searchInput.value = '';
            clearSearchResults();
        });
        elements.searchNextBtn?.addEventListener('click', () => activateSearchResult(state.activeSearchIndex + 1, true));
        elements.searchPrevBtn?.addEventListener('click', () => activateSearchResult(state.activeSearchIndex - 1, true));

        // Zoom and view controls
        elements.zoomInBtn.addEventListener('click', () => state.activeRenderer?.svg.transition().call(state.activeRenderer.zoom.scaleBy, 1.2));
        elements.zoomOutBtn.addEventListener('click', () => state.activeRenderer?.svg.transition().call(state.activeRenderer.zoom.scaleBy, 0.8));
        elements.zoomResetBtn.addEventListener('click', () => state.activeRenderer?.svg.transition().call(state.activeRenderer.zoom.transform, d3.zoomIdentity));
        elements.fitScreenBtn?.addEventListener('click', () => state.activeRenderer?.fitToScreen());
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
        window.LegacyGuidance?.maybeShow('mindmap-psoriasis', [
            'Use search to jump to pathway and therapy nodes.',
            'Use Prev/Next to move through matched nodes.',
            'Selected Node keeps details pinned as you navigate.',
            'Use Fit to Screen to recentre the map quickly.'
        ]);
        loadStateFromLocalStorage();
        setupEventListeners();
        switchTab(state.activeTab);
    }

    init();
});
