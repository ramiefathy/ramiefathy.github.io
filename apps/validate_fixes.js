const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testMindMap(htmlPath, name) {
    console.log(`\n🧪 Testing ${name}...`);
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Capture console errors
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });
    
    try {
        await page.goto(`file://${path.resolve(htmlPath)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000); // Wait for initialization
        
        // Check for error messages on page
        const errorElements = await page.$$('.text-red-500');
        if (errorElements.length > 0) {
            const errorText = await page.$eval('.text-red-500', el => el.textContent);
            console.log(`❌ ${name}: Page error - ${errorText}`);
            return false;
        }
        
        // Check if SVG exists (D3 rendered)
        const svg = await page.$('svg');
        if (!svg) {
            console.log(`❌ ${name}: No SVG found - D3 didn't render`);
            return false;
        }
        
        // Check if nodes exist
        const nodeCount = await page.$$eval('.node', nodes => nodes.length);
        if (nodeCount === 0) {
            console.log(`❌ ${name}: SVG exists but no nodes found`);
            return false;
        }
        
        console.log(`✅ ${name}: Working! Found ${nodeCount} nodes`);
        
        // Test tab switching if tabs exist
        const tabs = await page.$$('[data-tab]');
        if (tabs.length > 1) {
            await page.click('[data-tab]:not(.active)');
            await page.waitForTimeout(1000);
            const newNodeCount = await page.$$eval('.node', nodes => nodes.length);
            console.log(`   📝 Tab switching: ${newNodeCount > 0 ? '✅ Works' : '❌ Failed'}`);
        }
        
        await browser.close();
        return true;
        
    } catch (error) {
        console.log(`❌ ${name}: Exception - ${error.message}`);
        await browser.close();
        return false;
    }
}

async function main() {
    console.log('🚀 Comprehensive Mind Map Fix Validation\n');
    
    const tests = [
        { 
            path: 'AlopeciaMindMaps/Alopecia/AlopeciaMindMaps_optimized_stable.html', 
            name: 'Alopecia (Fixed)' 
        },
        { 
            path: 'CTCLMindMaps/CTCLMindMaps_improved_stable.html', 
            name: 'CTCL (Reference)' 
        }
    ];
    
    let passCount = 0;
    
    for (const test of tests) {
        if (fs.existsSync(test.path)) {
            const passed = await testMindMap(test.path, test.name);
            if (passed) passCount++;
        } else {
            console.log(`❌ ${test.name}: File not found - ${test.path}`);
        }
    }
    
    console.log(`\n📊 Results: ${passCount}/${tests.length} mind maps working`);
    
    if (passCount === tests.length) {
        console.log('🎉 All fixes successful!');
    } else {
        console.log('⚠️  Some issues remain - check logs above');
    }
}

main().catch(console.error);