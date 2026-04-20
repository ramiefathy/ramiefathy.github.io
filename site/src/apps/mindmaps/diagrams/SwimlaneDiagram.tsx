import React from 'react';
import type { Diagram, SwimlaneCell } from '../types';

export interface SwimlaneDiagramProps {
  diagram: Extract<Diagram, { type: 'swimlane' }>;
  onSelect: (cell: SwimlaneCell & { rowName: string; laneName: string }) => void;
}

export function SwimlaneDiagram({ diagram, onSelect }: SwimlaneDiagramProps) {
  const { lanes, rows } = diagram.data;
  // F21: belt-and-suspenders renderer-level guard. Schema rejects empty
  // lanes (R5), but if a consumer bypasses validation we render an empty-state
  // placeholder rather than a broken `grid-template-columns: 200px repeat(0, ...)`.
  if (!lanes || lanes.length === 0) {
    return (
      <div className="diagram-canvas diagram-canvas--swimlane diagram-canvas--placeholder">
        <p>No lanes to display.</p>
      </div>
    );
  }
  const gridCols = `200px repeat(${lanes.length}, minmax(0, 1fr))`;
  return (
    <div className="diagram-canvas diagram-canvas--swimlane">
      <div className="swimlane" style={{ gridTemplateColumns: gridCols }}>
        <div className="swimlane__corner" />
        {lanes.map((lane) => (
          <div key={lane.id} className="swimlane__lane-header">{lane.name}</div>
        ))}
        {rows.map((row) => (
          <React.Fragment key={row.id}>
            <div className="swimlane__row-header">{row.name}</div>
            {lanes.map((lane) => {
              const cell = row.cells[lane.id];
              if (!cell) return <div key={lane.id} className="swimlane__cell swimlane__cell--empty" />;
              const emphasisClass = cell.emphasis ? `swimlane__cell--${cell.emphasis}` : '';
              return (
                <button
                  key={lane.id}
                  type="button"
                  className={`swimlane__cell ${emphasisClass}`}
                  onClick={() => onSelect({ ...cell, rowName: row.name, laneName: lane.name })}
                >
                  {cell.text}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
