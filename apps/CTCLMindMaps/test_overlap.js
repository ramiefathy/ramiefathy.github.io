const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Load the HTML file
  const filePath = 'file://' + path.resolve('/Users/ramiefathy/Desktop/WebApps/CTCLMindMaps.html');
  await page.goto(filePath);
  
  // Wait for initial render
  await page.waitForTimeout(2000);
  
  // Test the "By Disease Stage" tab which has many nodes
  await page.click('#tab-treatment-stage');
  await page.waitForTimeout(2000);
  
  // Expand some nodes to see overlap
  await page.evaluate(() => {
    // Click on the root node to expand
    const rootNode = document.querySelector('.node');
    if (rootNode) {
      rootNode.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  });
  
  await page.waitForTimeout(1000);
  
  // Click on first level nodes to expand them
  await page.evaluate(() => {
    const nodes = document.querySelectorAll('.node');
    // Click on the first few child nodes
    if (nodes[1]) nodes[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    if (nodes[2]) nodes[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  
  await page.waitForTimeout(2000);
  
  // Take a screenshot to analyze
  await page.screenshot({ path: 'overlap_test.png', fullPage: false });
  
  // Get node positions to analyze overlap
  const nodeData = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('.node circle'));
    return nodes.map((node, i) => {
      const transform = node.parentElement.getAttribute('transform');
      const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
      const rect = node.getBoundingClientRect();
      return {
        index: i,
        x: match ? parseFloat(match[1]) : 0,
        y: match ? parseFloat(match[2]) : 0,
        radius: parseFloat(node.getAttribute('r')),
        screenX: rect.x + rect.width/2,
        screenY: rect.y + rect.height/2,
        screenRadius: rect.width/2
      };
    });
  });
  
  console.log('Node positions:', nodeData);
  
  // Check for overlaps
  const overlaps = [];
  for (let i = 0; i < nodeData.length; i++) {
    for (let j = i + 1; j < nodeData.length; j++) {
      const n1 = nodeData[i];
      const n2 = nodeData[j];
      const distance = Math.sqrt(Math.pow(n1.screenX - n2.screenX, 2) + Math.pow(n1.screenY - n2.screenY, 2));
      const minDistance = n1.screenRadius + n2.screenRadius + 5; // 5px padding
      
      if (distance < minDistance) {
        overlaps.push({
          nodes: [i, j],
          distance: distance,
          minDistance: minDistance,
          overlap: minDistance - distance
        });
      }
    }
  }
  
  console.log('\nOverlapping nodes found:', overlaps.length);
  overlaps.forEach(o => {
    console.log(`Nodes ${o.nodes[0]} and ${o.nodes[1]}: overlap by ${o.overlap.toFixed(1)}px`);
  });
  
  // Keep browser open for inspection
  console.log('\nBrowser will stay open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();
