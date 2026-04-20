import { describe, expect, it } from 'vitest';
import { getMindMapDataset, extractTopicFromPath } from '../../mindmaps/dataLoader';

// Actual diagram/comparison counts as shipped (confirmed from filesystem):
//   alopecia:          diagrams=6  comparisons=1
//   ctcl:              diagrams=4  comparisons=1
//   psoriasis:         diagrams=4  comparisons=1
//   pruritus:          diagrams=4  comparisons=1
//   autoimmune-bullous: diagrams=4  comparisons=1

describe('getMindMapDataset — per-topic diagram/comparison counts (R3)', () => {
  it('alopecia: >= 6 diagrams and >= 1 comparison', () => {
    const dataset = getMindMapDataset('alopecia');
    expect(dataset).toBeDefined();
    expect(dataset!.manifest.diagrams!.length).toBeGreaterThanOrEqual(6);
    expect(dataset!.manifest.comparisons!.length).toBeGreaterThanOrEqual(1);
  });

  it('ctcl: >= 4 diagrams and >= 1 comparison', () => {
    const dataset = getMindMapDataset('ctcl');
    expect(dataset).toBeDefined();
    expect(dataset!.manifest.diagrams!.length).toBeGreaterThanOrEqual(4);
    expect(dataset!.manifest.comparisons!.length).toBeGreaterThanOrEqual(1);
  });

  it('psoriasis: >= 4 diagrams and >= 1 comparison', () => {
    const dataset = getMindMapDataset('psoriasis');
    expect(dataset).toBeDefined();
    expect(dataset!.manifest.diagrams!.length).toBeGreaterThanOrEqual(4);
    expect(dataset!.manifest.comparisons!.length).toBeGreaterThanOrEqual(1);
  });

  it('pruritus: >= 4 diagrams and >= 1 comparison', () => {
    const dataset = getMindMapDataset('pruritus');
    expect(dataset).toBeDefined();
    expect(dataset!.manifest.diagrams!.length).toBeGreaterThanOrEqual(4);
    expect(dataset!.manifest.comparisons!.length).toBeGreaterThanOrEqual(1);
  });

  it('autoimmune-bullous: >= 4 diagrams and >= 1 comparison', () => {
    const dataset = getMindMapDataset('autoimmune-bullous');
    expect(dataset).toBeDefined();
    expect(dataset!.manifest.diagrams!.length).toBeGreaterThanOrEqual(4);
    expect(dataset!.manifest.comparisons!.length).toBeGreaterThanOrEqual(1);
  });
});

describe('getMindMapDataset — contract tests (R3)', () => {
  it('returns undefined for a topic that does not exist', () => {
    expect(getMindMapDataset('does-not-exist')).toBeUndefined();
  });

  it('returns the same object reference on a second call (cache hit)', () => {
    const first = getMindMapDataset('alopecia');
    const second = getMindMapDataset('alopecia');
    expect(first).toBeDefined();
    // Identity check — .toBe() ensures the cache is returning the same
    // object, not a new equal-but-distinct copy.
    expect(second).toBe(first);
  });
});

describe('extractTopicFromPath (R3)', () => {
  it('throws with /extract.*topic/i when the path has no /mindmaps/ segment', () => {
    expect(() => extractTopicFromPath('/foo/bar.json')).toThrow(/extract.*topic/i);
  });
});
