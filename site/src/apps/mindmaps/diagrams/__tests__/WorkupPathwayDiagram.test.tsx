// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { WorkupPathwayDiagram } from '../WorkupPathwayDiagram';
import type { Diagram } from '../../types';

afterEach(() => cleanup());

const fixture: Diagram = {
  id: 'd1', topic: 't', title: 'X', type: 'workup-pathway',
  data: {
    stages: [
      { id: 's1', name: 'History', items: [
        { id: 'i1', label: 'Onset' },
        { id: 'i2', label: 'Triggers' }
      ]},
      { id: 's2', name: 'Exam', items: [{ id: 'i3', label: 'Pull test' }] }
    ]
  }
};

describe('WorkupPathwayDiagram', () => {
  // F24: onSelect fires with the clicked WorkupItem
  it('F24: onSelect fires with the clicked item object', () => {
    const handler = vi.fn();
    render(<WorkupPathwayDiagram diagram={fixture} onSelect={handler} />);
    // Click the 'Onset' item button
    fireEvent.click(screen.getByText('Onset').closest('button')!);
    expect(handler).toHaveBeenCalledTimes(1);
    const arg = handler.mock.calls[0][0];
    expect(arg).toMatchObject({ id: 'i1', label: 'Onset' });
  });

  it('renders one section per stage', () => {
    render(<WorkupPathwayDiagram diagram={fixture} onSelect={() => {}} />);
    expect(screen.getByRole('heading', { name: /History/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Exam/ })).toBeInTheDocument();
  });

  it('renders all items', () => {
    render(<WorkupPathwayDiagram diagram={fixture} onSelect={() => {}} />);
    expect(screen.getByText('Onset')).toBeInTheDocument();
    expect(screen.getByText('Triggers')).toBeInTheDocument();
    expect(screen.getByText('Pull test')).toBeInTheDocument();
  });

  it('numbers items 01, 02, 03 within their stage', () => {
    render(<WorkupPathwayDiagram diagram={fixture} onSelect={() => {}} />);
    expect(screen.getAllByText(/^0\d$/).length).toBeGreaterThanOrEqual(3);
  });

  // F36: MAX_DEPTH = 10. Programmatic 12-deep subItems chain. Levels >10
  // must be replaced with a depth-limit placeholder (no recursion past it).
  function deepChain(depth: number): Diagram {
    let current: { id: string; label: string; subItems?: typeof current[] } = {
      id: 'leaf', label: 'leaf-item'
    };
    for (let i = depth; i >= 1; i--) {
      current = { id: `i${i}`, label: `item-${i}`, subItems: [current] } as typeof current;
    }
    return {
      id: 'd', topic: 't', title: 'Deep', type: 'workup-pathway',
      data: { stages: [{ id: 's', name: 'Stage', items: [current as unknown as Diagram['data']['stages'][number]['items'][number]] }] }
    } as Diagram;
  }

  it('F36: renders a depth-limit placeholder when subItems nest deeper than MAX_DEPTH (10)', () => {
    const deep = deepChain(12);
    const { container } = render(<WorkupPathwayDiagram diagram={deep} onSelect={() => {}} />);
    const placeholder = container.querySelector('.workup-item__depth-limit');
    expect(placeholder).toBeTruthy();
    expect(placeholder!.textContent).toMatch(/depth limit/i);
    expect(screen.queryByText('leaf-item')).toBeNull();
  });

  it('F36: renders the full chain when subItem depth is within MAX_DEPTH', () => {
    const shallow = deepChain(8);
    const { container } = render(<WorkupPathwayDiagram diagram={shallow} onSelect={() => {}} />);
    expect(container.querySelector('.workup-item__depth-limit')).toBeNull();
    expect(screen.getByText('leaf-item')).toBeInTheDocument();
  });
});
