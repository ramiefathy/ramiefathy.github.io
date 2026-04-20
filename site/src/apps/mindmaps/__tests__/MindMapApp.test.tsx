// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { MindMapDataset } from '../types';

// ─── jsdom shims (same pattern as AtlasView.test.tsx) ───────────────────────
// AtlasView uses d3 and calls matchMedia/getComputedTextLength/getBBox in
// useEffect. Without these shims the "click Atlas tab" test throws.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

if (typeof SVGElement !== 'undefined') {
  // @ts-expect-error jsdom shim
  if (!SVGElement.prototype.getComputedTextLength) {
    // @ts-expect-error — shim
    SVGElement.prototype.getComputedTextLength = function () {
      return (this.textContent ?? '').length * 7;
    };
  }
  // @ts-expect-error jsdom shim
  if (!SVGElement.prototype.getBBox) {
    // @ts-expect-error — shim
    SVGElement.prototype.getBBox = function () {
      return { x: 0, y: 0, width: 0, height: 0 };
    };
  }
}
// ────────────────────────────────────────────────────────────────────────────

// Import AFTER shims so module-scope matchMedia calls are safe.
// eslint-disable-next-line import/first
import { MindMapApp } from '../MindMapApp';

function makeDataset(diagrams: MindMapDataset['manifest']['diagrams'] = []): MindMapDataset {
  return {
    manifest: {
      id: 'test-app',
      title: 'Test App',
      defaultTab: 'tab-a',
      theme: 'atlas',
      tabs: [{ id: 'tab-a', name: 'Tab A' }],
      diagrams,
      comparisons: [],
    },
    tabs: {
      'tab-a': { id: 'root-a', name: 'Root A', children: [] },
    },
  };
}

beforeEach(() => {
  window.localStorage.clear();
  window.location.hash = '';
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.location.hash = '';
});

describe('MindMapApp — F26: default view selection', () => {
  it('defaults to Diagrams view when dataset has at least one diagram', () => {
    const dataset = makeDataset([
      { id: 'd1', topic: 'test', title: 'Diag One', type: 'classification', data: { root: { id: 'r', name: 'Root' } } },
    ]);
    const { container } = render(<MindMapApp dataset={dataset} />);
    // The Diagrams tab should have is-active
    const tabs = container.querySelectorAll('.view-switcher__tab');
    const diagramsTab = Array.from(tabs).find((t) => t.textContent?.includes('Diagrams'));
    expect(diagramsTab).toBeTruthy();
    expect(diagramsTab).toHaveClass('is-active');
    // DiagramsView renders a diagrams-view div
    expect(container.querySelector('.diagrams-view')).toBeTruthy();
  });

  it('defaults to Atlas view when dataset has no diagrams', () => {
    const dataset = makeDataset([]);
    const { container } = render(<MindMapApp dataset={dataset} />);
    // The Atlas tab should have is-active
    const tabs = container.querySelectorAll('.view-switcher__tab');
    const atlasTab = Array.from(tabs).find((t) => t.textContent?.includes('Atlas'));
    expect(atlasTab).toBeTruthy();
    expect(atlasTab).toHaveClass('is-active');
    // AtlasView renders inside .mindmap-app
    expect(container.querySelector('.mindmap-app')).toBeTruthy();
    // DiagramsView must NOT be present
    expect(container.querySelector('.diagrams-view')).toBeNull();
  });
});

describe('MindMapApp — F26: ViewSwitcher tab navigation', () => {
  it('switches to Compare view when Compare tab is clicked', () => {
    const dataset = makeDataset([
      { id: 'd1', topic: 'test', title: 'Diag', type: 'classification', data: { root: { id: 'r', name: 'Root' } } },
    ]);
    const { container } = render(<MindMapApp dataset={dataset} />);
    const tabs = container.querySelectorAll('.view-switcher__tab');
    const compareTab = Array.from(tabs).find((t) => t.textContent?.includes('Compare'))!;
    fireEvent.click(compareTab);
    // CompareView renders .compare-view (empty state since no comparisons)
    expect(container.querySelector('.compare-view')).toBeTruthy();
    expect(container.querySelector('.diagrams-view')).toBeNull();
  });

  it('switches to Atlas view when Atlas tab is clicked', () => {
    const dataset = makeDataset([
      { id: 'd1', topic: 'test', title: 'Diag', type: 'classification', data: { root: { id: 'r', name: 'Root' } } },
    ]);
    const { container } = render(<MindMapApp dataset={dataset} />);
    const tabs = container.querySelectorAll('.view-switcher__tab');
    const atlasTab = Array.from(tabs).find((t) => t.textContent?.includes('Atlas'))!;
    fireEvent.click(atlasTab);
    // AtlasView renders .mindmap-app
    expect(container.querySelector('.mindmap-app')).toBeTruthy();
    expect(container.querySelector('.diagrams-view')).toBeNull();
  });
});
