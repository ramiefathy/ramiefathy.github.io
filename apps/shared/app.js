function initializeMindMapApp(appConfig) {
    const {
        data,
        initialTab,
        theme = {},
        searchEnabled = true,
        storageKey = 'mindMapExpansionState'
    } = appConfig;

    // --- Color Theme Presets ---
    const COLOR_THEMES = {
        default: {
            name: 'Default Blue',
            nodes: ['#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff', '#f8fafc'],
            collapsible: '#1d4ed8',
            background: '#f8fafc'
        },
        forest: {
            name: 'Forest Green',
            nodes: ['#86efac', '#bbf7d0', '#dcfce7', '#f0fdf4', '#fafaf9'],
            collapsible: '#15803d',
            background: '#f0fdf4'
        },
        sunset: {
            name: 'Sunset Orange',
            nodes: ['#fdba74', '#fed7aa', '#ffedd5', '#fff7ed', '#fefefe'],
            collapsible: '#c2410c',
            background: '#fff7ed'
        },
        lavender: {
            name: 'Lavender Purple',
            nodes: ['#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff', '#fefefe'],
            collapsible: '#7c3aed',
            background: '#f5f3ff'
        },
        ocean: {
            name: 'Ocean Teal',
            nodes: ['#5eead4', '#99f6e4', '#ccfbf1', '#f0fdfa', '#fafafa'],
            collapsible: '#0f766e',
            background: '#f0fdfa'
        },
        dark: {
            name: 'Dark Mode',
            nodes: ['#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'],
            collapsible: '#3b82f6',
            background: '#1e293b'
        }
    };

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
        bookmarks: [],
        currentTheme: 'default',
    };

    // --- BOOKMARKS FUNCTIONALITY ---
    function loadBookmarks() {
        try {
            const saved = localStorage.getItem(`${storageKey}_bookmarks`);
            state.bookmarks = saved ? JSON.parse(saved) : [];
        } catch (e) {
            state.bookmarks = [];
        }
    }

    function saveBookmarks() {
        localStorage.setItem(`${storageKey}_bookmarks`, JSON.stringify(state.bookmarks));
        renderBookmarksUI();
    }

    function addBookmark(nodeName, tabKey, path) {
        const bookmark = {
            id: Date.now().toString(),
            name: nodeName,
            tab: tabKey,
            path: path,
            createdAt: new Date().toISOString()
        };

        // Check for duplicates
        const exists = state.bookmarks.some(b => b.name === nodeName && b.tab === tabKey);
        if (!exists) {
            state.bookmarks.push(bookmark);
            saveBookmarks();
            showNotification(`Bookmarked: ${nodeName}`);
        } else {
            showNotification('Already bookmarked');
        }
    }

    function removeBookmark(bookmarkId) {
        state.bookmarks = state.bookmarks.filter(b => b.id !== bookmarkId);
        saveBookmarks();
    }

    function renderBookmarksUI() {
        let bookmarksPanel = document.getElementById('bookmarks-panel');
        if (!bookmarksPanel) return;

        if (state.bookmarks.length === 0) {
            bookmarksPanel.innerHTML = '<p class="text-slate-500 text-sm p-2">No bookmarks yet. Click the star icon on nodes to bookmark them.</p>';
            return;
        }

        bookmarksPanel.innerHTML = state.bookmarks.map(b => `
            <div class="bookmark-item flex items-center justify-between p-2 hover:bg-slate-100 rounded cursor-pointer" data-bookmark-id="${b.id}">
                <span class="bookmark-name text-sm truncate flex-1" title="${b.name}">${b.name}</span>
                <button class="remove-bookmark text-slate-400 hover:text-red-500 ml-2" data-id="${b.id}">×</button>
            </div>
        `).join('');

        // Add event listeners
        bookmarksPanel.querySelectorAll('.bookmark-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('remove-bookmark')) {
                    const bookmark = state.bookmarks.find(b => b.id === item.dataset.bookmarkId);
                    if (bookmark) {
                        navigateToNode(bookmark.tab, bookmark.path);
                    }
                }
            });
        });

        bookmarksPanel.querySelectorAll('.remove-bookmark').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeBookmark(btn.dataset.id);
            });
        });
    }

    // --- COLOR THEME FUNCTIONALITY ---
    function loadTheme() {
        const saved = localStorage.getItem(`${storageKey}_theme`);
        state.currentTheme = saved && COLOR_THEMES[saved] ? saved : 'default';
        applyTheme(state.currentTheme);
    }

    function applyTheme(themeKey) {
        const themeConfig = COLOR_THEMES[themeKey];
        if (!themeConfig) return;

        state.currentTheme = themeKey;
        localStorage.setItem(`${storageKey}_theme`, themeKey);

        // Apply background color
        document.body.style.backgroundColor = themeConfig.background;

        // Update theme config for renderer
        if (theme.colors) {
            theme.colors.nodes = themeConfig.nodes;
            theme.colors.collapsible = themeConfig.collapsible;
        }

        // Re-render if already active
        if (state.activeRenderer) {
            switchTab(state.activeTab);
        }

        // Update theme picker UI
        document.querySelectorAll('.theme-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.theme === themeKey);
        });
    }

    function renderThemePicker() {
        let themePicker = document.getElementById('theme-picker');
        if (!themePicker) return;

        themePicker.innerHTML = Object.entries(COLOR_THEMES).map(([key, config]) => `
            <button class="theme-option ${key === state.currentTheme ? 'active' : ''}"
                    data-theme="${key}"
                    title="${config.name}"
                    style="background: linear-gradient(135deg, ${config.nodes[0]}, ${config.nodes[2]});">
            </button>
        `).join('');

        themePicker.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
        });
    }

    // --- EXPORT FUNCTIONALITY ---
    function exportAsSVG() {
        const svg = elements.mindMapContainer.querySelector('svg');
        if (!svg) {
            showNotification('No mind map to export');
            return;
        }

        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        downloadBlob(blob, `mindmap-${state.activeTab}.svg`);
        showNotification('SVG exported successfully');
    }

    function exportAsPNG() {
        const svg = elements.mindMapContainer.querySelector('svg');
        if (!svg) {
            showNotification('No mind map to export');
            return;
        }

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        const svgRect = svg.getBoundingClientRect();
        canvas.width = svgRect.width * 2;
        canvas.height = svgRect.height * 2;

        img.onload = function() {
            ctx.fillStyle = COLOR_THEMES[state.currentTheme]?.background || '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                downloadBlob(blob, `mindmap-${state.activeTab}.png`);
                showNotification('PNG exported successfully');
            }, 'image/png');
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }

    function exportAsJSON() {
        const exportData = {
            tab: state.activeTab,
            data: data[state.activeTab],
            expansionState: state.expansionState[state.activeTab],
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `mindmap-${state.activeTab}.json`);
        showNotification('JSON exported successfully');
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function showNotification(message) {
        let notification = document.getElementById('mindmap-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'mindmap-notification';
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #1e293b;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.style.opacity = '1';

        setTimeout(() => {
            notification.style.opacity = '0';
        }, 2500);
    }

    // --- ENHANCED UI: Create toolbar ---
    function createEnhancedToolbar() {
        const container = elements.mindMapContainer.parentElement;
        if (!container) return;

        // Check if toolbar already exists
        if (document.getElementById('mindmap-toolbar')) return;

        const toolbar = document.createElement('div');
        toolbar.id = 'mindmap-toolbar';
        toolbar.className = 'flex items-center justify-between gap-4 p-2 bg-white border-b border-slate-200 rounded-t-xl';
        toolbar.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-slate-600">Theme:</span>
                <div id="theme-picker" class="flex gap-1"></div>
            </div>
            <div class="flex items-center gap-2">
                <button id="toggle-bookmarks" class="px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition" title="Show Bookmarks">
                    ⭐ Bookmarks
                </button>
                <div class="relative">
                    <button id="export-menu-btn" class="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition">
                        📥 Export
                    </button>
                    <div id="export-menu" class="hidden absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[120px]">
                        <button id="export-svg" class="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50">SVG</button>
                        <button id="export-png" class="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50">PNG</button>
                        <button id="export-json" class="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50">JSON</button>
                    </div>
                </div>
            </div>
        `;

        // Insert toolbar before the mind map container
        container.insertBefore(toolbar, elements.mindMapContainer);

        // Create bookmarks panel (initially hidden)
        const bookmarksPanel = document.createElement('div');
        bookmarksPanel.id = 'bookmarks-panel';
        bookmarksPanel.className = 'hidden absolute left-4 top-16 bg-white border border-slate-200 rounded-lg shadow-lg z-40 w-64 max-h-80 overflow-y-auto';
        bookmarksPanel.style.display = 'none';
        container.style.position = 'relative';
        container.appendChild(bookmarksPanel);

        // Setup toolbar event listeners
        setupToolbarEvents();
    }

    function setupToolbarEvents() {
        const toggleBookmarks = document.getElementById('toggle-bookmarks');
        const bookmarksPanel = document.getElementById('bookmarks-panel');
        const exportMenuBtn = document.getElementById('export-menu-btn');
        const exportMenu = document.getElementById('export-menu');

        if (toggleBookmarks && bookmarksPanel) {
            toggleBookmarks.addEventListener('click', () => {
                const isHidden = bookmarksPanel.style.display === 'none';
                bookmarksPanel.style.display = isHidden ? 'block' : 'none';
                renderBookmarksUI();
            });
        }

        if (exportMenuBtn && exportMenu) {
            exportMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                exportMenu.classList.toggle('hidden');
            });

            document.addEventListener('click', () => {
                exportMenu.classList.add('hidden');
            });

            document.getElementById('export-svg')?.addEventListener('click', exportAsSVG);
            document.getElementById('export-png')?.addEventListener('click', exportAsPNG);
            document.getElementById('export-json')?.addEventListener('click', exportAsJSON);
        }

        renderThemePicker();
    }

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
        loadBookmarks();
        createEnhancedToolbar();
        loadTheme();
        setupEventListeners();
        switchTab(state.activeTab);
    }

    // Expose addBookmark function for external use (e.g., from node context menu)
    window.mindMapAddBookmark = addBookmark;

    init();
}