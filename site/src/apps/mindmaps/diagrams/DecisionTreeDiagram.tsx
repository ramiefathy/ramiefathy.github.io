import React, { useEffect, useState } from 'react';
import type { Diagram, DecisionTreeStep } from '../types';
import type { DiagramLayout, DecisionTreeLayoutNode } from './layoutEngine';

export interface DecisionTreeDiagramProps {
  diagram: Extract<Diagram, { type: 'decision-tree' }>;
  onSelect: (step: DecisionTreeStep) => void;
}

const NODE_FILL: Record<DecisionTreeStep['type'], string> = {
  decision: 'var(--mm-node-fill, #fbf8f1)',
  action: 'color-mix(in oklab, var(--moss, #5b7058), white 88%)',
  terminal: 'color-mix(in oklab, var(--terracotta, #c2674a), white 78%)',
};

function renderShape(node: DecisionTreeLayoutNode) {
  const stroke = 'var(--mm-node-stroke, var(--ink, #0a0a0a))';
  if (node.type === 'decision') {
    return (
      <polygon
        points={`${node.width / 2},0 ${node.width},${node.height / 2} ${node.width / 2},${node.height} 0,${node.height / 2}`}
        fill={NODE_FILL[node.type]}
        stroke={stroke}
        strokeWidth={1.25}
      />
    );
  }
  return (
    <rect
      width={node.width}
      height={node.height}
      rx={node.type === 'terminal' ? node.height / 2 : 4}
      ry={node.type === 'terminal' ? node.height / 2 : 4}
      fill={NODE_FILL[node.type]}
      stroke={stroke}
      strokeWidth={1.25}
    />
  );
}

function MultilineText({
  lines,
  x,
  y,
  fontSize,
  className,
}: {
  lines: string[];
  x: number;
  y: number;
  fontSize: number;
  className?: string;
}) {
  const lineHeight = fontSize * 1.22;
  const firstY = y - ((lines.length - 1) * lineHeight) / 2;
  return (
    <text
      className={className}
      textAnchor="middle"
      fontFamily="var(--font-display, sans-serif)"
      fontWeight={500}
      fontSize={fontSize}
      fill="var(--mm-text, var(--ink, #0a0a0a))"
    >
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} y={firstY + index * lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export function DecisionTreeDiagram({ diagram, onSelect }: DecisionTreeDiagramProps) {
  const [layout, setLayout] = useState<DiagramLayout<DecisionTreeLayoutNode> | null>(null);
  const stepById = new Map(diagram.data.steps.map((step) => [step.id, step]));

  useEffect(() => {
    let cancelled = false;
    setLayout(null);
    import('./layoutEngine')
      .then(({ layoutDecisionTreeDiagram }) => layoutDecisionTreeDiagram(diagram))
      .then((nextLayout) => {
        if (!cancelled) setLayout(nextLayout);
      });
    return () => {
      cancelled = true;
    };
  }, [diagram]);

  return (
    <div className="diagram-canvas diagram-canvas--decision-tree">
      <svg
        viewBox={`0 0 ${layout?.viewBox.width ?? 1} ${layout?.viewBox.height ?? 1}`}
        width={layout?.viewBox.width ?? 1}
        height={layout?.viewBox.height ?? 1}
        role="img"
        aria-label={diagram.title}
      >
        <defs>
          <marker
            id="decision-arrow"
            viewBox="0 -5 10 10"
            refX={9}
            refY={0}
            markerWidth={6}
            markerHeight={6}
            orient="auto"
          >
            <path d="M0,-5L10,0L0,5" fill="var(--mm-link, var(--rule-soft, rgba(10,10,10,0.42)))" />
          </marker>
        </defs>
        {layout && (
          <>
            <g className="dt-edges">
              {layout.edges.map((edge) => (
                <g key={edge.id}>
                  <path
                    data-diagram-edge={edge.id}
                    d={edge.path}
                    fill="none"
                    stroke="var(--mm-link, var(--rule-soft, rgba(10,10,10,0.22)))"
                    strokeWidth={1.5}
                    markerEnd={`url(#${edge.markerId})`}
                  />
                  {edge.label && (
                    <text
                      data-diagram-label={edge.id}
                      x={edge.label.x}
                      y={edge.label.y}
                      textAnchor="middle"
                      fontFamily="var(--font-mono, monospace)"
                      fontSize={edge.label.fontSize}
                      letterSpacing="0"
                      fill="var(--terracotta, #c2674a)"
                    >
                      {edge.label.lines.map((line, index) => (
                        <tspan key={`${line}-${index}`} x={edge.label!.x} dy={index === 0 ? 0 : '1.15em'}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  )}
                </g>
              ))}
            </g>
            <g className="dt-nodes">
              {layout.nodes.map((node) => {
                const step = stepById.get(node.id);
                if (!step) return null;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    data-step-id={node.id}
                    data-diagram-node={node.id}
                    data-node-width={node.width}
                    data-node-height={node.height}
                    cursor="pointer"
                    onClick={() => onSelect(step)}
                  >
                    {renderShape(node)}
                    <MultilineText
                      lines={node.label.lines}
                      x={node.width / 2}
                      y={node.height / 2}
                      fontSize={node.label.fontSize}
                    />
                  </g>
                );
              })}
            </g>
          </>
        )}
      </svg>
    </div>
  );
}
