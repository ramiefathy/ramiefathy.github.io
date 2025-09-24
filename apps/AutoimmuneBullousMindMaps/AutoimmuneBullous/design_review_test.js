const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runDesignReview() {
    // Launch browser
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    try {
        console.log('Phase 0: Preparation & Initial Setup');
        
        // Navigate to the mind map
        const htmlPath = path.resolve(__dirname, 'AutoimmuneBullousMindMaps.html');
        const fileUrl = `file://${htmlPath}`;
        console.log(`Navigating to: ${fileUrl}`);
        await page.goto(fileUrl);
        
        // Wait for the page to load completely
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        console.log('✓ Application loaded successfully');
        
        // Phase 1: Click on Pathology Findings tab
        console.log('\nPhase 1: Clicking on Pathology Findings tab');
        await page.click('[data-tab="pathology"]');
        await page.waitForTimeout(1000);
        
        console.log('✓ Pathology Findings tab activated');
        
        // Phase 2: Take initial screenshot
        console.log('\nPhase 2: Taking initial view screenshot');
        await page.screenshot({ path: 'pathology_initial_view.png', fullPage: false });
        console.log('✓ Initial screenshot captured: pathology_initial_view.png');
        
        // Phase 3: Check console for errors
        console.log('\nPhase 3: Checking browser console for errors');
        const consoleLogs = [];
        page.on('console', msg => consoleLogs.push(`${msg.type()}: ${msg.text()}`));
        
        // Get any existing console messages
        const existingErrors = await page.evaluate(() => {
            const errors = [];
            // Check for any JavaScript errors that might have occurred
            if (window.console && window.console._errors) {
                errors.push(...window.console._errors);
            }
            return errors;
        });
        
        console.log('Console messages captured:', consoleLogs);
        
        // Phase 4: Identify and expand the main nodes
        console.log('\nPhase 4: Identifying main nodes and expanding them');
        
        // Wait for the SVG to be rendered
        await page.waitForSelector('svg', { timeout: 10000 });
        
        // Find all top-level expandable nodes (children of root)
        const mainNodes = await page.evaluate(() => {
            const nodes = document.querySelectorAll('g.node[data-depth="1"]');
            const nodeInfo = [];
            nodes.forEach((node, index) => {
                const rect = node.querySelector('rect, circle');
                const text = node.querySelector('text');
                if (rect && text) {
                    const bbox = rect.getBoundingClientRect();
                    nodeInfo.push({
                        index: index,
                        text: text.textContent,
                        x: bbox.x + bbox.width/2,
                        y: bbox.y + bbox.height/2,
                        width: bbox.width,
                        height: bbox.height
                    });
                }
            });
            return nodeInfo;
        });
        
        console.log(`Found ${mainNodes.length} main nodes:`, mainNodes.map(n => n.text));
        
        // Click on each main node to expand them
        for (let i = 0; i < Math.min(mainNodes.length, 3); i++) {
            const node = mainNodes[i];
            console.log(`Expanding node ${i + 1}: "${node.text}"`);
            await page.mouse.click(node.x, node.y);
            await page.waitForTimeout(1000); // Wait for animation
        }
        
        console.log('✓ All main nodes expanded');
        
        // Phase 5: Take expanded state screenshot
        console.log('\nPhase 5: Taking expanded state screenshot');
        await page.screenshot({ path: 'pathology_expanded_view.png', fullPage: false });
        console.log('✓ Expanded state screenshot captured: pathology_expanded_view.png');
        
        // Phase 6: Verification checks
        console.log('\nPhase 6: Performing layout and sizing verification');
        
        const layoutAnalysis = await page.evaluate(() => {
            const analysis = {
                mainNodes: [],
                centralNode: null,
                childNodes: [],
                connections: [],
                issues: []
            };
            
            // Find central node (root)
            const central = document.querySelector('g.node[data-depth="0"]');
            if (central) {
                const rect = central.querySelector('rect, circle');
                if (rect) {
                    const bbox = rect.getBoundingClientRect();
                    analysis.centralNode = {
                        width: bbox.width,
                        height: bbox.height,
                        element: 'central'
                    };
                }
            }
            
            // Analyze main nodes (level 1)
            document.querySelectorAll('g.node[data-depth="1"]').forEach((node, index) => {
                const rect = node.querySelector('rect, circle');
                const text = node.querySelector('text');
                if (rect && text) {
                    const bbox = rect.getBoundingClientRect();
                    analysis.mainNodes.push({
                        index: index,
                        text: text.textContent,
                        width: bbox.width,
                        height: bbox.height,
                        x: bbox.x,
                        y: bbox.y
                    });
                }
            });
            
            // Analyze child nodes (level 2)
            document.querySelectorAll('g.node[data-depth="2"]').forEach((node, index) => {
                const rect = node.querySelector('rect, circle');
                const text = node.querySelector('text');
                if (rect && text) {
                    const bbox = rect.getBoundingClientRect();
                    analysis.childNodes.push({
                        index: index,
                        text: text.textContent,
                        width: bbox.width,
                        height: bbox.height,
                        x: bbox.x,
                        y: bbox.y,
                        parent: node.getAttribute('data-parent')
                    });
                }
            });
            
            // Check for overlaps
            const allNodes = [...analysis.mainNodes, ...analysis.childNodes];
            for (let i = 0; i < allNodes.length; i++) {
                for (let j = i + 1; j < allNodes.length; j++) {
                    const node1 = allNodes[i];
                    const node2 = allNodes[j];
                    
                    const overlap = !(
                        node1.x + node1.width < node2.x ||
                        node2.x + node2.width < node1.x ||
                        node1.y + node1.height < node2.y ||
                        node2.y + node2.height < node1.y
                    );
                    
                    if (overlap) {
                        analysis.issues.push({
                            type: 'overlap',
                            node1: node1.text,
                            node2: node2.text
                        });
                    }
                }
            }
            
            // Check connections visibility
            const links = document.querySelectorAll('path.link, line.link');
            analysis.connections.push({
                count: links.length,
                visible: links.length > 0
            });
            
            return analysis;
        });
        
        // Report findings
        console.log('\n=== DESIGN REVIEW RESULTS ===');
        console.log('\n1. Main Nodes Analysis:');
        console.log(`   - Found ${layoutAnalysis.mainNodes.length} main nodes`);
        if (layoutAnalysis.centralNode) {
            console.log(`   - Central node size: ${layoutAnalysis.centralNode.width}x${layoutAnalysis.centralNode.height}`);
        }
        
        layoutAnalysis.mainNodes.forEach((node, i) => {
            console.log(`   - Node ${i + 1} "${node.text}": ${node.width}x${node.height}`);
            if (layoutAnalysis.centralNode && node.width !== layoutAnalysis.centralNode.width) {
                console.log(`     ⚠️  Size mismatch with central node`);
            }
        });
        
        console.log('\n2. Child Nodes Analysis:');
        console.log(`   - Found ${layoutAnalysis.childNodes.length} child nodes`);
        layoutAnalysis.childNodes.forEach((child, i) => {
            const parentNode = layoutAnalysis.mainNodes.find(p => p.text === child.parent);
            if (parentNode && child.width >= parentNode.width) {
                console.log(`   ⚠️  Child "${child.text}" is not smaller than parent`);
            }
        });
        
        console.log('\n3. Layout Issues:');
        if (layoutAnalysis.issues.length === 0) {
            console.log('   ✓ No overlapping nodes detected');
        } else {
            layoutAnalysis.issues.forEach(issue => {
                console.log(`   ❌ Overlap detected: "${issue.node1}" and "${issue.node2}"`);
            });
        }
        
        console.log('\n4. Connections:');
        console.log(`   - Found ${layoutAnalysis.connections[0]?.count || 0} connection elements`);
        console.log(`   - Connections visible: ${layoutAnalysis.connections[0]?.visible ? '✓ Yes' : '❌ No'}`);
        
        console.log('\n5. Console Errors:');
        if (consoleLogs.length === 0) {
            console.log('   ✓ No console errors detected');
        } else {
            consoleLogs.forEach(log => {
                console.log(`   ${log}`);
            });
        }
        
        // Save analysis report
        const report = {
            timestamp: new Date().toISOString(),
            consoleLogs: consoleLogs,
            layoutAnalysis: layoutAnalysis,
            screenshots: ['pathology_initial_view.png', 'pathology_expanded_view.png']
        };
        
        fs.writeFileSync('design_review_report.json', JSON.stringify(report, null, 2));
        console.log('\n✓ Detailed report saved to: design_review_report.json');
        console.log('\n=== DESIGN REVIEW COMPLETED ===');
        
    } catch (error) {
        console.error('Error during design review:', error);
    } finally {
        await browser.close();
    }
}

// Run the design review
runDesignReview().catch(console.error);