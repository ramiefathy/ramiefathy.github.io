const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('🧪 Testing Refactored CTCL Mind Map...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 200
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Error') || text.includes('Failed') || text.includes('initialized')) {
            console.log(`📊 ${msg.type()}: ${text}`);
        }
    });
    
    // Test the CTCL mind map
    const ctclPath = 'file://' + path.resolve('CTCLMindMaps/CTCL/CTCLMindMaps.html');
    console.log('📂 Loading:', ctclPath);
    
    await page.goto(ctclPath);
    await page.waitForTimeout(3000); // Wait for initialization
    
    // Check if container exists
    const container = await page.$('#mind-map-container');
    if (!container) {
        console.log('❌ Mind map container not found!');
        await browser.close();
        return;
    }
    
    console.log('✅ Mind map container found');
    
    // Check if initialization succeeded
    const hasError = await page.$('.text-red-500');
    if (hasError) {
        const errorText = await hasError.textContent();
        console.log(`❌ Error on page: ${errorText}`);
    }
    
    // Test each tab
    const tabs = ['question', 'test', 'staging', 'subtypes-overall', 'treatment'];
    
    for (const tab of tabs) {
        console.log(`\n🔍 Testing tab: ${tab}`);
        
        try {
            // Click tab
            const tabSelector = `[data-tab="${tab}"]`;
            const tabElement = await page.$(tabSelector);
            
            if (!tabElement) {
                console.log(`   ❌ Tab element not found`);
                continue;
            }
            
            // Handle dropdown tabs
            if (tab === 'subtypes-overall' || tab === 'treatment') {
                // First click the parent dropdown
                const parentTab = tab.startsWith('subtypes') ? '#tab-subtypes' : '#tab-treatment';
                await page.hover(parentTab);
                await page.waitForTimeout(500);
            }
            
            await tabElement.click();
            await page.waitForTimeout(1500);
            
            // Count nodes
            const nodeCount = await page.$$eval('.node', nodes => nodes.length);
            console.log(`   ✅ Rendered ${nodeCount} nodes`);
            
            // Test expand all
            const expandBtn = await page.$('#expand-all');
            if (expandBtn && nodeCount > 0) {
                await expandBtn.click();
                await page.waitForTimeout(1000);
                const expandedCount = await page.$$eval('.node', nodes => nodes.length);
                console.log(`   ✅ After expand all: ${expandedCount} nodes`);
            }
            
            // Take screenshot
            await page.screenshot({ 
                path: `screenshots/ctcl_${tab}.png`,
                fullPage: false
            });
            console.log(`   📸 Screenshot saved: ctcl_${tab}.png`);
            
        } catch (error) {
            console.log(`   ❌ Error testing tab: ${error.message}`);
        }
    }
    
    console.log('\n✅ Test complete. Browser will remain open for manual inspection.');
    
    // Don't close - allow manual inspection
    // await browser.close();
})();