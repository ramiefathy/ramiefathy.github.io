import React from 'react';
import type { Diagram, LifecyclePhase } from '../types';

export interface LifecycleDiagramProps {
  diagram: Extract<Diagram, { type: 'lifecycle' }>;
  onSelect: (phase: LifecyclePhase) => void;
}

export function LifecycleDiagram({ diagram, onSelect }: LifecycleDiagramProps) {
  const phases = diagram.data.phases;
  const SIZE = 480;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const radius = SIZE * 0.34;
  const nodeRadius = Math.max(46, Math.min(58, SIZE * 0.1));
  const angleStep = (2 * Math.PI) / phases.length;
  const startAngle = -Math.PI / 2; // start at top

  function pointAt(angle: number, r = radius) {
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    };
  }

  return (
    <div className="diagram-canvas diagram-canvas--lifecycle">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={diagram.title}>
        <defs>
          <marker
            id="lifecycle-arrow"
            viewBox="0 -5 10 10"
            refX={9}
            refY={0}
            markerWidth={7}
            markerHeight={7}
            orient="auto"
          >
            <path d="M0,-5L10,0L0,5" fill="var(--terracotta, #c2674a)" />
          </marker>
        </defs>
        {/* Connecting circle */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--mm-link, var(--rule-soft, rgba(10,10,10,0.22)))" strokeWidth={1.5} strokeDasharray="4 4" />
        {/* Directional arcs between phases */}
        {phases.map((_, i) => {
          const a1 = startAngle + i * angleStep;
          const a2 = startAngle + (i + 1) * angleStep;
          const gap = phases.length > 1 ? angleStep * 0.2 : 0;
          const start = pointAt(a1 + gap);
          const end = pointAt(a2 - gap);
          const largeArc = angleStep - gap * 2 > Math.PI ? 1 : 0;
          return (
            <path
              key={i}
              data-lifecycle-edge={`${i}`}
              d={`M${start.x},${start.y} A${radius},${radius} 0 ${largeArc} 1 ${end.x},${end.y}`}
              fill="none"
              stroke="var(--terracotta, #c2674a)"
              strokeWidth={1.4}
              markerEnd="url(#lifecycle-arrow)"
            />
          );
        })}
        {/* Phase nodes */}
        {phases.map((phase, i) => {
          const angle = startAngle + i * angleStep;
          const { x, y } = pointAt(angle);
          return (
            <g key={phase.id} transform={`translate(${x}, ${y})`} cursor="pointer" onClick={() => onSelect(phase)}>
              <circle r={nodeRadius} fill="var(--mm-node-fill, var(--plate-bg, #fbf8f1))" stroke="var(--mm-node-stroke, var(--ink, #0a0a0a))" strokeWidth={1.25} />
              <text textAnchor="middle" dominantBaseline="central" y={-6}
                    fontFamily="var(--font-display, sans-serif)" fontWeight={500} fontSize={16}
                    fill="var(--mm-text, var(--ink, #0a0a0a))">{phase.name}</text>
              {phase.duration && (
                <text textAnchor="middle" dominantBaseline="central" y={14}
                      fontFamily="var(--font-mono, monospace)" fontSize={11}
                      fill="var(--slate, #475569)">{phase.duration}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
