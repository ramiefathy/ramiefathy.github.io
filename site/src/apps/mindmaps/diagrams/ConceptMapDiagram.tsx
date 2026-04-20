import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { Diagram, ConceptNode, ConceptEdgeKind } from '../types';

export interface ConceptMapDiagramProps {
  diagram: Extract<Diagram, { type: 'concept-map' }>;
  onSelect: (node: ConceptNode) => void;
}

const EDGE_COLOR: Record<ConceptEdgeKind, string> = {
  'causes':           'var(--terracotta, #c2674a)',
  'treats':           'var(--moss, #5b7058)',
  'exacerbates':      'var(--gold, #a37b2a)',
  'prevents':         'var(--slate, #475569)',
  'associated-with':  'var(--rule-soft, rgba(10,10,10,0.22))',
};

export function ConceptMapDiagram({ diagram, onSelect }: ConceptMapDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.innerHTML = '';

    const W = 720;
    const H = 480;
    d3.select(svg).attr('viewBox', `0 0 ${W} ${H}`);

    type Sim = d3.SimulationNodeDatum & { id: string; name: string; kind?: string };
    // F13: `d3.SimulationLinkDatum<Sim>` has a generic `string | Sim` source/target,
    // so the prior `as never` cast was a band-aid for the extra `kind` field.
    // Use a local intersection type so the shape is properly typed.
    type ConceptLink = d3.SimulationLinkDatum<Sim> & { kind: ConceptEdgeKind };
    const nodes: Sim[] = diagram.data.nodes.map((n) => ({ ...n }));
    const links: ConceptLink[] = diagram.data.edges.map((e) => ({ source: e.from, target: e.to, kind: e.kind }));

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: Sim) => d.id).distance(120).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-280))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .stop();

    for (let i = 0; i < 240; i++) sim.tick();

    const root = d3.select(svg).append('g');

    // Edges
    root.append('g').selectAll('path').data(diagram.data.edges).join('path')
      .attr('data-cm-edge', (d) => `${d.from}-${d.to}`)
      .attr('fill', 'none')
      .attr('stroke', (d) => EDGE_COLOR[d.kind])
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow)')
      .attr('d', (d) => {
        const s = nodes.find((n) => n.id === d.from)!;
        const t = nodes.find((n) => n.id === d.to)!;
        return `M${s.x},${s.y} L${t.x},${t.y}`;
      });

    // Arrow marker
    d3.select(svg).append('defs').append('marker')
      .attr('id', 'arrow').attr('viewBox', '0 -5 10 10').attr('refX', 30).attr('refY', 0)
      .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', 'var(--mm-text, #0a0a0a)');

    // Nodes
    const nodeG = root.append('g').selectAll('g').data(nodes).join('g')
      .attr('data-cm-node', (d) => d.id)
      .attr('transform', (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`)
      .attr('cursor', 'pointer')
      .on('click', (_, d) => {
        const original = diagram.data.nodes.find((n) => n.id === d.id);
        if (original) onSelect(original);
      });

    nodeG.append('rect')
      .attr('x', -56).attr('y', -18).attr('width', 112).attr('height', 36)
      .attr('rx', 4)
      .attr('fill', 'var(--mm-node-fill, var(--plate-bg, #fbf8f1))')
      .attr('stroke', 'var(--mm-node-stroke, var(--ink, #0a0a0a))')
      .attr('stroke-width', 1.25);

    nodeG.append('text')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('font-family', 'var(--font-display, sans-serif)').attr('font-weight', 500).attr('font-size', 12)
      .attr('fill', 'var(--mm-text, var(--ink, #0a0a0a))')
      .text((d) => d.name);

  }, [diagram, onSelect]);

  return (
    <div className="diagram-canvas diagram-canvas--concept-map">
      <svg ref={svgRef} role="img" aria-label={diagram.title} />
      <div className="concept-map__legend">
        <span><i style={{ background: 'var(--terracotta)' }} />causes</span>
        <span><i style={{ background: 'var(--moss)' }} />treats</span>
        <span><i style={{ background: 'var(--gold)' }} />exacerbates</span>
        <span><i style={{ background: 'var(--slate)' }} />prevents</span>
      </div>
    </div>
  );
}
