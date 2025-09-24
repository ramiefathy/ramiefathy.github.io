// CRITICAL FIXES FOR PRURITUS MINDMAP
// These fixes address the most serious bugs discovered in the UI/UX review

// FIX 1: Implement renderer caching to prevent memory leaks and improve performance
const rendererCache = new Map();
const searchListenerCleanup = new WeakMap();

// FIX 2: Enhanced switchTab with caching
function enhancedSwitchTab(tabName) {
    // Clear any existing search results listeners
    const resultsContainer = document.getElementById('search-results-container');
    if (searchListenerCleanup.has(resultsContainer)) {
        const cleanupFn = searchListenerCleanup.get(resultsContainer);
        cleanupFn();
    }
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.mind-map-view').forEach(v => {
        v.classList.remove('active');
        // Hide instead of destroying
        v.style.display = 'none';
    });
    
    const mainTabId = `tab-${tabName}`;
    const mainTabEl = document.getElementById(mainTabId);
    if (mainTabEl) mainTabEl.classList.add('active');

    const viewId = `view-${tabName}`;
    const view = document.getElementById(viewId);
    
    if (view) {
        view.classList.add('active');
        view.style.display = 'block';
        
        // Check cache first
        if (rendererCache.has(tabName)) {
            // Restore cached renderer
            const cachedRenderer = rendererCache.get(tabName);
            currentRenderer = cachedRenderer;
            console.log(`Restored cached renderer for ${tabName}`);
        } else {
            // Create new renderer with error handling
            view.innerHTML = '<div class="loading-indicator">Loading Interactive Map...</div>';
            
            // Use Promise for better async handling
            new Promise((resolve) => {
                setTimeout(() => {
                    try {
                        let data;
                        if (mindMapData[tabName]) {
                            data = mindMapData[tabName];
                        } else if (tabName === 'approach' && mindMapData.name) {
                            data = mindMapData;
                        } else {
                            throw new Error(`Data not found for tab: ${tabName}`);
                        }
                        
                        view.innerHTML = '';
                        const renderer = MindMapRenderer(view, data);
                        
                        // Cache the renderer
                        rendererCache.set(tabName, renderer);
                        view.rendererInstance = renderer;
                        currentRenderer = renderer;
                        
                        resolve(renderer);
                    } catch (error) {
                        console.error(`Error loading tab ${tabName}:`, error);
                        view.innerHTML = `
                            <div class="error-state p-8 text-center">
                                <svg class="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <h3 class="text-lg font-semibold text-gray-900 mb-2">Unable to Load View</h3>
                                <p class="text-gray-600">${error.message}</p>
                                <button onclick="enhancedSwitchTab('${tabName}')" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                    Try Again
                                </button>
                            </div>
                        `;
                        resolve(null);
                    }
                }, 10);
            });
        }
    }
}

