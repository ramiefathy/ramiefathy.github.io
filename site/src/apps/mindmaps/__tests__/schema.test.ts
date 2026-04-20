import { describe, expect, it } from 'vitest';
import { getMindMapDataset, listAvailableMindMaps } from '../../mindmaps/dataLoader';
import { validateMindMapManifest, validateMindMapDataset } from '../../mindmaps/schema';
import type { MindMapDataset } from '../../mindmaps/types';

describe('manifestSchema includes diagrams and comparisons (R2)', () => {
  it('manifestSchema preserves diagrams array — not stripped by Zod', () => {
    // alopecia/manifest.json declares "diagrams": [] and "comparisons": []
    // Before R2 fix, manifestSchema had no diagrams/comparisons fields so Zod
    // stripped them (strip mode default), making result.data.diagrams === undefined.
    const rawManifest = {
      id: 'alopecia',
      title: 'Alopecia Mind Map',
      defaultTab: 'approach',
      theme: 'teal',
      tabs: [{ id: 'approach', name: 'Alopecia Workup' }],
      diagrams: [],
      comparisons: []
    };
    const result = validateMindMapManifest(rawManifest);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // diagrams and comparisons must survive the Zod parse, not be stripped
    expect(Array.isArray(result.value.diagrams)).toBe(true);
    expect(Array.isArray(result.value.comparisons)).toBe(true);
  });

  it('listAvailableMindMaps returns alopecia entry with diagrams as an array', () => {
    // alopecia manifest.json declares "diagrams": [] — listAvailableMindMaps
    // runs validateMindMapManifest on each manifest. Before R2, Zod stripped
    // the field so manifest.diagrams would be undefined after parse.
    const manifests = listAvailableMindMaps();
    const alopecia = manifests.find((m) => m.id === 'alopecia');
    expect(alopecia).toBeDefined();
    expect(Array.isArray(alopecia!.diagrams)).toBe(true);
  });
});

describe('mind map dataset validation', () => {
  it('validates every shipped dataset without errors', () => {
    const topics = ['alopecia', 'autoimmune-bullous', 'ctcl', 'pruritus', 'psoriasis'];
    topics.forEach((topic) => {
      const dataset = getMindMapDataset(topic);
      expect(dataset, `dataset missing for ${topic}`).toBeDefined();
      const result = validateMindMapDataset(dataset as MindMapDataset);
      expect(result.ok, `dataset for ${topic} failed validation`).toBe(true);
    });
  });

  it('returns errors when duplicate node identifiers are encountered', () => {
    const valid = getMindMapDataset('alopecia');
    expect(valid).toBeDefined();
    const broken: MindMapDataset = {
      manifest: {
        ...valid!.manifest,
        defaultTab: 'example',
        tabs: [{ id: 'example', name: 'Example' }]
      },
      tabs: {
        example: {
          id: 'duplicate',
          name: 'Example',
          children: [
            { id: 'child', name: 'Child' },
            { id: 'child', name: 'Duplicate child' }
          ]
        }
      }
    };

    const result = validateMindMapDataset(broken);
    expect(result.ok).toBe(false);
    expect(result.ok ? '' : result.errors.join('\n')).toMatch(/Duplicate node id/);
  });

  it('detects undeclared tabs in the manifest', () => {
    const valid = getMindMapDataset('alopecia');
    expect(valid).toBeDefined();
    const broken: MindMapDataset = {
      manifest: { ...valid!.manifest },
      tabs: {
        ...valid!.tabs,
        unexpected: { id: 'unexpected', name: 'Unexpected' }
      }
    };

    const result = validateMindMapDataset(broken);
    expect(result.ok).toBe(false);
    expect(result.ok ? '' : result.errors.join('\n')).toMatch(/undeclared tabs/);
  });
});
