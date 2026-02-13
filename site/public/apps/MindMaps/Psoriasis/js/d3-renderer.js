// js/d3-renderer.js

function MindMapRenderer(container, data, options = {}) {
    const { onNodeClick, onNodeSelect } = options;
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
    
    container.append(svg.node());

    const g = svg.append("g");
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
        d.x0 = 0; // angle
        d.y0 = 0; // radius from center
    });

    const treeRadius = Math.min(width, height) / 2 - (isMobile ? 60 : 100);

    if (!treeRadius || treeRadius <= 0) {
        console.error('Invalid tree radius:', treeRadius);
        return null;
    }

    const toFiniteNumber = (value, fallback = 0) => {
        const parsed = typeof value === 'number' ? value : Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    const safeNodePoint = (node, fallbackNode = null) => {
        const fallbackX = fallbackNode
            ? toFiniteNumber(fallbackNode.x, toFiniteNumber(fallbackNode.x0, 0))
            : 0;
        const fallbackY = fallbackNode
            ? toFiniteNumber(fallbackNode.y, toFiniteNumber(fallbackNode.y0, 0))
            : 0;

        return {
            x: toFiniteNumber(node?.x, toFiniteNumber(node?.x0, fallbackX)),
            y: toFiniteNumber(node?.y, toFiniteNumber(node?.y0, fallbackY))
        };
    };

    const linkGenerator = d3.linkRadial()
        .angle(point => point.x)
        .radius(point => point.y);

    const safeCollapsedPath = (sourceNode) => {
        const sourcePoint = safeNodePoint(sourceNode);
        try {
            return linkGenerator({ source: sourcePoint, target: sourcePoint }) || 'M0,0L0,0';
        } catch {
            return 'M0,0L0,0';
        }
    };

    const safeLinkPath = (linkDatum) => {
        const sourcePoint = safeNodePoint(linkDatum?.source);
        const targetPoint = safeNodePoint(linkDatum?.target, linkDatum?.source);
        try {
            return linkGenerator({ source: sourcePoint, target: targetPoint }) || 'M0,0L0,0';
        } catch {
            return 'M0,0L0,0';
        }
    };

    applyFixedSectorPositioning(root);
    
    // Set initial positions for all nodes
    root.descendants().forEach(d => {
        const point = safeNodePoint(d);
        d.x = point.x;
        d.y = point.y;
        d.x0 = point.x;
        d.y0 = point.y;
    });
    
    // Initial collapse of all nodes beyond the first level
    if (root.children) {
        root.children.forEach(collapse);
    }
    
    // Fixed angular sectors for stable branch positioning.
    function applyFixedSectorPositioning(rootNode) {
        const mainBranches = rootNode.children || [];
        if (mainBranches.length === 0) {
            rootNode.x = 0;
            rootNode.y = 0;
            return rootNode;
        }

        const sectorSize = (2 * Math.PI) / mainBranches.length;
        const padding = 0.1; // Small padding between sectors

        // Position root at center
        rootNode.x = 0;
        rootNode.y = 0;

        // Assign fixed sectors to main branches
        mainBranches.forEach((branch, index) => {
            const sectorStart = index * sectorSize + padding;
            const sectorEnd = (index + 1) * sectorSize - padding;
            const sectorCenter = (sectorStart + sectorEnd) / 2;

            // Position main branch at fixed angle
            branch.x = toFiniteNumber(sectorCenter);
            branch.y = toFiniteNumber(treeRadius * 0.45); // Position at 45% of radius for more spacing from center

            // Position children within the branch's sector
            if (branch.children && branch.children.length > 0) {
                const childSectorSize = (sectorEnd - sectorStart) / branch.children.length;

                branch.children.forEach((child, childIndex) => {
                    const childAngle = sectorStart + (childIndex + 0.5) * childSectorSize;
                    child.x = toFiniteNumber(childAngle, branch.x);
                    child.y = toFiniteNumber(treeRadius * 0.75, branch.y); // Position at 75% of radius for better spacing

                    // Position grandchildren if they exist
                    if (child.children && child.children.length > 0) {
                        const grandChildSectorSize = childSectorSize / child.children.length;
                        child.children.forEach((grandChild, grandIndex) => {
                            const grandChildAngle = childAngle - childSectorSize/2 + (grandIndex + 0.5) * grandChildSectorSize;
                            grandChild.x = toFiniteNumber(grandChildAngle, child.x);
                            grandChild.y = toFiniteNumber(treeRadius * 0.95, child.y); // Position at 95% of radius for better spacing
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

        const sourcePoint = safeNodePoint(source);
        source.x = sourcePoint.x;
        source.y = sourcePoint.y;
        source.x0 = toFiniteNumber(source.x0, sourcePoint.x);
        source.y0 = toFiniteNumber(source.y0, sourcePoint.y);

        const treeData = applyFixedSectorPositioning(root);
        const nodes = treeData.descendants().reverse();
        const links = treeData.links();

        const { radii } = calculateSizing(nodes);

        // --- Links ---
        linksGroup.selectAll(".link").data(links, d => d.target.id)
            .join(
                enter => enter.append("path").attr("class", "link")
                    .attr("d", () => safeCollapsedPath(source)),
                update => update,
                exit => exit.transition().duration(duration)
                    .attr("d", () => safeCollapsedPath(source))
                    .remove()
            )
            .transition().duration(duration)
            .attr("d", d => safeLinkPath(d));

        // --- Nodes ---
        const nodeTranslate = (node, fallbackNode = null) => {
            const { x, y } = safeNodePoint(node, fallbackNode);
            const [tx, ty] = radialPoint(x, y);
            return `translate(${tx},${ty})`;
        };

        nodesGroup.selectAll(".node").data(nodes, d => d.id)
            .join(
                enter => {
                    const nodeEnter = enter.append("g")
                        .attr("class", "node")
                        .attr("transform", () => nodeTranslate(source))
                        .on("click", clickHandler);

                    nodeEnter.append("circle").attr("r", 1e-6);
                    nodeEnter.append("text").attr("class", "node-text")
                        .each(function(d) { wrapText(this, d, radii); });
                    
                    return nodeEnter;
                },
                update => update,
                exit => exit.transition().duration(duration)
                    .attr("transform", () => nodeTranslate(source)).remove()
                    .select("circle").attr("r", 1e-6)
            )
            .attr("tabindex", -1) // For focus
            .on('mousemove', tooltipMoveHandler)
            .on('mouseleave', tooltipLeaveHandler)
            .transition().duration(duration)
            .attr("transform", d => nodeTranslate(d, source))
            .select("circle")
            .attr("r", d => radii[d.depth] || radii[radii.length-1])
            .attr("fill", d => CONFIG.colors.nodes[d.depth] || CONFIG.colors.nodes[CONFIG.colors.nodes.length-1])
            .attr("class", d => d._children ? "collapsible" : "");

        nodes.forEach(d => {
            const point = safeNodePoint(d);
            d.x = point.x;
            d.y = point.y;
            d.x0 = point.x;
            d.y0 = point.y;
        });
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
        const safeX = toFiniteNumber(x);
        const safeY = toFiniteNumber(y);
        return [safeY * Math.cos(safeX - Math.PI / 2), safeY * Math.sin(safeX - Math.PI / 2)];
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
        if (onNodeSelect) {
            onNodeSelect({
                id: d.data.id,
                name: d.data.name,
                content: d.data.tooltip?.content || '',
                breadcrumb: d.ancestors().map(node => node.data.name).reverse()
            });
        }
        if (onNodeClick) {
            onNodeClick();
        }
    }
    
    function tooltipMoveHandler(event, d) {
        tooltip.style('visibility', 'visible').style('opacity', '1');
        const [x, y] = d3.pointer(event, document.body);
        tooltip.style('left', `${x + 15}px`).style('top', `${y + 15}px`);
        tooltip.html(`<div class="tooltip-title">${d.data.tooltip?.title || d.data.name}</div><div class="tooltip-content">${d.data.tooltip?.content || ''}</div>`);
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
                const targetDatum = targetNode.datum();
                if (targetDatum && onNodeSelect) {
                    onNodeSelect({
                        id: targetDatum.data.id,
                        name: targetDatum.data.name,
                        content: targetDatum.data.tooltip?.content || '',
                        breadcrumb: targetDatum.ancestors().map(node => node.data.name).reverse()
                    });
                }
                setTimeout(() => targetNode.classed('search-highlight', false), 2500);
            }, CONFIG.animation.duration);
        },
        fitToScreen() {
            svg.transition().duration(350).call(zoom.transform, d3.zoomIdentity.scale(0.95));
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
