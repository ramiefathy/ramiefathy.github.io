// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ComparisonTable } from '../ComparisonTable';
import type { Comparison } from '../../types';

afterEach(() => cleanup());

const fixture: Comparison = {
  id: 'c1', topic: 't', title: 'X',
  entities: [{ id: 'a', name: 'A', shortName: 'A' }, { id: 'b', name: 'B', shortName: 'B' }],
  features: [
    { id: 'f1', name: 'Age', values: { a: '30', b: '50' } },
    { id: 'f2', name: 'Pattern', isDistinguisher: true, values: { a: 'X', b: 'Y' } }
  ]
};

describe('ComparisonTable', () => {
  it('renders entity headers', () => {
    render(<ComparisonTable comparison={fixture} />);
    expect(screen.getByRole('columnheader', { name: /A/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /B/ })).toBeInTheDocument();
  });
  it('renders feature rows + values', () => {
    render(<ComparisonTable comparison={fixture} />);
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('Pattern')).toBeInTheDocument();
    expect(screen.getByText('Y')).toBeInTheDocument();
  });
  it('marks distinguisher features with a star', () => {
    const { container } = render(<ComparisonTable comparison={fixture} />);
    expect(container.querySelector('.compare-distinguisher')).toBeTruthy();
  });

  // F38: when a feature's values map is missing an entity's key, an em-dash
  // (U+2014 —) is rendered in that cell. This covers the `?? '\u2014'` guard.
  it('F38: renders em-dash when a feature value is missing for an entity', () => {
    const withMissing: typeof fixture = {
      ...fixture,
      features: [
        ...fixture.features,
        {
          id: 'f3',
          name: 'Scarring',
          // Entity 'b' has no value — only 'a' is present
          values: { a: 'Yes' },
        },
      ],
    };
    render(<ComparisonTable comparison={withMissing} />);
    // The em-dash should appear in the cell for entity 'b' on the 'Scarring' row
    expect(screen.getByText('\u2014')).toBeInTheDocument();
  });
});
