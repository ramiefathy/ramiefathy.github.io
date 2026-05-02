import React, { useEffect, useState } from 'react';
import type { ConceptEdgeKind, ConceptNode, Diagram } from '../types';
import type { ConceptMapLayoutNode, DiagramLayout } from './layoutEngine';

export interface ConceptMapDiagramProps {
  diagram: Extract<Diagram, { type: 'concept-map' }>;
  onSelect: (node: ConceptNode) => void;
}

const EDGE_COLOR: Record<ConceptEdgeKind, string> = {
  causes: 'var(--terracotta, #c2674a)',
  treats: 'var(--moss, #5b7058)',
  exacerbates: 'var(--gold, #a37b2a)',
  prevents: 'var(--slate, #475569)',
  'associated-with': 'var(--rule-soft, rgba(10,10,10,0.32))',
};

const EDGE_KINDS: ConceptEdgeKind[] = ['causes', 'treats', 'exacerbates', 'prevents', 'associated-with'];

function MultilineText({ node }: { node: ConceptMapLayoutNode }) {
  const lineHeight = node.label.fontSize * 1.22;
  const firstY = node.height / 2 - ((node.label.lines.length - 1) * lineHeight) / 2;
  return (
    <text
      textAnchor="middle"
      fontFamily="var(--font-display, sans-serif)"
      fontWeight={500}
      fontSize={node.label.fontSize}
      fill="var(--mm-text, var(--ink, #0a0a0a))"
    >
      {node.label.lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={node.width / 2} y={firstY + index * lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export function ConceptMapDiagram({ diagram, onSelect }: ConceptMapDiagramProps) {
  const [layout, setLayout] = useState<DiagramLayout<ConceptMapLayoutNode> | null>(null);
  const sourceNodeById = new Map(diagram.data.nodes.map((node) => [node.id, node]));

  useEffect(() => {
    let cancelled = false;
    setLayout(null);
    import('./layoutEngine')
      .then(({ layoutConceptMapDiagram }) => layoutConceptMapDiagram(diagram))
      .then((nextLayout) => {
        if (!cancelled) setLayout(nextLayout);
      });
    return () => {
      cancelled = true;
    };
  }, [diagram]);

  return (
    <div className="diagram-canvas diagram-canvas--concept-map">
      <svg
        viewBox={`0 0 ${layout?.viewBox.width ?? 1} ${layout?.viewBox.height ?? 1}`}
        width={layout?.viewBox.width ?? 1}
        height={layout?.viewBox.height ?? 1}
        role="img"
        aria-label={diagram.title}
      >
        <defs>
          {EDGE_KINDS.map((kind) => (
            <marker
              key={kind}
              id={`concept-arrow-${kind}`}
              viewBox="0 -5 10 10"
              refX={9}
              refY={0}
              markerWidth={6}
              markerHeight={6}
              orient="auto"
            >
              <path d="M0,-5L10,0L0,5" fill={EDGE_COLOR[kind]} />
            </marker>
          ))}
        </defs>
        {layout && (
          <>
            <g className="cm-edges">
              {layout.edges.map((edge) => (
                <path
                  key={edge.id}
                  data-cm-edge={edge.id}
                  data-diagram-edge={edge.id}
                  d={edge.path}
                  fill="none"
                  stroke={EDGE_COLOR[edge.kind ?? 'associated-with']}
                  strokeWidth={1.5}
                  markerEnd={`url(#${edge.markerId})`}
                />
              ))}
            </g>
            <g className="cm-nodes">
              {layout.nodes.map((node) => {
                const sourceNode = sourceNodeById.get(node.id);
                if (!sourceNode) return null;
                return (
                  <g
                    key={node.id}
                    data-cm-node={node.id}
                    data-diagram-node={node.id}
                    data-node-width={node.width}
                    data-node-height={node.height}
                    transform={`translate(${node.x}, ${node.y})`}
                    cursor="pointer"
                    onClick={() => onSelect(sourceNode)}
                  >
                    <rect
                      width={node.width}
                      height={node.height}
                      rx={4}
                      fill="var(--mm-node-fill, var(--plate-bg, #fbf8f1))"
                      stroke="var(--mm-node-stroke, var(--ink, #0a0a0a))"
                      strokeWidth={1.25}
                    />
                    <MultilineText node={node} />
                  </g>
                );
              })}
            </g>
          </>
        )}
      </svg>
      <div className="concept-map__legend">
        <span><i style={{ background: 'var(--terracotta)' }} />causes</span>
        <span><i style={{ background: 'var(--moss)' }} />treats</span>
        <span><i style={{ background: 'var(--gold)' }} />exacerbates</span>
        <span><i style={{ background: 'var(--slate)' }} />prevents</span>
      </div>
    </div>
  );
}
