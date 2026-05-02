// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ConceptMapDiagram } from '../ConceptMapDiagram';
import type { Diagram } from '../../types';

afterEach(() => cleanup());

const fixture: Diagram = {
  id: 'd1', topic: 't', title: 'X', type: 'concept-map',
  data: {
    nodes: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }],
    edges: [{ from: 'a', to: 'b', kind: 'causes' }, { from: 'b', to: 'c', kind: 'treats' }]
  }
};

describe('ConceptMapDiagram', () => {
  // F24: onSelect fires with the ConceptNode when a node group is clicked.
  // d3 attaches handlers via DOM event listeners; fireEvent.click works.
  it('F24: onSelect fires with the clicked node object', async () => {
    const handler = vi.fn();
    const { container } = render(<ConceptMapDiagram diagram={fixture} onSelect={handler} />);
    await waitFor(() => expect(container.querySelectorAll('[data-cm-node]').length).toBeGreaterThan(0));
    const nodeGroups = container.querySelectorAll('[data-cm-node]');
    expect(nodeGroups.length).toBeGreaterThan(0);
    fireEvent.click(nodeGroups[0]);
    expect(handler).toHaveBeenCalledTimes(1);
    const arg = handler.mock.calls[0][0];
    // First node is {id:'a', name:'A'}
    expect(arg).toMatchObject({ id: 'a', name: 'A' });
  });

  it('renders one SVG group per node', async () => {
    const { container } = render(<ConceptMapDiagram diagram={fixture} onSelect={() => {}} />);
    await waitFor(() => expect(container.querySelectorAll('[data-cm-node]').length).toBe(3));
    expect(container.querySelectorAll('[data-cm-node]').length).toBe(3);
  });
  it('renders one path per edge', async () => {
    const { container } = render(<ConceptMapDiagram diagram={fixture} onSelect={() => {}} />);
    await waitFor(() => expect(container.querySelectorAll('[data-cm-edge]').length).toBe(2));
    expect(container.querySelectorAll('[data-cm-edge]').length).toBe(2);
  });

  it('wraps node labels and uses relation-specific oriented markers', async () => {
    const longLabelFixture: Diagram = {
      ...fixture,
      data: {
        nodes: [
          { id: 'a', name: 'Androgen receptor sensitivity' },
          { id: 'b', name: 'Androgenetic alopecia' },
        ],
        edges: [{ from: 'a', to: 'b', kind: 'causes' }],
      },
    };
    const { container } = render(<ConceptMapDiagram diagram={longLabelFixture} onSelect={() => {}} />);
    await waitFor(() => expect(container.querySelectorAll('[data-diagram-node]').length).toBe(2));

    const svg = container.querySelector('svg')!;
    expect(svg.querySelector('marker#concept-arrow-causes[orient="auto"]')).toBeTruthy();
    const edge = svg.querySelector('[data-cm-edge]')!;
    expect(edge.getAttribute('marker-end')).toBe('url(#concept-arrow-causes)');
    expect(edge.getAttribute('d')).not.toMatch(/NaN|Infinity|-Infinity/);
    expect(svg.querySelectorAll('[data-diagram-node] tspan').length).toBeGreaterThan(2);
  });
});
