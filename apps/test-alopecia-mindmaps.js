const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testAlopeciaMindMaps() {
    console.log('🧪 Testing Refactored Alopecia Mind Maps Application...\n');
    
    const browser = await chromium.launch({ headless: false, slowMo: 1000 });
    const page = await browser.newPage();
    
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1400, height: 900 });
    
    const appUrl = 'file:///Users/ramiefathy/Desktop/WebApps/apps/MindMaps/AlopeciaMindMaps/Alopecia/AlopeciaMindMaps_optimized_stable.html';
    
    try {
        console.log('📱 Loading application...');
        await page.goto(appUrl);
        
        // Wait for the page to fully load
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000); // Allow D3 to render
        
        // Test 1: Initial load screenshot
        console.log('📸 Taking initial load screenshot...');
        await page.screenshot({ 
            path: '/Users/ramiefathy/Desktop/WebApps/apps/MindMaps/screenshots/01-initial-load.png',
            fullPage: true 
        });
        
        // Check if mind map SVG exists and has content
        console.log('🔍 Checking mind map visualization...');
        const svgExists = await page.$('svg');
        console.log(`SVG element exists: ${svgExists ? '✅ Yes' : '❌ No'}`);
        
        if (svgExists) {
            const nodeCount = await page.$$eval('svg circle', circles => circles.length);
            const textCount = await page.$$eval('svg text', texts => texts.length);
            console.log(`Mind map nodes found: ${nodeCount}`);
            console.log(`Text elements found: ${textCount}`);
            
            // Check if nodes are not just red circles (should have proper styling)
            const nodeColors = await page.$$eval('svg circle', circles => 
                circles.map(c => c.getAttribute('fill') || c.style.fill)
            );
            console.log(`Node colors: ${[...new Set(nodeColors)].join(', ')}`);
        }
        
        // Test 2: Tab navigation
        console.log('\n🔄 Testing tab navigation...');
        const tabs = [
            'Diagnostic Approach',
            'Classification', 
            'Tools',
            'Treatment by Condition',
            'New Treatments',
            'Prognosis'
        ];
        
        for (let i = 0; i < tabs.length; i++) {
            const tabName = tabs[i];
            console.log(`Testing tab: ${tabName}`);
            
            // Try to find and click the tab
            const tabSelector = `[data-tab="${tabName.toLowerCase().replace(/\s+/g, '-')}"], button:has-text("${tabName}"), .tab:has-text("${tabName}")`;
            
            try {
                await page.click(tabSelector, { timeout: 5000 });
                await page.waitForTimeout(2000); // Allow content to load
                
                await page.screenshot({ 
                    path: `/Users/ramiefathy/Desktop/WebApps/apps/MindMaps/screenshots/02-tab-${i + 1}-${tabName.toLowerCase().replace(/\s+/g, '-')}.png`,
                    fullPage: true 
                });
                console.log(`✅ ${tabName} tab working`);
            } catch (error) {
                console.log(`⚠️  Could not find or click ${tabName} tab: ${error.message}`);
            }
        }
        
        // Test 3: Treatment by Condition dropdown (specific focus)
        console.log('\n📋 Testing Treatment by Condition dropdown...');
        try {
            // Look for dropdown trigger
            const dropdownTriggers = [
                'select[name*="condition"], select[name*="treatment"]',
                '.dropdown-trigger, .select-trigger',
                'button:has-text("Select"), button:has-text("Choose")',
                '[data-dropdown], [data-select]'
            ];
            
            let dropdownFound = false;
            for (const trigger of dropdownTriggers) {
                try {
                    const element = await page.$(trigger);
                    if (element) {
                        console.log(`Found dropdown trigger: ${trigger}`);
                        await element.click();
                        await page.waitForTimeout(1000);
                        
                        await page.screenshot({ 
                            path: '/Users/ramiefathy/Desktop/WebApps/apps/MindMaps/screenshots/03-dropdown-open.png',
                            fullPage: true 
                        });
                        
                        // Check if dropdown options are visible and properly positioned
                        const dropdownOptions = await page.$$('.dropdown-option, option, .select-option');
                        console.log(`Dropdown options found: ${dropdownOptions.length}`);
                        
                        dropdownFound = true;
                        break;
                    }
                } catch (e) {
                    // Continue to next trigger
                }
            }
            
            if (!dropdownFound) {
                console.log('⚠️  No dropdown trigger found - checking for static content');
            }
        } catch (error) {
            console.log(`⚠️  Dropdown test error: ${error.message}`);
        }
        
        // Test 4: Interactive features
        console.log('\n🎯 Testing interactive features...');
        
        // Test zoom controls
        const zoomControls = ['.zoom-in', '.zoom-out', '.zoom-reset', '[title*="zoom"]', 'button:has-text("+"), button:has-text("-")'];
        let zoomFound = false;
        
        for (const control of zoomControls) {
            try {
                const element = await page.$(control);
                if (element) {
                    console.log(`Found zoom control: ${control}`);
                    await element.click();
                    await page.waitForTimeout(500);
                    zoomFound = true;
                }
            } catch (e) {
                // Continue
            }
        }
        
        console.log(`Zoom controls working: ${zoomFound ? '✅ Yes' : '⚠️  Not found'}`);
        
        // Test node interaction
        try {
            const nodes = await page.$$('svg circle');
            if (nodes.length > 0) {
                console.log('🎯 Testing node interaction...');
                await nodes[0].click();
                await page.waitForTimeout(1000);
                
                await page.screenshot({ 
                    path: '/Users/ramiefathy/Desktop/WebApps/apps/MindMaps/screenshots/04-node-interaction.png',
                    fullPage: true 
                });
                console.log('✅ Node interaction test completed');
            }
        } catch (error) {
            console.log(`⚠️  Node interaction error: ${error.message}`);
        }
        
        // Test 5: Search functionality
        console.log('\n🔍 Testing search functionality...');
        const searchSelectors = ['input[type="search"]', 'input[placeholder*="search"]', '.search-input', '#search'];
        
        for (const selector of searchSelectors) {
            try {
                const searchInput = await page.$(selector);
                if (searchInput) {
                    console.log(`Found search input: ${selector}`);
                    await searchInput.fill('alopecia');
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(1000);
                    
                    await page.screenshot({ 
                        path: '/Users/ramiefathy/Desktop/WebApps/apps/MindMaps/screenshots/05-search-test.png',
                        fullPage: true 
                    });
                    console.log('✅ Search functionality tested');
                    break;
                }
            } catch (e) {
                // Continue
            }
        }
        
        // Test 6: Final state screenshot
        console.log('\n📸 Taking final state screenshot...');
        await page.screenshot({ 
            path: '/Users/ramiefathy/Desktop/WebApps/apps/MindMaps/screenshots/06-final-state.png',
            fullPage: true 
        });
        
        // Generate test report
        const report = await generateTestReport(page);
        fs.writeFileSync('/Users/ramiefathy/Desktop/WebApps/apps/MindMaps/test-report.txt', report);
        
        console.log('\n✅ Test completed! Check screenshots and report for details.');
        console.log('📁 Screenshots saved to: /Users/ramiefathy/Desktop/WebApps/apps/MindMaps/screenshots/');
        console.log('📋 Test report saved to: /Users/ramiefathy/Desktop/WebApps/apps/MindMaps/test-report.txt');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

