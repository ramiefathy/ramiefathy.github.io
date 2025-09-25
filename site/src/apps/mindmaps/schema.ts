import { z } from 'zod';
import type { MindMapDataset, MindMapManifest, MindMapNode } from './types';

const tooltipSchema = z.object({
  title: z.string().min(1, 'Tooltip title is required'),
  markdown: z.string().default('')
});

const nodeSchema: z.ZodType<MindMapNode> = z.lazy(() =>
  z.object({
    id: z.string().min(1, 'Node id is required'),
    name: z.string().min(1, 'Node name is required'),
    tooltip: tooltipSchema.optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
    children: z.array(nodeSchema).optional()
  })
);

const manifestTabSchema = z.object({
  id: z.string().min(1, 'Tab id is required'),
  name: z.string().min(1, 'Tab name is required')
});

const manifestSchema = z.object({
  id: z.string().min(1, 'Manifest id is required'),
  title: z.string().min(1, 'Manifest title is required'),
  defaultTab: z.string().min(1, 'Default tab is required'),
  theme: z.string().min(1, 'Theme token is required'),
  tabs: z.array(manifestTabSchema).min(1, 'At least one tab is required')
});

function collectNodeIds(node: MindMapNode, seen: Map<string, string[]>, path: string[] = []) {
  const nextPath = [...path, node.name];
  if (seen.has(node.id)) {
    const existing = seen.get(node.id) ?? [];
    throw new Error(`Duplicate node id "${node.id}" encountered at ${nextPath.join(' › ')} (already used at ${existing.join(' › ')})`);
  }
  seen.set(node.id, nextPath);
  node.children?.forEach((child) => collectNodeIds(child, seen, nextPath));
}

export function validateMindMapManifest(manifest: MindMapManifest): MindMapManifest {
  return manifestSchema.parse(manifest);
}

export function validateMindMapNode(node: MindMapNode): MindMapNode {
  return nodeSchema.parse(node);
}

export function validateMindMapDataset(dataset: MindMapDataset): MindMapDataset {
  const manifest = validateMindMapManifest(dataset.manifest);
  const tabs = new Map<string, MindMapNode>(Object.entries(dataset.tabs));

  if (!tabs.has(manifest.defaultTab)) {
    throw new Error(`Default tab "${manifest.defaultTab}" does not exist in dataset for ${manifest.id}`);
  }

  manifest.tabs.forEach((tab) => {
    if (!tabs.has(tab.id)) {
      throw new Error(`Tab "${tab.id}" declared in manifest is missing from dataset for ${manifest.id}`);
    }
  });

  const unexpectedTabs = Array.from(tabs.keys()).filter((id) => !manifest.tabs.some((tab) => tab.id === id));
  if (unexpectedTabs.length > 0) {
    throw new Error(`Dataset for ${manifest.id} includes undeclared tabs: ${unexpectedTabs.join(', ')}`);
  }

  const seen = new Map<string, string[]>();
  tabs.forEach((node, tabId) => {
    validateMindMapNode(node);
    collectNodeIds(node, seen, [manifest.tabs.find((tab) => tab.id === tabId)?.name ?? tabId]);
  });

  return dataset;
}

export function listDatasetIssues(dataset: MindMapDataset): string[] {
  const issues: string[] = [];
  try {
    validateMindMapDataset(dataset);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
  }
  return issues;
}
