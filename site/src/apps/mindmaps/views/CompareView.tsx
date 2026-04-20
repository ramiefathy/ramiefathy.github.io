import React, { useEffect, useState } from 'react';
import type { MindMapDataset } from '../types';
import { ComparisonTable } from '../comparisons/ComparisonTable';

export function CompareView({ dataset }: { dataset: MindMapDataset }) {
  const comparisons = dataset.manifest.comparisons ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(comparisons[0]?.id ?? null);
  const selected = comparisons.find((c) => c.id === selectedId) ?? null;

  // F37/N3: keep selectedId consistent with the current comparisons list.
  // If comparisons is empty, clear selectedId. If selectedId is missing or null
  // but comparisons are available, select the first one (covers empty→nonempty).
  useEffect(() => {
    if (comparisons.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!selectedId || !comparisons.some((c) => c.id === selectedId)) {
      setSelectedId(comparisons[0].id);
    }
  }, [comparisons, selectedId]);

  if (comparisons.length === 0) {
    return <div className="compare-view compare-view--empty"><p>No comparisons authored yet for this topic.</p></div>;
  }

  return (
    <div className="compare-view">
      <nav className="compare-view__index" aria-label="Comparison library">
        <h3>Comparisons</h3>
        <ul>
          {comparisons.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => setSelectedId(c.id)} className={selectedId === c.id ? 'is-active' : ''}>
                {c.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="compare-view__main">
        {selected && (
          <>
            <header className="compare-view__header">
              <span className="kicker">COMPARISON</span>
              <h2>{selected.title}</h2>
              {selected.subtitle && <p className="lede">{selected.subtitle}</p>}
            </header>
            <ComparisonTable comparison={selected} />
            {selected.citations && selected.citations.length > 0 && (
              <footer className="compare-view__citations">
                <h4>Citations</h4>
                <ul>
                  {selected.citations.map((c, i) => (
                    <li key={i}>{c.quote} {c.pmid && <a href={`https://pubmed.ncbi.nlm.nih.gov/${c.pmid}/`} target="_blank" rel="noreferrer">PMID {c.pmid}</a>}</li>
                  ))}
                </ul>
              </footer>
            )}
          </>
        )}
      </div>
    </div>
  );
}
