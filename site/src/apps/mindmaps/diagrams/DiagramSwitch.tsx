import React from 'react';
import type { Diagram, DiagramCitation } from '../types';
import type { SideDrawerContent } from '../views/SideDrawer';
import { DecisionTreeDiagram } from './DecisionTreeDiagram';
import { WorkupPathwayDiagram } from './WorkupPathwayDiagram';
import { ClassificationDiagram } from './ClassificationDiagram';
import { SwimlaneDiagram } from './SwimlaneDiagram';
import { LifecycleDiagram } from './LifecycleDiagram';
import { ConceptMapDiagram } from './ConceptMapDiagram';

export interface DiagramSwitchProps {
  diagram: Diagram;
  onSelectStep: (info: SideDrawerContent) => void;
}

const FALLBACK_DETAIL = '<p><em>No additional detail.</em></p>';

// F16: escape HTML entities before interpolating authored strings into raw
// markdown fallbacks. Used for swimlane cell.text which is otherwise injected
// verbatim into `<p>${c.text}</p>` and forwarded to SideDrawer (which renders
// markdown/HTML). `cell.detail`, when present, is assumed to be authored
// markdown and is NOT escaped.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// The drawer always carries the diagram-level citations forward. Per-element
// citations could be added later by extending the element types; for now the
// authored content cites at diagram scope.
function buildContent(
  diagram: Diagram,
  title: string,
  markdown: string,
  extraCitations?: DiagramCitation[],
): SideDrawerContent {
  const citations = [...(diagram.citations ?? []), ...(extraCitations ?? [])];
  return {
    title,
    markdown: markdown && markdown.length > 0 ? markdown : FALLBACK_DETAIL,
    citations: citations.length > 0 ? citations : undefined,
  };
}

export function DiagramSwitch({ diagram, onSelectStep }: DiagramSwitchProps) {
  switch (diagram.type) {
    case 'decision-tree':
      return <DecisionTreeDiagram diagram={diagram} onSelect={(step) =>
        onSelectStep(buildContent(diagram, step.prompt ?? 'Step', step.detail ?? ''))} />;
    case 'workup-pathway':
      return <WorkupPathwayDiagram diagram={diagram} onSelect={(item) =>
        onSelectStep(buildContent(diagram, item.label, item.detail ?? ''))} />;
    case 'classification':
      return <ClassificationDiagram diagram={diagram} onSelect={(node) =>
        onSelectStep(buildContent(diagram, node.name, node.detail ?? ''))} />;
    case 'swimlane':
      return <SwimlaneDiagram diagram={diagram} onSelect={(c) =>
        onSelectStep(buildContent(diagram, `${c.rowName} · ${c.laneName}`, c.detail ?? `<p>${escapeHtml(c.text)}</p>`))} />;
    case 'lifecycle':
      return <LifecycleDiagram diagram={diagram} onSelect={(phase) =>
        onSelectStep(buildContent(diagram, phase.name + (phase.duration ? ` · ${phase.duration}` : ''), phase.detail ?? ''))} />;
    case 'concept-map':
      return <ConceptMapDiagram diagram={diagram} onSelect={(node) =>
        onSelectStep(buildContent(diagram, node.name, node.detail ?? ''))} />;
    default: {
      // F12: compile-time exhaustiveness check. If a new Diagram variant is
      // added to the discriminated union and not handled above, TypeScript
      // rejects this assignment. At runtime, render a placeholder — this
      // branch is only reachable if runtime validation is bypassed.
      const _exhaustive: never = diagram;
      return <div className="diagram-canvas diagram-canvas--placeholder">
        <p>Renderer for type "{(_exhaustive as Diagram).type}" not yet implemented.</p>
      </div>;
    }
  }
}
