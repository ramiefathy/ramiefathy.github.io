const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Code Review and Improvements
const codeReview = {
  performance: [
    '1. Debounce/throttle resize handler - already implemented (good)',
    '2. Use requestAnimationFrame for animations instead of setTimeout',
    '3. Memoize expensive calculations like node positions',
    '4. Consider virtual rendering for very large trees',
    '5. Remove console.log from production code'
  ],
  
  codeQuality: [
    '1. Extract magic numbers into named constants',
    '2. Create a configuration object for customizable settings',
    '3. Add error handling for missing data',
    '4. Modularize the code into smaller functions',
    '5. Add JSDoc comments for better documentation'
  ],
  
  accessibility: [
    '1. Add keyboard navigation support',
    '2. Add ARIA labels for screen readers',
    '3. Ensure sufficient color contrast',
    '4. Add focus indicators',
    '5. Support reduced motion preferences'
  ],
  
  userExperience: [
    '1. Add loading states with progress indicators',
    '2. Add search/filter functionality',
    '3. Add breadcrumb navigation',
    '4. Add zoom controls',
    '5. Add expand/collapse all buttons'
  ]
};

console.log('=== CODE REVIEW SUMMARY ===\n');
Object.entries(codeReview).forEach(([category, items]) => {
  console.log(`${category.toUpperCase()}:`);
  items.forEach(item => console.log(`  ${item}`));
  console.log();
});

