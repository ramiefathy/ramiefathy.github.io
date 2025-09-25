import { describe, expect, it } from 'vitest';
import { getMindMapDataset } from '../../mindmaps/dataLoader';
import { validateMindMapDataset } from '../../mindmaps/schema';
import type { MindMapDataset } from '../../mindmaps/types';

describe('mind map dataset validation', () => {
  it('validates every shipped dataset without throwing', () => {
    const topics = ['alopecia', 'autoimmune-bullous', 'ctcl', 'pruritus', 'psoriasis'];
    topics.forEach((topic) => {
      const dataset = getMindMapDataset(topic);
      expect(dataset, `dataset missing for ${topic}`).toBeDefined();
      expect(() => validateMindMapDataset(dataset as MindMapDataset)).not.toThrow();
    });
  });

  it('throws when duplicate node identifiers are encountered', () => {
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

    expect(() => validateMindMapDataset(broken)).toThrow(/Duplicate node id/);
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

    expect(() => validateMindMapDataset(broken)).toThrow(/undeclared tabs/);
  });
});
