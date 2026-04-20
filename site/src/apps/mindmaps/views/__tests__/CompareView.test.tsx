// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CompareView } from '../CompareView';
import type { MindMapDataset, Comparison } from '../../types';

afterEach(() => cleanup());

function makeComparison(id: string, title: string): Comparison {
  return {
    id,
    topic: 'test',
    title,
    entities: [
      { id: 'a', name: 'Entity A', shortName: 'A' },
      { id: 'b', name: 'Entity B', shortName: 'B' },
    ],
    features: [
      { id: 'f1', name: 'Feature One', values: { a: 'X', b: 'Y' } },
    ],
  };
}

function makeDataset(comparisons: Comparison[] = []): MindMapDataset {
  return {
    manifest: {
      id: 'test',
      title: 'Test',
      defaultTab: 'tab-a',
      theme: 'atlas',
      tabs: [{ id: 'tab-a', name: 'Tab A' }],
      comparisons,
    },
    tabs: {
      'tab-a': { id: 'node-root', name: 'Root' },
    },
  };
}

const COMP_A = makeComparison('comp-a', 'Comparison Alpha');
const COMP_B = makeComparison('comp-b', 'Comparison Beta');

describe('CompareView — empty state', () => {
  it('renders empty state when comparisons list is empty', () => {
    const { container } = render(<CompareView dataset={makeDataset([])} />);
    expect(container.querySelector('.compare-view--empty')).toBeTruthy();
    expect(screen.getByText(/No comparisons authored yet/i)).toBeInTheDocument();
  });
});

describe('CompareView — with comparisons', () => {
  it('initially selects the first comparison', () => {
    const { container } = render(<CompareView dataset={makeDataset([COMP_A, COMP_B])} />);
    const buttons = container.querySelectorAll('.compare-view__index button');
    expect(buttons[0]).toHaveClass('is-active');
    expect(buttons[1]).not.toHaveClass('is-active');
  });

  it('updates selection when a different comparison is clicked', () => {
    const { container } = render(<CompareView dataset={makeDataset([COMP_A, COMP_B])} />);
    const buttons = container.querySelectorAll('.compare-view__index button');
    fireEvent.click(buttons[1]);
    expect(buttons[1]).toHaveClass('is-active');
    expect(buttons[0]).not.toHaveClass('is-active');
    // The active nav button text should be 'Comparison Beta'
    expect(buttons[1].textContent).toBe('Comparison Beta');
  });
});

describe('CompareView — F37: selectedId resets when dataset.manifest changes', () => {
  it('resets to comparisons[0] when previously-selected id is absent in new manifest', () => {
    const datasetV1 = makeDataset([COMP_A, COMP_B]);
    const { rerender, container } = render(<CompareView dataset={datasetV1} />);

    // Select COMP_B
    const buttons = container.querySelectorAll('.compare-view__index button');
    fireEvent.click(buttons[1]);
    expect(buttons[1]).toHaveClass('is-active');

    // Rerender with a dataset that only has a new comparison (comp-c)
    const COMP_C = makeComparison('comp-c', 'Comparison Gamma');
    const datasetV2 = makeDataset([COMP_C]);
    rerender(<CompareView dataset={datasetV2} />);

    // selectedId='comp-b' is no longer present → should fall back to 'comp-c'
    const newButtons = container.querySelectorAll('.compare-view__index button');
    expect(newButtons[0]).toHaveClass('is-active');
    expect(newButtons[0].textContent).toBe('Comparison Gamma');
  });
});

// N3: empty→nonempty dataset transition must auto-select first item
describe('CompareView — N3: empty→nonempty dataset transition', () => {
  it('auto-selects first comparison when component mounts empty and comparisons are added', () => {
    const datasetEmpty = makeDataset([]);
    const { rerender, container } = render(<CompareView dataset={datasetEmpty} />);

    // Empty state is shown initially
    expect(container.querySelector('.compare-view--empty')).toBeTruthy();

    // Now provide comparisons
    const datasetFull = makeDataset([COMP_A, COMP_B]);
    rerender(<CompareView dataset={datasetFull} />);

    // First comparison should now be active
    const buttons = container.querySelectorAll('.compare-view__index button');
    expect(buttons[0]).toHaveClass('is-active');
    expect(buttons[0].textContent).toBe('Comparison Alpha');
  });
});
