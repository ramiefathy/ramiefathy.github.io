import { describe, expect, it } from 'vitest';
import { getMindMapDataset, extractTopicFromPath, listAvailableMindMaps } from '../../mindmaps/dataLoader';

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

describe('getMindMapDataset — expanded diagnostic diagram inventory', () => {
  const expectedTopicIds = [
    'acne',
    'alopecia',
    'allergic-contact-dermatitis',
    'atopic-dermatitis',
    'autoimmune-bullous',
    'ctcl',
    'drug-eruptions',
    'hidradenitis-suppurativa',
    'nail-disease',
    'oral-ulcers',
    'pigmented-lesions',
    'pruritus',
    'psoriasis',
    'rosacea',
    'urticaria-angioedema',
    'vasculitis-purpura',
  ];

  const expectedDiagramIds = [
    'alopecia-initial-loss-pattern-dt',
    'alopecia-areata-workup-dt',
    'telogen-effluvium-trigger-dt',
    'trichoscopy-hair-loss-dt',
    'pediatric-alopecia-dt',
    'pruritus-primary-lesion-dt',
    'neuropathic-pruritus-dt',
    'psoriatic-arthritis-screening-dt',
    'erythroderma-vs-pustular-psoriasis-dt',
    'subepidermal-blister-dif-dt',
    'mucosal-blistering-dt',
    'patch-plaque-mimicker-dt',
    'cd30-lymphoproliferative-dt',
    'erythroderma-ss-dt',
    'atopic-dermatitis-severity-dt',
    'acne-treatment-dt',
    'rosacea-subtype-treatment-dt',
    'hidradenitis-staging-treatment-dt',
    'urticaria-angioedema-workup-dt',
    'allergic-contact-dermatitis-patch-test-dt',
    'morbilliform-drug-eruption-risk-dt',
    'cutaneous-vasculitis-purpura-dt',
    'pigmented-lesion-triage-dt',
    'nail-disease-pattern-dt',
    'oral-ulcer-differential-dt',
  ];

  it('exposes the expected 16 mindmap topics', () => {
    expect(listAvailableMindMaps().map((manifest) => manifest.id).sort()).toEqual([...expectedTopicIds].sort());
  });

  it('exposes 47 total diagrams including every requested new algorithm', () => {
    const diagrams = expectedTopicIds.flatMap((topicId) => getMindMapDataset(topicId)?.manifest.diagrams ?? []);
    expect(diagrams).toHaveLength(47);
    expect(diagrams.map((diagram) => diagram.id)).toEqual(expect.arrayContaining(expectedDiagramIds));
  });

  it('does not ship the stale PubMed IDs caught during citation audit', () => {
    const stalePmids = [
      '11898951',
      '17312045',
      '17489818',
      '22760778',
      '28215817',
      '28342530',
      '29385376',
      '31092390',
      '31448731',
      '32179113',
      '32229279',
      '32623068',
      '32629974',
      '35538739',
      '36826171',
    ];
    const citedPmids = expectedTopicIds.flatMap((topicId) =>
      (getMindMapDataset(topicId)?.manifest.diagrams ?? []).flatMap((diagram) =>
        (diagram.citations ?? []).flatMap((citation) => citation.pmid ? [citation.pmid] : [])
      )
    );
    expect(citedPmids).not.toEqual(expect.arrayContaining(stalePmids));
  });

  it('loads each new topic as a diagram-first dataset with a default overview tab', () => {
    const newTopicIds = expectedTopicIds.filter((topicId) => !['alopecia', 'autoimmune-bullous', 'ctcl', 'pruritus', 'psoriasis'].includes(topicId));
    newTopicIds.forEach((topicId) => {
      const dataset = getMindMapDataset(topicId);
      expect(dataset, `${topicId}: dataset`).toBeDefined();
      expect(dataset!.manifest.defaultTab, `${topicId}: default tab`).toBe('overview');
      expect(dataset!.tabs.overview, `${topicId}: overview tab`).toBeDefined();
      expect(dataset!.manifest.diagrams, `${topicId}: diagram count`).toHaveLength(1);
    });
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
