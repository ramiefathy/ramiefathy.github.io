import type { MindMapDataset, MindMapManifest, MindMapNode } from './types';
import { validateMindMapDataset, validateMindMapManifest } from './schema';

const manifestModules = import.meta.glob('../../data/mindmaps/**/manifest.json', {
  import: 'default',
  eager: true
}) as Record<string, MindMapManifest>;

const allJsonModules = import.meta.glob('../../data/mindmaps/**/*.json', {
  import: 'default',
  eager: true
}) as Record<string, MindMapManifest | MindMapNode>;

const cache = new Map<string, MindMapDataset>();

function extractTopicFromPath(path: string): string {
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
      manifest = data;
      break;
    }
  }

  if (!manifest) {
    return undefined;
  }

  const tabs: Record<string, MindMapNode> = {};

  for (const [path, node] of Object.entries(allJsonModules)) {
    if (path.endsWith('manifest.json')) continue;
    if (extractTopicFromPath(path) !== topic) continue;
    const tab = extractTabFromPath(path);
    tabs[tab] = node as MindMapNode;
  }

  const dataset = validateMindMapDataset({ manifest, tabs });
  cache.set(topic, dataset);
  return dataset;
}

export function listAvailableMindMaps(): MindMapManifest[] {
  return Object.entries(manifestModules)
    .map(([path, manifest]) => ({ path, manifest: validateMindMapManifest(manifest) }))
    .sort((a, b) => a.manifest.title.localeCompare(b.manifest.title))
    .map((entry) => entry.manifest);
}
