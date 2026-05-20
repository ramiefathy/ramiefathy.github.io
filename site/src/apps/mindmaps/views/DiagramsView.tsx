import React, { useEffect, useMemo, useState } from 'react';
import type { MindMapDataset } from '../types';
import { DiagramSwitch } from '../diagrams/DiagramSwitch';
import { SideDrawer, type SideDrawerContent } from './SideDrawer';

export function DiagramsView({ dataset }: { dataset: MindMapDataset }) {
  const diagrams = dataset.manifest.diagrams ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(diagrams[0]?.id ?? null);
  const [drawer, setDrawer] = useState<SideDrawerContent | null>(null);
  const selected = useMemo(() => diagrams.find((d) => d.id === selectedId) ?? null, [diagrams, selectedId]);

  // F37/N3: keep selectedId consistent with the current diagrams list.
  // If diagrams is empty, clear selectedId. If selectedId is missing or null
  // but diagrams are available, select the first one (covers empty→nonempty).
  useEffect(() => {
    if (diagrams.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!selectedId || !diagrams.some((d) => d.id === selectedId)) {
      setSelectedId(diagrams[0].id);
    }
  }, [diagrams, selectedId]);

  if (diagrams.length === 0) {
    return (
      <div className="diagrams-view diagrams-view--empty">
        <p>No diagrams authored yet for this topic.</p>
      </div>
    );
  }

  return (
    <div className={`diagrams-view${drawer ? ' diagrams-view--with-drawer' : ''}`}>
      <nav className="diagrams-view__index" aria-label="Diagram library">
        <h3>Diagrams</h3>
        <ul>
          {diagrams.map((d, i) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => setSelectedId(d.id)}
                className={selectedId === d.id ? 'is-active' : ''}
              >
                <span className="diagrams-view__num">{String(i + 1).padStart(2, '0')}</span>
                <span className="diagrams-view__title">{d.title}</span>
                <span className="diagrams-view__type">[{d.type.toUpperCase().replace('-', ' ')}]</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="diagrams-view__main">
        {selected && (
          <>
            <header className="diagrams-view__header">
              <span className="kicker">{selected.type.replace('-', ' ').toUpperCase()}</span>
              <h2>{selected.title}</h2>
              {selected.subtitle && <p className="lede">{selected.subtitle}</p>}
            </header>
            <DiagramSwitch diagram={selected} onSelectStep={setDrawer} />
          </>
        )}
      </div>
      <SideDrawer content={drawer} onClose={() => setDrawer(null)} />
    </div>
  );
}
