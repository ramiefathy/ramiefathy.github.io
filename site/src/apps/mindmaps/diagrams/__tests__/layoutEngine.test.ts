import { describe, expect, it } from 'vitest';
import { getMindMapDataset, listAvailableMindMaps } from '../../dataLoader';
import type { Diagram } from '../../types';
import {
  boxesOverlap,
  layoutConceptMapDiagram,
  layoutDecisionTreeDiagram,
  sanitizePoint,
  wrapTextToLines,
} from '../layoutEngine';

const TEXT_WIDTH_FACTOR = 0.68;
const LINE_HEIGHT_FACTOR = 1.22;
const DIAMOND_TEXT_PADDING = 18;

function allDiagrams(): Diagram[] {
  return listAvailableMindMaps()
    .map((manifest) => getMindMapDataset(manifest.id))
    .filter((dataset): dataset is NonNullable<typeof dataset> => Boolean(dataset))
    .flatMap((dataset) => dataset.manifest.diagrams ?? []);
}

function assertFinitePath(path: string) {
  expect(path).not.toMatch(/NaN|Infinity|-Infinity/);
}

function diamondAvailableWidthAt(
  node: { width: number; height: number },
  y: number,
): number {
  const verticalDistanceFromCenter = Math.abs(y - node.height / 2);
  const halfWidthAtY = (node.width / 2) * (1 - (verticalDistanceFromCenter / (node.height / 2)));
  return Math.max(0, halfWidthAtY * 2);
}

function assertDiamondTextFits(
  diagramId: string,
  node: { id: string; width: number; height: number; label: { lines: string[]; fontSize: number } },
) {
  const lineHeight = node.label.fontSize * LINE_HEIGHT_FACTOR;
  const firstLineCenter = node.height / 2 - ((node.label.lines.length - 1) * lineHeight) / 2;

  node.label.lines.forEach((line, index) => {
    const lineCenterY = firstLineCenter + index * lineHeight;
    const lineBandTop = lineCenterY - lineHeight / 2;
    const lineBandBottom = lineCenterY + lineHeight / 2;
    const availableWidth = Math.min(
      diamondAvailableWidthAt(node, lineBandTop),
      diamondAvailableWidthAt(node, lineBandBottom),
    );
    const estimatedTextWidth = line.length * node.label.fontSize * TEXT_WIDTH_FACTOR;

    expect(
      estimatedTextWidth,
      `${diagramId}/${node.id}: "${line}" must fit inside diamond sidewalls`,
    ).toBeLessThanOrEqual(availableWidth - DIAMOND_TEXT_PADDING * 2);
  });
}

