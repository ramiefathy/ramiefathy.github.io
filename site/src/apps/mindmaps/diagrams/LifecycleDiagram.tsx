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
  const radius = SIZE * 0.35;
  const angleStep = (2 * Math.PI) / phases.length;
  const startAngle = -Math.PI / 2; // start at top

  return (
    <div className="diagram-canvas diagram-canvas--lifecycle">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={diagram.title}>
        {/* Connecting circle */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--mm-link, var(--rule-soft, rgba(10,10,10,0.22)))" strokeWidth={1.5} strokeDasharray="4 4" />
        {/* Arrowheads between phases */}
        {phases.map((_, i) => {
          const a1 = startAngle + i * angleStep;
          const a2 = startAngle + (i + 1) * angleStep;
          const aMid = (a1 + a2) / 2;
          const ax = cx + Math.cos(aMid) * (radius + 10);
          const ay = cy + Math.sin(aMid) * (radius + 10);
          return (
            <text key={i} x={ax} y={ay} textAnchor="middle" dominantBaseline="central"
                  fill="var(--terracotta, #c2674a)" fontSize={18}>{'\u2192'}</text>
          );
        })}
        {/* Phase nodes */}
        {phases.map((phase, i) => {
          const angle = startAngle + i * angleStep;
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          return (
            <g key={phase.id} transform={`translate(${x}, ${y})`} cursor="pointer" onClick={() => onSelect(phase)}>
              <circle r={48} fill="var(--mm-node-fill, var(--plate-bg, #fbf8f1))" stroke="var(--mm-node-stroke, var(--ink, #0a0a0a))" strokeWidth={1.25} />
              <text textAnchor="middle" dominantBaseline="central" y={-6}
                    fontFamily="var(--font-display, sans-serif)" fontWeight={500} fontSize={16}
                    fill="var(--mm-text, var(--ink, #0a0a0a))">{phase.name}</text>
              {phase.duration && (
                <text textAnchor="middle" dominantBaseline="central" y={14}
                      fontFamily="var(--font-mono, monospace)" fontSize={10}
                      fill="var(--slate, #475569)">{phase.duration}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
