import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { Diagram, DecisionTreeStep } from '../types';

export interface DecisionTreeDiagramProps {
  diagram: Extract<Diagram, { type: 'decision-tree' }>;
  onSelect: (step: DecisionTreeStep) => void;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 70;
const LEVEL_GAP = 110;
const SIBLING_GAP = 40;

export function DecisionTreeDiagram({ diagram, onSelect }: DecisionTreeDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const wrapper = containerRef.current;
    if (!svg || !wrapper) return;
    svg.innerHTML = '';

    // Build a hierarchy from the start step. Use BFS — branches give us a DAG-as-tree.
    const stepMap = new Map(diagram.data.steps.map((s) => [s.id, s]) as [string, DecisionTreeStep][]);
    type Layout = { step: DecisionTreeStep; x: number; y: number; depth: number };
    const layouts: Layout[] = [];
    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: diagram.data.start, depth: 0 }];
    const byDepth = new Map<number, string[]>();

    while (queue.length) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const step = stepMap.get(id);
      if (!step) continue;
      const arr = byDepth.get(depth) ?? [];
      arr.push(id);
      byDepth.set(depth, arr);
      for (const branch of step.branches ?? []) {
        queue.push({ id: branch.nextStepId, depth: depth + 1 });
      }
    }

    // F3: empty-state guard. If BFS produced no reachable nodes (bad start,
    // empty steps, etc.), Math.max(...[]) would poison layout math with
    // -Infinity/NaN. Render an empty SVG shell and bail. R1 schema enforces
    // `start ∈ steps`, but this is a belt-and-suspenders renderer-level guard.
    if (byDepth.size === 0) {
      d3.select(svg)
        .attr('viewBox', '0 0 1 1')
        .attr('role', 'img')
        .attr('aria-label', diagram.title);
      return;
    }

    // Position nodes: depth = y; index in depth row = x
    const maxDepth = Math.max(...byDepth.keys());
    const depthCounts = Array.from(byDepth.values()).map((row) => row.length);
    const maxRowSize = Math.max(...depthCounts);
    const totalWidth = maxRowSize * (NODE_WIDTH + SIBLING_GAP);
    const totalHeight = (maxDepth + 1) * (NODE_HEIGHT + LEVEL_GAP);

    for (const [depth, ids] of byDepth.entries()) {
      const rowWidth = ids.length * (NODE_WIDTH + SIBLING_GAP);
      const xOffset = (totalWidth - rowWidth) / 2;
      ids.forEach((id, idx) => {
        const step = stepMap.get(id)!;
        const x = xOffset + idx * (NODE_WIDTH + SIBLING_GAP);
        const y = depth * (NODE_HEIGHT + LEVEL_GAP);
        layouts.push({ step, x, y, depth });
      });
    }

    const svgSel = d3.select(svg)
      .attr('viewBox', `0 0 ${totalWidth + 80} ${totalHeight + 80}`)
      .attr('role', 'img')
      .attr('aria-label', diagram.title);

    const root = svgSel.append('g').attr('transform', 'translate(40, 40)');

    // Draw edges first (under nodes)
    const layoutById = new Map(layouts.map((l) => [l.step.id, l]));
    root.append('g').attr('class', 'dt-edges')
      .selectAll('g').data(layouts.flatMap((l) =>
        (l.step.branches ?? []).map((b) => ({ from: l, to: layoutById.get(b.nextStepId), label: b.label }))
      ).filter((e) => e.to)).join('g')
      .each(function (this: SVGGElement, edge: { from: Layout; to: Layout | undefined; label: string }) {
        const sel = d3.select(this);
        const from = edge.from;
        const to = edge.to!;
        const x1 = from.x + NODE_WIDTH / 2;
        const y1 = from.y + NODE_HEIGHT;
        const x2 = to.x + NODE_WIDTH / 2;
        const y2 = to.y;
        sel.append('path')
          .attr('d', `M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`)
          .attr('fill', 'none')
          .attr('stroke', 'var(--mm-link, var(--rule-soft, rgba(10,10,10,0.22)))')
          .attr('stroke-width', 1.5);
        sel.append('text')
          .attr('x', (x1 + x2) / 2)
          .attr('y', (y1 + y2) / 2 - 6)
          .attr('text-anchor', 'middle')
          .attr('font-family', 'var(--font-mono, monospace)')
          .attr('font-size', 10)
          .attr('letter-spacing', '0.08em')
          .attr('fill', 'var(--terracotta, #c2674a)')
          .text(edge.label);
      });

    // Draw nodes
    root.append('g').attr('class', 'dt-nodes')
      .selectAll('g').data(layouts).join('g')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .attr('data-step-id', (d) => d.step.id)
      .attr('cursor', 'pointer')
      .on('click', (_, d) => onSelect(d.step))
      .each(function (this: SVGGElement, d: Layout) {
        const sel = d3.select(this);
        const fill =
          d.step.type === 'decision' ? 'var(--mm-node-fill, #fbf8f1)' :
          d.step.type === 'action'   ? 'color-mix(in oklab, var(--moss, #5b7058), white 88%)' :
                                        'color-mix(in oklab, var(--terracotta, #c2674a), white 78%)';
        if (d.step.type === 'decision') {
          // Diamond
          sel.append('polygon')
            .attr('points', `${NODE_WIDTH/2},0 ${NODE_WIDTH},${NODE_HEIGHT/2} ${NODE_WIDTH/2},${NODE_HEIGHT} 0,${NODE_HEIGHT/2}`)
            .attr('fill', fill)
            .attr('stroke', 'var(--mm-node-stroke, var(--ink, #0a0a0a))')
            .attr('stroke-width', 1.25);
        } else if (d.step.type === 'terminal') {
          // Pill
          sel.append('rect')
            .attr('width', NODE_WIDTH).attr('height', NODE_HEIGHT)
            .attr('rx', NODE_HEIGHT / 2).attr('ry', NODE_HEIGHT / 2)
            .attr('fill', fill)
            .attr('stroke', 'var(--mm-node-stroke, var(--ink, #0a0a0a))')
            .attr('stroke-width', 1.25);
        } else {
          // Action: rectangle
          sel.append('rect')
            .attr('width', NODE_WIDTH).attr('height', NODE_HEIGHT)
            .attr('fill', fill)
            .attr('stroke', 'var(--mm-node-stroke, var(--ink, #0a0a0a))')
            .attr('stroke-width', 1.25);
        }
        // Label (with simple word wrap, max 2 lines). F31: initialize empty,
        // then push the first non-empty word unconditionally — the previous
        // version left a blank lines[0] when the first word already exceeded
        // maxCharsPerLine, producing a stranded empty tspan.
        const label = d.step.prompt ?? '';
        const words = label.split(/\s+/).filter((w) => w.length > 0);
        const lines: string[] = [];
        const maxCharsPerLine = 22;
        for (const word of words) {
          if (lines.length === 0) {
            lines.push(word);
            continue;
          }
          const last = lines[lines.length - 1];
          const combined = `${last} ${word}`;
          if (combined.length > maxCharsPerLine && lines.length < 2) {
            lines.push(word);
          } else {
            lines[lines.length - 1] = combined;
          }
        }
        if (lines.length === 0) lines.push('');
        const text = sel.append('text')
          .attr('x', NODE_WIDTH / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-family', 'var(--font-display, sans-serif)')
          .attr('font-size', 13)
          .attr('font-weight', 500)
          .attr('fill', 'var(--mm-text, var(--ink, #0a0a0a))');
        const startDy = -((lines.length - 1) * 1.15) / 2;
        lines.forEach((line, i) => {
          text.append('tspan')
            .attr('x', NODE_WIDTH / 2)
            .attr('y', NODE_HEIGHT / 2)
            .attr('dy', `${i === 0 ? startDy : 1.15}em`)
            .text(line);
        });
      });

  }, [diagram, onSelect]);

  return (
    <div ref={containerRef} className="diagram-canvas diagram-canvas--decision-tree">
      <svg ref={svgRef} role="img" aria-label={diagram.title} />
    </div>
  );
}
