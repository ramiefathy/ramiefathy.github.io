// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ClassificationDiagram } from '../ClassificationDiagram';
import type { Diagram } from '../../types';

afterEach(() => cleanup());

const fixture: Diagram = {
  id: 'd1', topic: 't', title: 'X', type: 'classification',
  data: {
    root: {
      id: 'r', name: 'Root',
      children: [
        { id: 'a', name: 'A', children: [{ id: 'a1', name: 'A1' }, { id: 'a2', name: 'A2' }] },
        { id: 'b', name: 'B' }
      ]
    }
  }
};

describe('ClassificationDiagram', () => {
  // F24: onSelect fires with the clicked ClassificationNode
  it('F24: onSelect fires with the clicked node object', () => {
    const handler = vi.fn();
    render(<ClassificationDiagram diagram={fixture} onSelect={handler} />);
    // Click the leaf node 'A1'
    fireEvent.click(screen.getByText('A1').closest('button')!);
    expect(handler).toHaveBeenCalledTimes(1);
    const arg = handler.mock.calls[0][0];
    expect(arg).toMatchObject({ id: 'a1', name: 'A1' });
  });

  it('renders the root and all descendants', () => {
    render(<ClassificationDiagram diagram={fixture} onSelect={() => {}} />);
    expect(screen.getByText('Root')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('A1')).toBeInTheDocument();
    expect(screen.getByText('A2')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  // F36: MAX_DEPTH = 10. Build a programmatic 12-deep chain; levels 0–10 must
  // render, levels >10 must be replaced with a depth-limit placeholder (one
  // leaf, no further recursion).
  function chain(depth: number): Diagram {
    // Build root → n1 → n2 → ... with `depth` descendants below root.
    let current: { id: string; name: string; children?: typeof current[] } = {
      id: `leaf`, name: `leaf`
    };
    for (let i = depth; i >= 1; i--) {
      current = { id: `n${i}`, name: `n${i}`, children: [current] } as typeof current;
    }
    return {
      id: 'd', topic: 't', title: 'Deep', type: 'classification',
      data: { root: current as unknown as Diagram['data']['root'] as never } as any
    } as Diagram;
  }

  it('F36: renders a depth-limit placeholder when recursion exceeds MAX_DEPTH (10)', () => {
    const deep = chain(12); // depths 0..12 → 13 levels; depth 11+ must be cut
    const { container } = render(<ClassificationDiagram diagram={deep} onSelect={() => {}} />);
    // Placeholder should mention depth limit
    const placeholder = container.querySelector('.class-node__depth-limit');
    expect(placeholder).toBeTruthy();
    expect(placeholder!.textContent).toMatch(/depth limit/i);
    // With MAX_DEPTH=10 and the chain root=n1 at depth 0, n12 sits at depth 11
    // and must be replaced by the placeholder; n11 at depth 10 still renders.
    expect(screen.getByText('n11')).toBeInTheDocument();
    expect(screen.queryByText('n12')).toBeNull();
    expect(screen.queryByText('leaf')).toBeNull();
  });

  it('F36: renders the full tree when depth is at or under MAX_DEPTH', () => {
    const shallow = chain(9); // depths 0..9 → 10 total
    const { container } = render(<ClassificationDiagram diagram={shallow} onSelect={() => {}} />);
    expect(container.querySelector('.class-node__depth-limit')).toBeNull();
    expect(screen.getByText('leaf')).toBeInTheDocument();
  });
});
