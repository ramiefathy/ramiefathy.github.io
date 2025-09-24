// js/d3-renderer.js

function MindMapRenderer(container, data, options = {}) {
    const { onNodeClick } = options;
    const tooltip = d3.select('#tooltip');

    // --- Configuration ---
    const CONFIG = {
        animation: { duration: 300 }, // Faster for better UX
        sizing: {
            mobile: { minRadius: 20, maxRadius: 35, minFont: 5, maxFont: 9 },
            desktop: { minRadius: 25, maxRadius: 40, minFont: 6, maxFont: 11 }
        },
        colors: {
            nodes: ['#c4b5fd', '#ddd6fe', '#e9d5ff', '#f3e8ff', '#faf5ff'],
            collapsible: '#3730a3'
        },
        zoom: { min: 0.5, max: 3 }
    };

    // *** DYNAMIC: Calculate radial levels based on actual node sizes ***
    function calculateDynamicRadialLevels(treeRadius, nodeRadii, mainBranchCount = 0) {
        const levels = { root: 0 };
        let currentRadius = 0;
        
        // ENHANCED: Use larger gaps to ensure visible connectors
        // Adaptive gap multiplier based on number of main branches
        const GAP_MULTIPLIER = mainBranchCount <= 3 ? 12.0 : (mainBranchCount === 9 ? 5.0 : (mainBranchCount > 8 ? 6.0 : 10.0)); // Increased gaps for better spacing
        
        // Level 1: Must fit root node + level1 node + gap
        // Distance = rootRadius + gap(GAP_MULTIPLIER*rootRadius) + level1Radius
        const rootRadius = nodeRadii[0];
        const level1NodeRadius = nodeRadii[1];
        currentRadius = rootRadius + (rootRadius * GAP_MULTIPLIER) + level1NodeRadius;
        levels.level1 = Math.min(currentRadius / treeRadius, 0.45); // Increased for more spacing
        
        // Level 2: From level1 position + level1 radius + gap + level2 radius
        const level2NodeRadius = nodeRadii[2];
        // Calculate from center of level1 node
        const level1Center = levels.level1 * treeRadius;
        currentRadius = level1Center + level1NodeRadius + (level1NodeRadius * GAP_MULTIPLIER) + level2NodeRadius;
        levels.level2 = Math.min(currentRadius / treeRadius, 0.75); // Increased for more spacing
        
        // Level 3: Similar calculation from level2 center
        const level3NodeRadius = nodeRadii[3];
        const level2Center = levels.level2 * treeRadius;
        currentRadius = level2Center + level2NodeRadius + (level2NodeRadius * GAP_MULTIPLIER) + level3NodeRadius;
        levels.level3 = Math.min(currentRadius / treeRadius, 0.90); // Increased for more spacing
        
        // Level 4: Outer level
        levels.level4 = 0.95;
        
        console.log('Dynamic radial levels calculated:', levels);
        return levels;
    }

    // --- Utility Functions ---
    function radialPoint(x, y) { 
        // *** DEBUG: Add validation for radial point calculations ***
        if (isNaN(x) || isNaN(y)) {
            console.error('NaN values in radialPoint:', { x, y });
            return [0, 0]; // Return safe default
        }
        return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)]; 
    }

    // --- Setup SVG and Main Group ---
    const { width, height } = container.getBoundingClientRect();
    
    // *** DEBUG: Add validation for container dimensions ***
    console.log('Container dimensions:', { width, height });
    if (!width || !height || width <= 0 || height <= 0) {
        console.error('Invalid container dimensions:', { width, height });
        return null;
    }
    
    const isMobile = width < 768;

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .style("font", "10px sans-serif");
    
    // *** FIX: Append the SVG to the DOM IMMEDIATELY ***
    // This ensures that all subsequent measurements like getComputedTextLength() will work.
    container.append(svg.node());

    const g = svg.append("g");
    
    // *** FIX: Create separate groups for links and nodes to ensure proper layering ***
    const linksGroup = g.append("g").attr("class", "links-group");
    const nodesGroup = g.append("g").attr("class", "nodes-group");

    // --- Setup Zoom Behavior ---
    const zoom = d3.zoom()
        .scaleExtent([CONFIG.zoom.min, CONFIG.zoom.max])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });
    svg.call(zoom);

    // --- Hierarchy and Layout ---
    const root = d3.hierarchy(data);
    root.descendants().forEach((d, i) => { 
        d.id = d.data.id || `node-${i}`;
        // *** FIX: Set initial coordinates to center (0,0) for radial layout ***
        d.x = 0; // angle
        d.y = 0; // radius from center
        d.x0 = 0; // previous angle
        d.y0 = 0; // previous radius from center
    });
    
    // *** FIX: Calculate tree radius and run initial layout ***
    const treeRadius = Math.min(width, height) / 2 - (isMobile ? 40 : 60);
    console.log('Tree layout parameters:', { width, height, treeRadius, isMobile });
    
    if (!treeRadius || treeRadius <= 0) {
        console.error('Invalid tree radius:', treeRadius);
        return null;
    }
    
    // *** Apply initial fixed sector positioning ***
    applyFixedSectorPositioning(root);
    
    // Set initial positions for all nodes
    root.descendants().forEach(d => {
        // Ensure we have valid coordinates
        if (typeof d.x !== 'number' || isNaN(d.x)) d.x = 0;
        if (typeof d.y !== 'number' || isNaN(d.y)) d.y = 0;
        d.x0 = d.x;
        d.y0 = d.y;
    });
    
    // Initial collapse of all nodes beyond the first level
    if (root.children) {
        root.children.forEach(collapse);
    }
    
    function calculateMinimumAngularSeparation(radius, nodeRadius) {
        // Calculate minimum angle needed between node centers to prevent overlap
        // Using correct formula: angle = 2 * atan(nodeRadius / orbitalRadius)
        // INCREASED safety margin to 2.0x to guarantee no overlap
        const safetyMargin = 2.0;
        const effectiveNodeRadius = nodeRadius * safetyMargin;
        
        // Safety check: if orbital radius is too small, use larger minimum angle
        if (radius <= effectiveNodeRadius * 1.5) {
            return Math.PI / 3; // 60 degrees minimum for very tight spaces
        }
        
        // Correct trigonometric formula for two circles at radius R
        // with radius r each: θ = 2 * atan(r/R)
        // Adding extra 20% to the calculated angle for safety
        const baseAngle = 2 * Math.atan(effectiveNodeRadius / radius);
        return baseAngle * 2.0; // Further increased safety margin for 9-node scenarios
    }

    function calculateOptimalSectors(children, availableAngle, radius, nodeRadii) {
        if (!children || children.length === 0) return [];
        
        // Calculate minimum angle needed for each child based on its DEPTH in tree
        const minAngles = children.map((child) => {
            // CRITICAL FIX: Use node depth, not array position!
            const nodeDepth = child.depth || 0;
            const childRadius = nodeRadii[Math.min(nodeDepth, nodeRadii.length - 1)];
            return calculateMinimumAngularSeparation(radius, childRadius);
        });
        
        // Calculate total minimum angle needed
        const totalMinAngle = minAngles.reduce((sum, angle) => sum + angle, 0);
        
        // If we need more space than available, we have several strategies:
        if (totalMinAngle >= availableAngle * 0.75) { // Even more conservative for many nodes
            // Strategy 1: Equal distribution (will cause overlap but evenly)
            const equalAngle = availableAngle / children.length;
            
            // Strategy 2: Return flag indicating spiral layout needed
            const useSpiral = totalMinAngle > availableAngle * 1.2;
            
            return children.map(() => ({
                angle: equalAngle,
                needsSpiral: useSpiral
            }));
        }
        
        // Otherwise, use minimum required plus equal distribution of remaining space
        const remainingAngle = availableAngle - totalMinAngle;
        const bonusPerChild = remainingAngle / children.length;
        
        return minAngles.map(minAngle => ({
            angle: minAngle + bonusPerChild,
            needsSpiral: false
        }));
    }
    
    function applyFixedSectorPositioning(rootNode) {
        // Get main branches (direct children of root)
        const mainBranches = rootNode.children || [];
        
        console.log('Applying collision-free spacing for', mainBranches.length, 'main branches');
        
        // Position root at center
        rootNode.x = 0;
        rootNode.y = 0;
        
        // Get pre-calculated node radii for collision calculations
        const config = isMobile ? CONFIG.sizing.mobile : CONFIG.sizing.desktop;
        // Adjust radii based on number of main branches - more aggressive sizing
        const manyNodes = mainBranches.length > 6;
        const veryManyNodes = mainBranches.length > 8;
        const baseRadii = [
            config.maxRadius - 5,              // Root node - smaller
            config.maxRadius - 5,              // Level 1 - same size as root
            config.maxRadius - 15,             // Level 2 - much smaller
            config.maxRadius - 15,             // Level 3 - much smaller
            config.minRadius   // Level 4+ - minimum size
        ];
        
        // Calculate dynamic radial levels based on node sizes
        const RADIAL_LEVELS = calculateDynamicRadialLevels(treeRadius, baseRadii, mainBranches.length);
        
        // Calculate collision-aware sectors for main branches
        const level1Radius = treeRadius * RADIAL_LEVELS.level1;
        
        // Special handling for many nodes (>6) - Use staggered spiral layout
        if (mainBranches.length > 6) {
            console.log(`Using staggered spiral layout for ${mainBranches.length} nodes`);
            
            // Calculate minimum safe distance between nodes
            const nodeRadius = baseRadii[1]; // Level 1 node radius
            const childRadius = baseRadii[2]; // Level 2 node radius
            const minNodeDistance = nodeRadius * 2.5; // Safety margin
            
            // Staggered spiral positioning for zero overlap
            if (mainBranches.length === 9) {
                // Custom layout for pathology with 9 nodes
                // Use a combination of radius and angle to ensure no overlap
                const positions = [
                    // Inner layer - 3 nodes at 120° apart
                    { radius: level1Radius * 3.0, angle: 0 },
                    { radius: level1Radius * 3.0, angle: 2 * Math.PI / 3 },
                    { radius: level1Radius * 3.0, angle: 4 * Math.PI / 3 },
                    // Middle layer - 3 nodes offset by 60° from inner
                    { radius: level1Radius * 4.5, angle: Math.PI / 3 },
                    { radius: level1Radius * 4.5, angle: Math.PI },
                    { radius: level1Radius * 4.5, angle: 5 * Math.PI / 3 },
                    // Outer layer - 3 nodes pushed much further out
                    { radius: level1Radius * 6.0, angle: Math.PI / 6 },
                    { radius: level1Radius * 6.0, angle: 5 * Math.PI / 6 },
                    { radius: level1Radius * 6.0, angle: 3 * Math.PI / 2 }
                ];
                
                mainBranches.forEach((branch, index) => {
                    branch.x = positions[index].angle;
                    branch.y = positions[index].radius;
                    console.log(`Node ${index + 1} (${branch.data.name}): angle ${positions[index].angle.toFixed(2)}, radius ${positions[index].radius.toFixed(0)}`);
                });
            } else {
                // General spiral algorithm for other counts
                const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle ~137.5°
                let currentRadius = level1Radius;
                const radiusIncrement = minNodeDistance * 0.8;
                
                mainBranches.forEach((branch, index) => {
                    const angle = index * goldenAngle;
                    // Increase radius gradually to create spiral
                    if (index > 0 && index % 3 === 0) {
                        currentRadius += radiusIncrement;
                    }
                    branch.x = angle % (2 * Math.PI);
                    branch.y = currentRadius;
                    console.log(`Node ${index + 1}: spiral position at radius ${currentRadius.toFixed(0)}`);
                });
            }
            
            // Position children of all branches with sector constraints
            mainBranches.forEach((branch, branchIndex) => {
                if (branch.children && branch.children.length > 0) {
                    const parentAngle = branch.x;
                    const parentRadius = branch.y;
                    const childCount = branch.children.length;
                    
                    // Calculate child radius based on parent's position
                    // Use adaptive gap based on parent's ring position
                    let gapMultiplier = 2.2;
                    if (mainBranches.length === 9) {
                        // Increased gaps to prevent overlap with neighboring branches
                        if (branchIndex >= 6) {
                            gapMultiplier = 3.0;  // Outer ring - increased spacing
                        } else if (branchIndex >= 3) {
                            gapMultiplier = 3.5;  // Middle ring - increased spacing
                        } else {
                            gapMultiplier = 4.0;  // Inner ring - increased spacing
                        }
                    } else {
                        gapMultiplier = 4.0;  // Default for other layouts
                    }
                    const childRadiusBase = parentRadius + (baseRadii[1] + baseRadii[2]) * gapMultiplier;
                    
                    if (childCount === 1) {
                        // Single child: place directly outward from parent
                        branch.children[0].x = parentAngle;
                        branch.children[0].y = childRadiusBase;
                    } else if (childCount <= 3) {
                        // 2-3 children: tighter angular spread to keep them closer
                        const spreadAngle = Math.PI / 9; // 20 degrees (reduced from 30)
                        const startAngle = parentAngle - spreadAngle * (childCount - 1) / 2;
                        
                        branch.children.forEach((child, idx) => {
                            child.x = startAngle + idx * spreadAngle;
                            child.y = childRadiusBase;
                        });
                    } else {
                        // 4+ children: use vertical stacking
                        const radiusStep = baseRadii[2] * 1.5;
                        branch.children.forEach((child, idx) => {
                            child.x = parentAngle;
                            child.y = childRadiusBase + idx * radiusStep;
                        });
                    }
                    
                    // Position grandchildren (if any) within child's subsector
                    branch.children.forEach((child, childIndex) => {
                        if (child.children && child.children.length > 0) {
                            const childAngle = child.x;
                            const childRadius = child.y;
                            const grandChildRadiusBase = childRadius + (baseRadii[2] + baseRadii[3]) * gapMultiplier * 0.6;
                            
                            if (child.children.length === 1) {
                                // Single grandchild: place directly outward
                                child.children[0].x = childAngle;
                                child.children[0].y = grandChildRadiusBase;
                            } else {
                                // Multiple grandchildren: minimal spread or vertical stacking
                                const grandChildCount = child.children.length;
                                if (grandChildCount <= 2) {
                                    const microSpread = Math.PI / 24; // 7.5 degrees
                                    const startAngle = childAngle - microSpread * (grandChildCount - 1) / 2;
                                    
                                    child.children.forEach((grandChild, idx) => {
                                        grandChild.x = startAngle + idx * microSpread;
                                        grandChild.y = grandChildRadiusBase;
                                    });
                                } else {
                                    // Stack vertically for 3+ grandchildren
                                    const radiusStep = baseRadii[3] * 1.3;
                                    child.children.forEach((grandChild, idx) => {
                                        grandChild.x = childAngle;
                                        grandChild.y = grandChildRadiusBase + idx * radiusStep;
                                    });
                                }
                            }
                        }
                    });
                }
            });
        } else {
            // Standard layout for fewer nodes
            const branchSectorData = calculateOptimalSectors(mainBranches, 2 * Math.PI, level1Radius, baseRadii);
            let currentAngle = 0;
            
            // Check if we need spiral layout for level 1
            const needsSpiral = branchSectorData.some(s => s.needsSpiral);
            if (needsSpiral) {
                console.warn('Level 1 needs spiral layout - too many nodes for available space');
            }
            
            // Assign sectors to main branches
            mainBranches.forEach((branch, index) => {
            const sectorData = branchSectorData[index];
            const sectorSize = sectorData.angle;
            const sectorCenter = currentAngle + sectorSize / 2;
            
            // Position main branch
            // If spiral needed, gradually increase radius for overlapping nodes
            if (needsSpiral && index > 0) {
                const radiusIncrement = baseRadii[1] * 0.5; // Half a node radius per overlapping node
                branch.y = level1Radius + (Math.floor(index / 8) * radiusIncrement);
                branch.x = sectorCenter;
            } else {
                branch.x = sectorCenter;
                branch.y = level1Radius;
            }
            
            console.log(`Branch ${branch.data.id}: sector ${sectorSize.toFixed(3)} rad, center ${sectorCenter.toFixed(3)}`);
            
            // Position children with proper collision avoidance
            if (branch.children && branch.children.length > 0) {
                const level2Radius = treeRadius * RADIAL_LEVELS.level2;
                const childSectorData = calculateOptimalSectors(
                    branch.children, 
                    sectorSize * 0.9, // Use 90% of parent sector to maintain boundaries
                    level2Radius, 
                    baseRadii
                );
                
                let childAngle = currentAngle + sectorSize * 0.05; // 5% padding from sector start
                
                branch.children.forEach((child, childIndex) => {
                    const childSectorInfo = childSectorData[childIndex];
                    const childSectorSize = childSectorInfo.angle;
                    child.x = childAngle + childSectorSize / 2;
                    
                    // ENHANCED: Give central nodes in odd-numbered sets extra radial distance
                    let adjustedRadius = level2Radius;
                    const isOddSet = branch.children.length % 2 === 1;
                    const middleIndex = Math.floor(branch.children.length / 2);
                    
                    if (isOddSet && childIndex === middleIndex) {
                        // Central node gets 10% extra radial distance to improve visibility
                        adjustedRadius = level2Radius * 1.1;
                    }
                    
                    child.y = adjustedRadius;
                    
                    // Position grandchildren
                    if (child.children && child.children.length > 0) {
                        const level3Radius = treeRadius * RADIAL_LEVELS.level3;
                        const grandChildSectorData = calculateOptimalSectors(
                            child.children,
                            childSectorSize * 0.9,
                            level3Radius,
                            baseRadii
                        );
                        
                        let grandChildAngle = childAngle + childSectorSize * 0.05;
                        
                        child.children.forEach((grandChild, grandIndex) => {
                            const grandSectorInfo = grandChildSectorData[grandIndex];
                            const grandSectorSize = grandSectorInfo.angle;
                            grandChild.x = grandChildAngle + grandSectorSize / 2;
                            
                            // ENHANCED: Give central nodes in odd-numbered sets extra radial distance
                            let adjustedGrandRadius = level3Radius;
                            const isOddGrandSet = child.children.length % 2 === 1;
                            const middleGrandIndex = Math.floor(child.children.length / 2);
                            
                            if (isOddGrandSet && grandIndex === middleGrandIndex) {
                                // Central node gets 10% extra radial distance
                                adjustedGrandRadius = level3Radius * 1.1;
                            }
                            
                            grandChild.y = adjustedGrandRadius;
                            
                            grandChildAngle += grandSectorSize;
                        });
                    }
                    
                    childAngle += childSectorSize;
                });
            }
            
            currentAngle += sectorSize;
        });
        } // Close else block for standard layout
        
        // Final collision detection and logging
        validateNodeSpacing(rootNode, baseRadii);
        
        return rootNode;
    }

    function validateNodeSpacing(rootNode, nodeRadii) {
        const allNodes = rootNode.descendants();
        let overlaps = 0;
        let parentChildOverlaps = 0;
        
        for (let i = 0; i < allNodes.length; i++) {
            for (let j = i + 1; j < allNodes.length; j++) {
                const node1 = allNodes[i];
                const node2 = allNodes[j];
                
                // Convert polar to cartesian for distance calculation
                const [x1, y1] = radialPoint(node1.x || 0, node1.y || 0);
                const [x2, y2] = radialPoint(node2.x || 0, node2.y || 0);
                
                const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                const radius1 = nodeRadii[Math.min(node1.depth, nodeRadii.length - 1)];
                const radius2 = nodeRadii[Math.min(node2.depth, nodeRadii.length - 1)];
                
                // Add padding for text overflow
                const textPadding = 5;
                const minDistance = radius1 + radius2 + textPadding;
                
                if (distance < minDistance) {
                    // Check if it's parent-child relationship
                    if (node1.parent === node2 || node2.parent === node1) {
                        parentChildOverlaps++;
                        console.warn(`Parent-child overlap: ${node1.data.name} and ${node2.data.name}, distance: ${distance.toFixed(1)}, required: ${minDistance.toFixed(1)}`);
                    } else {
                        overlaps++;
                        console.warn(`Sibling overlap: ${node1.data.name} and ${node2.data.name}, distance: ${distance.toFixed(1)}, required: ${minDistance.toFixed(1)}`);
                    }
                }
            }
        }
        
        // Special check for multi-ring layout
        const mainBranches = rootNode.children || [];
        if (mainBranches.length > 6) {
            console.log('🔍 Multi-ring layout validation:');
            const innerRingCount = Math.ceil(mainBranches.length / 2);
            console.log(`   Inner ring: ${innerRingCount} nodes`);
            console.log(`   Outer ring: ${mainBranches.length - innerRingCount} nodes`);
        }
        
        if (overlaps === 0 && parentChildOverlaps === 0) {
            console.log('✅ No node overlaps detected');
        } else {
            console.warn(`⚠️ ${overlaps} sibling overlaps and ${parentChildOverlaps} parent-child overlaps detected`);
        }
    }

    // --- Render Function ---
    function update(source) {
        const duration = CONFIG.animation.duration;
        
        // *** Use custom fixed sector positioning instead of D3 tree layout ***
        const treeData = applyFixedSectorPositioning(root);
        const nodes = treeData.descendants().reverse();
        const links = treeData.links();

        const { radii } = calculateSizing(nodes);

        // --- Links ---
        linksGroup.selectAll(".link").data(links, d => d.target.id)
            .join(
                enter => enter.append("path").attr("class", "link")
                    .attr("d", d => {
                        const o = { 
                            x: (source && typeof source.x0 === 'number' && !isNaN(source.x0)) ? source.x0 : 0, 
                            y: (source && typeof source.y0 === 'number' && !isNaN(source.y0)) ? source.y0 : 0 
                        };
                        return d3.linkRadial()
                            .angle(d => d.x || 0)
                            .radius(d => d.y || 0)
                            ({ source: o, target: o });
                    }),
                update => update,
                exit => exit.transition().duration(duration).attr("d", d => {
                    const o = { 
                        x: (source && typeof source.x === 'number' && !isNaN(source.x)) ? source.x : 0, 
                        y: (source && typeof source.y === 'number' && !isNaN(source.y)) ? source.y : 0 
                    };
                    return d3.linkRadial()
                        .angle(d => d.x || 0)
                        .radius(d => d.y || 0)
                        ({ source: o, target: o });
                }).remove()
            )
            .transition().duration(duration)
            .attr("d", d => {
                // *** FIX: Robust coordinate validation and safe path generation ***
                try {
                    // Validate source coordinates
                    const sourceX = (typeof d.source.x === 'number' && !isNaN(d.source.x)) ? d.source.x : 0;
                    const sourceY = (typeof d.source.y === 'number' && !isNaN(d.source.y)) ? d.source.y : 0;
                    const targetX = (typeof d.target.x === 'number' && !isNaN(d.target.x)) ? d.target.x : 0;
                    const targetY = (typeof d.target.y === 'number' && !isNaN(d.target.y)) ? d.target.y : 0;
                    
                    // Create safe link data
                    const safeLink = {
                        source: { x: sourceX, y: sourceY },
                        target: { x: targetX, y: targetY }
                    };
                    
                    return d3.linkRadial()
                        .angle(d => d.x)
                        .radius(d => d.y)
                        (safeLink);
                } catch (error) {
                    console.error('Error generating link path:', error, d);
                    return "M0,0L0,0";
                }
            });

        // --- Nodes ---
        nodesGroup.selectAll(".node").data(nodes, d => d.id)
            .join(
                enter => {
                    const nodeEnter = enter.append("g")
                        .attr("class", "node")
                        .attr("transform", d => `translate(${radialPoint((source && source.x0 !== undefined) ? source.x0 : 0, (source && source.y0 !== undefined) ? source.y0 : 0)})`)
                        .on("click", clickHandler);

                    nodeEnter.append("circle").attr("r", 1e-6);
                    nodeEnter.append("text").attr("class", "node-text")
                        .each(function(d) { wrapText(this, d, radii); });
                    
                    // Add badge for collapsed nodes with children
                    nodeEnter.append("g")
                        .attr("class", "node-badge")
                        .style("opacity", 0);
                    
                    return nodeEnter;
                },
                update => update,
                exit => exit.transition().duration(duration)
                    .attr("transform", d => `translate(${radialPoint(source.x, source.y)})`).remove()
                    .select("circle").attr("r", 1e-6)
            )
            .attr("tabindex", -1) // For focus
            .on('mousemove', tooltipMoveHandler)
            .on('mouseleave', tooltipLeaveHandler)
            .transition().duration(duration)
            .attr("transform", d => `translate(${radialPoint(d.x, d.y)})`)
            .select("circle")
            .attr("r", d => radii[d.depth] || radii[radii.length-1])
            .attr("fill", d => CONFIG.colors.nodes[d.depth] || CONFIG.colors.nodes[CONFIG.colors.nodes.length-1])
            .attr("class", d => {
                // Only show thick border if node has hidden children (_children)
                // Not if it has visible children (children)
                return d._children ? "collapsible" : "";
            });
        
        // Update badges for collapsed nodes
        nodesGroup.selectAll(".node").each(function(d) {
            const badgeGroup = d3.select(this).select(".node-badge");
            
            if (d._children && d.depth > 0) {
                // Show badge for collapsed nodes with children (except root)
                const radius = radii[d.depth] || radii[radii.length-1];
                
                badgeGroup.selectAll("*").remove();
                badgeGroup.append("circle")
                    .attr("cx", radius * 0.7)
                    .attr("cy", -radius * 0.7)
                    .attr("r", 8)
                    .attr("fill", "#3730a3")
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1.5);
                    
                badgeGroup.append("text")
                    .attr("x", radius * 0.7)
                    .attr("y", -radius * 0.7)
                    .attr("dy", "0.35em")
                    .attr("text-anchor", "middle")
                    .attr("fill", "#fff")
                    .style("font-size", "10px")
                    .style("font-weight", "bold")
                    .text(d._children.length);
                    
                badgeGroup.transition().duration(duration)
                    .style("opacity", 1);
            } else {
                // Hide badge
                badgeGroup.transition().duration(duration)
                    .style("opacity", 0);
            }
        });
        
        nodes.forEach(d => { 
            // Ensure valid coordinates are saved
            d.x0 = (typeof d.x === 'number' && !isNaN(d.x)) ? d.x : 0;
            d.y0 = (typeof d.y === 'number' && !isNaN(d.y)) ? d.y : 0;
        });
    }

    // --- Helper Functions ---
    // *** IMPROVEMENT: Enhanced sizing logic for better text containment ***
    function calculateSizing(nodes) {
        const visibleNodeCount = nodes.filter(d => !d.children && !d._children ? true : d.children ? true : false).length;
        const mainBranchCount = root.children ? root.children.length : 0;
        
        let sizeMultiplier = 1.0;
        if (visibleNodeCount <= 8) sizeMultiplier = 1.2; // Larger nodes for fewer items
        else if (visibleNodeCount <= 15) sizeMultiplier = 1.1;
        else if (visibleNodeCount > 25) sizeMultiplier = 0.85;
        
        const config = isMobile ? CONFIG.sizing.mobile : CONFIG.sizing.desktop;
        
        // Adjust node sizes based on multi-ring layout - more aggressive
        let level1Size = 48;
        if (mainBranchCount === 9) {
            level1Size = 35; // Even smaller for 9-node pathology layout
        } else if (mainBranchCount > 8) {
            level1Size = 38; // Much smaller for multi-ring with many nodes
        } else if (mainBranchCount > 6) {
            level1Size = 42; // Smaller for multi-ring
        }
        
        // Adjusted radii for better spacing with smaller children
        const baseRadii = [
            config.maxRadius - 5,  // Root node - smaller
            config.maxRadius - 5,  // Level 1 - same size as root for 3-node layout
            config.maxRadius - 15, // Level 2 - much smaller for children
            config.maxRadius - 15, // Level 3 - much smaller for grandchildren
            config.minRadius       // Level 4+ - minimum size
        ];
        const radii = baseRadii.map(r => Math.round(r * sizeMultiplier));
        return { radii };
    }

    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function smartTextSplit(text) {
        // Just split on spaces - keep words whole for better readability
        return text.split(/\s+/).filter(w => w.length > 0);
    }
    
    function wrapText(element, d, radii) {
        const textElement = d3.select(element);
        const radius = radii[d.depth] || radii[radii.length-1];
        textElement.text(null);

        // Check if text already has newlines
        if (d.data.name.includes('\n')) {
            // Text is pre-split, use as-is
            const lines = d.data.name.split('\n');
            const lineHeight = 0.9; // Tighter spacing for pre-split text
            const fontSize = Math.max(8, 12 - lines.length); // Dynamic font size
            
            const startY = -(lines.length - 1) * 0.5 * lineHeight;
            
            lines.forEach((lineText, i) => {
                textElement.append("tspan")
                    .attr("x", 0)
                    .attr("dy", i === 0 ? `${startY}em` : `${lineHeight}em`)
                    .style("font-size", `${fontSize}px`)
                    .text(lineText.trim());
            });
        } else {
            // Original word wrapping logic for non-pre-split text
            const words = d.data.name.split(/\s+/);
            const lineHeight = 1.0;
            const maxLineWidth = (radius - 8) * 2;
            
            let lines = [];
            let line = [];
            let tempTspan = textElement.append("tspan");
            
            words.forEach(word => {
                line.push(word);
                tempTspan.text(line.join(" "));
                if (tempTspan.node().getComputedTextLength() > maxLineWidth && line.length > 1) {
                    line.pop(); 
                    lines.push(line.join(" ")); 
                    line = [word];
                }
            });
            
            if (line.length > 0) {
                lines.push(line.join(" "));
            }
            tempTspan.remove();

            // Limit to maximum 3 lines to prevent overflow
            if (lines.length > 3) {
                lines = lines.slice(0, 2);
                lines.push(lines[lines.length - 1] + '...');
            }

            const startY = -(lines.length - 1) * 0.5 * lineHeight;
            
            lines.forEach((lineText, i) => {
                textElement.append("tspan")
                    .attr("x", 0)
                    .attr("dy", i === 0 ? `${startY}em` : `${lineHeight}em`)
                    .style("font-size", `${Math.max(7, 11 - lines.length)}px`)
                    .text(lineText);
            });
        }
    }

    // --- Event Handlers ---
    function clickHandler(event, d) {
        if (event.defaultPrevented) return; // ignore click after drag
        
        // For pathology with 9 nodes, implement auto-collapse of siblings
        const isPathologyTab = root.children && root.children.length === 9;
        
        if (d.children) {
            // Collapse this node
            d._children = d.children;
            d.children = null;
        } else {
            // Expand this node
            d.children = d._children;
            d._children = null;
            
            // Auto-collapse siblings if in pathology tab and this is a level 1 node
            if (isPathologyTab && d.depth === 1) {
                const siblings = d.parent.children;
                siblings.forEach(sibling => {
                    if (sibling !== d && sibling.children) {
                        sibling._children = sibling.children;
                        sibling.children = null;
                    }
                });
            }
        }
        update(d);
        if (onNodeClick) {
            onNodeClick();
        }
    }
    
    function tooltipMoveHandler(event, d) {
        tooltip.style('visibility', 'visible').style('opacity', '1');
        const [x, y] = d3.pointer(event, document.body);
        tooltip.style('left', `${x + 15}px`).style('top', `${y + 15}px`);
        tooltip.html(`<div class="tooltip-title">${d.data.tooltip.title}</div><div class="tooltip-content">${d.data.tooltip.content}</div>`);
    }

    function tooltipLeaveHandler() {
        tooltip.style('visibility', 'hidden').style('opacity', '0');
    }

    // --- Initial Render ---
    update(root);
    // The SVG is already appended, so no need for the line here.

    // --- Public API ---
    return {
        svg,
        zoom,
        expandAll() {
            root.descendants().forEach(d => {
                if (d._children) {
                    d.children = d._children;
                    d._children = null;
                }
            });
            update(root);
        },
        collapseAll() {
            if (root.children) {
                root.children.forEach(collapse);
            }
            update(root);
        },
        expandToNode(path) {
            let currentNode = root;
            path.slice(1).forEach(nodeId => {
                if (currentNode._children) {
                    currentNode.children = currentNode._children;
                    currentNode._children = null;
                }
                currentNode = (currentNode.children || []).find(c => c.data.id === nodeId) || currentNode;
            });
            update(currentNode);
            
            // Highlight the final node
            setTimeout(() => {
                const targetNode = nodesGroup.selectAll(".node").filter(d => d.data.id === path[path.length - 1]);
                targetNode.classed('search-highlight', true);
                targetNode.node()?.focus();
                setTimeout(() => targetNode.classed('search-highlight', false), 2500);
            }, CONFIG.animation.duration);
        },
        getExpansionState() {
            return root.descendants().filter(d => d.children).map(d => d.data.id);
        },
        applyExpansionState(expandedIds) {
            const idSet = new Set(expandedIds);
            root.descendants().forEach(d => {
                if (idSet.has(d.data.id) && d._children) {
                    d.children = d._children;
                    d._children = null;
                }
            });
            update(root);
        }
    };
}
