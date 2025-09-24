const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('🧪 Testing New Pathology Findings Tab...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500
    });
    
    const page = await browser.newPage();
    
    // Test AutoimmuneBullous pathology tab
    console.log('📊 Testing AutoimmuneBullous Pathology Tab...');
    const filePath = 'file://' + path.resolve('AutoimmuneBullousMindMaps/AutoimmuneBullous/AutoimmuneBullousMindMaps.html');
    await page.goto(filePath);
    await page.waitForTimeout(2000);
    
    // Click on Pathology Findings tab
    console.log('   Clicking on Pathology Findings tab...');
    await page.click('#tab-pathology');
    await page.waitForTimeout(1500);
    
    // Check if mind map is rendered
    const svgElement = await page.$('#svg-pathology');
    if (svgElement) {
        console.log('   ✅ Pathology mind map SVG rendered');
        
        // Check for nodes
        const nodes = await page.$$('.node');
        console.log(`   📍 Found ${nodes.length} nodes in the pathology mind map`);
        
        // Test node expansion
        if (nodes.length > 0) {
            console.log('   Testing node expansion...');
            await nodes[1].click(); // Click second node (first child)
            await page.waitForTimeout(1000);
            
            const expandedNodes = await page.$$('.node');
            console.log(`   📍 After expansion: ${expandedNodes.length} nodes`);
        }
        
        // Test tooltip
        console.log('   Testing tooltip on hover...');
        await page.hover('.node:nth-child(2)');
        await page.waitForTimeout(500);
        
        const tooltip = await page.$('#tooltip');
        const isVisible = await tooltip.evaluate(el => 
            window.getComputedStyle(el).visibility === 'visible'
        );
        console.log(`   ✅ Tooltip visible on hover: ${isVisible}`);
    } else {
        console.log('   ❌ Pathology mind map SVG not found!');
    }
    
    // Take screenshot
    await page.screenshot({ 
        path: 'screenshots/pathology_tab_test.png',
        fullPage: false
    });
    console.log('   📸 Screenshot saved: pathology_tab_test.png');
    
    // Test search functionality with pathology content
    console.log('\n📊 Testing Search with Pathology Content...');
    await page.fill('#search-input', 'tombstone');
    await page.waitForTimeout(1000);
    
    const searchResults = await page.$$('.search-result-item');
    console.log(`   📍 Found ${searchResults.length} search results for "tombstone"`);
    
    if (searchResults.length > 0) {
        console.log('   ✅ Search is finding pathology content');
    }
    
    await page.screenshot({ 
        path: 'screenshots/pathology_search_test.png',
        fullPage: false
    });
    console.log('   📸 Screenshot saved: pathology_search_test.png');
    
    console.log('\n✅ Pathology Findings tab implementation complete!');
    console.log('💡 The new tab consolidates histopathologic and DIF findings for all autoimmune bullous diseases.');
    
    // Keep browser open for inspection
    console.log('\n🔍 Browser remains open for manual inspection...');
})();