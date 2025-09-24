export interface MindMapTooltip {
  title: string;
  markdown: string;
}

export interface MindMapNode {
  id: string;
  name: string;
  tooltip?: MindMapTooltip;
  children?: MindMapNode[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface MindMapManifestTab {
  id: string;
  name: string;
}

export interface MindMapManifest {
  id: string;
  title: string;
  defaultTab: string;
  theme: string;
  tabs: MindMapManifestTab[];
}

export interface MindMapDataset {
  manifest: MindMapManifest;
  tabs: Record<string, MindMapNode>;
}

export interface SearchResult {
  id: string;
  name: string;
  tabId: string;
  path: string[];
  score: number;
}

export type LayoutMode = 'radial' | 'vertical';
export type ThemeMode = 'light' | 'dark';
