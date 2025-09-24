const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// List of all mind map applications to test
const mindMaps = [
    {
        name: 'CTCL',
        path: 'CTCLMindMaps/CTCL/CTCLMindMaps.html',
        tabs: ['question', 'test', 'staging', 'subtypes-overall', 'treatment']
    },
    {
        name: 'Alopecia',
        path: 'AlopeciaMindMaps/Alopecia/AlopeciaMindMaps_optimized_stable.html',
        tabs: ['approach', 'classification', 'tools', 'modality', 'treatment-aa', 'counseling']
    },
    {
        name: 'Psoriasis',
        path: 'PsoriasisMindMaps/Psoriasis/PsoriasisMindMaps.html',
        tabs: ['patho', 'subtypes', 'comorbid', 'psa', 'treatment-modality']
    },
    {
        name: 'Pruritus',
        path: 'PruritusMindMaps/PruritusMindMaps.html',
        tabs: ['approach', 'classification', 'modality', 'treatment-ckd', 'counseling']
    },
    {
        name: 'AutoimmuneBullous',
        path: 'AutoimmuneBullousMindMaps/AutoimmuneBullous/AutoimmuneBullousMindMaps.html',
        tabs: ['classification', 'workup', 'treatment', 'compendium-pv', 'compendium-bp']
    }
];

async function testMindMap(page, mindMap) {
    console.log(`\n📊 Testing ${mindMap.name} Mind Map...`);
    console.log(`   Path: ${mindMap.path}`);
    
    const filePath = 'file://' + path.resolve(mindMap.path);
    
    try {
        // Navigate to the mind map
        await page.goto(filePath);
        await page.waitForTimeout(3000); // Wait for initialization
        
        // Check if the mind map container exists
        const container = await page.$('#mind-map-container');
        if (!container) {
            throw new Error('Mind map container not found');
        }
        
        // Check if shared files loaded correctly
        const hasError = await page.$('.text-red-500');
        if (hasError) {
            const errorText = await hasError.textContent();
            throw new Error(`Script loading error: ${errorText}`);
        }
        
        // Test each tab
        console.log(`   ✅ Page loaded successfully`);
        let testedTabs = 0;
        
        for (const tab of mindMap.tabs) {
            try {
                // Click the tab
                const tabSelector = `[data-tab="${tab}"]`;
                const tabElement = await page.$(tabSelector);
                
                if (!tabElement) {
                    console.log(`   ⚠️  Tab "${tab}" not found`);
                    continue;
                }
                
                await tabElement.click();
                await page.waitForTimeout(1500);
                
                // Count nodes
                const nodeCount = await page.$$eval('.node', nodes => nodes.length);
                console.log(`   ✅ Tab "${tab}": ${nodeCount} nodes rendered`);
                testedTabs++;
                
                // Test expand all
                const expandBtn = await page.$('#expand-all');
                if (expandBtn) {
                    await expandBtn.click();
                    await page.waitForTimeout(1000);
                    const expandedCount = await page.$$eval('.node', nodes => nodes.length);
                    console.log(`      → Expanded: ${expandedCount} nodes`);
                }
                
            } catch (tabError) {
                console.log(`   ❌ Error testing tab "${tab}": ${tabError.message}`);
            }
        }
        
        // Take a screenshot of the final state
        const screenshotDir = `screenshots/${mindMap.name.toLowerCase()}_test`;
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        await page.screenshot({ 
            path: `${screenshotDir}/final_state.png`,
            fullPage: false
        });
        
        console.log(`   📸 Screenshot saved to ${screenshotDir}/final_state.png`);
        console.log(`   ✅ Successfully tested ${testedTabs}/${mindMap.tabs.length} tabs`);
        
        return { success: true, testedTabs, totalTabs: mindMap.tabs.length };
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

(async () => {
    console.log('🧪 Testing All Mind Map Applications...');
    console.log('   Using updated shared files from: shared/');
    console.log('   Timestamp:', new Date().toISOString());
    
    const browser = await chromium.launch({ 
        headless: true,
        slowMo: 100
    });
    
    const page = await browser.newPage();
    
    // Enable console logging for debugging
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Error') || text.includes('Failed')) {
            console.log(`   🔍 Console ${msg.type()}: ${text}`);
        }
    });
    
    // Test results summary
    const results = [];
    
    // Test each mind map
    for (const mindMap of mindMaps) {
        const result = await testMindMap(page, mindMap);
        results.push({ name: mindMap.name, ...result });
    }
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    let totalSuccess = 0;
    let totalFailure = 0;
    
    for (const result of results) {
        if (result.success) {
            console.log(`✅ ${result.name}: SUCCESS (${result.testedTabs}/${result.totalTabs} tabs)`);
            totalSuccess++;
        } else {
            console.log(`❌ ${result.name}: FAILED - ${result.error}`);
            totalFailure++;
        }
    }
    
    console.log('\n📈 Overall Results:');
    console.log(`   Total mind maps tested: ${mindMaps.length}`);
    console.log(`   Successful: ${totalSuccess}`);
    console.log(`   Failed: ${totalFailure}`);
    
    if (totalFailure > 0) {
        console.log('\n⚠️  Some mind maps need attention!');
        console.log('   Check if they are using the old file structure');
        console.log('   or need to be updated to use shared components.');
    } else {
        console.log('\n🎉 All mind maps are working correctly!');
    }
    
    await browser.close();
})();