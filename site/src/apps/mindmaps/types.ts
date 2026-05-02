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
  diagrams?: Diagram[];
  comparisons?: Comparison[];
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

// ────────────────────────────────────────────────────────────────────────────
// Diagrams (Phase 8 redesign)
// ────────────────────────────────────────────────────────────────────────────

export type DiagramType =
  | 'decision-tree'
  | 'workup-pathway'
  | 'classification'
  | 'swimlane'
  | 'lifecycle'
  | 'concept-map';

export interface DiagramCitation {
  pmid?: string;
  doi?: string;
  url?: string;
  quote: string;
}

interface DiagramBase {
  id: string;
  topic: string;
  title: string;
  subtitle?: string;
  citations?: DiagramCitation[];
}

// decision-tree: branching question → action / terminal diagnosis
export interface DecisionTreeStep {
  id: string;
  type: 'decision' | 'action' | 'terminal';
  prompt?: string;                              // decision: the question; action: imperative; terminal: diagnosis name
  detail?: string;                              // optional markdown body shown in side-drawer
  branches?: Array<{ label: string; nextStepId: string }>;
}

export interface DecisionTreeData {
  start: string;
  steps: DecisionTreeStep[];
}

// workup-pathway: numbered ordered list with optional sub-steps and branches
export interface WorkupItem {
  id: string;
  label: string;
  detail?: string;
  branchIf?: string;                            // optional condition that opens a sub-list
  subItems?: WorkupItem[];
}

export interface WorkupStage {
  id: string;
  name: string;                                 // "History", "Examination", "Labs", "Biopsy"
  items: WorkupItem[];
}

export interface WorkupPathwayData {
  stages: WorkupStage[];
}

// classification: nested taxonomy
export interface ClassificationNode {
  id: string;
  name: string;
  category?: string;                            // optional grouping label e.g. "Lymphocytic"
  detail?: string;
  children?: ClassificationNode[];
}

export interface ClassificationData {
  root: ClassificationNode;
}

// swimlane: matrix where columns = lanes (e.g., line of therapy), rows = entities or strategies
export interface SwimlaneCell {
  text: string;
  detail?: string;                              // optional drawer body
  emphasis?: 'primary' | 'caution' | 'muted';
}

export interface SwimlaneData {
  lanes: Array<{ id: string; name: string }>;
  rows: Array<{ id: string; name: string; cells: Record<string, SwimlaneCell> }>;
}

// lifecycle: circular or linear sequence of phases
export interface LifecyclePhase {
  id: string;
  name: string;
  duration?: string;                            // e.g., "2-7 years"
  detail?: string;
  diseaseAnchors?: string[];                    // diseases that disrupt this phase
}

export interface LifecycleData {
  phases: LifecyclePhase[];
  layout?: 'circular' | 'linear';
}

// concept-map: typed-edge entity-relationship graph
export type ConceptEdgeKind = 'causes' | 'treats' | 'exacerbates' | 'prevents' | 'associated-with';

export interface ConceptNode {
  id: string;
  name: string;
  kind?: 'cause' | 'mechanism' | 'condition' | 'modifier' | 'treatment';
  detail?: string;
}

export interface ConceptEdge {
  from: string;
  to: string;
  kind: ConceptEdgeKind;
  weight?: number;
}

export interface ConceptMapData {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

// Discriminated Diagram type
export type Diagram =
  | (DiagramBase & { type: 'decision-tree';  data: DecisionTreeData })
  | (DiagramBase & { type: 'workup-pathway'; data: WorkupPathwayData })
  | (DiagramBase & { type: 'classification'; data: ClassificationData })
  | (DiagramBase & { type: 'swimlane';       data: SwimlaneData })
  | (DiagramBase & { type: 'lifecycle';      data: LifecycleData })
  | (DiagramBase & { type: 'concept-map';    data: ConceptMapData });

// ────────────────────────────────────────────────────────────────────────────
// Comparisons (feature matrix for differential diagnosis)
// ────────────────────────────────────────────────────────────────────────────

export interface ComparisonFeature {
  id: string;
  name: string;
  isDistinguisher?: boolean;                    // flag — pathognomonic distinguisher
  values: Record<string, string>;               // entityId → cell value
}

export interface ComparisonEntity {
  id: string;
  name: string;
  shortName?: string;
  detail?: string;
}

export interface Comparison {
  id: string;
  topic: string;
  title: string;
  subtitle?: string;
  citations?: DiagramCitation[];
  entities: ComparisonEntity[];
  features: ComparisonFeature[];
}
