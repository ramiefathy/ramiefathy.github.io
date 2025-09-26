import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import Fuse from 'fuse.js';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import clsx from 'clsx';
import saveAs from 'file-saver';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import type {
  LayoutMode,
  MindMapDataset,
  MindMapNode,
  MindMapTooltip,
  SearchResult,
  ThemeMode
} from './types';
import { SYNONYMS } from './synonyms';

const STORAGE_VERSION = 'v1';

interface MindMapAppProps {
  dataset: MindMapDataset;
}

interface FlattenedNode {
  id: string;
  name: string;
  tabId: string;
  path: string[];
  idPath: string[];
  tooltipMarkdown: string;
  tags: string[];
}

interface PersistedState {
  activeTab: string;
  collapsed: Record<string, string[]>;
  layout: LayoutMode;
  theme: ThemeMode;
}

interface PersistedAnnotations {
  notes: Record<string, string>;
}

interface RenderableNode extends MindMapNode {
  originalChildren?: MindMapNode[];
  collapsed?: boolean;
}

function safeLoad<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return fallback;
    return JSON.parse(stored) as T;
  } catch (error) {
    console.warn('Failed to read localStorage key', key, error);
    return fallback;
  }
}

function safeSave<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to persist localStorage key', key, error);
  }
}

export function buildInitialCollapsed(node: MindMapNode): Set<string> {
  const collapsed = new Set<string>();
  const visit = (current: MindMapNode, depth: number) => {
    if (depth >= 2 && current.children && current.children.length) {
      collapsed.add(current.id);
    }
    current.children?.forEach((child) => visit(child, depth + 1));
  };
  visit(node, 0);
  return collapsed;
}

function buildRenderableTree(node: MindMapNode, collapsed: Set<string>): RenderableNode {
  const isCollapsed = collapsed.has(node.id);
  const children = node.children ?? [];
  return {
    ...node,
    originalChildren: children,
    collapsed: isCollapsed,
    children: isCollapsed ? [] : children.map((child) => buildRenderableTree(child, collapsed))
  };
}

function flattenNode(
  node: MindMapNode,
  tabId: string,
  path: string[],
  idPath: string[],
  acc: FlattenedNode[]
) {
  const tooltipMarkdown = node.tooltip?.markdown ?? '';
  const tags = node.tags ?? [];
  const synonyms = Object.entries(SYNONYMS)
    .filter(([token]) =>
      token.toLowerCase() === node.name.toLowerCase() || path.some((part) => part.toLowerCase().includes(token))
    )
    .flatMap(([, values]) => values);
  acc.push({
    id: node.id,
    name: node.name,
    tabId,
    path,
    idPath,
    tooltipMarkdown,
    tags: [...tags, ...synonyms]
  });
  node.children?.forEach((child) => flattenNode(child, tabId, [...path, child.name], [...idPath, child.id], acc));
}

export function buildBreadcrumbPath(nodeId: string, tabRoot: MindMapNode): string[] {
  const path: string[] = [];
  let found = false;
  const dfs = (node: MindMapNode, segments: string[]) => {
    if (found) return;
    const next = [...segments, node.name];
    if (node.id === nodeId) {
      path.push(...next);
      found = true;
      return;
    }
    node.children?.forEach((child) => dfs(child, next));
  };
  dfs(tabRoot, []);
  return path;
}

export function markdownToHtml(tooltip?: MindMapTooltip): string {
  if (!tooltip) return '';
  const raw = marked.parse(tooltip.markdown || '', { breaks: true });
  return DOMPurify.sanitize(raw);
}