// FIX 3: Enhanced search with proper cleanup
function enhancedSearchHandler(searchInput, searchResultsContainer, clearSearchBtn) {
    let searchTimer;
    let currentListeners = [];
    
    // Cleanup function
    const cleanup = () => {
        currentListeners.forEach(({ element, handler }) => {
            element.removeEventListener('click', handler);
        });
        currentListeners = [];
    };
    
    // Store cleanup function
    searchListenerCleanup.set(searchResultsContainer, cleanup);
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        const searchTerm = e.target.value.trim();
        
        // Always cleanup previous listeners
        cleanup();
        
        searchTimer = setTimeout(() => {
            if (currentRenderer) {
                try {
                    const matches = currentRenderer.search(searchTerm);
                    
                    if (searchTerm.length >= 2 && matches.length > 0) {
                        let resultsHTML = '<div class="bg-white rounded-lg shadow-lg border border-slate-200 max-h-60 overflow-y-auto">';
                        resultsHTML += `<div class="px-3 py-2 text-sm text-slate-600 border-b">Found ${matches.length} result${matches.length > 1 ? 's' : ''}</div>`;
                        resultsHTML += '<div class="py-1">';
                        
                        matches.slice(0, 10).forEach((match, index) => {
                            const path = [];
                            let current = match;
                            while (current) {
                                path.unshift(current.data.name);
                                current = current.parent;
                            }
                            resultsHTML += `<div class="search-result-item px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm" data-index="${index}">`;
                            resultsHTML += `<div class="font-medium text-slate-800">${match.data.name}</div>`;
                            if (path.length > 1) {
                                resultsHTML += `<div class="text-xs text-slate-500">${path.slice(0, -1).join(' → ')}</div>`;
                            }
                            resultsHTML += '</div>';
                        });
                        
                        if (matches.length > 10) {
                            resultsHTML += `<div class="px-3 py-2 text-xs text-slate-500 border-t">...and ${matches.length - 10} more</div>`;
                        }
                        
                        resultsHTML += '</div></div>';
                        searchResultsContainer.innerHTML = resultsHTML;
                        searchResultsContainer.style.display = 'block';
                        
                        // Add NEW click handlers with proper cleanup tracking
                        searchResultsContainer.querySelectorAll('.search-result-item').forEach((el) => {
                            const index = parseInt(el.dataset.index);
                            const handler = () => {
                                try {
                                    let node = matches[index];
                                    const nodesToExpand = [];
                                    while (node.parent) {
                                        nodesToExpand.push(node.parent);
                                        node = node.parent;
                                    }
                                    nodesToExpand.reverse().forEach(n => {
                                        if (n._children) {
                                            n.children = n._children;
                                            n._children = null;
                                        }
                                    });
                                    
                                    const activeView = document.querySelector('.mind-map-view.active');
                                    if (activeView) {
                                        const activeTabName = activeView.id.replace('view-', '');
                                        // Force re-render to show expanded path
                                        if (currentRenderer && currentRenderer.getRoot) {
                                            currentRenderer.getRoot().descendants().forEach(d => {
                                                d.x0 = d.x;
                                                d.y0 = d.y;
                                            });
                                            // Trigger update through the renderer
                                            const root = currentRenderer.getRoot();
                                            if (root && root.children) {
                                                currentRenderer.expandAll();
                                                setTimeout(() => currentRenderer.collapseAll(), 100);
                                                setTimeout(() => {
                                                    nodesToExpand.forEach(n => {
                                                        if (n._children) {
                                                            n.children = n._children;
                                                            n._children = null;
                                                        }
                                                    });
                                                }, 200);
                                            }
                                        }
                                    }
                                    searchResultsContainer.style.display = 'none';
                                } catch (error) {
                                    console.error('Error navigating to search result:', error);
                                }
                            };
                            
                            el.addEventListener('click', handler);
                            currentListeners.push({ element: el, handler });
                        });
                    } else {
                        searchResultsContainer.style.display = 'none';
                    }
                } catch (error) {
                    console.error('Search error:', error);
                    searchResultsContainer.innerHTML = `
                        <div class="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                            Search error: ${error.message}
                        </div>
                    `;
                }
            } else {
                searchResultsContainer.style.display = 'none';
            }
        }, 300);
    });
    
    // Clear search with cleanup
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchResultsContainer.style.display = 'none';
        cleanup();
        if (currentRenderer) {
            currentRenderer.search('');
        }
    });
}

// FIX 4: Add performance monitoring
const performanceMonitor = {
    metrics: new Map(),
    
    start(label) {
        this.metrics.set(label, performance.now());
    },
    
    end(label) {
        if (this.metrics.has(label)) {
            const duration = performance.now() - this.metrics.get(label);
            console.log(`Performance [${label}]: ${duration.toFixed(2)}ms`);
            this.metrics.delete(label);
            return duration;
        }
        return 0;
    },
    
    measure(label, fn) {
        this.start(label);
        const result = fn();
        this.end(label);
        return result;
    }
};

// FIX 5: Add loading states manager
const loadingStates = {
    show(container, message = 'Loading...') {
        const loadingHTML = `
            <div class="loading-state flex flex-col items-center justify-center p-8">
                <div class="loading-spinner w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                <p class="mt-4 text-gray-600">${message}</p>
            </div>
        `;
        container.innerHTML = loadingHTML;
    },
    
    hide(container) {
        const loadingElement = container.querySelector('.loading-state');
        if (loadingElement) {
            loadingElement.remove();
        }
    },
    
    error(container, error) {
        const errorHTML = `
            <div class="error-state p-8 text-center">
                <svg class="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Error</h3>
                <p class="text-gray-600">${error.message || error}</p>
            </div>
        `;
        container.innerHTML = errorHTML;
    }
};

// Add CSS for loading spinner if not present
if (!document.querySelector('#critical-fixes-styles')) {
    const style = document.createElement('style');
    style.id = 'critical-fixes-styles';
    style.innerHTML = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .animate-spin {
            animation: spin 1s linear infinite;
        }
        .error-state, .loading-state {
            min-height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    `;
    document.head.appendChild(style);
}

console.log('🔧 Critical fixes loaded for Pruritus MindMap');
console.log('Features added:');
console.log('  ✅ Renderer caching');
console.log('  ✅ Memory leak prevention');
console.log('  ✅ Error handling');
console.log('  ✅ Performance monitoring');
console.log('  ✅ Loading states');

// Export for use
window.PruritusFixes = {
    enhancedSwitchTab,
    enhancedSearchHandler,
    performanceMonitor,
    loadingStates,
    rendererCache
};