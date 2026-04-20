// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DiagramSwitch } from '../DiagramSwitch';
import type { Diagram } from '../../types';

afterEach(() => cleanup());

// ─────────────────────────────────────────────────────────────────────────────
// F6: DiagramSwitch dispatches to the correct renderer per type and fires
// onSelectStep with the right SideDrawerContent shape.
// ─────────────────────────────────────────────────────────────────────────────
describe('DiagramSwitch — F6: renderer routing by type', () => {
  it('decision-tree: renders .diagram-canvas--decision-tree', () => {
    const diagram: Diagram = {
      id: 'd', topic: 't', title: 'T', type: 'decision-tree',
      data: { start: 's1', steps: [{ id: 's1', type: 'terminal', prompt: 'Done' }] },
    };
    const { container } = render(<DiagramSwitch diagram={diagram} onSelectStep={() => {}} />);
    expect(container.querySelector('.diagram-canvas--decision-tree')).toBeTruthy();
  });

  it('workup-pathway: renders .diagram-canvas--workup', () => {
    const diagram: Diagram = {
      id: 'd', topic: 't', title: 'T', type: 'workup-pathway',
      data: { stages: [{ id: 's1', name: 'Stage', items: [{ id: 'i1', label: 'Item' }] }] },
    };
    const { container } = render(<DiagramSwitch diagram={diagram} onSelectStep={() => {}} />);
    expect(container.querySelector('.diagram-canvas--workup')).toBeTruthy();
  });

  it('classification: renders .diagram-canvas--classification', () => {
    const diagram: Diagram = {
      id: 'd', topic: 't', title: 'T', type: 'classification',
      data: { root: { id: 'r', name: 'Root' } },
    };
    const { container } = render(<DiagramSwitch diagram={diagram} onSelectStep={() => {}} />);
    expect(container.querySelector('.diagram-canvas--classification')).toBeTruthy();
  });

  it('swimlane: renders .diagram-canvas--swimlane', () => {
    const diagram: Diagram = {
      id: 'd', topic: 't', title: 'T', type: 'swimlane',
      data: { lanes: [{ id: 'a', name: 'A' }], rows: [{ id: 'r1', name: 'Row', cells: { a: { text: 'X' } } }] },
    };
    const { container } = render(<DiagramSwitch diagram={diagram} onSelectStep={() => {}} />);
    expect(container.querySelector('.diagram-canvas--swimlane')).toBeTruthy();
  });

  it('lifecycle: renders .diagram-canvas--lifecycle', () => {
    const diagram: Diagram = {
      id: 'd', topic: 't', title: 'T', type: 'lifecycle',
      data: { phases: [{ id: 'p1', name: 'Phase' }] },
    };
    const { container } = render(<DiagramSwitch diagram={diagram} onSelectStep={() => {}} />);
    expect(container.querySelector('.diagram-canvas--lifecycle')).toBeTruthy();
  });

  it('concept-map: renders .diagram-canvas--concept-map', () => {
    const diagram: Diagram = {
      id: 'd', topic: 't', title: 'T', type: 'concept-map',
      data: { nodes: [{ id: 'a', name: 'A' }], edges: [] },
    };
    const { container } = render(<DiagramSwitch diagram={diagram} onSelectStep={() => {}} />);
    expect(container.querySelector('.diagram-canvas--concept-map')).toBeTruthy();
  });

  // F6: onSelectStep payload — workup-pathway fires with {title, markdown, citations}
  it('onSelectStep fires with correct payload shape on workup-pathway item click', () => {
    const handler = vi.fn();
    const diagram: Diagram = {
      id: 'd', topic: 't', title: 'T', type: 'workup-pathway',
      citations: [{ quote: 'PMID ref', pmid: '12345' }],
      data: { stages: [{ id: 's1', name: 'Stage', items: [{ id: 'i1', label: 'Take history' }] }] },
    };
    const { container } = render(<DiagramSwitch diagram={diagram} onSelectStep={handler} />);
    fireEvent.click(container.querySelector('.workup-item button')!);
    expect(handler).toHaveBeenCalledTimes(1);
    const payload = handler.mock.calls[0][0];
    expect(payload).toHaveProperty('title');
    expect(payload).toHaveProperty('markdown');
    expect(payload).toHaveProperty('citations');
    // Citations from diagram-level are forwarded
    expect(payload.citations).toEqual(expect.arrayContaining([expect.objectContaining({ pmid: '12345' })]));
  });

  // F6: FALLBACK_DETAIL substituted when step has no detail
  it('FALLBACK_DETAIL substituted when workup item has no detail', () => {
    const handler = vi.fn();
    const diagram: Diagram = {
      id: 'd', topic: 't', title: 'T', type: 'workup-pathway',
      data: { stages: [{ id: 's1', name: 'Stage', items: [{ id: 'i1', label: 'Item' }] }] },
    };
    const { container } = render(<DiagramSwitch diagram={diagram} onSelectStep={handler} />);
    fireEvent.click(container.querySelector('.workup-item button')!);
    const payload = handler.mock.calls[0][0];
    // markdown must be non-empty (FALLBACK_DETAIL)
    expect(payload.markdown).toBeTruthy();
    expect(payload.markdown).toMatch(/No additional detail/i);
  });

  // F6: default arm renders placeholder for unknown type (tested in F12 block too,
  // but included here as the F6 spec also requests it).
  it('default arm renders placeholder for unknown type', () => {
    const bogus = { id: 'd', topic: 't', title: 'T', type: 'sankey', data: {} } as unknown as Diagram;
    const { container } = render(<DiagramSwitch diagram={bogus} onSelectStep={() => {}} />);
    expect(container.querySelector('.diagram-canvas--placeholder')).toBeTruthy();
  });
});

