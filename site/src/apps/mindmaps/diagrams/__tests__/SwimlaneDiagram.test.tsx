// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SwimlaneDiagram } from '../SwimlaneDiagram';
import type { Diagram } from '../../types';

afterEach(() => cleanup());

const fixture: Diagram = {
  id: 'd1', topic: 't', title: 'X', type: 'swimlane',
  data: {
    lanes: [{ id: 'a', name: 'First' }, { id: 'b', name: 'Second' }],
    rows: [
      { id: 'r1', name: 'Row 1', cells: { a: { text: 'A1' }, b: { text: 'B1' } } },
      { id: 'r2', name: 'Row 2', cells: { a: { text: 'A2', emphasis: 'primary' } } }
    ]
  }
};

describe('SwimlaneDiagram', () => {
  // F24: onSelect fires with cell + rowName + laneName
  it('F24: onSelect fires with cell object including rowName and laneName', () => {
    const handler = vi.fn();
    render(<SwimlaneDiagram diagram={fixture} onSelect={handler} />);
    // Click cell 'A1' (row 'Row 1', lane 'First')
    fireEvent.click(screen.getByText('A1').closest('button')!);
    expect(handler).toHaveBeenCalledTimes(1);
    const arg = handler.mock.calls[0][0];
    expect(arg).toMatchObject({ text: 'A1', rowName: 'Row 1', laneName: 'First' });
  });

  it('renders lane headers', () => {
    render(<SwimlaneDiagram diagram={fixture} onSelect={() => {}} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
  it('renders row labels and cell text', () => {
    render(<SwimlaneDiagram diagram={fixture} onSelect={() => {}} />);
    expect(screen.getByText('Row 1')).toBeInTheDocument();
    expect(screen.getByText('A1')).toBeInTheDocument();
    expect(screen.getByText('A2')).toBeInTheDocument();
    expect(screen.getByText('B1')).toBeInTheDocument();
  });

  // F21: belt-and-suspenders — even though schema rejects lanes: [], the
  // renderer should produce an empty-state div without throwing if a consumer
  // bypasses validation.
  it('F21: renders an empty-state placeholder when lanes is empty', () => {
    const emptyFixture = {
      id: 'd-empty', topic: 't', title: 'Empty', type: 'swimlane',
      data: { lanes: [], rows: [] }
    } as unknown as Diagram;
    const { container } = render(
      <SwimlaneDiagram diagram={emptyFixture as Extract<Diagram, { type: 'swimlane' }>} onSelect={() => {}} />
    );
    // Should render the empty-state marker class, and NO lane headers or rows
    expect(container.querySelector('.diagram-canvas--placeholder')).toBeTruthy();
    expect(container.querySelectorAll('.swimlane__lane-header').length).toBe(0);
  });
});
