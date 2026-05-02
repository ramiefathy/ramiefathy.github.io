import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkExtendedEdge, ElkNode, ElkPoint } from 'elkjs/lib/elk-api';
import type { ConceptEdgeKind, DecisionTreeStep, Diagram } from '../types';

const elk = new ELK();

export interface TextWrapOptions {
  maxCharsPerLine: number;
  maxLines: number;
  fontSize: number;
}

export interface WrappedText {
  lines: string[];
  fontSize: number;
}

export interface LayoutBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: WrappedText;
}

export interface DecisionTreeLayoutNode extends LayoutBox {
  type: 'decision' | 'action' | 'terminal';
}

export interface ConceptMapLayoutNode extends LayoutBox {
  kind?: string;
}

export interface LayoutLabel extends WrappedText {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutEdge {
  id: string;
  from: string;
  to: string;
  path: string;
  label?: LayoutLabel;
  kind?: ConceptEdgeKind;
  markerId: string;
}

export interface DiagramLayout<Node extends LayoutBox> {
  viewBox: {
    width: number;
    height: number;
  };
  nodes: Node[];
  edges: LayoutEdge[];
}

const TEXT_WIDTH_FACTOR = 0.68;
const LINE_HEIGHT_FACTOR = 1.22;
const DECISION_DIAMOND_TEXT_PADDING = 18;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function finiteOrFallback(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function wordsFrom(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

export function wrapTextToLines(text: string, options: TextWrapOptions): WrappedText {
  const words = wordsFrom(text);
  if (words.length === 0) return { lines: [''], fontSize: options.fontSize };

  const lines: string[] = [];
  for (const word of words) {
    if (lines.length === 0) {
      lines.push(word);
      continue;
    }
    const last = lines[lines.length - 1];
    const combined = `${last} ${word}`;
    if (combined.length > options.maxCharsPerLine && lines.length < options.maxLines) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = combined;
    }
  }

  return {
    lines: lines.map((line) => line.trim()).filter(Boolean),
    fontSize: options.fontSize,
  };
}

export function boxesOverlap(a: Pick<LayoutBox, 'x' | 'y' | 'width' | 'height'>, b: Pick<LayoutBox, 'x' | 'y' | 'width' | 'height'>, padding = 0): boolean {
  return !(
    a.x + a.width + padding <= b.x ||
    b.x + b.width + padding <= a.x ||
    a.y + a.height + padding <= b.y ||
    b.y + b.height + padding <= a.y
  );
}

function measureLabel(
  text: string,
  options: {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    paddingX: number;
    paddingY: number;
    fontSize: number;
    maxLines: number;
  },
): Omit<LayoutBox, 'id' | 'x' | 'y'> {
  const maxCharsPerLine = Math.max(8, Math.floor((options.maxWidth - options.paddingX * 2) / (options.fontSize * TEXT_WIDTH_FACTOR)));
  const label = wrapTextToLines(text, {
    maxCharsPerLine,
    maxLines: options.maxLines,
    fontSize: options.fontSize,
  });
  const longestLine = Math.max(...label.lines.map((line) => line.length), 1);
  const width = clamp(
    Math.ceil(longestLine * options.fontSize * TEXT_WIDTH_FACTOR + options.paddingX * 2),
    options.minWidth,
    options.maxWidth,
  );
  const height = Math.max(
    options.minHeight,
    Math.ceil(label.lines.length * options.fontSize * LINE_HEIGHT_FACTOR + options.paddingY * 2),
  );
  return { width, height, label };
}

function diamondAvailableWidthAt(width: number, height: number, y: number): number {
  const verticalDistanceFromCenter = Math.abs(y - height / 2);
  const halfWidthAtY = (width / 2) * (1 - (verticalDistanceFromCenter / (height / 2)));
  return Math.max(0, halfWidthAtY * 2);
}

function diamondLabelFits(label: WrappedText, width: number, height: number, padding: number): boolean {
  const lineHeight = label.fontSize * LINE_HEIGHT_FACTOR;
  const firstLineCenter = height / 2 - ((label.lines.length - 1) * lineHeight) / 2;

  return label.lines.every((line, index) => {
    const lineCenterY = firstLineCenter + index * lineHeight;
    const lineBandTop = lineCenterY - lineHeight / 2;
    const lineBandBottom = lineCenterY + lineHeight / 2;
    const availableWidth = Math.min(
      diamondAvailableWidthAt(width, height, lineBandTop),
      diamondAvailableWidthAt(width, height, lineBandBottom),
    );
    const estimatedTextWidth = line.length * label.fontSize * TEXT_WIDTH_FACTOR;
    return estimatedTextWidth <= availableWidth - padding * 2;
  });
}

function measureDecisionLabel(text: string): Omit<LayoutBox, 'id' | 'x' | 'y'> {
  const fontSize = 13;
  const minWidth = 360;
  const maxWidth = 640;
  const minHeight = 112;
  const maxLines = 7;
  const paddingY = 20;

  for (let maxCharsPerLine = 22; maxCharsPerLine >= 10; maxCharsPerLine--) {
    const label = wrapTextToLines(text, { maxCharsPerLine, maxLines, fontSize });
    const longestLine = Math.max(...label.lines.map((line) => line.length), 1);
    const textWidth = Math.ceil(longestLine * fontSize * TEXT_WIDTH_FACTOR);
    const textHeight = Math.ceil(label.lines.length * fontSize * LINE_HEIGHT_FACTOR);
    const height = Math.max(minHeight, textHeight + paddingY * 2);

    for (let width = Math.max(minWidth, textWidth + DECISION_DIAMOND_TEXT_PADDING * 4); width <= maxWidth; width += 20) {
      if (diamondLabelFits(label, width, height, DECISION_DIAMOND_TEXT_PADDING)) {
        return { width, height, label };
      }
    }
  }

  return measureLabel(text, {
    minWidth: maxWidth,
    maxWidth,
    minHeight: minHeight + 32,
    paddingX: DECISION_DIAMOND_TEXT_PADDING * 3,
    paddingY,
    fontSize,
    maxLines,
  });
}

function measureDecisionTreeStepLabel(step: DecisionTreeStep): Omit<LayoutBox, 'id' | 'x' | 'y'> {
  if (step.type === 'decision') {
    return measureDecisionLabel(step.prompt ?? '');
  }
  return measureLabel(step.prompt ?? '', {
    minWidth: 180,
    maxWidth: 280,
    minHeight: 64,
    paddingX: 24,
    paddingY: 16,
    fontSize: 13,
    maxLines: 4,
  });
}

export function sanitizePoint(point: ElkPoint | undefined, fallback: ElkPoint, padding = 0): ElkPoint {
  return {
    x: Number.isFinite(point?.x) ? point!.x + padding : fallback.x,
    y: Number.isFinite(point?.y) ? point!.y + padding : fallback.y,
  };
}

function sectionPoints(edge: ElkExtendedEdge, padding: number, fallbackStart: ElkPoint, fallbackEnd: ElkPoint): ElkPoint[] {
  const section = edge.sections?.[0];
  if (!section) return [fallbackStart, fallbackEnd];
  return [
    sanitizePoint(section.startPoint, fallbackStart, padding),
    ...(section.bendPoints ?? []).map((point) => sanitizePoint(point, fallbackStart, padding)),
    sanitizePoint(section.endPoint, fallbackEnd, padding),
  ];
}

function pointsToPath(points: ElkPoint[]): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  return `M${first.x},${first.y}${rest.map((point) => ` L${point.x},${point.y}`).join('')}`;
}

function midpoint(points: ElkPoint[]): ElkPoint {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];
  const start = points[0];
  const end = points[points.length - 1];
  return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
}