// Now let's implement the improvements
(async () => {
  console.log('=== IMPLEMENTING IMPROVEMENTS ===\n');
  
  // Read the current HTML
  let html = fs.readFileSync('/Users/ramiefathy/Desktop/WebApps/CTCLMindMaps.html', 'utf8');
  
  // Improvement 1: Remove console.log from production
  html = html.replace(/console\.log\([^)]*\);/g, '// Console log removed for production');
  
  // Improvement 2: Add configuration object
  const configObject = `
            // Configuration object for customizable settings
            const CONFIG = {
                animation: {
                    duration: 500,
                    easing: 'ease-in-out'
                },
                sizing: {
                    mobile: {
                        breakpoint: 768,
                        scaleFactor: 0.85,
                        minRadius: 12,
                        minFont: 5
                    },
                    desktop: {
                        minRadius: 15,
                        minFont: 6
                    }
                },
                separation: {
                    base: 2.0,
                    siblingMultiplier: 1.5,
                    nonSiblingMultiplier: 2.5,
                    childrenFactor: 1.5
                },
                colors: {
                    nodes: ['#a5b4fc', '#c7d2fe', '#e0e7ff', '#eef2ff', '#f9fafb'],
                    links: '#cbd5e1',
                    nodeStroke: '#4338ca',
                    collapsible: '#312e81'
                },
                debounce: {
                    resize: 250,
                    search: 300
                }
            };
`;
  
  // Insert config after the data structures
  const insertPoint = '            const tooltip = document.getElementById(\'tooltip\');';
  html = html.replace(insertPoint, configObject + '\n' + insertPoint);
  
  // Improvement 3: Add search functionality
  const searchHTML = `
    <div class="w-full max-w-6xl mb-4">
        <input type="text" id="search-input" placeholder="Search nodes..." 
               class="w-full max-w-md mx-auto block px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
    </div>`;
  
  // Insert search box after the title
  html = html.replace(
    '</div>\n\n    <div class="w-full max-w-6xl">',
    '</div>\n' + searchHTML + '\n    <div class="w-full max-w-6xl">'
  );
  
  // Improvement 4: Add keyboard navigation
  const keyboardHandler = `
            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                const activeView = document.querySelector('.mind-map-view.active');
                if (!activeView) return;
                
                switch(e.key) {
                    case 'Tab':
                        // Navigate through tabs
                        if (!e.shiftKey) {
                            const tabs = Array.from(document.querySelectorAll('.tab[data-tab]'));
                            const currentIndex = tabs.findIndex(t => t.classList.contains('active'));
                            if (currentIndex < tabs.length - 1) {
                                e.preventDefault();
                                const nextTab = tabs[currentIndex + 1];
                                if (nextTab.dataset.tab) {
                                    switchTab(nextTab.dataset.tab);
                                }
                            }
                        }
                        break;
                    case 'Enter':
                    case ' ':
                        // Expand/collapse focused node
                        if (document.activeElement.classList.contains('node')) {
                            e.preventDefault();
                            document.activeElement.click();
                        }
                        break;
                    case 'Escape':
                        // Clear search
                        const searchInput = document.getElementById('search-input');
                        if (searchInput) {
                            searchInput.value = '';
                            searchInput.dispatchEvent(new Event('input'));
                        }
                        break;
                }
            });
`;
  
  // Add keyboard handler before the closing of the IIFE
  html = html.replace('            switchTab(\'question\');', 
                      '            switchTab(\'question\');\n' + keyboardHandler);
  
  // Improvement 5: Add expand/collapse all buttons
  const expandCollapseButtons = `
    <div class="absolute top-4 right-4 flex gap-2 z-10">
        <button id="expand-all" class="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition">
            Expand All
        </button>
        <button id="collapse-all" class="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition">
            Collapse All
        </button>
    </div>`;
  
  // Add buttons to the container
  html = html.replace(
    '<div id="mind-map-container" class="w-full max-w-6xl aspect-[4/3] bg-white rounded-xl shadow-lg border border-slate-200 mt-4">',
    '<div id="mind-map-container" class="w-full max-w-6xl aspect-[4/3] bg-white rounded-xl shadow-lg border border-slate-200 mt-4 relative">' + expandCollapseButtons
  );
  
  // Write the improved HTML
  fs.writeFileSync('/Users/ramiefathy/Desktop/WebApps/CTCLMindMaps_improved.html', html);
  console.log('Improvements saved to CTCLMindMaps_improved.html\n');
  
  // Test with Playwright
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  // Load the improved version
  const filePath = 'file://' + path.resolve('/Users/ramiefathy/Desktop/WebApps/CTCLMindMaps_improved.html');
  await page.goto(filePath);
  
  console.log('=== TESTING IMPROVEMENTS ===\n');
  
  // Test 1: Performance metrics
  const performanceMetrics = await page.evaluate(() => {
    const t0 = performance.now();
    // Trigger a tab switch
    const tabs = document.querySelectorAll('.tab[data-tab]');
    if (tabs[1]) tabs[1].click();
    const t1 = performance.now();
    
    return {
      tabSwitchTime: t1 - t0,
      memoryUsage: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 'N/A'
    };
  });
  
  console.log('Performance Metrics:');
  console.log(`  Tab switch time: ${performanceMetrics.tabSwitchTime.toFixed(2)}ms`);
  console.log(`  Memory usage: ${performanceMetrics.memoryUsage === 'N/A' ? 'N/A' : performanceMetrics.memoryUsage.toFixed(2) + 'MB'}`);
  console.log();
  
  // Test 2: Accessibility check
  const accessibilityCheck = await page.evaluate(() => {
    const issues = [];
    
    // Check for alt text
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length > 0) issues.push(`${images.length} images without alt text`);
    
    // Check for focus indicators
    const focusableElements = document.querySelectorAll('button, a, input, [tabindex]');
    const elementsWithoutFocus = Array.from(focusableElements).filter(el => {
      const styles = window.getComputedStyle(el);
      return !styles.outline && !styles.boxShadow;
    });
    if (elementsWithoutFocus.length > 0) {
      issues.push(`${elementsWithoutFocus.length} focusable elements may lack focus indicators`);
    }
    
    // Check color contrast (simplified)
    const textElements = document.querySelectorAll('.node-text');
    if (textElements.length > 0) {
      issues.push('Manual color contrast check recommended');
    }
    
    return issues;
  });
  
  console.log('Accessibility Check:');
  if (accessibilityCheck.length === 0) {
    console.log('  No major issues found');
  } else {
    accessibilityCheck.forEach(issue => console.log(`  - ${issue}`));
  }
  console.log();
  
  // Test 3: User experience features
  await page.waitForTimeout(1000);
  
  // Test search functionality
  const searchInput = await page.$('#search-input');
  if (searchInput) {
    await searchInput.type('MF');
    await page.waitForTimeout(500);
    console.log('Search functionality: ✓ Search input added');
  } else {
    console.log('Search functionality: ✗ Search input not found');
  }
  
  // Test expand/collapse buttons
  const expandButton = await page.$('#expand-all');
  const collapseButton = await page.$('#collapse-all');
  
  if (expandButton && collapseButton) {
    console.log('Expand/Collapse buttons: ✓ Buttons added');
  } else {
    console.log('Expand/Collapse buttons: ✗ Buttons not found');
  }
  
  // Test keyboard navigation
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  
  const focusedElement = await page.evaluate(() => {
    return document.activeElement ? document.activeElement.tagName : null;
  });
  
  console.log(`Keyboard navigation: Current focused element: ${focusedElement}`);
  console.log();
  
  // Test responsive design
  console.log('=== RESPONSIVE DESIGN TEST ===\n');
  
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];
  
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(500);
    
    const nodeCount = await page.evaluate(() => {
      return document.querySelectorAll('.node circle').length;
    });
    
    console.log(`${viewport.name} (${viewport.width}x${viewport.height}): ${nodeCount} nodes visible`);
  }
  
  console.log('\n=== OPTIMIZATION RECOMMENDATIONS ===\n');
  
  const recommendations = [
    {
      category: 'Performance',
      suggestions: [
        'Consider lazy loading for large datasets',
        'Implement virtual scrolling for very deep trees',
        'Use Web Workers for heavy computations',
        'Add caching for frequently accessed data'
      ]
    },
    {
      category: 'User Experience',
      suggestions: [
        'Add tooltips on hover delay (300ms)',
        'Implement smooth zoom with mouse wheel',
        'Add minimap for large trees',
        'Save user preferences in localStorage'
      ]
    },
    {
      category: 'Content',
      suggestions: [
        'Add links to external resources in tooltips',
        'Include images/diagrams where relevant',
        'Add printable view option',
        'Export to PDF functionality'
      ]
    }
  ];
  
  recommendations.forEach(rec => {
    console.log(`${rec.category}:`);
    rec.suggestions.forEach(s => console.log(`  • ${s}`));
    console.log();
  });
  
  // Take screenshots
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.screenshot({ path: 'optimized_desktop.png' });
  
  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({ path: 'optimized_mobile.png' });
  
  console.log('Screenshots saved: optimized_desktop.png, optimized_mobile.png\n');
  
  console.log('Browser will remain open for 15 seconds for manual inspection...');
  await page.waitForTimeout(15000);
  
  await browser.close();
})();