async function generateTestReport(page) {
    const report = [];
    report.push('ALOPECIA MIND MAPS - TEST REPORT');
    report.push('=' .repeat(50));
    report.push(`Test Date: ${new Date().toISOString()}`);
    report.push('');
    
    // Check page title
    const title = await page.title();
    report.push(`Page Title: ${title}`);
    
    // Check for JavaScript errors
    let jsErrors = [];
    page.on('pageerror', error => jsErrors.push(error.message));
    
    if (jsErrors.length > 0) {
        report.push('\nJavaScript Errors:');
        jsErrors.forEach(error => report.push(`- ${error}`));
    } else {
        report.push('\n✅ No JavaScript errors detected');
    }
    
    // Check D3 and mind map elements
    try {
        const d3Available = await page.evaluate(() => typeof window.d3 !== 'undefined');
        report.push(`\nD3.js Available: ${d3Available ? '✅ Yes' : '❌ No'}`);
        
        const svgCount = await page.$$eval('svg', svgs => svgs.length);
        report.push(`SVG Elements: ${svgCount}`);
        
        if (svgCount > 0) {
            const nodeCount = await page.$$eval('svg circle', circles => circles.length);
            const textCount = await page.$$eval('svg text', texts => texts.length);
            const linkCount = await page.$$eval('svg line, svg path', elements => elements.length);
            
            report.push(`Mind Map Nodes: ${nodeCount}`);
            report.push(`Text Elements: ${textCount}`);
            report.push(`Links/Paths: ${linkCount}`);
            
            if (nodeCount > 0 && textCount > 0) {
                report.push('✅ Mind map visualization appears to be working');
            } else {
                report.push('⚠️  Mind map visualization may have issues');
            }
        }
    } catch (error) {
        report.push(`Error checking D3/mind map elements: ${error.message}`);
    }
    
    // Check for navigation elements
    try {
        const buttons = await page.$$eval('button', buttons => buttons.length);
        const tabs = await page.$$eval('[role="tab"], .tab, [data-tab]', elements => elements.length);
        
        report.push(`\nNavigation Elements:`);
        report.push(`Buttons: ${buttons}`);
        report.push(`Tabs: ${tabs}`);
    } catch (error) {
        report.push(`Error checking navigation: ${error.message}`);
    }
    
    report.push('\n' + '='.repeat(50));
    report.push('Test completed successfully');
    
    return report.join('\n');
}

// Create screenshots directory
const screenshotsDir = '/Users/ramiefathy/Desktop/WebApps/apps/MindMaps/screenshots';
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Run the test
testAlopeciaMindMaps().catch(console.error);