describe('DiagramSwitch', () => {
  // F12: exhaustiveness-check fallback. Compile-time this is enforced by
  // `_exhaustive: never`; at runtime, if a bogus diagram.type slips past
  // validation, render a placeholder instead of nothing.
  it('F12: renders a placeholder when diagram.type is unknown (runtime fallback)', () => {
    const bogus = {
      id: 'd', topic: 't', title: 'T', type: 'sankey', data: {}
    } as unknown as Diagram;
    const { container, getByText } = render(
      <DiagramSwitch diagram={bogus} onSelectStep={() => {}} />
    );
    expect(container.querySelector('.diagram-canvas--placeholder')).toBeTruthy();
    expect(getByText(/Renderer for type "sankey" not yet implemented/i)).toBeInTheDocument();
  });

  // F16: swimlane cell.text is interpolated into raw HTML (`<p>${c.text}</p>`)
  // as SideDrawer markdown. If text is un-escaped, '<script>' passes through.
  // Verify via the onSelectStep callback — DiagramSwitch builds the markdown
  // before SideDrawer ever sees it, so assert on the argument.
  it('F16: HTML-escapes swimlane cell text before interpolating into markdown fallback', () => {
    const handler = vi.fn();
    const malicious: Diagram = {
      id: 'd', topic: 't', title: 'X', type: 'swimlane',
      data: {
        lanes: [{ id: 'a', name: 'A' }],
        rows: [
          { id: 'r1', name: 'Row', cells: { a: { text: '<script>alert(1)</script> & "x"' } } }
        ]
      }
    };
    const { container } = render(<DiagramSwitch diagram={malicious} onSelectStep={handler} />);
    const btn = container.querySelector('.swimlane__cell');
    expect(btn).toBeTruthy();
    fireEvent.click(btn!);
    expect(handler).toHaveBeenCalledTimes(1);
    const arg = handler.mock.calls[0][0];
    // Raw <script> tag must NOT appear; escaped form must.
    expect(arg.markdown).not.toContain('<script>');
    expect(arg.markdown).toContain('&lt;script&gt;');
    expect(arg.markdown).toContain('&amp;');
    expect(arg.markdown).toContain('&quot;');
  });

  // Regression: cell.detail (pre-authored markdown) is passed through verbatim,
  // only the fallback path uses escapeHtml.
  it('F16: passes through cell.detail as-is when provided', () => {
    const handler = vi.fn();
    const fixture: Diagram = {
      id: 'd', topic: 't', title: 'X', type: 'swimlane',
      data: {
        lanes: [{ id: 'a', name: 'A' }],
        rows: [
          { id: 'r1', name: 'Row', cells: { a: { text: '<x>', detail: '<p>trusted</p>' } } }
        ]
      }
    };
    const { container } = render(<DiagramSwitch diagram={fixture} onSelectStep={handler} />);
    const btn = container.querySelector('.swimlane__cell');
    fireEvent.click(btn!);
    expect(handler.mock.calls[0][0].markdown).toBe('<p>trusted</p>');
  });
});
