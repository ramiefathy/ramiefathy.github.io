import type { Comparison, Diagram, MindMapDataset, MindMapManifest } from './types';
import { validateComparison, validateDiagram, validateMindMapDataset, validateMindMapManifest } from './schema';

// Vite's import.meta.glob with eager:true + import:'default' already returns
// Record<string, unknown> — the as-casts were no-ops; removed for clarity.
const manifestModules = import.meta.glob('../../data/mindmaps/**/manifest.json', {
  import: 'default',
  eager: true,
});

const allJsonModules = import.meta.glob('../../data/mindmaps/*/*.json', {
  import: 'default',
  eager: true,
});

// Load typed diagrams + comparisons for each topic. The glob generic is `unknown`
// because Vite cannot verify runtime JSON shape — the schema validators do.
const diagramFiles = import.meta.glob<{ default: unknown }>(
  '/src/data/mindmaps/*/diagrams/*.json',
  { eager: true }
);
const comparisonFiles = import.meta.glob<{ default: unknown }>(
  '/src/data/mindmaps/*/comparisons/*.json',
  { eager: true }
);

function diagramsForTopic(topicId: string): Diagram[] {
  const items: Diagram[] = [];
  for (const [path, mod] of Object.entries(diagramFiles)) {
    if (!path.includes(`/mindmaps/${topicId}/diagrams/`)) continue;
    const result = validateDiagram(mod.default);
    if (!result.ok) {
      throw new Error(`Invalid diagram JSON at ${path}: ${result.errors.join('; ')}`);
    }
    items.push(result.value);
  }
  return items;
}

function comparisonsForTopic(topicId: string): Comparison[] {
  const items: Comparison[] = [];
  for (const [path, mod] of Object.entries(comparisonFiles)) {
    if (!path.includes(`/mindmaps/${topicId}/comparisons/`)) continue;
    const result = validateComparison(mod.default);
    if (!result.ok) {
      throw new Error(`Invalid comparison JSON at ${path}: ${result.errors.join('; ')}`);
    }
    items.push(result.value);
  }
  return items;
}

const cache = new Map<string, MindMapDataset>();

export function extractTopicFromPath(path: string): string {
  const parts = path.split('/');
  const idx = parts.findIndex((segment) => segment === 'mindmaps');
  if (idx === -1 || idx + 1 >= parts.length) {
    throw new Error(`Unable to extract mind map topic from path: ${path}`);
  }
  return parts[idx + 1];
}

function extractTabFromPath(path: string): string {
  const withoutExt = path.replace(/\.json$/, '');
  return withoutExt.substring(withoutExt.lastIndexOf('/') + 1);
}

export function getMindMapDataset(topic: string): MindMapDataset | undefined {
  if (cache.has(topic)) {
    return cache.get(topic);
  }

  let manifest: MindMapManifest | undefined;
  for (const [path, data] of Object.entries(manifestModules)) {
    if (extractTopicFromPath(path) === topic) {
      const manifestResult = validateMindMapManifest(data);
      if (!manifestResult.ok) {
        throw new Error(`Invalid manifest JSON at ${path}: ${manifestResult.errors.join('; ')}`);
      }
      manifest = manifestResult.value;
      break;
    }
  }

  if (!manifest) {
    return undefined;
  }

  // Use unknown so we can pass raw JSON to validateMindMapDataset without a
  // premature cast; the validator narrows tabs values to MindMapNode.
  const tabs: Record<string, unknown> = {};

  for (const [path, node] of Object.entries(allJsonModules)) {
    if (path.endsWith('manifest.json')) continue;
    if (extractTopicFromPath(path) !== topic) continue;
    const tab = extractTabFromPath(path);
    tabs[tab] = node;
  }

  const datasetResult = validateMindMapDataset({ manifest, tabs });
  if (!datasetResult.ok) {
    throw new Error(`Invalid dataset for topic "${topic}": ${datasetResult.errors.join('; ')}`);
  }
  const dataset = datasetResult.value;

  // Validate any diagrams/comparisons embedded in the manifest itself.
  // (dataLoader globs file-based ones below; this covers the in-manifest path too.)
  const inlineDiagrams: Diagram[] = [];
  for (const inline of manifest.diagrams ?? []) {
    const r = validateDiagram(inline);
    if (!r.ok) throw new Error(`Invalid inline diagram in manifest for topic "${topic}": ${r.errors.join('; ')}`);
    inlineDiagrams.push(r.value);
  }
  const inlineComparisons: Comparison[] = [];
  for (const inline of manifest.comparisons ?? []) {
    const r = validateComparison(inline);
    if (!r.ok) throw new Error(`Invalid inline comparison in manifest for topic "${topic}": ${r.errors.join('; ')}`);
    inlineComparisons.push(r.value);
  }

  const enrichedDataset: MindMapDataset = {
    ...dataset,
    manifest: {
      ...dataset.manifest,
      diagrams: [...inlineDiagrams, ...diagramsForTopic(topic)],
      comparisons: [...inlineComparisons, ...comparisonsForTopic(topic)],
    },
  };
  cache.set(topic, enrichedDataset);
  return enrichedDataset;
}

export function listAvailableMindMaps(): MindMapManifest[] {
  return Object.entries(manifestModules)
    .map(([path, manifest]) => {
      const result = validateMindMapManifest(manifest);
      if (!result.ok) {
        throw new Error(`Invalid manifest JSON at ${path}: ${result.errors.join('; ')}`);
      }
      return { path, manifest: result.value };
    })
    .sort((a, b) => a.manifest.title.localeCompare(b.manifest.title))
    .map((entry) => entry.manifest);
}
