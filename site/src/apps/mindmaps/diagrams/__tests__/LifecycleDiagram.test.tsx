// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LifecycleDiagram } from '../LifecycleDiagram';
import type { Diagram } from '../../types';

afterEach(() => cleanup());

const fixture: Diagram = {
  id: 'd1', topic: 't', title: 'X', type: 'lifecycle',
  data: {
    phases: [
      { id: 'a', name: 'A', duration: '1y' },
      { id: 'b', name: 'B', duration: '2w' }
    ]
  }
};

describe('LifecycleDiagram', () => {
  // F24: onSelect fires with the clicked LifecyclePhase
  it('F24: onSelect fires with the clicked phase object', () => {
    const handler = vi.fn();
    const { container } = render(<LifecycleDiagram diagram={fixture} onSelect={handler} />);
    // Each phase is rendered as an SVG <g> with an onClick
    const phaseGroups = container.querySelectorAll('svg g[cursor="pointer"]');
    expect(phaseGroups.length).toBe(2);
    fireEvent.click(phaseGroups[0]);
    expect(handler).toHaveBeenCalledTimes(1);
    const arg = handler.mock.calls[0][0];
    expect(arg).toMatchObject({ id: 'a', name: 'A' });
  });

  it('renders one element per phase', () => {
    render(<LifecycleDiagram diagram={fixture} onSelect={() => {}} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });
  it('renders durations', () => {
    render(<LifecycleDiagram diagram={fixture} onSelect={() => {}} />);
    expect(screen.getByText('1y')).toBeInTheDocument();
    expect(screen.getByText('2w')).toBeInTheDocument();
  });

  it('uses path-based oriented arrows instead of horizontal arrow glyphs', () => {
    const { container } = render(<LifecycleDiagram diagram={fixture} onSelect={() => {}} />);
    const svg = container.querySelector('svg')!;
    expect(svg.querySelector('marker#lifecycle-arrow[orient="auto"]')).toBeTruthy();
    expect(svg.querySelectorAll('[data-lifecycle-edge]').length).toBe(2);
    expect(svg.textContent).not.toContain('\u2192');
  });
});
