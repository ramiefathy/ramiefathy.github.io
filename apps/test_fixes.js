const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('🧪 Testing mind map fixes...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for visual verification
  });
  const page = await browser.newPage();
  
  // Test the fixed Alopecia mind map
  const alopeciaPath = 'file://' + path.resolve('AlopeciaMindMaps/Alopecia/AlopeciaMindMaps_optimized_stable.html');
  console.log('📂 Loading:', alopeciaPath);
  
  await page.goto(alopeciaPath);
  
  // Wait for page to load
  await page.waitForTimeout(2000);
  
  // Check for error messages
  const errorElements = await page.$$('.text-red-500');
  if (errorElements.length > 0) {
    console.log('❌ Error detected on page');
    const errorText = await page.$eval('.text-red-500', el => el.textContent);
    console.log('Error message:', errorText);
  }
  
  // Check if SVG was created (indicates D3 rendered successfully)
  const svgExists = await page.$('svg');
  if (svgExists) {
    console.log('✅ SVG element found - D3 rendering successful!');
    
    // Check for nodes
    const nodeCount = await page.$$eval('.node', nodes => nodes.length);
    console.log(`📊 Found ${nodeCount} mind map nodes`);
    
    if (nodeCount > 0) {
      console.log('✅ Mind map rendered with nodes successfully!');
      
      // Test tab switching
      console.log('🔀 Testing tab switching...');
      await page.click('[data-tab="classification"]');
      await page.waitForTimeout(1000);
      
      const newNodeCount = await page.$$eval('.node', nodes => nodes.length);
      console.log(`📊 After tab switch: ${newNodeCount} nodes`);
      
      if (newNodeCount > 0) {
        console.log('✅ Tab switching works correctly!');
      }
      
      // Test node interaction
      console.log('🖱️ Testing node click...');
      await page.click('.node', { timeout: 5000 });
      console.log('✅ Node interaction successful!');
      
    } else {
      console.log('⚠️ SVG exists but no nodes found');
    }
  } else {
    console.log('❌ No SVG element found - D3 rendering failed');
    
    // Check console for errors
    page.on('console', msg => console.log('Browser console:', msg.text()));
  }
  
  // Take a screenshot
  await page.screenshot({ 
    path: 'screenshots/alopecia_test_fixed.png',
    fullPage: true 
  });
  console.log('📸 Screenshot saved to screenshots/alopecia_test_fixed.png');
  
  // Keep browser open for manual inspection
  console.log('🔍 Browser will remain open for manual inspection...');
  console.log('Close the browser window when done testing.');
  
  // Don't close automatically - let user inspect
  // await browser.close();
})();