function normalizeGraphSize(graph: ElkNode, padding: number) {
  return {
    width: Math.ceil(finiteOrFallback(graph.width, 1) + padding * 2),
    height: Math.ceil(finiteOrFallback(graph.height, 1) + padding * 2),
  };
}

export async function layoutDecisionTreeDiagram(
  diagram: Extract<Diagram, { type: 'decision-tree' }>,
): Promise<DiagramLayout<DecisionTreeLayoutNode>> {
  const padding = 48;
  const stepById = new Map(diagram.data.steps.map((step) => [step.id, step]));
  const children: ElkNode[] = diagram.data.steps.map((step) => {
    const measured = measureDecisionTreeStepLabel(step);
    return {
      id: step.id,
      width: measured.width,
      height: measured.height,
    };
  });
  const edges: ElkExtendedEdge[] = diagram.data.steps.flatMap((step) =>
    (step.branches ?? []).map((branch, index) => ({
      id: `${step.id}--${branch.nextStepId}--${index}`,
      sources: [step.id],
      targets: [branch.nextStepId],
    })),
  );

  if (children.length === 0 || !stepById.has(diagram.data.start)) {
    return { viewBox: { width: 1, height: 1 }, nodes: [], edges: [] };
  }

  const graph = await elk.layout({
    id: `${diagram.id}-layout`,
    children,
    edges,
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '48',
      'elk.spacing.edgeNode': '24',
      'elk.layered.spacing.nodeNodeBetweenLayers': '88',
      'elk.layered.spacing.edgeNodeBetweenLayers': '24',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    },
  });

  const measuredById = new Map(
    diagram.data.steps.map((step) => [
      step.id,
      measureDecisionTreeStepLabel(step),
    ]),
  );

  const nodes: DecisionTreeLayoutNode[] = (graph.children ?? []).map((node) => {
    const step = stepById.get(node.id)!;
    const measured = measuredById.get(node.id)!;
    return {
      id: node.id,
      type: step.type,
      x: finiteOrFallback(node.x, 0) + padding,
      y: finiteOrFallback(node.y, 0) + padding,
      width: finiteOrFallback(node.width, measured.width),
      height: finiteOrFallback(node.height, measured.height),
      label: measured.label,
    };
  });
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const branchLabelByEdgeId = new Map<string, string>();
  diagram.data.steps.forEach((step) => {
    (step.branches ?? []).forEach((branch, index) => {
      branchLabelByEdgeId.set(`${step.id}--${branch.nextStepId}--${index}`, branch.label);
    });
  });

  const renderedEdges: LayoutEdge[] = (graph.edges ?? []).map((edge) => {
    const sourceId = edge.sources[0];
    const targetId = edge.targets[0];
    const source = nodeById.get(sourceId);
    const target = nodeById.get(targetId);
    const fallbackStart = source
      ? { x: source.x + source.width / 2, y: source.y + source.height }
      : { x: padding, y: padding };
    const fallbackEnd = target
      ? { x: target.x + target.width / 2, y: target.y }
      : { x: padding, y: padding };
    const points = sectionPoints(edge, padding, fallbackStart, fallbackEnd);
    const labelText = branchLabelByEdgeId.get(edge.id) ?? '';
    const labelWrap = wrapTextToLines(labelText, { maxCharsPerLine: 18, maxLines: 3, fontSize: 11 });
    const labelAnchor = target
      ? {
          x: target.x + target.width / 2,
          y: target.y - 24 - Math.max(0, labelWrap.lines.length - 1) * 6,
        }
      : midpoint(points);
    return {
      id: edge.id,
      from: sourceId,
      to: targetId,
      path: pointsToPath(points),
      markerId: 'decision-arrow',
      label: labelText
        ? {
            ...labelWrap,
            x: labelAnchor.x,
            y: labelAnchor.y,
            width: Math.max(48, Math.max(...labelWrap.lines.map((line) => line.length)) * 7),
            height: labelWrap.lines.length * 14,
          }
        : undefined,
    };
  });

  return {
    viewBox: normalizeGraphSize(graph, padding),
    nodes,
    edges: renderedEdges,
  };
}

