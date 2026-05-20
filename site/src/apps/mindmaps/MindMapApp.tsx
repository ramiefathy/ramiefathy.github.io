import React, { useMemo, useState } from 'react';
import type { MindMapDataset } from './types';
import { ViewSwitcher, type MindMapViewId } from './views/ViewSwitcher';
import { AtlasView } from './views/AtlasView';
import { DiagramsView } from './views/DiagramsView';
import { CompareView } from './views/CompareView';

// Re-exports for back-compat with existing consumers (do NOT remove until all
// imports of these helpers from MindMapApp have been migrated to AtlasView).
export { buildInitialCollapsed, buildBreadcrumbPath, markdownToHtml } from './views/AtlasView';

interface MindMapAppProps {
  dataset: MindMapDataset;
}

const MindMapApp: React.FC<MindMapAppProps> = ({ dataset }) => {
  const counts = useMemo(() => ({
    diagrams: dataset.manifest.diagrams?.length ?? 0,
    comparisons: dataset.manifest.comparisons?.length ?? 0,
    atlas: dataset.manifest.tabs.length,
  }), [dataset]);

  // Default to Diagrams when at least one is authored, else fall back to Atlas.
  const initialView: MindMapViewId = counts.diagrams > 0 ? 'diagrams' : 'atlas';
  const [view, setView] = useState<MindMapViewId>(initialView);

  return (
    <div className="mindmap-shell">
      <ViewSwitcher value={view} onChange={setView} counts={counts} />
      {view === 'diagrams' && <DiagramsView dataset={dataset} />}
      {view === 'compare'  && <CompareView dataset={dataset} />}
      {view === 'atlas'    && <AtlasView dataset={dataset} />}
    </div>
  );
};

export { MindMapApp };
export default MindMapApp;
