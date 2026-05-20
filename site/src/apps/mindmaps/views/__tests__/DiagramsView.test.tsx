// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DiagramsView } from '../DiagramsView';
import type { MindMapDataset } from '../../types';

afterEach(() => cleanup());

// Minimal dataset with two diagrams (classification = no d3 dependency in jsdom).
function makeDataset(diagrams: MindMapDataset['manifest']['diagrams'] = []): MindMapDataset {
  return {
    manifest: {
      id: 'test',
      title: 'Test',
      defaultTab: 'tab-a',
      theme: 'atlas',
      tabs: [{ id: 'tab-a', name: 'Tab A' }],
      diagrams,
    },
    tabs: {
      'tab-a': { id: 'node-root', name: 'Root' },
    },
  };
}

const DIAGRAM_A = {
  id: 'diag-a', topic: 'test', title: 'Alpha', type: 'classification' as const,
  data: { root: { id: 'r', name: 'Root' } },
};
const DIAGRAM_B = {
  id: 'diag-b', topic: 'test', title: 'Beta', type: 'workup-pathway' as const,
  data: { stages: [{ id: 's1', name: 'Stage', items: [{ id: 'i1', label: 'Item' }] }] },
};

describe('DiagramsView — empty state', () => {
  it('renders empty state when diagrams list is empty', () => {
    const { container } = render(<DiagramsView dataset={makeDataset([])} />);
    expect(container.querySelector('.diagrams-view--empty')).toBeTruthy();
    expect(screen.getByText(/No diagrams authored yet/i)).toBeInTheDocument();
  });
});

describe('DiagramsView — with diagrams', () => {
  it('initially selects the first diagram (diagrams[0].id)', () => {
    const { container } = render(<DiagramsView dataset={makeDataset([DIAGRAM_A, DIAGRAM_B])} />);
    // The first library button should carry the is-active class
    const buttons = container.querySelectorAll('.diagrams-view__index button');
    expect(buttons[0]).toHaveClass('is-active');
    expect(buttons[1]).not.toHaveClass('is-active');
  });

  it('updates selection when a different library button is clicked', () => {
    const { container } = render(<DiagramsView dataset={makeDataset([DIAGRAM_A, DIAGRAM_B])} />);
    const buttons = container.querySelectorAll('.diagrams-view__index button');
    // Click the second diagram
    fireEvent.click(buttons[1]);
    expect(buttons[1]).toHaveClass('is-active');
    expect(buttons[0]).not.toHaveClass('is-active');
    // The canvas for the second diagram type (workup-pathway) renders as .diagram-canvas--workup
    expect(container.querySelector('.diagram-canvas--workup')).toBeTruthy();
  });

  it('renders the DiagramSwitch canvas for the initially selected diagram', () => {
    const { container } = render(<DiagramsView dataset={makeDataset([DIAGRAM_A, DIAGRAM_B])} />);
    // DIAGRAM_A is classification
    expect(container.querySelector('.diagram-canvas--classification')).toBeTruthy();
  });
});

describe('DiagramsView — F37: selectedId resets when dataset.manifest changes', () => {
  it('resets to diagrams[0] when previously-selected id is absent in new manifest', () => {
    const datasetV1 = makeDataset([DIAGRAM_A, DIAGRAM_B]);
    const { rerender, container } = render(<DiagramsView dataset={datasetV1} />);

    // Select DIAGRAM_B
    const buttons = container.querySelectorAll('.diagrams-view__index button');
    fireEvent.click(buttons[1]);
    expect(buttons[1]).toHaveClass('is-active');

    // Now rerender with a new dataset that only contains a third diagram (diag-c)
    const DIAGRAM_C = {
      id: 'diag-c', topic: 'test', title: 'Gamma', type: 'classification' as const,
      data: { root: { id: 'r', name: 'New Root' } },
    };
    const datasetV2 = makeDataset([DIAGRAM_C]);
    rerender(<DiagramsView dataset={datasetV2} />);

    // selectedId='diag-b' is no longer present → should fall back to 'diag-c'
    const newButtons = container.querySelectorAll('.diagrams-view__index button');
    expect(newButtons[0]).toHaveClass('is-active');
    // Library nav button for Gamma should be active
    expect(newButtons[0].textContent).toContain('Gamma');
  });
});

// N3: empty→nonempty dataset transition must auto-select first item
describe('DiagramsView — N3: empty→nonempty dataset transition', () => {
  it('auto-selects first diagram when component mounts empty and diagrams are added', () => {
    const datasetEmpty = makeDataset([]);
    const { rerender, container } = render(<DiagramsView dataset={datasetEmpty} />);

    // Empty state is shown initially
    expect(container.querySelector('.diagrams-view--empty')).toBeTruthy();

    // Now provide diagrams
    const datasetFull = makeDataset([DIAGRAM_A, DIAGRAM_B]);
    rerender(<DiagramsView dataset={datasetFull} />);

    // First diagram should now be active
    const buttons = container.querySelectorAll('.diagrams-view__index button');
    expect(buttons[0]).toHaveClass('is-active');
    expect(buttons[0].textContent).toContain('Alpha');
  });
});
