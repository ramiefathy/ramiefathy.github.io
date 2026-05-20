// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ViewSwitcher } from '../ViewSwitcher';

afterEach(() => cleanup());

describe('ViewSwitcher', () => {
  it('renders three buttons for the three view modes', () => {
    render(<ViewSwitcher value="diagrams" onChange={() => {}} counts={{ diagrams: 6, comparisons: 1, atlas: 9 }} />);
    expect(screen.getByRole('tab', { name: /Diagrams/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Compare/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Atlas/i })).toBeInTheDocument();
  });

  it('marks the active view as aria-selected', () => {
    render(<ViewSwitcher value="compare" onChange={() => {}} counts={{ diagrams: 6, comparisons: 1, atlas: 9 }} />);
    expect(screen.getByRole('tab', { name: /Compare/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Diagrams/i })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange with the selected view id when a tab is clicked', () => {
    const onChange = vi.fn();
    render(<ViewSwitcher value="diagrams" onChange={onChange} counts={{ diagrams: 6, comparisons: 1, atlas: 9 }} />);
    fireEvent.click(screen.getByRole('tab', { name: /Atlas/i }));
    expect(onChange).toHaveBeenCalledWith('atlas');
  });

  it('shows the count badge for each view', () => {
    render(<ViewSwitcher value="diagrams" onChange={() => {}} counts={{ diagrams: 6, comparisons: 1, atlas: 9 }} />);
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
  });
});
