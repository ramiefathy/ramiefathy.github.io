const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAndFixLayout() {
    console.log('🚀 Testing and fixing Pruritus Mind Map layout...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        args: ['--force-device-scale-factor=1']
    });
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1400, height: 900 });
    
    const filePath = `file://${path.resolve(__dirname, 'PruritusMindMaps.html')}`;
    await page.goto(filePath);
    await delay(2000);
    
    console.log('📊 Analyzing current node positions...\n');
    
    // Take screenshot of current state
    await page.screenshot({ path: 'before_fix.png' });
    console.log('✅ Screenshot saved: before_fix.png');
    
    // Analyze current positions
    const analysis = await page.evaluate(() => {
        const nodes = document.querySelectorAll('.node');
        const positions = [];
        
        nodes.forEach(node => {
            const transform = node.getAttribute('transform');
            const text = node.querySelector('text')?.textContent || '';
            if (transform) {
                const match = transform.match(/translate\(([-\d.]+),([-\d.]+)\)/);
                if (match) {
                    positions.push({
                        text: text.trim(),
                        x: parseFloat(match[1]),
                        y: parseFloat(match[2])
                    });
                }
            }
        });
        
        return positions;
    });
    
    console.log('Current node positions:');
    analysis.forEach(node => {
        console.log(`  ${node.text}: (${node.x.toFixed(1)}, ${node.y.toFixed(1)})`);
    });
    
    // The issue is in the polarToCartesian function - it's using the wrong angle offset
    console.log('\n🔧 Applying fix to make nodes horizontal...\n');
    
    // Inject the corrected renderer
    await page.evaluate(() => {
        // Clear the current visualization
        const container = document.getElementById('mind-map-view');
        if (!container || !window.dataMap) return;
        
        container.innerHTML = '';
        
        // Create corrected renderer with proper angle calculation
        window.MindMapRenderer = function(container, data, options = {}) {
            const { onNodeClick } = options;
            const tooltip = d3.select('#tooltip');
            
            const CONFIG = {
                animation: { duration: 500 },
                sizing: {
                    mobile: { minRadius: 12, maxRadius: 25, minFont: 8, maxFont: 10 },
                    desktop: { minRadius: 15, maxRadius: 30, minFont: 9, maxFont: 11 }
                },
                colors: {
                    nodes: ['#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff', '#f8fafc'],
                    collapsible: '#1d4ed8'
                },
                zoom: { min: 0.3, max: 4 },
                layout: {
                    firstLevelRadius: 100,
                    levelStep: 80,
                    minNodeSpacing: 5
                }
            };
            
            const { width, height } = container.getBoundingClientRect();
            if (!width || !height) return null;
            
            const isMobile = width < 768;
            const centerX = width / 2;
            const centerY = height / 2;
            
            const svg = d3.create("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("viewBox", [0, 0, width, height]);
            
            container.innerHTML = '';
            container.append(svg.node());
            
            const g = svg.append("g")
                .attr("transform", `translate(${centerX}, ${centerY})`);
            
            const linksGroup = g.append("g").attr("class", "links-group");
            const nodesGroup = g.append("g").attr("class", "nodes-group");
            
            const root = d3.hierarchy(data);
            
            let nodeIdCounter = 0;
            root.descendants().forEach(d => {
                d.id = d.data.id || `node-${nodeIdCounter++}`;
                d.x0 = 0;
                d.y0 = 0;
            });
            
            // Collapse all children except root's
            root.descendants().forEach(d => {
                if (d.depth > 0 && d.children) {
                    d._children = d.children;
                    d.children = null;
                }
            });
            
            function computeRadialLayout(rootNode) {
                rootNode.x = 0;
                rootNode.y = 0;
                rootNode.angle = 0;
                rootNode.radius = 0;
                
                const levels = [];
                const queue = [{node: rootNode, level: 0}];
                
                while (queue.length > 0) {
                    const {node, level} = queue.shift();
                    if (!levels[level]) levels[level] = [];
                    levels[level].push(node);
                    
                    if (node.children) {
                        node.children.forEach(child => {
                            queue.push({node: child, level: level + 1});
                        });
                    }
                }
                
                levels.forEach((levelNodes, levelIndex) => {
                    if (levelIndex === 0) return;
                    
                    const radius = CONFIG.layout.firstLevelRadius + (levelIndex - 1) * CONFIG.layout.levelStep;
                    
                    levelNodes.forEach((node, i) => {
                        let angle;
                        
                        if (levelIndex === 1) {
                            const count = levelNodes.length;
                            if (count === 2) {
                                // TWO nodes: position LEFT and RIGHT (horizontal)
                                // 0 = right (3 o'clock), PI/2 = bottom, PI = left (9 o'clock), -PI/2 = top
                                angle = i === 0 ? Math.PI : 0; // First node left, second node right
                            } else if (count === 3) {
                                // Three nodes: top and two at bottom corners
                                if (i === 0) angle = -Math.PI/2; // Top
                                else if (i === 1) angle = Math.PI/3; // Bottom right
                                else angle = 2*Math.PI/3; // Bottom left
                            } else {
                                // Distribute evenly starting from right
                                angle = (i * 2 * Math.PI) / count;
                            }
                        } else {
                            // Other levels: position relative to parent
                            const parent = node.parent;
                            const siblings = parent.children;
                            const siblingIndex = siblings.indexOf(node);
                            const parentAngle = parent.angle || 0;
                            
                            if (siblings.length === 1) {
                                angle = parentAngle;
                            } else {
                                const spread = Math.PI / 4; // 45 degrees spread
                                const offset = (siblingIndex - (siblings.length - 1) / 2) * spread / siblings.length;
                                angle = parentAngle + offset;
                            }
                        }
                        
                        node.angle = angle;
                        node.radius = radius;
                        node.x = angle;
                        node.y = radius;
                    });
                });
                
                return rootNode;
            }
            
            // FIXED: Correct polar to cartesian conversion
            function polarToCartesian(angle, radius) {
                // Standard polar coordinates: 0 = right, PI/2 = down, PI = left, -PI/2 = up
                return [
                    radius * Math.cos(angle),
                    radius * Math.sin(angle)
                ];
            }
            
            function getNodeRadius(d) {
                const config = isMobile ? CONFIG.sizing.mobile : CONFIG.sizing.desktop;
                const depth = d.depth || 0;
                const depthFactor = Math.max(0.4, 1 - depth * 0.25);
                const baseRadius = config.minRadius + (config.maxRadius - config.minRadius) * depthFactor;
                const siblingCount = d.parent?.children?.length || 1;
                const siblingFactor = siblingCount > 5 ? 0.8 : 1;
                return Math.round(baseRadius * siblingFactor);
            }
            
            function getFontSize(d) {
                const radius = getNodeRadius(d);
                const config = isMobile ? CONFIG.sizing.mobile : CONFIG.sizing.desktop;
                return Math.max(config.minFont, Math.min(config.maxFont, radius / 2.5));
            }
            
            const zoom = d3.zoom()
                .scaleExtent([CONFIG.zoom.min, CONFIG.zoom.max])
                .on("zoom", (event) => {
                    g.attr("transform", `translate(${centerX}, ${centerY}) scale(${event.transform.k})`);
                });
            
            svg.call(zoom);
            
            function update(source) {
                const duration = CONFIG.animation.duration;
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
                    .attr("stroke-width", 1.5)
                    .attr("opacity", 0)
                    .attr("d", d => {
                        const [x, y] = polarToCartesian(source.x0 || 0, source.y0 || 0);
                        return `M${x},${y}L${x},${y}`;
                    })
                  .merge(link)
                    .transition().duration(duration)
                    .attr("opacity", 0.6)
                    .attr("d", d => {
                        const [sx, sy] = polarToCartesian(d.source.angle || 0, d.source.radius || 0);
                        const [tx, ty] = polarToCartesian(d.target.angle || 0, d.target.radius || 0);
                        return `M${sx},${sy}L${tx},${ty}`;
                    });
                
                link.exit()
                    .transition().duration(duration)
                    .attr("opacity", 0)
                    .remove();
                
                // Update nodes
                const node = nodesGroup.selectAll("g.node")
                    .data(nodes, d => d.id);
                
                const nodeEnter = node.enter().append("g")
                    .attr("class", "node")
                    .attr("transform", d => {
                        const [x, y] = polarToCartesian(source.x0 || 0, source.y0 || 0);
                        return `translate(${x},${y})`;
                    })
                    .style("opacity", 0)
                    .style("cursor", "pointer")
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
                    .attr("stroke-width", d => d._children ? 3 : 1.5)
                    .attr("class", d => d._children ? "collapsible" : "");
                
                nodeEnter.append("text")
                    .attr("class", "node-text")
                    .attr("dy", "0.31em")
                    .attr("text-anchor", "middle")
                    .style("font-size", d => `${getFontSize(d)}px`)
                    .style("pointer-events", "none")
                    .text(d => d.data.name);
                
                const nodeUpdate = nodeEnter.merge(node);
                
                nodeUpdate.transition().duration(duration)
                    .attr("transform", d => {
                        const [x, y] = polarToCartesian(d.angle || 0, d.radius || 0);
                        return `translate(${x},${y})`;
                    })
                    .style("opacity", 1);
                
                nodeUpdate.select("circle")
                    .transition().duration(duration)
                    .attr("r", d => getNodeRadius(d));
                
                nodeUpdate.select("text")
                    .style("font-size", d => `${getFontSize(d)}px`)
                    .each(function(d) {
                        const text = d3.select(this);
                        if (d.depth === 0) {
                            text.attr("x", 0).attr("text-anchor", "middle");
                        } else {
                            // Position text outside node based on angle
                            const angle = d.angle || 0;
                            if (Math.abs(angle) < Math.PI/4 || Math.abs(angle) > 3*Math.PI/4) {
                                // Right or left side - horizontal text placement
                                if (angle < Math.PI/2 && angle > -Math.PI/2) {
                                    text.attr("x", getNodeRadius(d) + 5).attr("text-anchor", "start");
                                } else {
                                    text.attr("x", -(getNodeRadius(d) + 5)).attr("text-anchor", "end");
                                }
                            } else {
                                // Top or bottom - center text
                                text.attr("x", 0).attr("text-anchor", "middle");
                                if (angle > 0) {
                                    text.attr("y", getNodeRadius(d) + 12); // Below node
                                } else {
                                    text.attr("y", -(getNodeRadius(d) + 5)); // Above node
                                }
                            }
                        }
                    });
                
                node.exit()
                    .transition().duration(duration)
                    .attr("transform", d => {
                        const [x, y] = polarToCartesian(source.angle || 0, source.radius || 0);
                        return `translate(${x},${y})`;
                    })
                    .style("opacity", 0)
                    .remove();
                
                nodes.forEach(d => {
                    d.x0 = d.angle || 0;
                    d.y0 = d.radius || 0;
                });
            }
            
            container.rendererInstance = {
                expandAll: () => {},
                collapseAll: () => {}
            };
            
            update(root);
            return container.rendererInstance;
        };
        
        // Re-render with fixed layout
        const currentTab = window.currentTab || 'approach';
        if (window.dataMap && window.dataMap[currentTab]) {
            new window.MindMapRenderer(container, window.dataMap[currentTab]);
        }
    });
    
    await delay(2000);
    
    // Take screenshot after fix
    await page.screenshot({ path: 'after_fix.png' });
    console.log('✅ Screenshot saved: after_fix.png');
    
    // Verify the fix
    const afterAnalysis = await page.evaluate(() => {
        const nodes = document.querySelectorAll('.node');
        const positions = [];
        
        nodes.forEach(node => {
            const transform = node.getAttribute('transform');
            const text = node.querySelector('text')?.textContent || '';
            if (transform) {
                const match = transform.match(/translate\(([-\d.]+),([-\d.]+)\)/);
                if (match) {
                    positions.push({
                        text: text.trim(),
                        x: parseFloat(match[1]),
                        y: parseFloat(match[2])
                    });
                }
            }
        });
        
        return positions;
    });
    
    console.log('\nFixed node positions:');
    afterAnalysis.forEach(node => {
        console.log(`  ${node.text}: (${node.x.toFixed(1)}, ${node.y.toFixed(1)})`);
    });
    
    console.log('\n✨ Layout test complete! Check the screenshots to verify the fix.');
    
    await delay(3000);
    await browser.close();
}

testAndFixLayout().catch(console.error);