describe('mindmap diagram layout engine', () => {
  it('wraps long text without blank lines or undersized font fallbacks', () => {
    const result = wrapTextToLines('Supercalifragilisticexpialidocious causes branch labels to stretch', {
      maxCharsPerLine: 16,
      maxLines: 4,
      fontSize: 13,
    });

    expect(result.fontSize).toBeGreaterThanOrEqual(12);
    expect(result.lines.length).toBeGreaterThan(1);
    expect(result.lines.every((line) => line.trim().length > 0)).toBe(true);
    expect(result.lines[0]).toContain('Super');
  });

  it('sanitizes non-finite ELK edge coordinates before paths are rendered', () => {
    const fallback = { x: 25, y: 50 };

    expect(sanitizePoint({ x: Number.NaN, y: Number.POSITIVE_INFINITY }, fallback, 48)).toEqual(fallback);
    expect(sanitizePoint({ x: 10, y: 20 }, fallback, 48)).toEqual({ x: 58, y: 68 });
  });

  it('lays out every shipped decision tree with finite geometry and no node overlaps', async () => {
    const trees = allDiagrams().filter((diagram): diagram is Extract<Diagram, { type: 'decision-tree' }> => diagram.type === 'decision-tree');
    expect(trees.length).toBeGreaterThanOrEqual(5);

    for (const diagram of trees) {
      const layout = await layoutDecisionTreeDiagram(diagram);
      expect(layout.nodes, `${diagram.id}: every step should become one node`).toHaveLength(diagram.data.steps.length);
      expect(layout.viewBox.width, `${diagram.id}: viewBox width`).toBeGreaterThan(0);
      expect(layout.viewBox.height, `${diagram.id}: viewBox height`).toBeGreaterThan(0);

      for (const node of layout.nodes) {
        expect(Number.isFinite(node.x), `${diagram.id}/${node.id}: finite x`).toBe(true);
        expect(Number.isFinite(node.y), `${diagram.id}/${node.id}: finite y`).toBe(true);
        expect(node.width, `${diagram.id}/${node.id}: readable node width`).toBeGreaterThanOrEqual(180);
        expect(node.height, `${diagram.id}/${node.id}: readable node height`).toBeGreaterThanOrEqual(64);
        expect(node.label.fontSize, `${diagram.id}/${node.id}: readable label font`).toBeGreaterThanOrEqual(12);
        expect(node.label.lines.every((line) => line.trim().length > 0), `${diagram.id}/${node.id}: no blank label lines`).toBe(true);
        if (node.type === 'decision') {
          assertDiamondTextFits(diagram.id, node);
        }
      }

      for (let i = 0; i < layout.nodes.length; i++) {
        for (let j = i + 1; j < layout.nodes.length; j++) {
          expect(
            boxesOverlap(layout.nodes[i], layout.nodes[j], 6),
            `${diagram.id}: ${layout.nodes[i].id} overlaps ${layout.nodes[j].id}`,
          ).toBe(false);
        }
      }

      for (const edge of layout.edges) {
        assertFinitePath(edge.path);
        if (edge.label) {
          expect(edge.label.fontSize, `${diagram.id}/${edge.id}: readable branch label font`).toBeGreaterThanOrEqual(11);
        }
      }
    }
  });

  it('lays out every shipped concept map with finite geometry and no node overlaps', async () => {
    const maps = allDiagrams().filter((diagram): diagram is Extract<Diagram, { type: 'concept-map' }> => diagram.type === 'concept-map');
    expect(maps.length).toBeGreaterThanOrEqual(1);

    for (const diagram of maps) {
      const layout = await layoutConceptMapDiagram(diagram);
      expect(layout.nodes, `${diagram.id}: every concept should become one node`).toHaveLength(diagram.data.nodes.length);
      expect(layout.viewBox.width, `${diagram.id}: viewBox width`).toBeGreaterThan(0);
      expect(layout.viewBox.height, `${diagram.id}: viewBox height`).toBeGreaterThan(0);

      for (const node of layout.nodes) {
        expect(Number.isFinite(node.x), `${diagram.id}/${node.id}: finite x`).toBe(true);
        expect(Number.isFinite(node.y), `${diagram.id}/${node.id}: finite y`).toBe(true);
        expect(node.width, `${diagram.id}/${node.id}: readable node width`).toBeGreaterThanOrEqual(144);
        expect(node.label.fontSize, `${diagram.id}/${node.id}: readable label font`).toBeGreaterThanOrEqual(12);
        expect(node.label.lines.every((line) => line.trim().length > 0), `${diagram.id}/${node.id}: no blank label lines`).toBe(true);
      }

      for (let i = 0; i < layout.nodes.length; i++) {
        for (let j = i + 1; j < layout.nodes.length; j++) {
          expect(
            boxesOverlap(layout.nodes[i], layout.nodes[j], 6),
            `${diagram.id}: ${layout.nodes[i].id} overlaps ${layout.nodes[j].id}`,
          ).toBe(false);
        }
      }

      for (const edge of layout.edges) {
        assertFinitePath(edge.path);
        expect(edge.markerId, `${diagram.id}/${edge.id}: marker id`).toMatch(/^concept-arrow-/);
      }
    }
  });
});
