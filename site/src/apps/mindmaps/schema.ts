import { z } from 'zod';
import type {
  Comparison,
  Diagram,
  MindMapDataset,
  MindMapManifest,
  MindMapNode,
} from './types';

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
  tabs: z.array(manifestTabSchema).min(1, 'At least one tab is required'),
  diagrams: z.array(z.unknown()).optional(),
  comparisons: z.array(z.unknown()).optional()
});

export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

function requireArray(value: unknown, label: string, errors: string[], required = false): unknown[] | null {
  if (value === undefined || value === null) {
    if (required) {
      errors.push(`${label}: must be an array (got ${value === null ? 'null' : 'undefined'})`);
      return null;
    }
    return [];
  }
  if (Array.isArray(value)) return value as unknown[];
  errors.push(`${label}: must be an array (got ${typeof value})`);
  return null;
}

function collectNodeIds(node: MindMapNode, seen: Map<string, string[]>, path: string[] = []) {
  const nextPath = [...path, node.name];
  if (seen.has(node.id)) {
    const existing = seen.get(node.id) ?? [];
    throw new Error(`Duplicate node id "${node.id}" encountered at ${nextPath.join(' › ')} (already used at ${existing.join(' › ')})`);
  }
  seen.set(node.id, nextPath);
  node.children?.forEach((child) => collectNodeIds(child, seen, nextPath));
}

export function validateMindMapManifest(manifest: unknown): Result<MindMapManifest> {
  const result = manifestSchema.safeParse(manifest);
  if (result.success) {
    return { ok: true, value: result.data as MindMapManifest };
  }
  return { ok: false, errors: result.error.issues.map((i) => i.message) };
}

export function validateMindMapNode(node: unknown): Result<MindMapNode> {
  const result = nodeSchema.safeParse(node);
  if (result.success) {
    return { ok: true, value: result.data };
  }
  return { ok: false, errors: result.error.issues.map((i) => i.message) };
}

