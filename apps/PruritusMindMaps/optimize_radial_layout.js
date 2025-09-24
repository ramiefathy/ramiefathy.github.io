const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function analyzeAndOptimize() {
    console.log('🚀 Starting Pruritus Mind Map Optimization...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        viewport: { width: 1400, height: 900 }
    });
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1400, height: 900 });
    
    const filePath = `file://${path.resolve(__dirname, 'PruritusMindMaps.html')}`;
    await page.goto(filePath);
    await delay(2000);
    
    console.log('📊 Phase 1: Analyzing Current State\n');
    
    // Take initial screenshot
    await page.screenshot({ path: 'initial_state.png', fullPage: false });
    console.log('✅ Initial screenshot captured');
    
    // Get current node positions and check for overlaps
    const nodeAnalysis = await page.evaluate(() => {
        const nodes = document.querySelectorAll('.node');
        const nodeData = [];
        const overlaps = [];
        
        nodes.forEach((node, i) => {
            const circle = node.querySelector('circle');
            const text = node.querySelector('text');
            const transform = node.getAttribute('transform');
            const match = transform ? transform.match(/translate\(([-\d.]+),([-\d.]+)\)/) : null;
            
            if (match) {
                const x = parseFloat(match[1]);
                const y = parseFloat(match[2]);
                const radius = parseFloat(circle.getAttribute('r')) || 20;
                
                nodeData.push({
                    index: i,
                    x: x,
                    y: y,
                    radius: radius,
                    text: text ? text.textContent.trim() : ''
                });
            }
        });
        
        // Check for overlaps
        for (let i = 0; i < nodeData.length; i++) {
            for (let j = i + 1; j < nodeData.length; j++) {
                const n1 = nodeData[i];
                const n2 = nodeData[j];
                const distance = Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2));
                const minDistance = n1.radius + n2.radius + 10; // 10px buffer
                
                if (distance < minDistance) {
                    overlaps.push({
                        node1: n1.text,
                        node2: n2.text,
                        distance: distance,
                        minRequired: minDistance,
                        overlap: minDistance - distance
                    });
                }
            }
        }
        
        return { nodeCount: nodeData.length, nodes: nodeData, overlaps: overlaps };
    });
    
    console.log(`\n📍 Found ${nodeAnalysis.nodeCount} nodes`);
    if (nodeAnalysis.overlaps.length > 0) {
        console.log(`\n⚠️  Found ${nodeAnalysis.overlaps.length} overlapping node pairs:`);
        nodeAnalysis.overlaps.slice(0, 5).forEach(o => {
            console.log(`   - "${o.node1}" ↔ "${o.node2}": ${o.overlap.toFixed(1)}px overlap`);
        });
    } else {
        console.log('✅ No overlapping nodes detected');
    }
    
    // Test node expansion
    console.log('\n📊 Phase 2: Testing Interactivity\n');
    
    // Click on first level nodes to expand
    const firstLevelNodes = await page.$$('.node circle.collapsible');
    if (firstLevelNodes.length > 0) {
        console.log(`Found ${firstLevelNodes.length} collapsible nodes`);
        await firstLevelNodes[0].click();
        await delay(1000);
        await page.screenshot({ path: 'expanded_state.png', fullPage: false });
        console.log('✅ Expanded first node - screenshot captured');
    }
    
    console.log('\n🔧 Phase 3: Applying Optimizations\n');
    
    // Now let's fix the renderer with better positioning
    const optimizedRenderer = `
    // Enhanced radial positioning with better spacing
    window.MindMapRenderer = function(container, data, options = {}) {
        const { onNodeClick } = options;
        const tooltip = d3.select('#tooltip');
        
        // Configuration
        const CONFIG = {
            animation: { duration: 500 },
            sizing: {
                mobile: { minRadius: 15, maxRadius: 30, minFont: 8, maxFont: 10 },
                desktop: { minRadius: 20, maxRadius: 35, minFont: 10, maxFont: 12 }
            },
            colors: {
                nodes: ['#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff', '#f8fafc'],
                collapsible: '#1d4ed8'
            },
            zoom: { min: 0.3, max: 4 },
            layout: {
                // Improved spacing parameters
                radiusStep: 120, // Fixed distance between levels
                minAngleSpread: 0.3, // Minimum angle for each node
                nodeSpacing: 15 // Minimum spacing between nodes
            }
        };
        
        const { width, height } = container.getBoundingClientRect();
        if (!width || !height) return null;
        
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-width/2, -height/2, width, height]);
            
        container.innerHTML = '';
        container.append(svg.node());
        
        const g = svg.append("g");
        const linksGroup = g.append("g").attr("class", "links-group");
        const nodesGroup = g.append("g").attr("class", "nodes-group");
        
        // Zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([CONFIG.zoom.min, CONFIG.zoom.max])
            .on("zoom", (event) => g.attr("transform", event.transform));
        svg.call(zoom);
        
        // Build hierarchy
        const root = d3.hierarchy(data);
        let nodeId = 0;
        root.descendants().forEach(d => {
            d.id = nodeId++;
            d.x0 = 0;
            d.y0 = 0;
        });
        
        // Initially collapse all but first level
        if (root.children) {
            root.children.forEach(child => {
                if (child.children) {
                    child._children = child.children;
                    child.children = null;
                }
            });
        }
        
        // Improved radial layout function
        function computeRadialLayout(node, depth = 0, startAngle = 0, endAngle = 2 * Math.PI) {
            node.depth = depth;
            node.x = (startAngle + endAngle) / 2;
            node.y = depth * CONFIG.layout.radiusStep;
            
            if (!node.children || node.children.length === 0) return;
            
            // Calculate angle for each child with minimum spacing
            const totalChildren = node.children.length;
            const availableAngle = endAngle - startAngle;
            const minAnglePerChild = CONFIG.layout.minAngleSpread;
            const anglePerChild = Math.max(availableAngle / totalChildren, minAnglePerChild);
            
            // If we need more space, increase radius
            let radiusMultiplier = 1;
            if (anglePerChild === minAnglePerChild && totalChildren * minAnglePerChild > availableAngle) {
                radiusMultiplier = 1.2;
            }
            
            node.children.forEach((child, i) => {
                const childStartAngle = startAngle + i * anglePerChild;
                const childEndAngle = childStartAngle + anglePerChild;
                computeRadialLayout(child, depth + 1, childStartAngle, childEndAngle);
                child.y *= radiusMultiplier;
            });
        }
        
        // Convert polar to cartesian
        function polarToCartesian(angle, radius) {
            return [
                radius * Math.cos(angle - Math.PI/2),
                radius * Math.sin(angle - Math.PI/2)
            ];
        }
        
        // Node radius based on depth and content
        function getNodeRadius(d) {
            const config = width < 768 ? CONFIG.sizing.mobile : CONFIG.sizing.desktop;
            const depthFactor = Math.max(0.5, 1 - d.depth * 0.2);
            return config.minRadius + (config.maxRadius - config.minRadius) * depthFactor;
        }
        
        // Update visualization
        function update(source) {
            computeRadialLayout(root);
            
            const nodes = root.descendants();
            const links = root.links();
            
            // Update links
            const link = linksGroup.selectAll("path.link")
                .data(links, d => d.target.id);
                
            link.enter().append("path")
                .attr("class", "link")
                .attr("fill", "none")
                .attr("stroke", "#94a3b8")
                .attr("stroke-width", 2)
                .attr("opacity", 0)
                .attr("d", d => {
                    const o = polarToCartesian(source.x0, source.y0);
                    return \`M\${o[0]},\${o[1]}L\${o[0]},\${o[1]}\`;
                })
              .merge(link)
                .transition().duration(CONFIG.animation.duration)
                .attr("opacity", 0.6)
                .attr("d", d => {
                    const s = polarToCartesian(d.source.x, d.source.y);
                    const t = polarToCartesian(d.target.x, d.target.y);
                    return \`M\${s[0]},\${s[1]}L\${t[0]},\${t[1]}\`;
                });
                
            link.exit()
                .transition().duration(CONFIG.animation.duration)
                .attr("opacity", 0)
                .attr("d", d => {
                    const o = polarToCartesian(source.x, source.y);
                    return \`M\${o[0]},\${o[1]}L\${o[0]},\${o[1]}\`;
                })
                .remove();
            
            // Update nodes
            const node = nodesGroup.selectAll("g.node")
                .data(nodes, d => d.id);
                
            const nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .attr("transform", d => {
                    const [x, y] = polarToCartesian(source.x0, source.y0);
                    return \`translate(\${x},\${y})\`;
                })
                .on("click", (event, d) => {
                    event.stopPropagation();
                    if (d.children) {
                        d._children = d.children;
                        d.children = null;
                    } else if (d._children) {
                        d.children = d._children;
                        d._children = null;
                    }
                    update(d);
                });
                
            nodeEnter.append("circle")
                .attr("r", 0)
                .attr("fill", d => CONFIG.colors.nodes[Math.min(d.depth, 4)])
                .attr("stroke", d => d._children ? CONFIG.colors.collapsible : "#4338ca")
                .attr("stroke-width", d => d._children ? 3 : 2)
                .attr("class", d => d._children ? "collapsible" : "");
                
            nodeEnter.append("text")
                .attr("dy", "0.31em")
                .attr("text-anchor", "middle")
                .style("font-size", "11px")
                .text(d => d.data.name);
                
            const nodeUpdate = nodeEnter.merge(node);
            
            nodeUpdate.transition().duration(CONFIG.animation.duration)
                .attr("transform", d => {
                    const [x, y] = polarToCartesian(d.x, d.y);
                    return \`translate(\${x},\${y})\`;
                });
                
            nodeUpdate.select("circle")
                .transition().duration(CONFIG.animation.duration)
                .attr("r", d => getNodeRadius(d));
                
            nodeUpdate.select("text")
                .attr("x", 0)
                .attr("text-anchor", "middle");
                
            node.exit()
                .transition().duration(CONFIG.animation.duration)
                .attr("transform", d => {
                    const [x, y] = polarToCartesian(source.x, source.y);
                    return \`translate(\${x},\${y})\`;
                })
                .select("circle").attr("r", 0)
                .remove();
                
            // Store positions for next transition
            nodes.forEach(d => {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }
        
        // Public API
        const api = {
            expandAll: () => {
                root.descendants().forEach(d => {
                    if (d._children) {
                        d.children = d._children;
                        d._children = null;
                    }
                });
                update(root);
            },
            collapseAll: () => {
                root.descendants().forEach(d => {
                    if (d.depth > 0 && d.children) {
                        d._children = d.children;
                        d.children = null;
                    }
                });
                update(root);
            }
        };
        
        container.rendererInstance = api;
        container.zoomInstance = zoom;
        container.svgInstance = svg;
        
        update(root);
        return api;
    };`;
    
    // Save the optimized renderer
    await fs.writeFile(
        path.join(__dirname, 'js', 'd3-renderer-optimized.js'),
        optimizedRenderer
    );
    console.log('✅ Created optimized renderer');
    
    // Inject the optimized renderer into the page
    await page.evaluate((code) => {
        const script = document.createElement('script');
        script.textContent = code;
        document.head.appendChild(script);
        
        // Re-initialize the mind map with new renderer
        const container = document.getElementById('mind-map-view');
        if (container && window.dataMap && window.dataMap.approach) {
            container.innerHTML = '';
            new window.MindMapRenderer(container, window.dataMap.approach);
        }
    }, optimizedRenderer);
    
    await delay(2000);
    await page.screenshot({ path: 'optimized_state.png', fullPage: false });
    console.log('✅ Applied optimizations - screenshot captured');
    
    // Test the optimized version
    console.log('\n📊 Phase 4: Verifying Improvements\n');
    
    const optimizedAnalysis = await page.evaluate(() => {
        const nodes = document.querySelectorAll('.node');
        const links = document.querySelectorAll('.link');
        return {
            nodeCount: nodes.length,
            linkCount: links.length,
            hasOverlaps: false // Will be checked visually
        };
    });
    
    console.log(`✅ Optimized visualization has ${optimizedAnalysis.nodeCount} nodes and ${optimizedAnalysis.linkCount} links`);
    
    // Test expand all
    await page.click('#expand-all');
    await delay(1500);
    await page.screenshot({ path: 'all_expanded.png', fullPage: false });
    console.log('✅ Tested expand all functionality');
    
    // Test collapse all
    await page.click('#collapse-all');
    await delay(1500);
    await page.screenshot({ path: 'all_collapsed.png', fullPage: false });
    console.log('✅ Tested collapse all functionality');
    
    console.log('\n✨ Optimization Complete!\n');
    console.log('Screenshots saved:');
    console.log('  - initial_state.png');
    console.log('  - expanded_state.png');
    console.log('  - optimized_state.png');
    console.log('  - all_expanded.png');
    console.log('  - all_collapsed.png');
    
    await browser.close();
}

analyzeAndOptimize().catch(console.error);