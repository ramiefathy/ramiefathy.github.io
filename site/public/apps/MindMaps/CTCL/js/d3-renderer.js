// js/d3-renderer.js

function MindMapRenderer(container, data, options = {}) {
    const { onNodeClick, onNodeSelect } = options;
    const tooltip = d3.select('#tooltip');
    const fallbackNodePalette = ['#a7f3d0', '#99f6e4', '#a5f3fc', '#67e8f9', '#cffafe'];
    const getNodeFillCss = (depth) => {
        const clampedDepth = Math.max(0, Math.min(fallbackNodePalette.length - 1, Number.isFinite(depth) ? depth : 0));
        const fallbackColor = fallbackNodePalette[clampedDepth] || fallbackNodePalette[fallbackNodePalette.length - 1];
        // Use CSS properties (not SVG attributes) so the browser can resolve color-mix() values in custom properties.
        return `var(--mindmap-node-fill-${clampedDepth}, ${fallbackColor})`;
    };

    // --- Configuration ---
    const CONFIG = {
        animation: { duration: 500 },
        sizing: {
            mobile: { minRadius: 20, maxRadius: 38, minFont: 5, maxFont: 9 },
            desktop: { minRadius: 25, maxRadius: 45, minFont: 6, maxFont: 11 }
        },
        colors: {},
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
    let currentRadii = [];

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

        if (mainBranches.length === 2) {
            rootNode.x = 0;
            rootNode.y = 0;
            const dualBranchAngles = [Math.PI * 0.25, Math.PI * 1.25];

            mainBranches.forEach((branch, index) => {
                branch.x = toFiniteNumber(dualBranchAngles[index], 0);
                branch.y = toFiniteNumber(treeRadius * 0.52);
            });

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
        currentRadii = radii;

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

                    nodeEnter.append("circle")
                        .attr("r", 1e-6)
                        .style("fill", d => getNodeFillCss(d.depth));
                    nodeEnter.append("text").attr("class", "node-text");
                    
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
            .select("circle")
            .style("fill", d => getNodeFillCss(d.depth))
            .attr("class", d => d._children ? "collapsible" : "");
        
        nodesGroup.selectAll(".node").data(nodes, d => d.id)
            .transition().duration(duration)
            .attr("transform", d => nodeTranslate(d, source));

        nodesGroup.selectAll(".node").data(nodes, d => d.id)
            .select("circle")
            .transition().duration(duration)
            .attr("r", d => radii[d.depth] || radii[radii.length-1]);

        const radiusCeiling = Math.round(Math.min(width, height) * 0.12);
        const requestedRadiiByDepth = new Map();
        const nodeTexts = nodesGroup.selectAll(".node text.node-text");

        nodeTexts.each(function(d) {
            const requested = wrapText(this, d, radii, { render: false, radiusCeiling });
            if (typeof requested !== 'number' || !Number.isFinite(requested)) return;
            const depth = Number.isFinite(d.depth) ? d.depth : 0;
            if (depth > 1) return;
            requestedRadiiByDepth.set(depth, Math.max(requestedRadiiByDepth.get(depth) || 0, requested));
        });

        if (requestedRadiiByDepth.size) {
            requestedRadiiByDepth.forEach((requested, depth) => {
                if (requested > (radii[depth] || 0)) {
                    radii[depth] = requested;
                }
            });
            nodesGroup.selectAll(".node circle")
                // Cancel any in-flight radius transitions so bumped radii don't tween back to the old target.
                .interrupt()
                .attr("r", d => radii[d.depth] || radii[radii.length - 1]);
        }

        nodeTexts.each(function(d) {
            wrapText(this, d, radii, { render: true, radiusCeiling });
        });

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
        const maxAllowedRadius = Math.max(config.minRadius, Math.round(Math.min(width, height) * 0.12));
        const baseRadii = [Math.min(config.maxRadius, maxAllowedRadius), 38, 32, 28, config.minRadius];
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

    function wrapText(element, d, radii, { render = true, radiusCeiling = null } = {}) {
        const textElement = d3.select(element);
        const depth = Number.isFinite(d.depth) ? d.depth : 0;
        const radiusBase = radii[depth] || radii[radii.length - 1] || 24;
        const label = ((d.data?.name || '') + '').trim();
        const words = label.split(/\s+/).filter(Boolean);

        const fontPx = 14;
        const lineHeightEm = 1.1;
        const paddingPx = 2;
        const maxLines = depth <= 1 ? 3 : 2;
        const radiusMax = depth <= 1
            ? Math.min(Number.isFinite(radiusCeiling) ? radiusCeiling : radiusBase, Math.round(radiusBase * 1.25))
            : radiusBase;

        const renderLines = (lines) => {
            textElement
                .text(null)
                .attr("font-size", `${fontPx}px`)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                // Ensure measurements use the final suite typography immediately (avoids post-font-load overflow).
                .style("font-family", "var(--font-body, var(--legacy-font-sans, ui-sans-serif))")
                .style("font-weight", "500");
            const startDy = -((lines.length - 1) * lineHeightEm) / 2;
            lines.forEach((lineText, index) => {
                textElement
                    .append("tspan")
                    .attr("x", 0)
                    .attr("dy", index === 0 ? `${startDy}em` : `${lineHeightEm}em`)
                    .text(lineText);
            });
        };

        const renderedTextFitsCircle = (radius) => {
            const node = textElement.node();
            if (!node) return true;
            const bbox = node.getBBox();
            if (bbox.width <= 0 || bbox.height <= 0) return true;
            const radiusSafe = Math.max(4, radius - paddingPx);
            const corners = [
                { x: bbox.x, y: bbox.y },
                { x: bbox.x + bbox.width, y: bbox.y },
                { x: bbox.x, y: bbox.y + bbox.height },
                { x: bbox.x + bbox.width, y: bbox.y + bbox.height }
            ];
            return corners.every((corner) => Math.hypot(corner.x, corner.y) <= radiusSafe);
        };

        const maxCornerDistance = () => {
            const node = textElement.node();
            if (!node) return Number.POSITIVE_INFINITY;
            const bbox = node.getBBox();
            if (bbox.width <= 0 || bbox.height <= 0) return 0;
            const corners = [
                { x: bbox.x, y: bbox.y },
                { x: bbox.x + bbox.width, y: bbox.y },
                { x: bbox.x, y: bbox.y + bbox.height },
                { x: bbox.x + bbox.width, y: bbox.y + bbox.height }
            ];
            return Math.max(...corners.map((corner) => Math.hypot(corner.x, corner.y)));
        };

        const isMicroLine = (line) => /^[A-Za-z]{1,2}(?:…)?$/.test(line);

        const truncateLastLineToFit = (lines, radius) => {
            if (!lines.length) return null;
            const lastIndex = lines.length - 1;
            const base = lines[lastIndex].trim();
            if (!base) return null;

            const minChars = 3;
            const attempts = [];
            if (base.includes(" ")) {
                const parts = base.split(/\s+/);
                for (let cut = parts.length - 1; cut >= 1; cut -= 1) {
                    attempts.push(`${parts.slice(0, cut).join(" ")}…`);
                }
            }

            for (let len = base.length; len >= minChars; len -= 1) {
                attempts.push(`${base.slice(0, len).trimEnd()}…`);
            }

            for (const candidate of attempts) {
                const core = candidate.replace(/…$/, "");
                if (core.length < minChars) continue;
                if (isMicroLine(candidate)) continue;
                const mutated = [...lines];
                mutated[lastIndex] = candidate;
                renderLines(mutated);
                if (renderedTextFitsCircle(radius)) return mutated;
            }

            return null;
        };

        const buildCandidates = () => {
            if (!words.length) return [[""]];
            const candidates = [];
            candidates.push([words.join(" ")]);

            if (words.length >= 2 && maxLines >= 2) {
                for (let i = 1; i < words.length; i += 1) {
                    candidates.push([words.slice(0, i).join(" "), words.slice(i).join(" ")]);
                }
            }

            if (words.length >= 3 && maxLines >= 3) {
                for (let i = 1; i < words.length - 1; i += 1) {
                    for (let j = i + 1; j < words.length; j += 1) {
                        candidates.push([
                            words.slice(0, i).join(" "),
                            words.slice(i, j).join(" "),
                            words.slice(j).join(" ")
                        ]);
                    }
                }
            }

            return candidates;
        };

        const pickBest = (radius, allowEllipsis) => {
            const candidates = buildCandidates();
            let best = null;

            for (const candidate of candidates) {
                if (candidate.slice(0, -1).some((line) => isMicroLine(line))) continue;
                renderLines(candidate);
                let ellipsisUsed = false;
                let lines = candidate;

                if (!renderedTextFitsCircle(radius)) {
                    if (!allowEllipsis) continue;
                    const truncated = truncateLastLineToFit(candidate, radius);
                    if (!truncated) continue;
                    ellipsisUsed = true;
                    lines = truncated;
                }

                if (lines.slice(0, -1).some((line) => line.endsWith("…"))) continue;
                if (lines.filter((line) => line.endsWith("…")).length > 1) continue;
                if (lines.length > 1 && isMicroLine(lines[lines.length - 1])) continue;

                const margin = Math.max(0, Math.max(4, radius - paddingPx) - maxCornerDistance());
                const solution = { lines, ellipsisUsed, margin };

                if (!best) {
                    best = solution;
                    continue;
                }

                const bestScore = [best.ellipsisUsed ? 1 : 0, best.lines.length, -best.margin];
                const evalScore = [solution.ellipsisUsed ? 1 : 0, solution.lines.length, -solution.margin];
                const isBetter =
                    evalScore[0] < bestScore[0] ||
                    (evalScore[0] === bestScore[0] && evalScore[1] < bestScore[1]) ||
                    (evalScore[0] === bestScore[0] && evalScore[1] === bestScore[1] && evalScore[2] < bestScore[2]);

                if (isBetter) best = solution;
            }

            return best;
        };

        let requestedRadius = null;
        if (!render && depth <= 1 && radiusMax > radiusBase) {
            if (!pickBest(radiusBase, false)) {
                for (let r = radiusBase; r <= radiusMax; r += 2) {
                    if (pickBest(r, false)) {
                        requestedRadius = r;
                        break;
                    }
                }
            }
            textElement
                .text(null)
                .attr("font-size", `${fontPx}px`)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .style("font-family", "var(--font-body, var(--legacy-font-sans, ui-sans-serif))")
                .style("font-weight", "500");
            return requestedRadius;
        }

        const radius = radiusBase;
        const solution = pickBest(radius, false) || pickBest(radius, true);
        if (solution) {
            renderLines(solution.lines);
        } else {
            const fallback = label ? `${label.slice(0, 3)}…` : "";
            renderLines([fallback]);
        }

        return null;
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
    requestAnimationFrame(() => fitToScreen({ duration: 0 }));
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready
            .then(() => {
                update(root);
                fitToScreen({ duration: 0 });
            })
            .catch(() => {});
    }
    // The SVG is already appended, so no need for the line here.

    // --- Public API ---
    function getProjectedNodeBounds(nodes) {
        if (!nodes.length) return null;

        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        nodes.forEach((node) => {
            const point = safeNodePoint(node);
            const [x, y] = radialPoint(point.x, point.y);
            const radius = currentRadii[node.depth] || currentRadii[currentRadii.length - 1] || 24;
            minX = Math.min(minX, x - radius);
            maxX = Math.max(maxX, x + radius);
            minY = Math.min(minY, y - radius);
            maxY = Math.max(maxY, y + radius);
        });

        if (![minX, minY, maxX, maxY].every(Number.isFinite)) return null;
        return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    }

    function fitToScreen({ duration = 350 } = {}) {
        const graphNode = g.node();
        if (!graphNode) return;

        const visibleNodes = root.descendants().filter((node) => node.depth <= 1);
        const bounds = getProjectedNodeBounds(visibleNodes.length ? visibleNodes : root.descendants());
        if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
            return;
        }

        const insetRatio = 0.12;
        const paddedWidth = width * (1 - insetRatio * 2);
        const paddedHeight = height * (1 - insetRatio * 2);
        const computedScale = Math.min(paddedWidth / bounds.width, paddedHeight / bounds.height);
        const clampedScale = Math.max(CONFIG.zoom.min, Math.min(CONFIG.zoom.max, computedScale));
        const centerX = bounds.minX + bounds.width / 2;
        const centerY = bounds.minY + bounds.height / 2;
        const translateX = -centerX * clampedScale;
        const translateY = -centerY * clampedScale;
        const transform = d3.zoomIdentity.translate(translateX, translateY).scale(clampedScale);

        if (duration > 0) {
            svg.transition().duration(duration).call(zoom.transform, transform);
        } else {
            svg.call(zoom.transform, transform);
        }
    }

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
            fitToScreen();
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
