const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runDetailedReview() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    try {
        console.log('=== DETAILED DESIGN REVIEW ===\n');
        
        // Navigate to the application
        const htmlPath = path.resolve(__dirname, 'AutoimmuneBullousMindMaps.html');
        const fileUrl = `file://${htmlPath}`;
        console.log(`Loading: ${fileUrl}`);
        await page.goto(fileUrl);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000); // Give extra time for D3 rendering
        
        // Click on Pathology Findings tab
        console.log('Clicking Pathology Findings tab...');
        await page.click('[data-tab="pathology"]');
        await page.waitForTimeout(2000);
        
        // Take initial screenshot
        await page.screenshot({ path: 'detailed_initial_view.png', fullPage: false });
        console.log('✓ Initial screenshot captured');
        
        // Check browser console
        const consoleLogs = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleLogs.push(`ERROR: ${msg.text()}`);
            } else if (msg.type() === 'warning') {
                consoleLogs.push(`WARNING: ${msg.text()}`);
            }
        });
        
        // Detailed analysis of the current state
        const analysis = await page.evaluate(() => {
            const results = {
                svg: null,
                nodes: [],
                links: [],
                nodeDetails: [],
                issues: []
            };
            
            // Find the SVG container
            const svg = document.querySelector('svg');
            if (!svg) {
                results.issues.push('No SVG found');
                return results;
            }
            
            results.svg = {
                width: svg.getAttribute('width') || svg.clientWidth,
                height: svg.getAttribute('height') || svg.clientHeight,
                viewBox: svg.getAttribute('viewBox')
            };
            
            // Find all nodes
            const nodes = svg.querySelectorAll('g[data-id], g.node, circle, rect');
            console.log('Found node elements:', nodes.length);
            
            nodes.forEach((node, index) => {
                let nodeData = {
                    index: index,
                    tagName: node.tagName,
                    classes: node.className.baseVal || node.className,
                    dataId: node.getAttribute('data-id'),
                    dataDepth: node.getAttribute('data-depth'),
                    transform: node.getAttribute('transform')
                };
                
                // Get bounding box
                try {
                    const bbox = node.getBoundingClientRect();
                    nodeData.bbox = {
                        x: bbox.x,
                        y: bbox.y,
                        width: bbox.width,
                        height: bbox.height
                    };
                } catch (e) {
                    nodeData.bbox = null;
                }
                
                // Get text content
                const text = node.querySelector('text') || node.parentElement?.querySelector('text');
                if (text) {
                    nodeData.text = text.textContent.trim();
                }
                
                // Check if it's a clickable/expandable node
                const hasClickHandler = node.style.cursor === 'pointer' || node.onclick !== null;
                nodeData.clickable = hasClickHandler;
                
                results.nodeDetails.push(nodeData);
            });
            
            // Find links/connections
            const links = svg.querySelectorAll('path, line');
            links.forEach((link, index) => {
                results.links.push({
                    index: index,
                    tagName: link.tagName,
                    classes: link.className.baseVal || link.className,
                    d: link.getAttribute('d'),
                    stroke: link.getAttribute('stroke') || getComputedStyle(link).stroke,
                    visible: link.style.display !== 'none' && link.style.visibility !== 'hidden'
                });
            });
            
            return results;
        });
        
        console.log('\\n=== CURRENT STATE ANALYSIS ===');
        console.log(`SVG dimensions: ${analysis.svg?.width}x${analysis.svg?.height}`);
        console.log(`Found ${analysis.nodeDetails.length} node elements`);
        console.log(`Found ${analysis.links.length} link elements`);
        
        // Identify the main nodes based on text content
        const pathologyNodes = analysis.nodeDetails.filter(node => 
            node.text && (
                node.text.includes('Intraepidermal') ||
                node.text.includes('Subepidermal') ||
                node.text.includes('IgG-Mediated') ||
                node.text.includes('IgA-Mediated') ||
                node.text === 'Pathology Findings'
            )
        );
        
        console.log('\\n=== PATHOLOGY NODES FOUND ===');
        pathologyNodes.forEach((node, i) => {
            console.log(`${i + 1}. "${node.text}" (${node.tagName}, classes: ${node.classes})`);
            if (node.bbox) {
                console.log(`   Position: (${Math.round(node.bbox.x)}, ${Math.round(node.bbox.y)})`);
                console.log(`   Size: ${Math.round(node.bbox.width)}x${Math.round(node.bbox.height)}`);
            }
            console.log(`   Clickable: ${node.clickable ? 'Yes' : 'Unknown'}`);
        });
        
        // Try to click on the main category nodes
        console.log('\\n=== ATTEMPTING TO EXPAND NODES ===');
        
        const mainCategoryNodes = pathologyNodes.filter(node => 
            node.text && (
                node.text.includes('Intraepidermal') ||
                node.text.includes('Subepidermal')
            ) && !node.text.includes('Pathology Findings')
        );
        
        for (let i = 0; i < Math.min(mainCategoryNodes.length, 3); i++) {
            const node = mainCategoryNodes[i];
            if (node.bbox && node.bbox.width > 0 && node.bbox.height > 0) {
                const centerX = node.bbox.x + node.bbox.width / 2;
                const centerY = node.bbox.y + node.bbox.height / 2;
                
                console.log(`Clicking on "${node.text}" at (${Math.round(centerX)}, ${Math.round(centerY)})`);
                
                try {
                    await page.mouse.click(centerX, centerY);
                    await page.waitForTimeout(1500); // Wait for animation
                    console.log(`✓ Clicked on "${node.text}"`);
                } catch (error) {
                    console.log(`✗ Failed to click on "${node.text}": ${error.message}`);
                }
            }
        }
        
        // Take final screenshot
        await page.screenshot({ path: 'detailed_expanded_view.png', fullPage: false });
        console.log('✓ Final screenshot captured');
        
        // Final verification
        const finalAnalysis = await page.evaluate(() => {
            const analysis = {
                centralNode: null,
                level1Nodes: [],
                level2Nodes: [],
                sizing: {
                    issues: []
                },
                connections: {
                    visible: 0,
                    total: 0
                }
            };
            
            // Check for nodes at different levels based on position and text content
            const svg = document.querySelector('svg');
            if (!svg) return analysis;
            
            const allNodes = Array.from(svg.querySelectorAll('g, circle, rect')).map(node => {
                const text = node.querySelector('text') || node.parentElement?.querySelector('text');
                let bbox;
                try {
                    bbox = node.getBoundingClientRect();
                } catch (e) {
                    bbox = null;
                }
                
                return {
                    element: node,
                    text: text ? text.textContent.trim() : '',
                    bbox: bbox,
                    transform: node.getAttribute('transform')
                };
            }).filter(node => node.text && node.bbox && node.bbox.width > 0);
            
            // Find central node
            const central = allNodes.find(node => node.text === 'Pathology Findings');
            if (central) {
                analysis.centralNode = {
                    text: central.text,
                    width: central.bbox.width,
                    height: central.bbox.height,
                    x: central.bbox.x,
                    y: central.bbox.y
                };
            }
            
            // Find level 1 nodes (main categories)
            analysis.level1Nodes = allNodes.filter(node => 
                node.text.includes('Intraepidermal') || 
                (node.text.includes('Subepidermal') && !node.text.includes('Pathology Findings'))
            ).map(node => ({
                text: node.text,
                width: node.bbox.width,
                height: node.bbox.height,
                x: node.bbox.x,
                y: node.bbox.y
            }));
            
            // Find level 2 nodes (disease-specific nodes)
            analysis.level2Nodes = allNodes.filter(node => 
                node.text.includes('Pemphigus') || 
                node.text.includes('Bullous') || 
                node.text.includes('Dermatitis') ||
                node.text.includes('EBA') ||
                node.text.includes('Linear')
            ).map(node => ({
                text: node.text,
                width: node.bbox.width,
                height: node.bbox.height,
                x: node.bbox.x,
                y: node.bbox.y
            }));
            
            // Size comparisons
            if (analysis.centralNode && analysis.level1Nodes.length > 0) {
                analysis.level1Nodes.forEach(node => {
                    const sizeDiff = Math.abs(node.width - analysis.centralNode.width);
                    if (sizeDiff > 10) { // Allow 10px tolerance
                        analysis.sizing.issues.push(`Level 1 node "${node.text}" width (${node.width}) differs from central node width (${analysis.centralNode.width})`);
                    }
                });
            }
            
            // Check if level 2 nodes are smaller than level 1
            if (analysis.level1Nodes.length > 0 && analysis.level2Nodes.length > 0) {
                const avgLevel1Size = analysis.level1Nodes.reduce((sum, node) => sum + node.width, 0) / analysis.level1Nodes.length;
                analysis.level2Nodes.forEach(node => {
                    if (node.width >= avgLevel1Size) {
                        analysis.sizing.issues.push(`Level 2 node "${node.text}" is not smaller than level 1 nodes`);
                    }
                });
            }
            
            // Count connections
            const connections = svg.querySelectorAll('path, line');
            analysis.connections.total = connections.length;
            connections.forEach(conn => {
                if (conn.style.display !== 'none' && conn.style.visibility !== 'hidden') {
                    analysis.connections.visible++;
                }
            });
            
            return analysis;
        });
        
        console.log('\\n=== VERIFICATION RESULTS ===');
        
        // Central node check
        if (finalAnalysis.centralNode) {
            console.log(`✓ Central node found: "${finalAnalysis.centralNode.text}" (${finalAnalysis.centralNode.width}x${finalAnalysis.centralNode.height})`);
        } else {
            console.log('✗ Central node not found');
        }
        
        // Main nodes check
        console.log(`\\nMain category nodes (${finalAnalysis.level1Nodes.length} found):`);
        finalAnalysis.level1Nodes.forEach((node, i) => {
            console.log(`  ${i + 1}. "${node.text}" - ${node.width}x${node.height}`);
        });
        
        if (finalAnalysis.level1Nodes.length !== 3) {
            console.log('⚠️  Expected 3 main nodes, found', finalAnalysis.level1Nodes.length);
        }
        
        // Child nodes check
        console.log(`\\nChild nodes (${finalAnalysis.level2Nodes.length} found):`);
        finalAnalysis.level2Nodes.forEach((node, i) => {
            console.log(`  ${i + 1}. "${node.text}" - ${node.width}x${node.height}`);
        });
        
        // Sizing issues
        console.log('\\nSizing analysis:');
        if (finalAnalysis.sizing.issues.length === 0) {
            console.log('✓ No sizing issues detected');
        } else {
            finalAnalysis.sizing.issues.forEach(issue => {
                console.log('⚠️ ', issue);
            });
        }
        
        // Connections check
        console.log(`\\nConnections: ${finalAnalysis.connections.visible}/${finalAnalysis.connections.total} visible`);
        if (finalAnalysis.connections.visible > 0) {
            console.log('✓ Connecting lines are visible');
        } else {
            console.log('⚠️  No visible connecting lines found');
        }
        
        // Console errors
        console.log('\\nConsole messages:');
        if (consoleLogs.length === 0) {
            console.log('✓ No console errors or warnings');
        } else {
            consoleLogs.forEach(log => console.log(log));
        }
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            analysis: analysis,
            finalAnalysis: finalAnalysis,
            consoleLogs: consoleLogs,
            screenshots: ['detailed_initial_view.png', 'detailed_expanded_view.png']
        };
        
        fs.writeFileSync('detailed_review_report.json', JSON.stringify(report, null, 2));
        console.log('\\n✓ Detailed report saved to: detailed_review_report.json');
        
        console.log('\\n=== REVIEW COMPLETED ===');
        
    } catch (error) {
        console.error('Error during detailed review:', error);
    } finally {
        await browser.close();
    }
}

runDetailedReview().catch(console.error);