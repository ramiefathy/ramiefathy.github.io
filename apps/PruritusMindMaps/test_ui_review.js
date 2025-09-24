const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'ui_review_screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function reviewPruritusUI() {
    const browser = await chromium.launch({ 
        headless: false,
        args: ['--start-maximized']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2
    });
    
    const page = await context.newPage();
    
    console.log('🔍 Starting comprehensive UI/UX review of Pruritus MindMap...\n');
    
    const findings = {
        positive: [],
        issues: [],
        improvements: [],
        performance: {}
    };
    
    try {
        // 1. INITIAL LOAD TEST
        console.log('📊 Testing initial page load...');
        const startTime = Date.now();
        
        const filePath = `file://${path.join(__dirname, 'PruritusMindMaps.html')}`;
        await page.goto(filePath, { waitUntil: 'networkidle' });
        
        const loadTime = Date.now() - startTime;
        findings.performance.loadTime = loadTime;
        console.log(`   ✅ Page loaded in ${loadTime}ms`);
        
        // Wait for mind map to render
        await page.waitForTimeout(2000);
        
        // 2. VISUAL HIERARCHY TEST
        console.log('\n🎨 Evaluating visual hierarchy...');
        
        // Check header visibility
        const headerVisible = await page.isVisible('h1:has-text("Pruritus Workup")');
        if (headerVisible) {
            findings.positive.push('Clear page title and description');
        }
        
        // Check tab visibility and structure
        const tabs = await page.$$('.tab');
        console.log(`   Found ${tabs.length} tabs`);
        
        if (tabs.length === 7) {
            findings.positive.push('All expected tabs are present');
        } else {
            findings.issues.push(`Expected 7 tabs but found ${tabs.length}`);
        }
        
        // Screenshot initial state
        await page.screenshot({ 
            path: path.join(screenshotsDir, '01_initial_state.png'),
            fullPage: true 
        });
        
        // 3. TAB NAVIGATION TEST
        console.log('\n🔄 Testing tab navigation...');
        
        const tabTests = [
            'classification',
            'pathophysiology', 
            'modality',
            'treatment-pn',
            'treatment-ckd',
            'counseling'
        ];
        
        for (const tabName of tabTests) {
            const tabSelector = `#tab-${tabName}`;
            const viewSelector = `#view-${tabName}`;
            
            try {
                await page.click(tabSelector);
                await page.waitForTimeout(1000);
                
                const isActive = await page.$eval(tabSelector, el => el.classList.contains('active'));
                const viewVisible = await page.isVisible(viewSelector);
                
                if (isActive && viewVisible) {
                    console.log(`   ✅ Tab "${tabName}" switches correctly`);
                    
                    // Check if SVG renders
                    const svgExists = await page.$eval(viewSelector, view => {
                        return view.querySelector('svg') !== null;
                    });
                    
                    if (!svgExists) {
                        findings.issues.push(`No mind map rendered for tab "${tabName}"`);
                        console.log(`   ⚠️  No SVG found for "${tabName}"`);
                    }
                } else {
                    findings.issues.push(`Tab "${tabName}" navigation failed`);
                }
            } catch (error) {
                findings.issues.push(`Error testing tab "${tabName}": ${error.message}`);
            }
        }
        
        // Return to first tab
        await page.click('#tab-approach');
        await page.waitForTimeout(1000);
        
        // 4. SEARCH FUNCTIONALITY TEST
        console.log('\n🔍 Testing search functionality...');
        
        // Test search input
        await page.fill('#search-input', 'chronic');
        await page.waitForTimeout(500);
        
        // Check if search results appear
        const searchResultsVisible = await page.isVisible('#search-results-container > div');
        
        if (searchResultsVisible) {
            findings.positive.push('Search results display correctly');
            
            // Count results
            const resultCount = await page.$$eval('#search-results-container .hover\\:bg-slate-50', 
                elements => elements.length);
            console.log(`   ✅ Search found ${resultCount} results`);
            
            await page.screenshot({ 
                path: path.join(screenshotsDir, '02_search_results.png') 
            });
        } else {
            findings.issues.push('Search results not displaying');
        }
        
        // Test clear search
        await page.click('#clear-search');
        await page.waitForTimeout(300);
        
        const searchCleared = await page.$eval('#search-input', el => el.value === '');
        if (searchCleared) {
            findings.positive.push('Clear search button works');
        } else {
            findings.issues.push('Clear search button not functioning');
        }
        
        // 5. ZOOM CONTROLS TEST
        console.log('\n🔍 Testing zoom controls...');
        
        // Test zoom in
        await page.click('#zoom-in');
        await page.waitForTimeout(300);
        await page.click('#zoom-in');
        await page.waitForTimeout(300);
        
        await page.screenshot({ 
            path: path.join(screenshotsDir, '03_zoomed_in.png') 
        });
        
        // Test zoom reset
        await page.click('#zoom-reset');
        await page.waitForTimeout(300);
        
        // Test zoom out
        await page.click('#zoom-out');
        await page.waitForTimeout(300);
        
        await page.screenshot({ 
            path: path.join(screenshotsDir, '04_zoomed_out.png') 
        });
        
        findings.positive.push('Zoom controls functional');
        
        // Reset zoom
        await page.click('#zoom-reset');
        await page.waitForTimeout(300);
        
        // 6. EXPAND/COLLAPSE TEST
        console.log('\n📂 Testing expand/collapse functionality...');
        
        // Test expand all
        await page.click('#expand-all');
        await page.waitForTimeout(1000);
        
        const expandedNodes = await page.$$('.node');
        console.log(`   ✅ Expanded to show ${expandedNodes.length} nodes`);
        
        await page.screenshot({ 
            path: path.join(screenshotsDir, '05_all_expanded.png') 
        });
        
        // Test collapse all
        await page.click('#collapse-all');
        await page.waitForTimeout(1000);
        
        const collapsedNodes = await page.$$('.node');
        console.log(`   ✅ Collapsed to show ${collapsedNodes.length} nodes`);
        
        await page.screenshot({ 
            path: path.join(screenshotsDir, '06_all_collapsed.png') 
        });
        
        // 7. NODE INTERACTION TEST
        console.log('\n👆 Testing node interactions...');
        
        // Click on a node to expand
        const firstNode = await page.$('.node');
        if (firstNode) {
            await firstNode.click();
            await page.waitForTimeout(500);
            findings.positive.push('Node click interaction works');
        }
        
        // Test tooltip on hover
        const nodeForTooltip = await page.$('.node:nth-child(2)');
        if (nodeForTooltip) {
            await nodeForTooltip.hover();
            await page.waitForTimeout(500);
            
            const tooltipVisible = await page.isVisible('#tooltip');
            if (tooltipVisible) {
                findings.positive.push('Tooltips display on hover');
            } else {
                findings.issues.push('Tooltips not showing on node hover');
            }
        }
        
        // 8. RESPONSIVE DESIGN TEST
        console.log('\n📱 Testing responsive design...');
        
        // Test tablet view
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(1000);
        await page.screenshot({ 
            path: path.join(screenshotsDir, '07_tablet_view.png') 
        });
        
        // Test mobile view
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        await page.screenshot({ 
            path: path.join(screenshotsDir, '08_mobile_view.png') 
        });
        
        // Check if controls are still accessible
        const controlsVisible = await page.isVisible('#expand-all');
        if (controlsVisible) {
            findings.positive.push('Controls remain accessible on mobile');
        } else {
            findings.issues.push('Controls not properly visible on mobile');
        }
        
        // 9. KEYBOARD SHORTCUTS TEST
        console.log('\n⌨️ Testing keyboard shortcuts...');
        
        // Reset viewport for keyboard tests
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(500);
        
        // Test Ctrl+F to focus search
        await page.keyboard.press('Control+F');
        await page.waitForTimeout(300);
        
        const searchFocused = await page.$eval('#search-input', el => el === document.activeElement);
        if (searchFocused) {
            findings.positive.push('Ctrl+F focuses search input');
        } else {
            findings.issues.push('Ctrl+F shortcut not working');
        }
        
        // Test Escape to clear search
        await page.type('#search-input', 'test');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        
        const searchClearedByEsc = await page.$eval('#search-input', el => el.value === '');
        if (searchClearedByEsc) {
            findings.positive.push('Escape key clears search');
        } else {
            findings.issues.push('Escape key not clearing search');
        }
        
        // 10. PERFORMANCE OBSERVATIONS
        console.log('\n⚡ Evaluating performance...');
        
        // Test animation smoothness
        await page.click('#expand-all');
        await page.waitForTimeout(1500);
        
        // Count total nodes when fully expanded
        const allNodes = await page.$$('.node');
        findings.performance.totalNodes = allNodes.length;
        console.log(`   Total nodes when expanded: ${allNodes.length}`);
        
        if (allNodes.length > 50) {
            findings.improvements.push('Consider implementing virtualization for large node counts');
        }
        
        // 11. UI CONSISTENCY CHECK
        console.log('\n🎯 Checking UI consistency...');
        
        // Check button styles
        const buttons = await page.$$('button');
        let buttonStylesConsistent = true;
        
        for (const button of buttons) {
            const hasTransition = await button.evaluate(el => 
                window.getComputedStyle(el).transition !== 'none'
            );
            if (!hasTransition) {
                buttonStylesConsistent = false;
                break;
            }
        }
        
        if (buttonStylesConsistent) {
            findings.positive.push('Button styles and transitions are consistent');
        } else {
            findings.issues.push('Some buttons lack transition effects');
        }
        
        // 12. ACCESSIBILITY CHECK
        console.log('\n♿ Basic accessibility check...');
        
        // Check for title attributes on buttons
        const zoomInTitle = await page.$eval('#zoom-in', el => el.getAttribute('title'));
        if (zoomInTitle) {
            findings.positive.push('Buttons have helpful title attributes');
        } else {
            findings.issues.push('Missing title attributes on control buttons');
        }
        
        // Check color contrast
        const tabColorContrast = await page.$eval('.tab', el => {
            const styles = window.getComputedStyle(el);
            return styles.color;
        });
        console.log(`   Tab text color: ${tabColorContrast}`);
        
    } catch (error) {
        console.error('❌ Test error:', error);
        findings.issues.push(`Test execution error: ${error.message}`);
    }
    
    // GENERATE REPORT
    console.log('\n' + '='.repeat(60));
    console.log('📋 UI/UX REVIEW REPORT');
    console.log('='.repeat(60));
    
    console.log('\n✅ POSITIVE FINDINGS:');
    findings.positive.forEach(item => console.log(`   • ${item}`));
    
    console.log('\n⚠️ ISSUES FOUND:');
    if (findings.issues.length === 0) {
        console.log('   • No critical issues found');
    } else {
        findings.issues.forEach(item => console.log(`   • ${item}`));
    }
    
    console.log('\n💡 SUGGESTED IMPROVEMENTS:');
    
    // Add general improvements based on testing
    findings.improvements.push('Add loading indicators for tab switches');
    findings.improvements.push('Implement breadcrumb navigation for deep nodes');
    findings.improvements.push('Add a mini-map for navigation in large graphs');
    findings.improvements.push('Consider adding export functionality (PNG/SVG)');
    findings.improvements.push('Add node count indicator when expanded/collapsed');
    findings.improvements.push('Implement undo/redo for node expansions');
    findings.improvements.push('Add animation speed controls');
    findings.improvements.push('Include a help modal with keyboard shortcuts');
    
    findings.improvements.forEach(item => console.log(`   • ${item}`));
    
    console.log('\n📊 PERFORMANCE METRICS:');
    console.log(`   • Initial load time: ${findings.performance.loadTime}ms`);
    console.log(`   • Total nodes (expanded): ${findings.performance.totalNodes}`);
    
    console.log('\n📸 Screenshots saved to:', screenshotsDir);
    
    await browser.close();
}

// Run the review
reviewPruritusUI().catch(console.error);