export function validateMindMapDataset(input: unknown): Result<MindMapDataset> {
  if (!input || typeof input !== 'object') {
    return { ok: false, errors: ['dataset must be an object'] };
  }
  const obj = input as Record<string, unknown>;
  const errors: string[] = [];

  const manifestResult = validateMindMapManifest(obj['manifest']);
  if (!manifestResult.ok) {
    return { ok: false, errors: manifestResult.errors };
  }
  const manifest = manifestResult.value;

  if (!obj['tabs'] || typeof obj['tabs'] !== 'object' || Array.isArray(obj['tabs'])) {
    return { ok: false, errors: ['dataset tabs must be an object'] };
  }
  const tabs = new Map<string, MindMapNode>(Object.entries(obj['tabs'] as Record<string, unknown>) as [string, MindMapNode][]);

  if (!tabs.has(manifest.defaultTab)) {
    errors.push(`Default tab "${manifest.defaultTab}" does not exist in dataset for ${manifest.id}`);
  }

  manifest.tabs.forEach((tab) => {
    if (!tabs.has(tab.id)) {
      errors.push(`Tab "${tab.id}" declared in manifest is missing from dataset for ${manifest.id}`);
    }
  });

  const unexpectedTabs = Array.from(tabs.keys()).filter((id) => !manifest.tabs.some((tab) => tab.id === id));
  if (unexpectedTabs.length > 0) {
    errors.push(`Dataset for ${manifest.id} includes undeclared tabs: ${unexpectedTabs.join(', ')}`);
  }

  const seen = new Map<string, string[]>();
  tabs.forEach((node, tabId) => {
    const nodeResult = validateMindMapNode(node);
    if (!nodeResult.ok) {
      nodeResult.errors.forEach((e) => errors.push(e));
    } else {
      try {
        collectNodeIds(node, seen, [manifest.tabs.find((tab) => tab.id === tabId)?.name ?? tabId]);
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, value: input as MindMapDataset };
}

export function listDatasetIssues(input: unknown): string[] {
  const result = validateMindMapDataset(input);
  return result.ok ? [] : result.errors;
}

const KNOWN_DIAGRAM_TYPES = new Set([
  'decision-tree',
  'workup-pathway',
  'classification',
  'swimlane',
  'lifecycle',
  'concept-map',
]);

export function validateDiagram(input: unknown): Result<Diagram> {
  if (!input || typeof input !== 'object') {
    return { ok: false, errors: ['diagram must be an object'] };
  }
  const errors: string[] = [];
  const obj = input as Record<string, unknown>;
  if (!obj.id) errors.push('diagram missing id');
  if (!obj.topic) errors.push('diagram missing topic');
  if (!obj.title) errors.push('diagram missing title');
  if (typeof obj.type !== 'string' || !KNOWN_DIAGRAM_TYPES.has(obj.type)) {
    errors.push(`unknown diagram type: ${String(obj.type)}`);
  }
  if (!obj.data || typeof obj.data !== 'object') {
    errors.push('diagram missing data field');
    return { ok: false, errors };
  }

  const citations = requireArray(obj.citations, 'diagram citations', errors, true);
  if (citations !== null) {
    if (!citations.length) errors.push('diagram must include at least one citation');
    citations.forEach((citation, index) => {
      if (!citation || typeof citation !== 'object' || Array.isArray(citation)) {
        errors.push(`diagram citation ${index + 1}: must be an object`);
        return;
      }
      const citationObj = citation as Record<string, unknown>;
      if (typeof citationObj.quote !== 'string' || citationObj.quote.trim().length === 0) {
        errors.push(`diagram citation ${index + 1}: quote is required`);
      }
      const hasLocator =
        typeof citationObj.pmid === 'string' && citationObj.pmid.trim().length > 0 ||
        typeof citationObj.doi === 'string' && citationObj.doi.trim().length > 0 ||
        typeof citationObj.url === 'string' && citationObj.url.trim().length > 0;
      if (!hasLocator) {
        errors.push(`diagram citation ${index + 1}: PMID, DOI, or URL is required`);
      }
    });
  }

  if (obj.type === 'decision-tree') {
    const data = obj.data as { steps?: unknown; start?: unknown };
    const steps = requireArray(data.steps, 'decision-tree: steps', errors, true);
    if (steps !== null) {
      const stepObjs = steps.filter((s): s is { id: string; branches?: unknown } => typeof s === 'object' && s !== null);
      if (stepObjs.length !== steps.length) errors.push('decision-tree: every step must be an object');
      const stepIds = stepObjs.map((s) => s.id);
      if (stepIds.length !== new Set(stepIds).size) errors.push('decision-tree: duplicate step ids');
      const ids = new Set(stepIds);
      if (typeof data.start !== 'string') {
        errors.push('decision-tree: start must be a string step id');
      } else if (!ids.has(data.start)) {
        errors.push(`decision-tree: start "${data.start}" not found in steps`);
      }
      for (const step of stepObjs) {
        const branches = requireArray(step.branches, `decision-tree: step "${step.id}" branches`, errors);
        if (branches === null) continue;
        const branchObjs = (branches as unknown[]).filter(
          (b): b is { nextStepId?: unknown } => typeof b === 'object' && b !== null
        );
        if (branchObjs.length !== branches.length) {
          errors.push(`decision-tree: every branch must be an object`);
        }
        for (const branch of branchObjs) {
          if (typeof branch.nextStepId !== 'string') {
            errors.push(`decision-tree: branch nextStepId must be a string`);
          } else if (!ids.has(branch.nextStepId)) {
            errors.push(`decision-tree: branch nextStepId "${branch.nextStepId}" not found`);
          }
        }
      }

      // F34: BFS from start; any step id not reached is an orphan. Skipped if
      // start is missing/invalid or step ids have duplicates — those errors
      // surface above and a reachability cascade would be noise.
      if (typeof data.start === 'string' && ids.has(data.start) && stepIds.length === new Set(stepIds).size) {
        const stepById = new Map<string, { id: string; branches?: unknown }>();
        for (const s of stepObjs) stepById.set(s.id, s);
        const reachable = new Set<string>();
        const queue: string[] = [data.start];
        while (queue.length) {
          const current = queue.shift()!;
          if (reachable.has(current)) continue;
          reachable.add(current);
          const step = stepById.get(current);
          const rawBranches = Array.isArray(step?.branches) ? (step!.branches as unknown[]) : [];
          const branches = rawBranches.filter((b): b is { nextStepId?: unknown } => typeof b === 'object' && b !== null);
          for (const branch of branches) {
            if (typeof branch.nextStepId === 'string' && ids.has(branch.nextStepId)) {
              queue.push(branch.nextStepId);
            }
          }
        }
        for (const id of stepIds) {
          if (!reachable.has(id)) {
            errors.push(`decision-tree: orphan step "${id}" not reachable from start`);
          }
        }
      }
    }
  }

  if (obj.type === 'swimlane') {
    const data = obj.data as { lanes?: unknown; rows?: unknown };
    const lanes = requireArray(data.lanes, 'swimlane: lanes', errors, true);
    const rows = requireArray(data.rows, 'swimlane: rows', errors, true);
    if (lanes !== null && rows !== null) {
      if (!lanes.length) errors.push('swimlane: at least one lane required');
      const laneObjs = lanes.filter((l): l is { id: string } => typeof l === 'object' && l !== null);
      if (laneObjs.length !== lanes.length) errors.push('swimlane: every lane must be an object');
      const rowObjs = rows.filter((r): r is { id: string; cells?: unknown } => typeof r === 'object' && r !== null);
      if (rowObjs.length !== rows.length) errors.push('swimlane: every row must be an object');
      const laneIdList = laneObjs.map((l) => l.id);
      if (laneIdList.length !== new Set(laneIdList).size) errors.push('swimlane: duplicate lane ids');
      const laneIds = new Set(laneIdList);
      const rowIdList = rowObjs.map((r) => r.id);
      if (rowIdList.length !== new Set(rowIdList).size) errors.push('swimlane: duplicate row ids');
      for (const row of rowObjs) {
        const cells = row.cells;
        if (cells !== undefined && (typeof cells !== 'object' || cells === null || Array.isArray(cells))) {
          errors.push(`swimlane: row "${row.id}" cells must be an object`);
          continue;
        }
        for (const laneId of Object.keys(cells ?? {})) {
          if (!laneIds.has(laneId)) errors.push(`swimlane: row "${row.id}" references unknown lane "${laneId}"`);
        }
      }
    }
  }

  if (obj.type === 'workup-pathway') {
    const data = obj.data as { stages?: unknown };
    const stages = requireArray(data.stages, 'workup-pathway: stages', errors, true);
    if (stages !== null) {
      if (!stages.length) errors.push('workup-pathway: at least one stage required');
      const stageObjs = stages.filter((s): s is { id: string; items?: unknown } => typeof s === 'object' && s !== null);
      if (stageObjs.length !== stages.length) errors.push('workup-pathway: every stage must be an object');
      for (const stage of stageObjs) {
        requireArray(stage.items, `workup-pathway: stage "${stage.id}" items`, errors, true);
      }
    }
  }
  if (obj.type === 'classification') {
    const data = obj.data as { root?: unknown };
    if (!data.root) errors.push('classification: root required (root node)');
  }
  if (obj.type === 'lifecycle') {
    const data = obj.data as { phases?: unknown };
    const phases = requireArray(data.phases, 'lifecycle: phases', errors, true);
    if (phases !== null) {
      if (!phases.length) errors.push('lifecycle: at least one phase required');
      const phaseObjs = phases.filter((p): p is { id: string } => typeof p === 'object' && p !== null);
      const phaseIds = phaseObjs.map((p) => p.id);
      if (phaseIds.length !== new Set(phaseIds).size) errors.push('lifecycle: duplicate phase ids');
    }
  }
  if (obj.type === 'concept-map') {
    const data = obj.data as { nodes?: unknown; edges?: unknown };
    const nodes = requireArray(data.nodes, 'concept-map: nodes', errors, true);
    const edges = requireArray(data.edges, 'concept-map: edges', errors, true);
    if (nodes !== null) {
      if (!nodes.length) errors.push('concept-map: at least one node required');
      const nodeObjs = nodes.filter((n): n is { id: string } => typeof n === 'object' && n !== null);
      const nodeIds = nodeObjs.map((n) => n.id);
      if (nodeIds.length !== new Set(nodeIds).size) errors.push('concept-map: duplicate node ids');
      const nodeIdSet = new Set(nodeIds);
      if (edges !== null) {
        const edgeObjs = (edges as unknown[]).filter(
          (e): e is { from?: unknown; to?: unknown } => typeof e === 'object' && e !== null
        );
        if (edgeObjs.length !== edges.length) {
          errors.push(`concept-map: every edge must be an object`);
        }
        for (const edge of edgeObjs) {
          if (typeof edge.from !== 'string' || !nodeIdSet.has(edge.from)) {
            errors.push(`concept-map: edge from "${String(edge.from)}" not found in nodes`);
          }
          if (typeof edge.to !== 'string' || !nodeIdSet.has(edge.to)) {
            errors.push(`concept-map: edge to "${String(edge.to)}" not found in nodes`);
          }
        }
      }
    }
  }

  if (errors.length === 0) {
    return { ok: true, value: input as Diagram };
  }
  return { ok: false, errors };
}

export function validateComparison(input: unknown): Result<Comparison> {
  if (!input || typeof input !== 'object') {
    return { ok: false, errors: ['comparison must be an object'] };
  }
  const errors: string[] = [];
  const obj = input as Record<string, unknown>;
  if (!obj.id) errors.push('comparison missing id');
  if (!obj.topic) errors.push('comparison missing topic');
  if (!obj.title) errors.push('comparison missing title');

  const entities = requireArray(obj.entities, 'comparison: entities', errors, true);
  const features = requireArray(obj.features, 'comparison: features', errors, true);
  if (entities === null || features === null) return { ok: false, errors };

  const entityObjs = entities.filter((e): e is { id: string } => typeof e === 'object' && e !== null);
  if (entityObjs.length !== entities.length) errors.push('comparison: every entity must be an object');
  const featureObjs = features.filter((f): f is { id: string; values?: unknown } => typeof f === 'object' && f !== null);
  if (featureObjs.length !== features.length) errors.push('comparison: every feature must be an object');
  const entityIdList = entityObjs.map((e) => e.id);
  if (entityIdList.length !== new Set(entityIdList).size) errors.push('comparison: duplicate entity ids');
  const entityIds = new Set(entityIdList);
  const featureIdList = featureObjs.map((f) => f.id);
  if (featureIdList.length !== new Set(featureIdList).size) errors.push('comparison: duplicate feature ids');

  for (const feature of featureObjs) {
    const values = feature.values;
    if (values === undefined) {
      errors.push(`comparison feature "${feature.id}" values: must be an array or object (got undefined)`);
      continue;
    }
    if (typeof values !== 'object' || values === null || Array.isArray(values)) {
      errors.push(`comparison feature "${feature.id}" values must be an object`);
      continue;
    }
    for (const valueKey of Object.keys(values)) {
      if (!entityIds.has(valueKey)) errors.push(`comparison feature "${feature.id}" references missing entity "${valueKey}"`);
    }
  }

  if (entityIds.size < 2) errors.push('comparison requires at least 2 entities');

  if (errors.length === 0) {
    return { ok: true, value: input as Comparison };
  }
  return { ok: false, errors };
}
