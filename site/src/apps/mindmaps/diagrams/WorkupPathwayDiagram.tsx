import React from 'react';
import type { Diagram, WorkupItem } from '../types';

export interface WorkupPathwayDiagramProps {
  diagram: Extract<Diagram, { type: 'workup-pathway' }>;
  onSelect: (item: WorkupItem) => void;
}

// F36: hard cap on subItems recursion depth. Guards against adversarial or
// runaway authored JSON blowing the React reconciler. Placeholder is a leaf —
// no further recursion.
const MAX_DEPTH = 10;

function renderItem(item: WorkupItem, num: string, onSelect: (i: WorkupItem) => void, depth = 0): React.ReactElement {
  if (depth > MAX_DEPTH) {
    return (
      <li key={item.id} className="workup-item workup-item__depth-limit">
        <span>Depth limit reached — remaining items omitted.</span>
      </li>
    );
  }
  return (
    <li key={item.id} className="workup-item">
      <button type="button" onClick={() => onSelect(item)}>
        <span className="workup-item__num">{num}</span>
        <span className="workup-item__label">{item.label}</span>
      </button>
      {item.branchIf && (
        <div className="workup-item__branch-if">
          <span className="workup-item__branch-prefix">if</span> {item.branchIf}
        </div>
      )}
      {item.subItems && item.subItems.length > 0 && (
        <ol className="workup-item__sub">
          {item.subItems.map((sub, i) => renderItem(sub, `${num}.${String(i + 1).padStart(2, '0')}`, onSelect, depth + 1))}
        </ol>
      )}
    </li>
  );
}

export function WorkupPathwayDiagram({ diagram, onSelect }: WorkupPathwayDiagramProps) {
  return (
    <div className="diagram-canvas diagram-canvas--workup">
      {diagram.data.stages.map((stage, si) => (
        <section key={stage.id} className="workup-stage">
          <header>
            <span className="workup-stage__num">{String(si + 1).padStart(2, '0')}</span>
            <h3>{stage.name}</h3>
          </header>
          <ol className="workup-stage__items">
            {stage.items.map((item, i) => renderItem(item, String(i + 1).padStart(2, '0'), onSelect))}
          </ol>
        </section>
      ))}
    </div>
  );
}
