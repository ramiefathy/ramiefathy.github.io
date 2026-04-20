// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DecisionTreeDiagram } from '../DecisionTreeDiagram';
import type { Diagram } from '../../types';

afterEach(() => cleanup());

const fixture: Diagram = {
  id: 'd1', topic: 't', title: 'X', type: 'decision-tree',
  data: {
    start: 's1',
    steps: [
      { id: 's1', type: 'decision', prompt: 'Q?', branches: [
        { label: 'Yes', nextStepId: 's2' },
        { label: 'No',  nextStepId: 's3' }
      ]},
      { id: 's2', type: 'terminal', prompt: 'A' },
      { id: 's3', type: 'terminal', prompt: 'B' }
    ]
  }
};

describe('DecisionTreeDiagram', () => {
  // F24: onSelect fires with the DecisionTreeStep when a node is clicked.
  // d3 attaches click handlers via DOM event listeners; fireEvent.click works.
  it('F24: onSelect fires with the clicked step object', () => {
    const handler = vi.fn();
    const { container } = render(<DecisionTreeDiagram diagram={fixture} onSelect={handler} />);
    const nodes = container.querySelectorAll('[data-step-id]');
    expect(nodes.length).toBeGreaterThan(0);
    fireEvent.click(nodes[0]);
    expect(handler).toHaveBeenCalledTimes(1);
    const arg = handler.mock.calls[0][0];
    // First step is 's1' (type: decision, prompt: 'Q?')
    expect(arg).toMatchObject({ id: 's1' });
  });

  it('renders an SVG with one node per step', () => {
    const { container } = render(<DecisionTreeDiagram diagram={fixture} onSelect={() => {}} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg!.querySelectorAll('[data-step-id]').length).toBe(3);
  });

  it('labels decision nodes with their prompt', () => {
    render(<DecisionTreeDiagram diagram={fixture} onSelect={() => {}} />);
    expect(screen.getByText('Q?')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('labels each branch edge', () => {
    render(<DecisionTreeDiagram diagram={fixture} onSelect={() => {}} />);
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  // F3: empty-state — start references a step that exists in an empty map (or
  // BFS finds no reachable layouts). Renderer must not crash on Math.max(...[])
  // producing -Infinity / NaN viewBox attributes.
  it('F3: renders an empty-state SVG without crashing when no layouts are produced', () => {
    const emptyFixture = {
      id: 'd-empty', topic: 't', title: 'Empty', type: 'decision-tree',
      data: {
        start: 'missing-id', // not present in stepMap → BFS produces zero layouts
        steps: [{ id: 's1', type: 'terminal', prompt: 'Orphan' }]
      }
    } as unknown as Diagram;
    expect(() => {
      const { container } = render(<DecisionTreeDiagram diagram={emptyFixture as Extract<Diagram, { type: 'decision-tree' }>} onSelect={() => {}} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      // No node groups should be rendered
      expect(svg!.querySelectorAll('[data-step-id]').length).toBe(0);
    }).not.toThrow();
  });

  // F31: word-wrap with first word > 22 chars. Bug: lines[0] stays as empty
  // string; first tspan is blank and the long word moves to line 2. Fix: first
  // tspan should contain the long word itself (no blank tspans).
  it('F31: first word longer than maxCharsPerLine yields no blank tspan', () => {
    const longWord = 'Supercalifragilisticexpialidocious'; // 34 chars > 22
    const longFixture: Diagram = {
      id: 'd2', topic: 't', title: 'Y', type: 'decision-tree',
      data: {
        start: 's1',
        steps: [{ id: 's1', type: 'terminal', prompt: longWord }]
      }
    };
    const { container } = render(<DecisionTreeDiagram diagram={longFixture} onSelect={() => {}} />);
    const tspans = container.querySelectorAll('svg [data-step-id] tspan');
    expect(tspans.length).toBeGreaterThanOrEqual(1);
    // The first tspan must not be empty
    expect(tspans[0].textContent).not.toBe('');
    // And it must contain (some of) the long word — not be stranded on line 2.
    expect(tspans[0].textContent).toContain('Super');
  });
});
