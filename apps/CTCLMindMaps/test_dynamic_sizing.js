const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  // Load the HTML file
  const filePath = 'file://' + path.resolve('/Users/ramiefathy/Desktop/WebApps/CTCLMindMaps.html');
  await page.goto(filePath);
  
  console.log('=== TESTING DYNAMIC NODE SIZING ===\n');
  
  // Test the "By Disease Stage" tab
  await page.click('#tab-treatment-stage');
  await page.waitForTimeout(2000);
  
  // Function to count visible nodes and measure sizes
  async function analyzeNodeSizes(description) {
    const analysis = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.node circle'));
      const visibleNodes = nodes.filter(n => {
        const r = parseFloat(n.getAttribute('r'));
        return r > 1; // Nodes with r > 1 are visible
      });
      
      const sizes = {};
      visibleNodes.forEach(node => {
        const r = parseFloat(node.getAttribute('r'));
        const depth = parseInt(node.parentElement.querySelector('circle').getAttribute('r') === '48' ? 0 : 
                              node.parentElement.querySelector('circle').getAttribute('r') === '38' ? 1 : 
                              node.parentElement.querySelector('circle').getAttribute('r') === '32' ? 2 : 
                              node.parentElement.querySelector('circle').getAttribute('r') === '26' ? 3 : 4);
        if (!sizes[`depth_${depth}`]) {
          sizes[`depth_${depth}`] = [];
        }
        sizes[`depth_${depth}`].push(r);
      });
      
      // Get text sizes
      const texts = Array.from(document.querySelectorAll('.node text'));
      const textSizes = texts.map(t => t.style.fontSize).filter(s => s);
      
      return {
        totalVisible: visibleNodes.length,
        sizesByDepth: sizes,
        uniqueTextSizes: [...new Set(textSizes)],
        avgRadius: visibleNodes.reduce((sum, n) => sum + parseFloat(n.getAttribute('r')), 0) / visibleNodes.length
      };
    });
    
    console.log(`${description}:`);
    console.log(`  Visible nodes: ${analysis.totalVisible}`);
    console.log(`  Average radius: ${analysis.avgRadius.toFixed(1)}px`);
    console.log(`  Text sizes: ${analysis.uniqueTextSizes.join(', ')}`);
    console.log('');
    
    return analysis;
  }
  
  // Test 1: Initial state (root collapsed)
  const initial = await analyzeNodeSizes('Initial state (root only)');
  
  // Test 2: Expand root
  await page.evaluate(() => {
    const rootNode = document.querySelector('.node');
    if (rootNode) rootNode.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await page.waitForTimeout(1000);
  const rootExpanded = await analyzeNodeSizes('Root expanded');
  
  // Test 3: Expand all first-level nodes
  await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('.node .collapsible'));
    nodes.forEach((node, i) => {
      if (i < 4) { // Expand first 4 collapsible nodes
        setTimeout(() => {
          node.parentElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }, i * 200);
      }
    });
  });
  await page.waitForTimeout(1500);
  const allExpanded = await analyzeNodeSizes('All nodes expanded');
  
  // Test 4: Collapse some nodes
  await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('.node'));
    // Click on some expanded nodes to collapse them
    if (nodes[2]) nodes[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    if (nodes[3]) nodes[3].dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await page.waitForTimeout(1000);
  const partialCollapsed = await analyzeNodeSizes('Some nodes collapsed');
  
  // Now implement dynamic sizing
  console.log('=== IMPLEMENTING DYNAMIC SIZING ===\n');
  
  // Read current HTML
  let html = fs.readFileSync('/Users/ramiefathy/Desktop/WebApps/CTCLMindMaps.html', 'utf8');
  
  // Create new update function with dynamic sizing
  const dynamicSizingCode = `
                function update(source) {
                    const duration = 500;
                    const treeData = treeLayout(root);
                    const nodes = treeData.descendants().reverse();
                    const links = treeData.links();

                    // Dynamic sizing based on number of visible nodes
                    const visibleNodeCount = nodes.filter(d => !d.children && !d._children ? true : 
                                                              d.children ? true : false).length;
                    
                    // Calculate size multiplier based on visible nodes
                    // Fewer nodes = larger size, more nodes = smaller size
                    let sizeMultiplier = 1.0;
                    if (visibleNodeCount <= 5) {
                        sizeMultiplier = 1.4; // Very few nodes, make them larger
                    } else if (visibleNodeCount <= 10) {
                        sizeMultiplier = 1.2;
                    } else if (visibleNodeCount <= 20) {
                        sizeMultiplier = 1.0;
                    } else if (visibleNodeCount <= 35) {
                        sizeMultiplier = 0.85;
                    } else {
                        sizeMultiplier = 0.7; // Many nodes, make them smaller
                    }
                    
                    // Base sizes that will be scaled
                    const baseRadii = [isMobile ? 30 : 36, isMobile ? 24 : 28, isMobile ? 20 : 24, isMobile ? 16 : 20, isMobile ? 14 : 17];
                    const baseFontSizes = [isMobile ? 9 : 11, isMobile ? 8 : 9, isMobile ? 7 : 8, isMobile ? 6 : 7, isMobile ? 5 : 6];
                    
                    // Apply dynamic scaling
                    const radii = baseRadii.map(r => Math.round(r * sizeMultiplier));
                    const fontSizes = baseFontSizes.map(s => Math.round(s * sizeMultiplier) + 'px');
                    
                    const colors = ['#a5b4fc', '#c7d2fe', '#e0e7ff', '#eef2ff', '#f9fafb'];
                    
                    // Debug log for testing
                    console.log(\`Visible nodes: \${visibleNodeCount}, Size multiplier: \${sizeMultiplier}\`);`;
  
  // Find and replace the update function
  const updateFunctionPattern = /function update\(source\) \{[\s\S]*?const colors = \['#a5b4fc'[^\]]*\];/;
  
  if (updateFunctionPattern.test(html)) {
    html = html.replace(updateFunctionPattern, dynamicSizingCode);
    
    // Write the updated HTML
    fs.writeFileSync('/Users/ramiefathy/Desktop/WebApps/CTCLMindMaps.html', html);
    console.log('Dynamic sizing code added successfully!\n');
    
    // Reload page to test dynamic sizing
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Re-test with dynamic sizing
    console.log('=== TESTING WITH DYNAMIC SIZING ===\n');
    
    await page.click('#tab-treatment-stage');
    await page.waitForTimeout(2000);
    
    // Test dynamic sizing with different node counts
    const dynamicInitial = await analyzeNodeSizes('Dynamic: Initial (should be large)');
    
    // Expand root
    await page.evaluate(() => {
      const rootNode = document.querySelector('.node');
      if (rootNode) rootNode.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await page.waitForTimeout(1000);
    const dynamicRoot = await analyzeNodeSizes('Dynamic: Root expanded (should be medium)');
    
    // Expand all nodes
    await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.node .collapsible'));
      nodes.forEach((node, i) => {
        setTimeout(() => {
          node.parentElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }, i * 100);
      });
    });
    await page.waitForTimeout(2000);
    const dynamicAll = await analyzeNodeSizes('Dynamic: All expanded (should be smaller)');
    
    // Check for overlaps with all nodes expanded
    const overlapCheck = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.node circle'));
      let overlaps = 0;
      
      for (let i = 0; i < nodes.length; i++) {
        const rect1 = nodes[i].getBoundingClientRect();
        const x1 = rect1.x + rect1.width / 2;
        const y1 = rect1.y + rect1.height / 2;
        const r1 = rect1.width / 2;
        
        for (let j = i + 1; j < nodes.length; j++) {
          const rect2 = nodes[j].getBoundingClientRect();
          const x2 = rect2.x + rect2.width / 2;
          const y2 = rect2.y + rect2.height / 2;
          const r2 = rect2.width / 2;
          
          if (r1 > 1 && r2 > 1) { // Only check visible nodes
            const distance = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
            const minDistance = r1 + r2 + 5; // 5px padding
            
            if (distance < minDistance) {
              overlaps++;
            }
          }
        }
      }
      
      return overlaps;
    });
    
    console.log(`\nOverlap check with all nodes: ${overlapCheck} overlapping pairs\n`);
    
    // Take screenshots
    await page.screenshot({ path: 'dynamic_few_nodes.png' });
    
    // Collapse most nodes
    await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.node'));
      nodes.forEach((node, i) => {
        if (i > 0 && i < 4) {
          node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      });
    });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'dynamic_many_nodes.png' });
    
    // Summary
    console.log('=== SUMMARY ===');
    console.log(`Initial avg radius: ${initial.avgRadius.toFixed(1)}px`);
    console.log(`Dynamic few nodes avg radius: ${dynamicInitial.avgRadius.toFixed(1)}px`);
    console.log(`Dynamic many nodes avg radius: ${dynamicAll.avgRadius.toFixed(1)}px`);
    console.log(`Size increase ratio: ${(dynamicInitial.avgRadius / dynamicAll.avgRadius).toFixed(2)}x`);
    
  } else {
    console.log('Could not find update function to replace!');
  }
  
  console.log('\nBrowser will remain open for 10 seconds for inspection...');
  await page.waitForTimeout(10000);
  
  await browser.close();
})();
