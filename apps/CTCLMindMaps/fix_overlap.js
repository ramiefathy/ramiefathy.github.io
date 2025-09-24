const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  // Load the HTML file
  const filePath = 'file://' + path.resolve('/Users/ramiefathy/Desktop/WebApps/CTCLMindMaps.html');
  await page.goto(filePath);
  
  // Wait for initial render
  await page.waitForTimeout(2000);
  
  // Test the "By Disease Stage" tab which has many nodes
  await page.click('#tab-treatment-stage');
  await page.waitForTimeout(2000);
  
  // Expand nodes to see overlap
  await page.evaluate(() => {
    // Click all collapsible nodes to expand them
    const collapsibleNodes = document.querySelectorAll('.node .collapsible');
    console.log('Found collapsible nodes:', collapsibleNodes.length);
    collapsibleNodes.forEach((node, index) => {
      setTimeout(() => {
        node.parentElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }, index * 100);
    });
  });
  
  await page.waitForTimeout(3000);
  
  // Analyze the current separation function and node positions
  const analysis = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('.node'));
    const nodeData = [];
    
    nodes.forEach((node, i) => {
      const circle = node.querySelector('circle');
      const text = node.querySelector('text');
      const transform = node.getAttribute('transform');
      const match = transform ? transform.match(/translate\(([^,]+),([^)]+)\)/) : null;
      
      if (circle && match) {
        const rect = circle.getBoundingClientRect();
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;
        const radius = rect.width / 2;
        
        // Get the text content
        const nodeText = text ? text.textContent.replace(/\s+/g, ' ').trim() : '';
        
        nodeData.push({
          index: i,
          text: nodeText,
          svgX: parseFloat(match[1]),
          svgY: parseFloat(match[2]),
          screenX: centerX,
          screenY: centerY,
          radius: radius,
          depth: parseInt(circle.parentElement.querySelector('circle').getAttribute('r') === '48' ? 0 : 
                          circle.parentElement.querySelector('circle').getAttribute('r') === '38' ? 1 : 
                          circle.parentElement.querySelector('circle').getAttribute('r') === '32' ? 2 : 
                          circle.parentElement.querySelector('circle').getAttribute('r') === '26' ? 3 : 4)
        });
      }
    });
    
    // Check for overlaps
    const overlaps = [];
    for (let i = 0; i < nodeData.length; i++) {
      for (let j = i + 1; j < nodeData.length; j++) {
        const n1 = nodeData[i];
        const n2 = nodeData[j];
        
        if (n1.screenX && n2.screenX && n1.radius && n2.radius) {
          const distance = Math.sqrt(
            Math.pow(n1.screenX - n2.screenX, 2) + 
            Math.pow(n1.screenY - n2.screenY, 2)
          );
          const minDistance = n1.radius + n2.radius + 10; // 10px minimum padding
          
          if (distance < minDistance) {
            overlaps.push({
              node1: { index: i, text: n1.text, depth: n1.depth },
              node2: { index: j, text: n2.text, depth: n2.depth },
              distance: distance,
              minDistance: minDistance,
              overlap: minDistance - distance,
              sameDepth: n1.depth === n2.depth
            });
          }
        }
      }
    }
    
    return { nodeData, overlaps };
  });
  
  console.log('\n=== OVERLAP ANALYSIS ===');
  console.log(`Total nodes visible: ${analysis.nodeData.length}`);
  console.log(`Overlapping pairs found: ${analysis.overlaps.length}\n`);
  
  if (analysis.overlaps.length > 0) {
    console.log('Top overlaps:');
    analysis.overlaps
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 10)
      .forEach(o => {
        console.log(`- "${o.node1.text}" (depth ${o.node1.depth}) overlaps "${o.node2.text}" (depth ${o.node2.depth}) by ${o.overlap.toFixed(1)}px`);
      });
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'overlap_analysis.png', fullPage: false });
  console.log('\nScreenshot saved as overlap_analysis.png');
  
  // Now let's fix the overlap by adjusting the separation function
  console.log('\n=== APPLYING FIX ===');
  
  // Read the current HTML
  let html = fs.readFileSync('/Users/ramiefathy/Desktop/WebApps/CTCLMindMaps.html', 'utf8');
  
  // Create a much more aggressive separation function
  const newSeparationFunction = `                // Aggressive separation function to eliminate overlap
                const treeLayout = d3.tree()
                    .size([2 * Math.PI, Math.min(width, height) / 2 - (isMobile ? 80 : 120)])
                    .separation((a, b) => {
                        // Much more aggressive separation based on depth
                        if (a.parent === b.parent) {
                            // Siblings at same level
                            const depth = a.depth || 1;
                            // Exponentially increase separation at deeper levels
                            const depthFactor = Math.pow(1.8, depth); // Increased from 1.3 to 1.8
                            
                            // Consider if nodes have children
                            const aHasChildren = (a.children && a.children.length > 0) || (a._children && a._children.length > 0);
                            const bHasChildren = (b.children && b.children.length > 0) || (b._children && b._children.length > 0);
                            
                            // Give extra space to nodes with children
                            const childrenFactor = (aHasChildren || bHasChildren) ? 1.5 : 1;
                            
                            // Add base multiplier for all siblings
                            return depthFactor * childrenFactor * 1.2; // Added 1.2x base multiplier
                        }
                        // Non-siblings get even more separation
                        const depth = Math.max(a.depth || 1, b.depth || 1);
                        return Math.pow(1.8, depth) * 2; // Increased multiplier from 1.5 to 2
                    });`;
  
  // Replace the separation function
  const oldPattern = /\/\/ Fixed separation function[\s\S]*?return Math\.pow\(1\.3, depth\) \* 1\.5;\s*}\s*}\);/;
  
  if (oldPattern.test(html)) {
    html = html.replace(oldPattern, newSeparationFunction);
    console.log('Separation function updated with more aggressive spacing');
  } else {
    console.log('Could not find the separation function to replace');
  }
  
  // Also reduce node sizes slightly more
  const newNodeSizes = `                    // Smaller node sizes to further reduce overlap
                    const radii = [isMobile ? 35 : 42, isMobile ? 28 : 34, isMobile ? 23 : 28, isMobile ? 19 : 23, isMobile ? 16 : 19];
                    const fontSizes = [isMobile ? '10px' : '12px', isMobile ? '9px' : '10px', isMobile ? '8px' : '9px', isMobile ? '7px' : '8px', isMobile ? '6px' : '7px'];`;
  
  const oldNodeSizes = /\/\/ Balanced node sizes[\s\S]*?const fontSizes = \[.*?\];/;
  
  if (oldNodeSizes.test(html)) {
    html = html.replace(oldNodeSizes, newNodeSizes);
    console.log('Node sizes reduced');
  }
  
  // Write the fixed HTML
  fs.writeFileSync('/Users/ramiefathy/Desktop/WebApps/CTCLMindMaps.html', html);
  console.log('HTML file updated');
  
  // Reload and test the fix
  await page.reload();
  await page.waitForTimeout(2000);
  
  // Click the same tab again
  await page.click('#tab-treatment-stage');
  await page.waitForTimeout(2000);
  
  // Expand nodes again
  await page.evaluate(() => {
    const collapsibleNodes = document.querySelectorAll('.node .collapsible');
    collapsibleNodes.forEach((node, index) => {
      setTimeout(() => {
        node.parentElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }, index * 100);
    });
  });
  
  await page.waitForTimeout(3000);
  
  // Check if overlaps are fixed
  const fixedAnalysis = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('.node'));
    const overlaps = [];
    
    nodes.forEach((node1, i) => {
      const circle1 = node1.querySelector('circle');
      if (!circle1) return;
      
      const rect1 = circle1.getBoundingClientRect();
      const x1 = rect1.x + rect1.width / 2;
      const y1 = rect1.y + rect1.height / 2;
      const r1 = rect1.width / 2;
      
      nodes.forEach((node2, j) => {
        if (j <= i) return;
        
        const circle2 = node2.querySelector('circle');
        if (!circle2) return;
        
        const rect2 = circle2.getBoundingClientRect();
        const x2 = rect2.x + rect2.width / 2;
        const y2 = rect2.y + rect2.height / 2;
        const r2 = rect2.width / 2;
        
        if (x1 && x2 && r1 && r2) {
          const distance = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
          const minDistance = r1 + r2 + 10;
          
          if (distance < minDistance) {
            overlaps.push({ overlap: minDistance - distance });
          }
        }
      });
    });
    
    return overlaps.length;
  });
  
  console.log(`\n=== AFTER FIX ===`);
  console.log(`Overlapping pairs: ${fixedAnalysis}`);
  
  await page.screenshot({ path: 'overlap_fixed.png', fullPage: false });
  console.log('Screenshot saved as overlap_fixed.png');
  
  console.log('\nBrowser will stay open for 15 seconds for inspection...');
  await page.waitForTimeout(15000);
  
  await browser.close();
})();
