const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs').promises;

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testOverlapFix() {
    console.log('🔍 Testing overlap fix on all tabs...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        args: ['--force-device-scale-factor=1']
    });
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1400, height: 900 });
    
    const filePath = `file://${path.resolve(__dirname, 'PruritusMindMaps.html')}`;
    await page.goto(filePath);
    await delay(2000);
    
    const tabs = [
        { id: 'tab-approach', name: 'Approach' },
        { id: 'tab-classification', name: 'Classification' },
        { id: 'tab-pathophysiology', name: 'Pathophysiology' },
        { id: 'tab-modality', name: 'Therapeutic Modalities' },
        { id: 'tab-treatment-pn', name: 'Prurigo Nodularis Tx' },
        { id: 'tab-treatment-ckd', name: 'CKD-Associated Pruritus' },
        { id: 'tab-counseling', name: 'Patient Counseling' }
    ];
    
    let allResults = [];
    
    for (const tab of tabs) {
        console.log(`\n📊 Testing ${tab.name}...`);
        
        // Click tab
        await page.click(`#${tab.id}`);
        await delay(1500);
        
        // Expand all nodes
        await page.click('#expand-all');
        await delay(2000); // Wait for animations
        
        // Analyze nodes
        const analysis = await page.evaluate(() => {
            const nodes = document.querySelectorAll('.node');
            const nodeData = [];
            
            // Collect all node data
            nodes.forEach(node => {
                const transform = node.getAttribute('transform');
                const match = transform ? transform.match(/translate\(([-\d.]+),([-\d.]+)\)/) : null;
                const text = node.querySelector('text')?.textContent?.trim() || 'Unknown';
                const circle = node.querySelector('circle');
                const radius = parseFloat(circle?.getAttribute('r')) || 30;
                
                if (match) {
                    nodeData.push({
                        text: text.replace(/\s+/g, ''),
                        x: parseFloat(match[1]),
                        y: parseFloat(match[2]),
                        radius: radius
                    });
                }
            });
            
            // Check for exact position overlaps
            const positionMap = new Map();
            const exactOverlaps = [];
            
            nodeData.forEach(node => {
                const key = `${Math.round(node.x)},${Math.round(node.y)}`;
                if (positionMap.has(key)) {
                    exactOverlaps.push({
                        node1: positionMap.get(key),
                        node2: node.text,
                        position: key
                    });
                } else {
                    positionMap.set(key, node.text);
                }
            });
            
            // Check for visual overlaps (nodes too close)
            const visualOverlaps = [];
            for (let i = 0; i < nodeData.length; i++) {
                for (let j = i + 1; j < nodeData.length; j++) {
                    const n1 = nodeData[i];
                    const n2 = nodeData[j];
                    const distance = Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2));
                    const minRequired = n1.radius + n2.radius + 5; // 5px buffer
                    
                    if (distance < minRequired) {
                        visualOverlaps.push({
                            node1: n1.text,
                            node2: n2.text,
                            distance: distance.toFixed(1),
                            minRequired: minRequired.toFixed(1),
                            overlap: (minRequired - distance).toFixed(1)
                        });
                    }
                }
            }
            
            // Group nodes by depth (distance from center)
            const depthGroups = new Map();
            nodeData.forEach(node => {
                const distFromCenter = Math.sqrt(node.x * node.x + node.y * node.y);
                const depth = Math.round(distFromCenter / 50) * 50; // Round to nearest 50px
                if (!depthGroups.has(depth)) {
                    depthGroups.set(depth, []);
                }
                depthGroups.get(depth).push(node);
            });
            
            // Check angle distribution at each depth
            const angleAnalysis = [];
            depthGroups.forEach((nodes, depth) => {
                if (nodes.length > 1) {
                    const angles = nodes.map(n => Math.atan2(n.y, n.x) * 180 / Math.PI);
                    angles.sort((a, b) => a - b);
                    
                    const angleGaps = [];
                    for (let i = 0; i < angles.length; i++) {
                        const nextIndex = (i + 1) % angles.length;
                        let gap = angles[nextIndex] - angles[i];
                        if (i === angles.length - 1) {
                            gap = 360 + angles[0] - angles[i];
                        }
                        angleGaps.push(gap);
                    }
                    
                    const idealGap = 360 / nodes.length;
                    const minGap = Math.min(...angleGaps);
                    const maxGap = Math.max(...angleGaps);
                    
                    angleAnalysis.push({
                        depth: depth,
                        nodeCount: nodes.length,
                        idealGap: idealGap.toFixed(1),
                        minGap: minGap.toFixed(1),
                        maxGap: maxGap.toFixed(1),
                        wellDistributed: Math.abs(maxGap - minGap) < 20
                    });
                }
            });
            
            return {
                nodeCount: nodeData.length,
                exactOverlaps: exactOverlaps,
                visualOverlaps: visualOverlaps,
                angleAnalysis: angleAnalysis,
                nodes: nodeData
            };
        });
        
        // Report results
        console.log(`  Total nodes: ${analysis.nodeCount}`);
        
        if (analysis.exactOverlaps.length > 0) {
            console.log(`  ❌ EXACT OVERLAPS: ${analysis.exactOverlaps.length}`);
            analysis.exactOverlaps.forEach(o => {
                console.log(`     - "${o.node1}" and "${o.node2}" at ${o.position}`);
            });
        } else {
            console.log(`  ✅ No exact position overlaps`);
        }
        
        if (analysis.visualOverlaps.length > 0) {
            console.log(`  ⚠️  VISUAL OVERLAPS: ${analysis.visualOverlaps.length}`);
            analysis.visualOverlaps.forEach(o => {
                console.log(`     - "${o.node1}" ↔ "${o.node2}": ${o.overlap}px overlap`);
            });
        } else {
            console.log(`  ✅ No visual overlaps`);
        }
        
        // Check angle distribution
        console.log(`  📐 Angle distribution:`);
        analysis.angleAnalysis.forEach(a => {
            const status = a.wellDistributed ? '✅' : '⚠️';
            console.log(`     ${status} Depth ${a.depth}px: ${a.nodeCount} nodes, gaps: ${a.minGap}°-${a.maxGap}° (ideal: ${a.idealGap}°)`);
        });
        
        // Take screenshot
        await page.screenshot({ path: `overlap_test_${tab.id.replace('tab-', '')}.png` });
        
        allResults.push({
            tab: tab.name,
            ...analysis
        });
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('SUMMARY');
    console.log('='.repeat(50));
    
    let totalOverlaps = 0;
    allResults.forEach(result => {
        const overlaps = result.exactOverlaps.length + result.visualOverlaps.length;
        totalOverlaps += overlaps;
        const status = overlaps === 0 ? '✅' : '❌';
        console.log(`${status} ${result.tab}: ${overlaps} overlaps`);
    });
    
    if (totalOverlaps === 0) {
        console.log('\n🎉 SUCCESS! No overlaps detected in any tab!');
    } else {
        console.log(`\n❌ FAILED: ${totalOverlaps} total overlaps found`);
    }
    
    await delay(3000);
    await browser.close();
}

testOverlapFix().catch(console.error);