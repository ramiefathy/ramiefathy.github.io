const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('🔍 Testing Node Spacing Fixes...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  const page = await browser.newPage();
  
  // Test the Alopecia mind map
  const alopeciaPath = 'file://' + path.resolve('AlopeciaMindMaps/Alopecia/AlopeciaMindMaps_optimized_stable.html');
  console.log('📂 Loading Alopecia mind map...');
  
  await page.goto(alopeciaPath);
  await page.waitForTimeout(3000); // Wait for full initialization
  
  // Check console logs for collision detection
  page.on('console', msg => {
    if (msg.text().includes('collision-free spacing') || 
        msg.text().includes('overlaps detected') || 
        msg.text().includes('No node overlaps')) {
      console.log('🔬 Spacing Analysis:', msg.text());
    }
  });
  
  // Test different tabs to check spacing across different data sets
  const tabs = ['approach', 'classification', 'modality'];
  
  for (const tab of tabs) {
    console.log(`\n📋 Testing tab: ${tab}`);
    
    try {
      await page.click(`[data-tab="${tab}"]`);
      await page.waitForTimeout(2000);
      
      // Check if nodes exist
      const nodeCount = await page.$$eval('.node', nodes => nodes.length);
      console.log(`   📊 Nodes rendered: ${nodeCount}`);
      
      if (nodeCount > 0) {
        // Take screenshot for visual verification
        await page.screenshot({ 
          path: `screenshots/spacing_test_${tab}.png`,
          fullPage: true 
        });
        console.log(`   📸 Screenshot saved: spacing_test_${tab}.png`);
        
        // Test node expansion to check dynamic spacing
        await page.click('.node');
        await page.waitForTimeout(1000);
        const expandedCount = await page.$$eval('.node', nodes => nodes.length);
        console.log(`   🔄 After expansion: ${expandedCount} nodes`);
      }
    } catch (error) {
      console.log(`   ❌ Error testing ${tab}: ${error.message}`);
    }
  }
  
  console.log('\n✅ Spacing test complete. Check console logs and screenshots.');
  console.log('Browser will remain open for manual inspection.');
  
  // Keep browser open for visual inspection
  // await browser.close();
})();