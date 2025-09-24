const { chromium } = require('playwright-core');
const path = require('path');

async function captureSpacing(htmlPath, outputName) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto(`file://${path.resolve(htmlPath)}`);
    await page.waitForTimeout(3000);
    
    // Switch to modality tab (has most nodes for testing)
    try {
        await page.click('[data-tab="modality"]');
        await page.waitForTimeout(2000);
        
        // Expand all nodes to show maximum density
        await page.click('#expand-all');
        await page.waitForTimeout(2000);
    } catch (e) {
        console.log('Could not expand nodes');
    }
    
    await page.screenshot({ 
        path: `screenshots/${outputName}_spacing.png`,
        fullPage: false,
        clip: { x: 0, y: 0, width: 1200, height: 800 }
    });
    
    const nodeCount = await page.$$eval('.node', nodes => nodes.length);
    console.log(`${outputName}: ${nodeCount} nodes captured`);
    
    await browser.close();
}

(async () => {
    console.log('📊 Comparing spacing implementations...\n');
    
    // Test the fixed Alopecia implementation
    await captureSpacing(
        'AlopeciaMindMaps/Alopecia/AlopeciaMindMaps_optimized_stable.html', 
        'alopecia_fixed'
    );
    
    // Test CTCL for comparison
    if (require('fs').existsSync('CTCLMindMaps/CTCLMindMaps_improved_stable.html')) {
        await captureSpacing(
            'CTCLMindMaps/CTCLMindMaps_improved_stable.html',
            'ctcl_reference'
        );
    }
    
    console.log('\n✅ Spacing comparison screenshots saved to screenshots/ folder');
    console.log('Compare alopecia_fixed_spacing.png with the previous overlapping version');
})();