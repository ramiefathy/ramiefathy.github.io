import React from 'react';

export type MindMapViewId = 'diagrams' | 'compare' | 'atlas';

const VIEWS: Array<{ id: MindMapViewId; label: string }> = [
  { id: 'diagrams', label: 'Diagrams' },
  { id: 'compare',  label: 'Compare' },
  { id: 'atlas',    label: 'Atlas' },
];

export interface ViewSwitcherProps {
  value: MindMapViewId;
  onChange: (next: MindMapViewId) => void;
  counts: { diagrams: number; comparisons: number; atlas: number };
}

export function ViewSwitcher({ value, onChange, counts }: ViewSwitcherProps) {
  return (
    <div className="view-switcher" role="tablist" aria-label="Mindmap view mode">
      {VIEWS.map((view) => {
        const count = view.id === 'compare' ? counts.comparisons : counts[view.id];
        const isActive = value === view.id;
        return (
          <button
            key={view.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`view-switcher__tab${isActive ? ' is-active' : ''}`}
            onClick={() => onChange(view.id)}
          >
            <span className="view-switcher__label">{view.label}</span>
            <span className="view-switcher__count" aria-hidden="true">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