function exportSvgAsImage(svg: SVGSVGElement, type: 'png' | 'pdf') {
  const container = svg.parentElement;
  if (!container) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  return toPng(container, { width, height, cacheBust: true })
    .then((dataUrl) => {
      if (type === 'png') {
        saveAs(dataUrl, 'mind-map.png');
      } else {
        const pdf = new jsPDF({ orientation: width > height ? 'landscape' : 'portrait', unit: 'px', format: [width, height] });
        pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
        pdf.save('mind-map.pdf');
      }
    })
    .catch((error) => {
      console.error('Failed to export mind map', error);
    });
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const prefersDarkMode = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

const MindMapApp: React.FC<MindMapAppProps> = ({ dataset }) => {
  const { manifest, tabs } = dataset;
  const [activeTab, setActiveTab] = useState<string>(manifest.defaultTab);
  const [layout, setLayout] = useState<LayoutMode>('radial');
  const [theme, setTheme] = useState<ThemeMode>(prefersDarkMode() ? 'dark' : 'light');
  const [collapsedByTab, setCollapsedByTab] = useState<Record<string, Set<string>>>(() => {
    const initial: Record<string, Set<string>> = {};
    Object.entries(tabs).forEach(([tabId, node]) => {
      initial[tabId] = buildInitialCollapsed(node);
    });
    return initial;
  });
  const [annotations, setAnnotations] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [presentationMode, setPresentationMode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const minimapRef = useRef<SVGSVGElement>(null);

  const storageKey = `mindmap:${manifest.id}:state:${STORAGE_VERSION}`;
  const notesKey = `mindmap:${manifest.id}:notes:${STORAGE_VERSION}`;

  // Load persisted state/annotations after mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const persisted = safeLoad<PersistedState | null>(storageKey, null);
    if (persisted) {
      setActiveTab(persisted.activeTab || manifest.defaultTab);
      setLayout(persisted.layout || 'radial');
      setTheme(persisted.theme || (prefersDarkMode() ? 'dark' : 'light'));
      setCollapsedByTab((current) => {
        const next: Record<string, Set<string>> = { ...current };
        Object.entries(persisted.collapsed || {}).forEach(([tabId, list]) => {
          next[tabId] = new Set(list);
        });
        return next;
      });
    }
    const savedNotes = safeLoad<PersistedAnnotations | null>(notesKey, null);
    if (savedNotes?.notes) {
      setAnnotations(savedNotes.notes);
    }
  }, [manifest.defaultTab, manifest.id, storageKey, notesKey]);

  // Persist state changes
  useEffect(() => {
    const collapsedSerialized: Record<string, string[]> = {};
    Object.entries(collapsedByTab).forEach(([tabId, set]) => {
      collapsedSerialized[tabId] = Array.from(set);
    });
    const payload: PersistedState = {
      activeTab,
      collapsed: collapsedSerialized,
      layout,
      theme
    };
    safeSave(storageKey, payload);
  }, [activeTab, collapsedByTab, layout, theme, storageKey]);

  useEffect(() => {
    safeSave<PersistedAnnotations>(notesKey, { notes: annotations });
  }, [annotations, notesKey]);

  // Flatten data for search index
  const flattened = useMemo(() => {
    const rows: FlattenedNode[] = [];
    Object.entries(tabs).forEach(([tabId, root]) => {
      flattenNode(root, tabId, [root.name], [root.id], rows);
    });
    return rows;
  }, [tabs]);

  const nodeLookup = useMemo(() => {
    const map = new Map<string, FlattenedNode>();
    flattened.forEach((entry) => {
      map.set(entry.id, entry);
    });
    return map;
  }, [flattened]);

  const fuse = useMemo(() => {
    return new Fuse(flattened, {
      includeScore: true,
      threshold: 0.35,
      keys: [
        'name',
        'tooltipMarkdown',
        {
          name: 'path',
          getFn: (item: FlattenedNode) => item.path.join(' ')
        },
        'tags'
      ]
    });
  }, [flattened]);

  const highlightSet = useMemo(() => new Set(highlightedIds), [highlightedIds]);

  const sanitizedTooltips = useMemo(() => {
    const map = new Map<string, string>();
    Object.values(tabs).forEach((root) => {
      const walk = (node: MindMapNode) => {
        if (node.tooltip) {
          map.set(node.id, markdownToHtml(node.tooltip));
        }
        node.children?.forEach(walk);
      };
      walk(root);
    });
    return map;
  }, [tabs]);

  const applySearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setHighlightedIds([]);
        return;
      }
      const results = fuse
        .search(query.trim())
        .slice(0, 50)
        .map((entry) => ({
          id: entry.item.id,
          name: entry.item.name,
          tabId: entry.item.tabId,
          path: entry.item.path,
          idPath: entry.item.idPath,
          score: entry.score ?? 0
        }));
      setSearchResults(results);
      setHighlightedIds(results.flatMap((result) => result.idPath));
    },
    [fuse]
  );

  useEffect(() => {
    applySearch(searchQuery);
  }, [applySearch, searchQuery]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  }, []);

  const toggleLayout = useCallback(() => {
    setLayout((current) => (current === 'radial' ? 'vertical' : 'radial'));
  }, []);

  const setCollapsed = useCallback(
    (tabId: string, updater: (current: Set<string>) => Set<string>) => {
      setCollapsedByTab((prev) => ({
        ...prev,
        [tabId]: updater(prev[tabId] ?? new Set<string>())
      }));
    },
    []
  );

  const expandPath = useCallback(
    (tabId: string, path: string[]) => {
      setCollapsed(tabId, (current) => {
        const next = new Set(current);
        path.forEach((nodeId) => next.delete(nodeId));
        return next;
      });
    },
    [setCollapsed]
  );

  const collapseAll = useCallback(() => {
    setCollapsed(activeTab, () => buildInitialCollapsed(tabs[activeTab]));
  }, [activeTab, tabs, setCollapsed]);

  const expandAll = useCallback(() => {
    setCollapsed(activeTab, () => new Set());
  }, [activeTab, setCollapsed]);

  const handleAnnotationChange = useCallback((nodeId: string, value: string) => {
    setAnnotations((prev) => ({ ...prev, [nodeId]: value }));
  }, []);

  const exportState = useCallback(() => {
    const payload = {
      collapsed: Object.fromEntries(
        Object.entries(collapsedByTab).map(([tabId, set]) => [tabId, Array.from(set)])
      ),
      annotations
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    saveAs(blob, `${manifest.id}-state.json`);
  }, [annotations, collapsedByTab, manifest.id]);

  const importState = useCallback(
    async (file: File) => {
      const text = await file.text();
      const parsed = JSON.parse(text) as { collapsed?: Record<string, string[]>; annotations?: Record<string, string> };
      if (parsed.collapsed) {
        setCollapsedByTab((prev) => {
          const next: Record<string, Set<string>> = { ...prev };
          Object.entries(parsed.collapsed!).forEach(([tabId, ids]) => {
            next[tabId] = new Set(ids);
          });
          return next;
        });
      }
      if (parsed.annotations) {
        setAnnotations(parsed.annotations);
      }
    },
    []
  );

  const handleSearchResultSelect = useCallback(
    (result: SearchResult) => {
      setActiveTab(result.tabId);
      expandPath(result.tabId, result.idPath);
      setSelectedNodeId(result.id);
      setHighlightedIds(result.idPath);
    },
    [expandPath, tabs]
  );

  const visibleTree = useMemo(() => {
    const collapsed = collapsedByTab[activeTab] ?? new Set<string>();
    return buildRenderableTree(tabs[activeTab], collapsed);
  }, [activeTab, collapsedByTab, tabs]);

  const selectedBreadcrumb = useMemo(() => {
    if (!selectedNodeId) return [];
    const lookup = nodeLookup.get(selectedNodeId);
    if (lookup) {
      return lookup.path;
    }
    const root = tabs[activeTab];
    if (!root) return [];
    return buildBreadcrumbPath(selectedNodeId, root);
  }, [activeTab, nodeLookup, selectedNodeId, tabs]);

  const reducedMotion = prefersReducedMotion();

  // Render main SVG whenever layout or collapsed changes
  useEffect(() => {
    const svg = svgRef.current;
    const wrapper = containerRef.current;
    if (!svg || !wrapper) return;

    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;

    const root = d3.hierarchy<RenderableNode>(visibleTree, (d) => d.children ?? []);

    svg.innerHTML = '';

    const g = d3
      .select(svg)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('role', 'tree')
      .attr('tabindex', 0)
      .attr('aria-label', `${manifest.title} mind map`)
      .append('g');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });

    d3.select(svg).call(zoom);

    type RenderNode = d3.HierarchyPointNode<RenderableNode> & { cartX?: number; cartY?: number };
    type RenderLink = {
      source: RenderNode;
      target: RenderNode;
      sourcePoint: [number, number];
      targetPoint: [number, number];
    };

    let nodes: RenderNode[];
    let renderLinks: RenderLink[];

    if (layout === 'radial') {
      const radius = Math.min(width, height) / 2 - 40;
      const cluster = d3.cluster<RenderableNode>().size([2 * Math.PI, radius]);
      cluster(root);
      nodes = root.descendants().map((node) => {
        const angle = node.x;
        const r = node.y;
        const cartX = width / 2 + Math.cos(angle - Math.PI / 2) * r;
        const cartY = height / 2 + Math.sin(angle - Math.PI / 2) * r;
        return Object.assign(node, { cartX, cartY });
      });
      renderLinks = root.links().map((link) => {
        const source = nodes.find((node) => node.data.id === link.source.data.id)!;
        const target = nodes.find((node) => node.data.id === link.target.data.id)!;
        return {
          source,
          target,
          sourcePoint: [source.cartX ?? width / 2, source.cartY ?? height / 2],
          targetPoint: [target.cartX ?? width / 2, target.cartY ?? height / 2]
        };
      });
    } else {
      const tree = d3.tree<RenderableNode>().size([height - 80, width - 160]);
      tree(root);
      nodes = root
        .descendants()
        .map((node) => Object.assign(node, { cartX: node.y + 80, cartY: node.x + 40 }));
      renderLinks = root.links().map((link) => {
        const source = nodes.find((node) => node.data.id === link.source.data.id)!;
        const target = nodes.find((node) => node.data.id === link.target.data.id)!;
        return {
          source,
          target,
          sourcePoint: [source.cartX ?? 0, source.cartY ?? 0],
          targetPoint: [target.cartX ?? 0, target.cartY ?? 0]
        };
      });
    }

    const linkGenerator = d3
      .linkHorizontal<{ source: [number, number]; target: [number, number] }, [number, number]>()
      .x((d) => d[0])
      .y((d) => d[1]);

    g.append('g')
      .attr('fill', 'none')
      .attr('stroke', theme === 'dark' ? '#4b5563' : '#cbd5f5')
      .attr('stroke-width', 1.5)
      .selectAll('path')
      .data(renderLinks)
      .join('path')
      .attr('d', (link) =>
        linkGenerator({ source: link.sourcePoint, target: link.targetPoint })
      );

    const nodeGroup = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('transform', (d) =>
        layout === 'radial'
          ? `translate(${d.cartX ?? width / 2}, ${d.cartY ?? height / 2})`
          : `translate(${d.cartX}, ${d.cartY})`
      )
      .attr('role', 'treeitem')
      .attr('aria-expanded', (d) =>
        d.data.originalChildren && d.data.originalChildren.length > 0
          ? String(!d.data.collapsed)
          : undefined
      )
      .attr('tabindex', 0)
      .attr('data-node-id', (d) => d.data.id)
      .on('click keydown', (event, d) => {
        if (event.type === 'click' || (event as KeyboardEvent).key === 'Enter' || (event as KeyboardEvent).key === ' ') {
          event.preventDefault();
          setSelectedNodeId(d.data.id);
          const hasChildren = d.data.originalChildren && d.data.originalChildren.length > 0;
          if (hasChildren) {
            setCollapsed(activeTab, (current) => {
              const next = new Set(current);
              if (next.has(d.data.id)) {
                next.delete(d.data.id);
              } else {
                next.add(d.data.id);
              }
              return next;
            });
          }
        }
        if ((event as KeyboardEvent).key === 'ArrowUp') {
          const index = nodes.findIndex((node) => node.data.id === d.data.id);
          if (index > 0) {
            const target = nodes[index - 1];
            const element = svg.querySelector(`[data-node-id="${target.data.id}"]`) as SVGGElement | null;
            element?.focus();
          }
        }
        if ((event as KeyboardEvent).key === 'ArrowDown') {
          const index = nodes.findIndex((node) => node.data.id === d.data.id);
          if (index < nodes.length - 1) {
            const target = nodes[index + 1];
            const element = svg.querySelector(`[data-node-id="${target.data.id}"]`) as SVGGElement | null;
            element?.focus();
          }
        }
      });

    nodeGroup
      .append('circle')
      .attr('r', 12)
      .attr('fill', (d) => (highlightSet.has(d.data.id) ? '#f97316' : theme === 'dark' ? '#1f2937' : '#ffffff'))
      .attr('stroke', (d) => (highlightSet.has(d.data.id) ? '#f97316' : theme === 'dark' ? '#f9fafb' : '#1f2937'))
      .attr('stroke-width', (d) => (highlightSet.has(d.data.id) ? 3 : 1.5));

    nodeGroup
      .append('text')
      .attr('x', (d) =>
        layout === 'radial'
          ? (d.cartX ?? 0) >= width / 2
            ? 16
            : -16
          : 16
      )
      .attr('dy', '0.32em')
      .attr('text-anchor', (d) =>
        layout === 'radial' && (d.cartX ?? 0) < width / 2 ? 'end' : 'start'
      )
      .attr('fill', theme === 'dark' ? '#f9fafb' : '#111827')
      .text((d) => d.data.name);

    if (!reducedMotion && highlightSet.size > 0) {
      nodeGroup
        .filter((d) => highlightSet.has(d.data.id))
        .append('animate')
        .attr('attributeName', 'opacity')
        .attr('values', '1;0.4;1')
        .attr('dur', '2s')
        .attr('repeatCount', 'indefinite');
    }

    if (minimapRef.current) {
      const mini = d3.select(minimapRef.current);
      mini.selectAll('*').remove();
      const scale = 0.15;
      const miniGroup = mini.append('g').attr('transform', `scale(${scale})`);
      miniGroup
        .append('g')
        .attr('fill', 'none')
        .attr('stroke', '#9ca3af')
        .selectAll('path')
        .data(renderLinks)
        .join('path')
        .attr('d', (link) =>
          linkGenerator({
            source: [link.sourcePoint[0], link.sourcePoint[1]],
            target: [link.targetPoint[0], link.targetPoint[1]]
          })
        );
      miniGroup
        .append('g')
        .selectAll('circle')
        .data(nodes)
        .join('circle')
        .attr('cx', (d) => (layout === 'radial' ? d.cartX ?? width / 2 : d.cartX ?? 0))
        .attr('cy', (d) => (layout === 'radial' ? d.cartY ?? height / 2 : d.cartY ?? 0))
        .attr('r', 6)
        .attr('fill', (d) => (highlightSet.has(d.data.id) ? '#f97316' : theme === 'dark' ? '#4b5563' : '#9ca3af'));
    }
  }, [visibleTree, layout, theme, manifest.title, highlightSet, reducedMotion, activeTab]);

  const selectedTooltipHtml = selectedNodeId ? sanitizedTooltips.get(selectedNodeId) ?? '' : '';

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setShowHelp((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className={clsx('mindmap-app', theme, presentationMode && 'presentation-mode')}>
      <div className="mindmap-controls" aria-live="polite">
        <div className="control-row">
          <div className="tabs" role="tablist" aria-label={`${manifest.title} tabs`}>
            {manifest.tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`mindmap-panel-${tab.id}`}
                className={clsx('tab', activeTab === tab.id && 'active')}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.name}
              </button>
            ))}
          </div>
          <div className="actions">
            <button type="button" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? '🌞' : '🌜'}
            </button>
            <button type="button" onClick={toggleLayout} aria-label="Toggle layout mode">
              {layout === 'radial' ? '⟲' : '☰'}
            </button>
            <button type="button" onClick={() => setPresentationMode((prev) => !prev)} aria-label="Toggle presentation mode">
              {presentationMode ? 'Exit Presentation' : 'Presentation'}
            </button>
            <button type="button" onClick={collapseAll}>Collapse all</button>
            <button type="button" onClick={expandAll}>Expand all</button>
            <button type="button" onClick={() => svgRef.current && exportSvgAsImage(svgRef.current, 'png')}>Export PNG</button>
            <button type="button" onClick={() => svgRef.current && exportSvgAsImage(svgRef.current, 'pdf')}>Export PDF</button>
            <button type="button" onClick={exportState}>Export state</button>
            <label className="import-label">
              Import state
              <input
                type="file"
                accept="application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    importState(file);
                    event.target.value = '';
                  }
                }}
              />
            </label>
            <button type="button" onClick={() => setShowHelp(true)} aria-label="Open help">
              ?
            </button>
          </div>
        </div>
        <div className="search-row">
          <label htmlFor="mindmap-search" className="sr-only">
            Search nodes
          </label>
          <input
            id="mindmap-search"
            type="search"
            placeholder="Search nodes or tooltips"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <button type="button" onClick={() => setSearchQuery('')}>
            Clear
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="search-results" role="listbox" aria-label="Search results">
            {searchResults.map((result) => (
              <button
                key={result.id}
                role="option"
                className="search-result"
                onClick={() => handleSearchResultSelect(result)}
              >
                <span className="result-name">{result.name}</span>
                <span className="result-path">{result.path.join(' › ')}</span>
                <span className="result-score">{result.score.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mindmap-layout">
        <div className="canvas-panel" aria-live="polite">
          <div ref={containerRef} className="mindmap-canvas" role="region" aria-label={`${manifest.title} visualization`}>
            <svg ref={svgRef} />
          </div>
          <div className="mindmap-minimap" aria-hidden="true">
            <svg ref={minimapRef} viewBox="0 0 600 600" />
          </div>
          {selectedBreadcrumb.length > 0 && (
            <nav className="breadcrumbs" aria-label="Selected node breadcrumb">
              {selectedBreadcrumb.map((segment, index) => (
                <span key={segment}>
                  {segment}
                  {index < selectedBreadcrumb.length - 1 && ' › '}
                </span>
              ))}
            </nav>
          )}
        </div>
        <aside className="detail-panel" aria-live="polite">
          <h2>Details</h2>
          {selectedNodeId ? (
            <>
              <div className="tooltip-content" dangerouslySetInnerHTML={{ __html: selectedTooltipHtml }} />
              <label htmlFor="mindmap-annotation">Personal notes</label>
              <textarea
                id="mindmap-annotation"
                value={annotations[selectedNodeId] ?? ''}
                onChange={(event) => handleAnnotationChange(selectedNodeId, event.target.value)}
                placeholder="Add your own notes. These are saved only on this device."
              />
            </>
          ) : (
            <p>Select a node to view details and add notes.</p>
          )}
          {Object.entries(annotations)
            .filter(([, value]) => value.trim().length > 0)
            .map(([nodeId, value]) => ({
              nodeId,
              value,
              lookup: nodeLookup.get(nodeId)
            }))
            .sort((a, b) => (a.lookup?.path.join(' › ') || '').localeCompare(b.lookup?.path.join(' › ') || ''))
            .map(({ nodeId, value, lookup }) => {
              const root = lookup ? tabs[lookup.tabId] : tabs[activeTab];
              const breadcrumb = lookup
                ? lookup.path.join(' › ')
                : root
                ? buildBreadcrumbPath(nodeId, root).join(' › ')
                : nodeId;
              return (
                <details key={nodeId}>
                  <summary>Note for {breadcrumb || nodeId}</summary>
                  <pre>{value}</pre>
                </details>
              );
            })}
        </aside>
      </div>

      {showHelp && (
        <div className="help-overlay" role="dialog" aria-modal="true">
          <div className="help-content">
            <h2>Keyboard & feature guide</h2>
            <ul>
              <li>Use Tab to move between controls, Enter/Space to toggle nodes.</li>
              <li>Arrow Up/Down move focus between nearby nodes.</li>
              <li>Press ? at any time to open or close this help.</li>
              <li>Toggle between radial and vertical layouts with the ⟲/☰ button.</li>
              <li>Export your current state or annotations to share across devices.</li>
            </ul>
            <button type="button" onClick={() => setShowHelp(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MindMapApp;