export async function layoutConceptMapDiagram(
  diagram: Extract<Diagram, { type: 'concept-map' }>,
): Promise<DiagramLayout<ConceptMapLayoutNode>> {
  const padding = 48;
  const children: ElkNode[] = diagram.data.nodes.map((node) => {
    const measured = measureLabel(node.name, {
      minWidth: 144,
      maxWidth: 240,
      minHeight: 58,
      paddingX: 20,
      paddingY: 14,
      fontSize: 13,
      maxLines: 4,
    });
    return {
      id: node.id,
      width: measured.width,
      height: measured.height,
    };
  });
  const edges: ElkExtendedEdge[] = diagram.data.edges.map((edge, index) => ({
    id: `${edge.from}--${edge.to}--${edge.kind}--${index}`,
    sources: [edge.from],
    targets: [edge.to],
  }));

  const graph = await elk.layout({
    id: `${diagram.id}-layout`,
    children,
    edges,
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '52',
      'elk.spacing.edgeNode': '22',
      'elk.layered.spacing.nodeNodeBetweenLayers': '76',
      'elk.layered.spacing.edgeNodeBetweenLayers': '22',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    },
  });

  const sourceNodeById = new Map(diagram.data.nodes.map((node) => [node.id, node]));
  const measuredById = new Map(
    diagram.data.nodes.map((node) => [
      node.id,
      measureLabel(node.name, {
        minWidth: 144,
        maxWidth: 240,
        minHeight: 58,
        paddingX: 20,
        paddingY: 14,
        fontSize: 13,
        maxLines: 4,
      }),
    ]),
  );
  const edgeById = new Map(diagram.data.edges.map((edge, index) => [`${edge.from}--${edge.to}--${edge.kind}--${index}`, edge]));

  const nodes: ConceptMapLayoutNode[] = (graph.children ?? []).map((node) => {
    const sourceNode = sourceNodeById.get(node.id);
    const measured = measuredById.get(node.id)!;
    return {
      id: node.id,
      kind: sourceNode?.kind,
      x: finiteOrFallback(node.x, 0) + padding,
      y: finiteOrFallback(node.y, 0) + padding,
      width: finiteOrFallback(node.width, measured.width),
      height: finiteOrFallback(node.height, measured.height),
      label: measured.label,
    };
  });
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const renderedEdges: LayoutEdge[] = (graph.edges ?? []).map((edge) => {
    const sourceId = edge.sources[0];
    const targetId = edge.targets[0];
    const source = nodeById.get(sourceId);
    const target = nodeById.get(targetId);
    const fallbackStart = source
      ? { x: source.x + source.width, y: source.y + source.height / 2 }
      : { x: padding, y: padding };
    const fallbackEnd = target
      ? { x: target.x, y: target.y + target.height / 2 }
      : { x: padding, y: padding };
    const points = sectionPoints(edge, padding, fallbackStart, fallbackEnd);
    const original = edgeById.get(edge.id);
    const kind = original?.kind ?? 'associated-with';
    return {
      id: edge.id,
      from: sourceId,
      to: targetId,
      kind,
      path: pointsToPath(points),
      markerId: `concept-arrow-${kind}`,
    };
  });

  return {
    viewBox: normalizeGraphSize(graph, padding),
    nodes,
    edges: renderedEdges,
  };
}
