import React from 'react';
import type { Diagram, ClassificationNode } from '../types';

export interface ClassificationDiagramProps {
  diagram: Extract<Diagram, { type: 'classification' }>;
  onSelect: (node: ClassificationNode) => void;
}

// F36: hard cap on recursion depth. Authored classification data can nest
// arbitrarily; a runaway or adversarial dataset would otherwise blow the React
// reconciler stack. The placeholder is a leaf — no further recursion.
const MAX_DEPTH = 10;

function renderNode(node: ClassificationNode, depth: number, onSelect: (n: ClassificationNode) => void): React.ReactElement {
  if (depth > MAX_DEPTH) {
    return (
      <div key={node.id} className="class-node class-node__depth-limit">
        <span>Depth limit reached — remaining nodes omitted.</span>
      </div>
    );
  }
  const hasChildren = (node.children?.length ?? 0) > 0;
  return (
    <div key={node.id} className={`class-node class-node--depth-${depth}`}>
      <button type="button" onClick={() => onSelect(node)} className="class-node__label">
        {node.category && <span className="class-node__category">{node.category}</span>}
        <span className="class-node__name">{node.name}</span>
      </button>
      {hasChildren && (
        <div className="class-node__children">
          {node.children!.map((c) => renderNode(c, depth + 1, onSelect))}
        </div>
      )}
    </div>
  );
}

export function ClassificationDiagram({ diagram, onSelect }: ClassificationDiagramProps) {
  return (
    <div className="diagram-canvas diagram-canvas--classification">
      {renderNode(diagram.data.root, 0, onSelect)}
    </div>
  );
}
