const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('🔤 Testing Text Wrapping & Border Improvements...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  // Test the Alopecia mind map
  const alopeciaPath = 'file://' + path.resolve('AlopeciaMindMaps/Alopecia/AlopeciaMindMaps_optimized_stable.html');
  await page.goto(alopeciaPath);
  await page.waitForTimeout(2000);
  
  console.log('📋 Testing treatment-aa tab with text improvements...');
  
  // Go to treatment-aa which had the "Limited/Patchy Disease" node
  await page.click('[data-tab="treatment-aa"]');
  await page.waitForTimeout(2000);
  
  // Expand all to see text wrapping
  await page.click('#expand-all');
  await page.waitForTimeout(2000);
  
  // Click on some nodes to check border behavior
  const nodes = await page.$$('.node');
  if (nodes.length > 2) {
    console.log('🖱️ Clicking nodes to verify border behavior...');
    await nodes[1].click(); // Click second node
    await page.waitForTimeout(1000);
    await nodes[2].click(); // Click third node
    await page.waitForTimeout(1000);
  }
  
  // Take final screenshot
  await page.screenshot({ 
    path: 'screenshots/text_improvements.png',
    fullPage: false,
    clip: { x: 200, y: 100, width: 800, height: 600 }
  });
  
  console.log('✅ Screenshot saved: text_improvements.png');
  console.log('💡 Check for:');
  console.log('   - Better text wrapping (no single letters on lines)');
  console.log('   - Proper word breaks');
  console.log('   - Correct border styling (thick only for collapsed nodes)');
  
  // Keep open for inspection
  console.log('\n🔍 Browser remains open for manual inspection...');
})();