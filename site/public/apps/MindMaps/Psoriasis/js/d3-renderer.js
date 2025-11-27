// js/d3-renderer.js

function MindMapRenderer(container, data, options = {}) {
    const { onNodeClick } = options;
    const tooltip = d3.select('#tooltip');

    // --- Configuration ---
    const CONFIG = {
        animation: { duration: 500 },
        sizing: {
            mobile: { minRadius: 20, maxRadius: 38, minFont: 5, maxFont: 9 },
            desktop: { minRadius: 25, maxRadius: 45, minFont: 6, maxFont: 11 }
        },
        colors: {
            nodes: ['#c4b5fd', '#ddd6fe', '#e9d5ff', '#f3e8ff', '#faf5ff'],
            collapsible: '#3730a3'
        },
        zoom: { min: 0.5, max: 3 }
    };

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
        d.x0 = 0; // angle
        d.y0 = 0; // radius from center
    });
    
    // *** FIX: Calculate tree radius and run initial layout ***
    const treeRadius = Math.min(width, height) / 2 - (isMobile ? 60 : 100);
    console.log('Tree layout parameters:', { width, height, treeRadius, isMobile });
    
    if (!treeRadius || treeRadius <= 0) {
        console.error('Invalid tree radius:', treeRadius);
        return null;
    }
    
    // *** Apply initial fixed sector positioning ***
    applyFixedSectorPositioning(root);
    
    // Set initial positions for all nodes
    root.descendants().forEach(d => {
        d.x0 = d.x || 0;
        d.y0 = d.y || 0;
    });
    
    // Initial collapse of all nodes beyond the first level
    if (root.children) {
        root.children.forEach(collapse);
    }
    
    // *** FIXED ANGULAR SECTORS: Custom positioning to prevent redistribution ***
    function applyFixedSectorPositioning(rootNode) {
        // Get main branches (direct children of root)
        const mainBranches = rootNode.children || [];
        const sectorSize = (2 * Math.PI) / mainBranches.length;
        const padding = 0.1; // Small padding between sectors
        
        console.log('Applying fixed sectors for', mainBranches.length, 'main branches');
        
        // Position root at center
        rootNode.x = 0;
        rootNode.y = 0;
        
        // Assign fixed sectors to main branches
        mainBranches.forEach((branch, index) => {
            const sectorStart = index * sectorSize + padding;
            const sectorEnd = (index + 1) * sectorSize - padding;
            const sectorCenter = (sectorStart + sectorEnd) / 2;
            
            // Position main branch at fixed angle
            branch.x = sectorCenter;
            branch.y = treeRadius * 0.45; // Position at 45% of radius for more spacing from center
            
            console.log(`Branch ${branch.data.id}: sector ${sectorStart.toFixed(2)} to ${sectorEnd.toFixed(2)}, center ${sectorCenter.toFixed(2)}`);
            
            // Position children within the branch's sector
            if (branch.children && branch.children.length > 0) {
                const childSectorSize = (sectorEnd - sectorStart) / branch.children.length;
                
                branch.children.forEach((child, childIndex) => {
                    const childAngle = sectorStart + (childIndex + 0.5) * childSectorSize;
                    child.x = childAngle;
                    child.y = treeRadius * 0.75; // Position at 75% of radius for better spacing
                    
                    // Position grandchildren if they exist
                    if (child.children && child.children.length > 0) {
                        const grandChildSectorSize = childSectorSize / child.children.length;
                        child.children.forEach((grandChild, grandIndex) => {
                            const grandChildAngle = childAngle - childSectorSize/2 + (grandIndex + 0.5) * grandChildSectorSize;
                            grandChild.x = grandChildAngle;
                            grandChild.y = treeRadius * 0.95; // Position at 95% of radius for better spacing
                        });
                    }
                });
            }
        });
        
        return rootNode;
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
                        const o = { x: source.x0 || 0, y: source.y0 || 0 };
                        // *** DEBUG: Check for NaN in link source coordinates ***
                        if (isNaN(o.x) || isNaN(o.y)) {
                            console.error('NaN in link source coordinates:', { source: source, o: o });
                            o.x = 0; o.y = 0;
                        }
                        return d3.linkRadial()({ source: o, target: o });
                    }),
                update => update,
                exit => exit.transition().duration(duration).attr("d", d => {
                    const o = { x: source.x || 0, y: source.y || 0 };
                    // *** DEBUG: Check for NaN in link exit coordinates ***
                    if (isNaN(o.x) || isNaN(o.y)) {
                        console.error('NaN in link exit coordinates:', { source: source, o: o });
                        o.x = 0; o.y = 0;
                    }
                    return d3.linkRadial()({ source: o, target: o });
                }).remove()
            )
            .transition().duration(duration)
            .attr("d", d => {
                // *** FIX: Robust coordinate validation and safe path generation ***
                try {
                    const sourceX = d.source.x || 0;
                    const sourceY = d.source.y || 0;
                    const targetX = d.target.x || 0;
                    const targetY = d.target.y || 0;
                    
                    if (isNaN(sourceX) || isNaN(sourceY) || isNaN(targetX) || isNaN(targetY)) {
                        console.warn('Invalid coordinates, using safe path');
                        return "M0,0L0,0";
                    }
                    
                    return d3.linkRadial().angle(d => d.x || 0).radius(d => d.y || 0)(d);
                } catch (error) {
                    console.error('Error generating link path:', error);
                    return "M0,0L0,0";
                }
            });

        // --- Nodes ---
        nodesGroup.selectAll(".node").data(nodes, d => d.id)
            .join(
                enter => {
                    const nodeEnter = enter.append("g")
                        .attr("class", "node")
                        .attr("transform", d => `translate(${radialPoint(source.x0, source.y0)})`)
                        .on("click", clickHandler);

                    nodeEnter.append("circle").attr("r", 1e-6);
                    nodeEnter.append("text").attr("class", "node-text")
                        .each(function(d) { wrapText(this, d, radii); });
                    
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
            .attr("class", d => d._children ? "collapsible" : "");
        
        nodes.forEach(d => { d.x0 = d.x; d.y0 = d.y; });
    }

    // --- Helper Functions ---
    // *** IMPROVEMENT: More robust sizing logic ***
    function calculateSizing(nodes) {
        const visibleNodeCount = nodes.filter(d => !d.children && !d._children ? true : d.children ? true : false).length;
        let sizeMultiplier = 1.0;
        if (visibleNodeCount <= 10) sizeMultiplier = 1.1;
        else if (visibleNodeCount > 20) sizeMultiplier = 0.9;
        
        const config = isMobile ? CONFIG.sizing.mobile : CONFIG.sizing.desktop;
        const baseRadii = [config.maxRadius, 38, 32, 28, config.minRadius];
        const radii = baseRadii.map(r => Math.round(r * sizeMultiplier));
        return { radii };
    }

    function radialPoint(x, y) { 
        // *** DEBUG: Add validation for radial point calculations ***
        if (isNaN(x) || isNaN(y)) {
            console.error('NaN values in radialPoint:', { x, y });
            return [0, 0]; // Return safe default
        }
        return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)]; 
    }
    
    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function wrapText(element, d, radii) {
        const textElement = d3.select(element);
        const words = d.data.name.split(/\s+/).filter(w => w.length > 0);
        const lineHeight = 1.1;
        const radius = radii[d.depth] || radii[radii.length-1];
        const maxLineWidth = (radius - 5) * 2;
        textElement.text(null);

        let lines = []; let line = [];
        let tempTspan = textElement.append("tspan");
        words.forEach(word => {
            line.push(word);
            tempTspan.text(line.join(" "));
            if (tempTspan.node().getComputedTextLength() > maxLineWidth && line.length > 1) {
                line.pop(); lines.push(line.join(" ")); line = [word];
            }
        });
        lines.push(line.join(" "));
        tempTspan.remove();

        const startY = -(lines.length - 1) * 0.5 * lineHeight;
        lines.forEach((lineText, i) => {
            textElement.append("tspan").attr("x", 0).attr("dy", i === 0 ? `${startY}em` : `${lineHeight}em`).text(lineText);
        });
    }

    // --- Event Handlers ---
    function clickHandler(event, d) {
        if (event.defaultPrevented) return; // ignore click after drag
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
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
