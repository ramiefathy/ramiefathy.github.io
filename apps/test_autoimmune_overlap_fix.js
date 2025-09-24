const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('🧪 Testing AutoimmuneBullous Mind Maps Overlap Fix...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 300
    });
    
    const page = await browser.newPage();
    
    // Test AutoimmuneBullous app tabs
    const filePath = 'file://' + path.resolve('AutoimmuneBullousMindMaps/AutoimmuneBullous/AutoimmuneBullousMindMaps.html');
    await page.goto(filePath);
    await page.waitForTimeout(2000);
    
    const tabs = [
        { id: 'tab-classification', name: 'Classification' },
        { id: 'tab-workup', name: 'Diagnostic Workup' },
        { id: 'tab-pathology', name: 'Pathology Findings' },
        { id: 'tab-treatment', name: 'Treatment' }
    ];
    
    for (const tab of tabs) {
        console.log(`📊 Testing ${tab.name} tab...`);
        await page.click(`#${tab.id}`);
        await page.waitForTimeout(1500);
        
        // Expand some nodes to test parent-child spacing
        const nodes = await page.$$('.node');
        console.log(`   Found ${nodes.length} nodes`);
        
        if (nodes.length > 1) {
            // Click the first child node to expand
            await nodes[1].click();
            await page.waitForTimeout(1000);
            
            const expandedNodes = await page.$$('.node');
            console.log(`   After expansion: ${expandedNodes.length} nodes`);
        }
        
        // Take screenshot
        await page.screenshot({ 
            path: `screenshots/autoimmune_${tab.name.toLowerCase().replace(/\s+/g, '_')}_overlap_fix.png`,
            fullPage: false
        });
        console.log(`   📸 Screenshot saved`);
    }
    
    // Test disease compendium dropdowns
    console.log('\n📊 Testing Disease Compendium dropdowns...');
    await page.hover('#tab-compendium');
    await page.waitForTimeout(1000);
    
    await page.click('.dropdown-item[data-tab="compendium-pv"]');
    await page.waitForTimeout(1500);
    
    await page.screenshot({ 
        path: 'screenshots/autoimmune_compendium_pv_overlap_fix.png',
        fullPage: false
    });
    console.log('   📸 PV Compendium screenshot saved');
    
    console.log('\n✅ AutoimmuneBullous overlap fix testing complete!');
    console.log('💡 Check screenshots to verify:');
    console.log('   - No overlap between sibling nodes');
    console.log('   - No overlap between parent and child nodes');
    console.log('   - Visible connection lines between all nodes');
    
    // Keep browser open for inspection
    console.log('\n🔍 Browser remains open for manual inspection...');
})();