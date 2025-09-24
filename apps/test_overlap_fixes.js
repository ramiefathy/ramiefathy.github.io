const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('🧪 Testing Node Overlap Fixes...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 // Slow enough to see what's happening
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Dynamic radial levels') || 
        text.includes('overlap') || 
        text.includes('spiral') ||
        text.includes('Branch')) {
      console.log(`📊 ${msg.type()}: ${text}`);
    }
  });
  
  // Test the Alopecia mind map
  const alopeciaPath = 'file://' + path.resolve('AlopeciaMindMaps/Alopecia/AlopeciaMindMaps_optimized_stable.html');
  console.log('📂 Loading:', alopeciaPath);
  
  await page.goto(alopeciaPath);
  await page.waitForTimeout(3000); // Wait for initialization
  
  // Test different tabs with varying node counts
  const testTabs = [
    { tab: 'approach', expectedNodes: 'few' },
    { tab: 'classification', expectedNodes: 'medium' },
    { tab: 'modality', expectedNodes: 'many' },
    { tab: 'treatment-aa', expectedNodes: 'many' }
  ];
  
  for (const test of testTabs) {
    console.log(`\n🔍 Testing ${test.tab} (${test.expectedNodes} nodes)...`);
    
    try {
      // Click tab
      const tabSelector = `[data-tab="${test.tab}"]`;
      await page.click(tabSelector);
      await page.waitForTimeout(2000);
      
      // Count nodes
      const nodeCount = await page.$$eval('.node', nodes => nodes.length);
      console.log(`   ✓ Rendered ${nodeCount} nodes`);
      
      // Expand all to stress test
      const expandBtn = await page.$('#expand-all');
      if (expandBtn) {
        await expandBtn.click();
        await page.waitForTimeout(1500);
        const expandedCount = await page.$$eval('.node', nodes => nodes.length);
        console.log(`   ✓ After expand all: ${expandedCount} nodes`);
      }
      
      // Take screenshot
      await page.screenshot({ 
        path: `screenshots/fixed_${test.tab}.png`,
        fullPage: false,
        clip: { x: 0, y: 100, width: 1200, height: 700 }
      });
      console.log(`   📸 Screenshot saved: fixed_${test.tab}.png`);
      
    } catch (error) {
      console.log(`   ❌ Error testing ${test.tab}: ${error.message}`);
    }
  }
  
  console.log('\n✅ Test complete. Check screenshots for visual verification.');
  console.log('💡 Browser will remain open for manual inspection.');
  
  // Don't close - allow manual inspection
  // await browser.close();
})();