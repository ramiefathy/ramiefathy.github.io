import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import Fuse from 'fuse.js';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import clsx from 'clsx';
import saveAs from 'file-saver';
import type {
  LayoutMode,
  MindMapDataset,
  MindMapNode,
  MindMapTooltip,
  SearchResult,
  ThemeMode
} from '../types';
import { SYNONYMS } from '../synonyms';

const STORAGE_VERSION = 'v1';
const MOBILE_BREAKPOINT = 768;

export interface AtlasViewProps {
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

async function exportSvgAsImage(svg: SVGSVGElement, type: 'png' | 'pdf') {
  const container = svg.parentElement;
  if (!container) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  try {
    const [{ toPng }, jsPDFModule] = await Promise.all([
      import('html-to-image'),
      import('jspdf')
    ]);
    const jsPDF = jsPDFModule.default;
    const dataUrl = await toPng(container, { width, height, cacheBust: true });

    if (type === 'png') {
      saveAs(dataUrl, 'mind-map.png');
    } else {
      const pdf = new jsPDF({ orientation: width > height ? 'landscape' : 'portrait', unit: 'px', format: [width, height] });
      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      pdf.save('mind-map.pdf');
    }
  } catch (error) {
    console.error('Failed to export mind map', error);
  }
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const prefersDarkMode = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

// Hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Hook for swipe gestures on tabs (doesn't interfere with canvas D3 zoom)
function useSwipeGestures(
  elementRef: React.RefObject<HTMLElement>,
  handlers: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
  }
) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length !== 1) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Swipe detection: must be fast and horizontal
      if (deltaTime < 300 && Math.abs(deltaX) > 60 && Math.abs(deltaY) < 40) {
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      }

      touchStartRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handlers]);
}

const AtlasView: React.FC<AtlasViewProps> = ({ dataset }) => {
  const { manifest, tabs } = dataset;
  const [activeTab, setActiveTab] = useState<string>(manifest.defaultTab);
  const [theme, setTheme] = useState<ThemeMode>(prefersDarkMode() ? 'dark' : 'light');
  const [collapsedByTab, setCollapsedByTab] = useState<Record<string, Set<string>>>(() => {
    const initial: Record<string, Set<string>> = {};
    Object.entries(tabs).forEach(([tabId, node]) => {
      initial[tabId] = buildInitialCollapsed(node);
    });
    return initial;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Mobile-specific state
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [detailPanelExpanded, setDetailPanelExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const [gestureHint, setGestureHint] = useState<string | null>(null);
  const [hasShownGestureHint, setHasShownGestureHint] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  // Phase 7D-A1: bump on container-resize so the render effect re-runs and re-fits the viewport
  const [resizeTick, setResizeTick] = useState(0);
  useEffect(() => {
    const wrapper = containerRef.current;
    if (!wrapper || typeof ResizeObserver === 'undefined') return;
    let pending = false;
    const ro = new ResizeObserver(() => {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(() => {
        pending = false;
        setResizeTick((n) => n + 1);
      });
    });
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, []);
  const svgRef = useRef<SVGSVGElement>(null);
  const initialHashProcessed = useRef(false);
  const tabsWrapperRef = useRef<HTMLDivElement>(null);
  const detailPanelRef = useRef<HTMLElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  // F19: component-scoped refs for the zoom-indicator hide timer and the post-fit
  // zoom-indicator suppression timer. Previously both leaked (one via
  // `window.__zoomHideTimer` which survives remounts; the other was untracked).
  const zoomHideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const autoFitTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const storageKey = `mindmap:${manifest.id}:state:${STORAGE_VERSION}`;

  // Load persisted state after mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const persisted = safeLoad<PersistedState | null>(storageKey, null);
    if (persisted) {
      // F2: guard against stale-but-truthy persisted tab ids (e.g. renamed/removed tab).
      // Falling back on `||` only handles empty-string / undefined, not stale ids, which
      // would make `tabs[activeTab]` undefined and crash buildRenderableTree.
      const persistedTab = persisted.activeTab;
      setActiveTab(persistedTab && tabs[persistedTab] ? persistedTab : manifest.defaultTab);
      setTheme(persisted.theme || (prefersDarkMode() ? 'dark' : 'light'));
      setCollapsedByTab((current) => {
        const next: Record<string, Set<string>> = { ...current };
        Object.entries(persisted.collapsed || {}).forEach(([tabId, list]) => {
          next[tabId] = new Set(list);
        });
        return next;
      });
    }
  }, [manifest.defaultTab, manifest.id, storageKey, tabs]);

  // Persist state changes
  useEffect(() => {
    const collapsedSerialized: Record<string, string[]> = {};
    Object.entries(collapsedByTab).forEach(([tabId, set]) => {
      collapsedSerialized[tabId] = Array.from(set);
    });
    const payload: PersistedState = {
      activeTab,
      collapsed: collapsedSerialized,
      layout: 'radial',
      theme
    };
    safeSave(storageKey, payload);
  }, [activeTab, collapsedByTab, theme, storageKey]);

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

  // Deep linking: read URL hash on mount and navigate to node
  useEffect(() => {
    if (typeof window === 'undefined' || initialHashProcessed.current) return;

    const hash = window.location.hash.slice(1); // Remove '#'
    if (!hash) return;

    // Hash format: tabId:nodeId or just nodeId
    const [first, second] = hash.split(':');
    const targetNodeId = second || first;
    const targetTabId = second ? first : null;

    const lookup = nodeLookup.get(targetNodeId);
    if (lookup) {
      initialHashProcessed.current = true;
      // F2: guard against hash-supplied tab id that no longer exists in the dataset.
      // Falling back to lookup.tabId ensures buildRenderableTree receives a valid root.
      const tabId = targetTabId && tabs[targetTabId] ? targetTabId : lookup.tabId;
      setActiveTab(tabId);
      // Expand path to this node
      setCollapsedByTab((prev) => {
        const next = { ...prev };
        const current = new Set(next[tabId] ?? buildInitialCollapsed(tabs[tabId]));
        lookup.idPath.forEach((id) => current.delete(id));
        next[tabId] = current;
        return next;
      });
      setSelectedNodeId(targetNodeId);
      setHighlightedIds(lookup.idPath);
    }
  }, [nodeLookup, tabs]);

  // Deep linking: update URL hash when node is selected
  useEffect(() => {
    if (typeof window === 'undefined' || !selectedNodeId) return;

    const lookup = nodeLookup.get(selectedNodeId);
    if (lookup) {
      const hash = `${lookup.tabId}:${selectedNodeId}`;
      // Use replaceState to avoid polluting browser history
      window.history.replaceState(null, '', `#${hash}`);
    }
  }, [selectedNodeId, nodeLookup]);

  // Handle hash changes (back/forward navigation)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) {
        setSelectedNodeId(null);
        return;
      }

      const [first, second] = hash.split(':');
      const targetNodeId = second || first;
      const lookup = nodeLookup.get(targetNodeId);

      if (lookup && lookup.id !== selectedNodeId) {
        setActiveTab(lookup.tabId);
        setCollapsedByTab((prev) => {
          const next = { ...prev };
          const current = new Set(next[lookup.tabId] ?? new Set());
          lookup.idPath.forEach((id) => current.delete(id));
          next[lookup.tabId] = current;
          return next;
        });
        setSelectedNodeId(targetNodeId);
        setHighlightedIds(lookup.idPath);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [nodeLookup, selectedNodeId]);

  // Copy link to clipboard
  const copyNodeLink = useCallback(() => {
    if (typeof window === 'undefined' || !selectedNodeId) return;

    const url = window.location.href;

    // F23: `navigator.clipboard` can be undefined (non-secure contexts, older
    // browsers, some test environments). Calling `.writeText` on undefined
    // throws synchronously *before* returning a Promise, so the existing
    // `.catch` fallback never fires. Guard explicitly.
    const legacyCopy = () => {
      try {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (err) {
        console.warn('Clipboard fallback failed', err);
      }
    };

    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
      legacyCopy();
      return;
    }

    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(() => {
      // Fallback for rejected promises (permissions denied, etc.)
      legacyCopy();
    });
  }, [selectedNodeId]);

  // Navigate to a node in breadcrumb
  const navigateToBreadcrumbNode = useCallback((index: number) => {
    if (!selectedNodeId) return;

    const lookup = nodeLookup.get(selectedNodeId);
    if (!lookup || index >= lookup.idPath.length) return;

    const targetId = lookup.idPath[index];
    setSelectedNodeId(targetId);
    setHighlightedIds(lookup.idPath.slice(0, index + 1));
  }, [selectedNodeId, nodeLookup]);

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

  // F33: on initial mount, if the hash-init effect has populated `highlightedIds`
  // with a selected node's ancestor path, do NOT immediately clobber it by
  // running `applySearch('')`. Skip the first invocation only when it would be
  // a no-op clear against an empty search box; subsequent empties (user erased
  // the search term) still clear highlights as expected.
  const didMountSearchRef = useRef(false);
  useEffect(() => {
    if (!didMountSearchRef.current && searchQuery === '') {
      didMountSearchRef.current = true;
      return;
    }
    didMountSearchRef.current = true;
    applySearch(searchQuery);
  }, [applySearch, searchQuery]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
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

  const exportState = useCallback(() => {
    const payload = {
      collapsed: Object.fromEntries(
        Object.entries(collapsedByTab).map(([tabId, set]) => [tabId, Array.from(set)])
      )
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    saveAs(blob, `${manifest.id}-state.json`);
  }, [collapsedByTab, manifest.id]);

  const importState = useCallback(
    async (file: File) => {
      // F17: previously JSON.parse could throw inside this async callback, producing
      // an unhandled rejection. Wrap parse in try/catch and surface a sanitized
      // user-facing error (no raw parse messages leaked). No toast pattern exists in
      // this codebase, so `alert` is the fallback per plan.
      const text = await file.text();
      let parsed: { collapsed?: Record<string, string[]> };
      try {
        parsed = JSON.parse(text) as { collapsed?: Record<string, string[]> };
      } catch (error) {
        console.warn('Failed to parse imported state JSON', error);
        if (typeof window !== 'undefined') {
          window.alert('Could not import state: the file is not valid JSON.');
        }
        return;
      }
      if (parsed && parsed.collapsed) {
        setCollapsedByTab((prev) => {
          const next: Record<string, Set<string>> = { ...prev };
          Object.entries(parsed.collapsed!).forEach(([tabId, ids]) => {
            next[tabId] = new Set(ids);
          });
          return next;
        });
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

  // Mobile: Navigate to next/previous tab
  const tabIds = useMemo(() => manifest.tabs.map((t) => t.id), [manifest.tabs]);

  const goToNextTab = useCallback(() => {
    const currentIndex = tabIds.indexOf(activeTab);
    const nextIndex = (currentIndex + 1) % tabIds.length;
    setActiveTab(tabIds[nextIndex]);
  }, [activeTab, tabIds]);

  const goToPreviousTab = useCallback(() => {
    const currentIndex = tabIds.indexOf(activeTab);
    const prevIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
    setActiveTab(tabIds[prevIndex]);
  }, [activeTab, tabIds]);

  // Setup swipe gestures for tabs wrapper only (doesn't interfere with canvas D3 zoom)
  useSwipeGestures(tabsWrapperRef as React.RefObject<HTMLElement>, {
    onSwipeLeft: goToNextTab,
    onSwipeRight: goToPreviousTab,
  });

  // D3 handles all canvas touch interactions (pinch-zoom, pan, node tap)

  // Show gesture hint on first mobile visit.
  // N2/F18: the inner 4000ms hide-timer must survive the `hasShownGestureHint`
  // dep change that fires when the outer timer sets it to true. Splitting into
  // two effects — one to show the hint, one to auto-hide it — ensures the hide
  // timer is only created/cleaned up when `gestureHint` itself changes, not on
  // every `hasShownGestureHint` flip.
  const gestureHintInnerTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (!isMobile || hasShownGestureHint) return;

    const hintKey = `mindmap:gesture-hint-shown:${STORAGE_VERSION}`;
    const shown = safeLoad<boolean>(hintKey, false);
    if (shown) {
      setHasShownGestureHint(true);
      return;
    }

    // Show gesture hint after a short delay
    const timer = setTimeout(() => {
      setGestureHint('Pinch to zoom • Drag to pan • Tap nodes to select');
      setHasShownGestureHint(true);
      safeSave(hintKey, true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isMobile, hasShownGestureHint]);

  // Auto-hide the gesture hint 4 seconds after it appears. This is a separate
  // effect so the hide timer is keyed to `gestureHint` changes only and is not
  // cancelled by the `hasShownGestureHint` dep flip in the effect above.
  useEffect(() => {
    if (!gestureHint) return;
    gestureHintInnerTimerRef.current = setTimeout(() => setGestureHint(null), 4000);
    return () => {
      if (gestureHintInnerTimerRef.current) {
        clearTimeout(gestureHintInnerTimerRef.current);
        gestureHintInnerTimerRef.current = undefined;
      }
    };
  }, [gestureHint]);

  // Close mobile menu when clicking backdrop
  const handleMobileMenuBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setMobileMenuOpen(false);
    }
  }, []);

  // Close mobile menu on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  // Detail panel drag handling for bottom sheet - track drag distance
  const sheetDragRef = useRef<{ startY: number; startTransform: boolean } | null>(null);

  const handleSheetTouchStart = useCallback((e: React.TouchEvent) => {
    // Only handle touches on the handle area
    const target = e.target as HTMLElement;
    if (!target.classList.contains('sheet-handle') && target.tagName !== 'H2') return;

    const touch = e.touches[0];
    sheetDragRef.current = { startY: touch.clientY, startTransform: detailPanelExpanded };
  }, [detailPanelExpanded]);

  const handleSheetTouchMove = useCallback((e: React.TouchEvent) => {
    if (!sheetDragRef.current) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - sheetDragRef.current.startY;

    // Threshold for toggle
    if (Math.abs(deltaY) > 40) {
      if (deltaY > 0 && sheetDragRef.current.startTransform) {
        setDetailPanelExpanded(false);
        sheetDragRef.current = null;
      } else if (deltaY < 0 && !sheetDragRef.current.startTransform) {
        setDetailPanelExpanded(true);
        sheetDragRef.current = null;
      }
    }
  }, []);

  const handleSheetTouchEnd = useCallback(() => {
    sheetDragRef.current = null;
  }, []);

  // Toggle detail panel on click (mobile bottom sheet)
  const toggleDetailPanel = useCallback(() => {
    setDetailPanelExpanded((prev) => !prev);
  }, []);

  const visibleTree = useMemo(() => {
    // F2: if activeTab is somehow stale (shouldn't happen after the guards above,
    // but defensive against an in-flight state-update race), fall back to defaultTab
    // so buildRenderableTree never receives `undefined`.
    const root = tabs[activeTab] ?? tabs[manifest.defaultTab];
    const collapsed = collapsedByTab[activeTab] ?? new Set<string>();
    return buildRenderableTree(root, collapsed);
  }, [activeTab, collapsedByTab, tabs, manifest.defaultTab]);

  const selectedBreadcrumb = useMemo(() => {
    if (!selectedNodeId) return { path: [], idPath: [] };
    const lookup = nodeLookup.get(selectedNodeId);
    if (lookup) {
      return { path: lookup.path, idPath: lookup.idPath };
    }
    const root = tabs[activeTab];
    if (!root) return { path: [], idPath: [] };
    return { path: buildBreadcrumbPath(selectedNodeId, root), idPath: [] };
  }, [activeTab, nodeLookup, selectedNodeId, tabs]);

  const reducedMotion = prefersReducedMotion();

  // Render main SVG whenever layout or collapsed changes (Phase 7D-A1/A2/A3 Atlas hardening)
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

    // === A2 helpers: hidden measurement element + label wrapper (ported from legacy d3-renderer.js) ===
    const NODE_TEXT = { fontPx: 13, lineHeightEm: 1.15, hPadPx: 14, vPadPx: 10, minRxPx: 38, minRyPx: 22 };
    const measureEl = d3.select(svg)
      .append('text')
      .attr('class', 'mindmap-measure-text')
      .attr('x', 0)
      .attr('y', 0)
      .style('visibility', 'hidden')
      .style('font-family', "var(--font-display, var(--font-body))")
      .style('font-weight', '500')
      .attr('text-anchor', 'start')
      .attr('dominant-baseline', 'alphabetic') as d3.Selection<SVGTextElement, unknown, null, undefined>;
    const measureTextWidth = (text: string, fontPx: number): number => {
      measureEl.attr('font-size', `${fontPx}px`).text(text);
      const node = measureEl.node();
      if (!node) return 0;
      const measured = node.getComputedTextLength();
      return Number.isFinite(measured) ? measured : 0;
    };
    const tokenize = (label: string) => {
      const trimmed = (label || '').trim();
      if (!trimmed) return [] as { text: string; joinerBefore: string }[];
      const words = trimmed.split(/\s+/).filter(Boolean);
      const tokens: { text: string; joinerBefore: string }[] = [];
      words.forEach((word, wi) => {
        const joinerBefore = wi === 0 ? '' : ' ';
        if (!word.includes('-')) {
          tokens.push({ text: word, joinerBefore });
          return;
        }
        const segments = word.split('-');
        segments.forEach((seg, si) => {
          if (!seg) return;
          const jb = si === 0 ? joinerBefore : '';
          const text = si < segments.length - 1 ? `${seg}-` : seg;
          tokens.push({ text, joinerBefore: jb });
        });
      });
      return tokens;
    };
    const wrapTokens = (tokens: { text: string; joinerBefore: string }[], maxWidthPx: number, fontPx: number, maxLines: number) => {
      const safeMaxWidth = Math.max(24, maxWidthPx);
      const safeMaxLines = Math.max(1, Math.floor(maxLines));
      if (!tokens.length) return [''];
      const lines: string[] = [];
      let current = '';
      for (const token of tokens) {
        const joiner = current ? token.joinerBefore : '';
        const candidate = `${current}${joiner}${token.text}`;
        const w = measureTextWidth(candidate, fontPx);
        if (current && w > safeMaxWidth) {
          lines.push(current.trim());
          current = token.text;
        } else {
          current = candidate;
        }
      }
      if (current.trim()) lines.push(current.trim());
      if (lines.length <= safeMaxLines) return lines;
      const head = lines.slice(0, safeMaxLines - 1);
      const tail = lines.slice(safeMaxLines - 1).join(' ');
      return [...head, tail.trim()].filter(Boolean);
    };
    const computeNodeDims = (label: string, depth: number) => {
      const fontPx = NODE_TEXT.fontPx;
      const maxLines = depth <= 1 ? 3 : 2;
      const maxR = Math.min(width, height) * 0.12;
      const maxRy = maxR;
      const maxRx = maxR * 1.6;
      const maxLineWidthPx = Math.max(40, (maxRx - NODE_TEXT.hPadPx) * 2);
      const tokens = tokenize(label);
      const lines = wrapTokens(tokens, maxLineWidthPx, fontPx, maxLines);
      const lineWidths = lines.map((l) => measureTextWidth(l, fontPx));
      const widest = Math.max(0, ...lineWidths);
      const rx = Math.min(maxRx, Math.max(NODE_TEXT.minRxPx, widest / 2 + NODE_TEXT.hPadPx));
      const lineHeightPx = fontPx * NODE_TEXT.lineHeightEm;
      const ry = Math.min(maxRy, Math.max(NODE_TEXT.minRyPx, (Math.max(1, lines.length) * lineHeightPx) / 2 + NODE_TEXT.vPadPx));
      return { rx, ry, fontPx, lines };
    };

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
        // Update zoom level for indicator
        setZoomLevel(event.transform.k);
        setShowZoomIndicator(true);
        // F19: hide zoom indicator after a delay — track on component-scoped ref
        // so a remount/unmount properly clears the pending timer.
        if (zoomHideTimerRef.current) clearTimeout(zoomHideTimerRef.current);
        zoomHideTimerRef.current = setTimeout(() => {
          setShowZoomIndicator(false);
        }, 1000);
      });

    // Store zoom reference for programmatic control
    zoomRef.current = zoom;
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

    const linkGenerator = d3
      .linkHorizontal<{ source: [number, number]; target: [number, number] }, [number, number]>()
      .x((d) => d[0])
      .y((d) => d[1]);

    g.append('g')
      .attr('fill', 'none')
      .attr('stroke', 'var(--mm-link, var(--rule-soft, rgba(10,10,10,0.22)))')
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
        `translate(${d.cartX ?? width / 2}, ${d.cartY ?? height / 2})`
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

    // === A2: depth-aware ellipse nodes with wrapped labels ===
    const dimsByNode = new Map<string, { rx: number; ry: number; fontPx: number; lines: string[] }>();
    nodes.forEach((n) => {
      dimsByNode.set(n.data.id, computeNodeDims(n.data.name, n.depth ?? 0));
    });

    nodeGroup
      .append('ellipse')
      .attr('rx', (d) => dimsByNode.get(d.data.id)?.rx ?? 38)
      .attr('ry', (d) => dimsByNode.get(d.data.id)?.ry ?? 22)
      .attr('fill', (d) =>
        highlightSet.has(d.data.id)
          ? 'var(--mm-highlight-fill, #fdf6e9)'
          : `var(--mm-node-fill-${Math.min(4, d.depth ?? 0)}, var(--mm-node-fill, var(--plate-bg, #fbf8f1)))`
      )
      .attr('stroke', (d) =>
        highlightSet.has(d.data.id)
          ? 'var(--mm-highlight, var(--terracotta, #c2674a))'
          : 'var(--mm-node-stroke, var(--ink, #0a0a0a))'
      )
      .attr('stroke-width', (d) => (highlightSet.has(d.data.id) ? 2.5 : 1.25));

    // Wrapped multi-line labels (one tspan per wrapped line, vertically centered)
    nodeGroup.each(function (d) {
      const dims = dimsByNode.get(d.data.id);
      if (!dims) return;
      const text = d3.select(this).append('text')
        .attr('x', 0)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', `${dims.fontPx}px`)
        .style('font-family', 'var(--font-display, var(--font-body))')
        .style('font-weight', '500')
        .style('pointer-events', 'none')
        .attr('fill', 'var(--mm-text, var(--ink, #0a0a0a))');
      const lines = dims.lines.length ? dims.lines : [d.data.name];
      const startDy = -((lines.length - 1) * NODE_TEXT.lineHeightEm) / 2;
      lines.forEach((line, i) => {
        text.append('tspan')
          .attr('x', 0)
          .attr('dy', `${i === 0 ? startDy : NODE_TEXT.lineHeightEm}em`)
          .text(line);
      });
    });

    // === A7: cap highlight pulse to 3 cycles instead of indefinite ===
    if (!reducedMotion && highlightSet.size > 0) {
      nodeGroup
        .filter((d) => highlightSet.has(d.data.id))
        .append('animate')
        .attr('attributeName', 'opacity')
        .attr('values', '1;0.55;1')
        .attr('dur', '1.4s')
        .attr('repeatCount', '3');
    }

    // === A1: fit the rendered tree into the viewport with breathing room ===
    if (nodes.length > 0 && zoomRef.current) {
      const xs = nodes.map((n) => n.cartX ?? 0);
      const ys = nodes.map((n) => n.cartY ?? 0);
      // Inflate bounds by the largest node's rx/ry so labels aren't clipped
      const maxRx = Math.max(...nodes.map((n) => dimsByNode.get(n.data.id)?.rx ?? 38));
      const maxRy = Math.max(...nodes.map((n) => dimsByNode.get(n.data.id)?.ry ?? 22));
      const minX = Math.min(...xs) - maxRx;
      const maxX = Math.max(...xs) + maxRx;
      const minY = Math.min(...ys) - maxRy;
      const maxY = Math.max(...ys) + maxRy;
      const bbW = Math.max(1, maxX - minX);
      const bbH = Math.max(1, maxY - minY);
      const padding = 24;
      const scale = Math.min(
        (width - padding * 2) / bbW,
        (height - padding * 2) / bbH,
        1.2
      );
      const tx = (width - (minX + bbW / 2) * scale * 2) / 2;
      const ty = (height - (minY + bbH / 2) * scale * 2) / 2;
      const transform = d3.zoomIdentity
        .translate(width / 2 - ((minX + maxX) / 2) * scale, height / 2 - ((minY + maxY) / 2) * scale)
        .scale(scale);
      // Suppress the throbbing zoom-indicator overlay during the initial fit
      const prevSetShowZoomIndicator = setShowZoomIndicator;
      d3.select(svg).call(zoomRef.current.transform, transform);
      // F19: hide the zoom indicator immediately after auto-fit — track the
      // timer on a component-scoped ref so unmount clears it.
      if (autoFitTimerRef.current) clearTimeout(autoFitTimerRef.current);
      autoFitTimerRef.current = setTimeout(() => prevSetShowZoomIndicator(false), 0);
      // Discard unused locals (keeps the linter happy)
      void tx; void ty;
    }

    // F19: cleanup pending timers when this effect re-runs or the component unmounts.
    return () => {
      if (zoomHideTimerRef.current) {
        clearTimeout(zoomHideTimerRef.current);
        zoomHideTimerRef.current = undefined;
      }
      if (autoFitTimerRef.current) {
        clearTimeout(autoFitTimerRef.current);
        autoFitTimerRef.current = undefined;
      }
    };
  }, [visibleTree, theme, manifest.title, highlightSet, reducedMotion, activeTab, resizeTick]);

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
    <div className={clsx('mindmap-app', theme)}>
      <div className="mindmap-controls" aria-live="polite">
        <div className="control-row">
          {/* Horizontally scrollable tabs wrapper for mobile */}
          <div className="tabs-wrapper" ref={tabsWrapperRef}>
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
          </div>

          {/* Desktop actions — A4: grouped into Always-visible + View popover + Export popover */}
          <div className="actions">
            {/* Always visible: theme, help */}
            <button type="button" onClick={toggleTheme} aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
              {theme === 'light' ? 'Light' : 'Dark'}
            </button>

            {/* View popover */}
            <details className="actions-popover">
              <summary aria-label="View options">View ▾</summary>
              <div className="actions-popover__menu">
                <button type="button" onClick={collapseAll}>Collapse all</button>
                <button type="button" onClick={expandAll}>Expand all</button>
              </div>
            </details>

            {/* Export popover */}
            <details className="actions-popover">
              <summary aria-label="Export options">Export ▾</summary>
              <div className="actions-popover__menu">
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
                        // F17: swallow rejections so unhandled promise errors don't bubble up.
                        importState(file).catch((err) => {
                          console.warn('Import state failed', err);
                          if (typeof window !== 'undefined') {
                            window.alert('Could not import state: the file could not be read.');
                          }
                        });
                        event.target.value = '';
                      }
                    }}
                  />
                </label>
              </div>
            </details>

            <button type="button" onClick={() => setShowHelp(true)} aria-label="Open help">
              ?
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className={clsx('mobile-menu-toggle', mobileMenuOpen && 'open')}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="hamburger-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
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
            aria-describedby="mindmap-search-status"
          />
          <button type="button" onClick={() => setSearchQuery('')}>
            Clear
          </button>
        </div>
        {/* A7: live region announces match count to screen readers */}
        <p id="mindmap-search-status" className="sr-only" role="status" aria-live="polite">
          {searchQuery
            ? `${searchResults.length} ${searchResults.length === 1 ? 'match' : 'matches'} for "${searchQuery}"`
            : ''}
        </p>
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

      {/* Mobile slide-out menu */}
      <div
        className={clsx('mobile-actions-menu', mobileMenuOpen && 'open')}
        onClick={handleMobileMenuBackdropClick}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="mobile-actions-content">
          <button
            type="button"
            className="mobile-menu-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            Close
          </button>

          <h3>View</h3>
          <button type="button" onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}>
            <span>{theme === 'light' ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <h3>Navigation</h3>
          <button type="button" onClick={() => { collapseAll(); setMobileMenuOpen(false); }}>
            <span>Collapse all</span>
          </button>
          <button type="button" onClick={() => { expandAll(); setMobileMenuOpen(false); }}>
            <span>Expand all</span>
          </button>
          <h3>Export</h3>
          <button type="button" onClick={() => { svgRef.current && exportSvgAsImage(svgRef.current, 'png'); setMobileMenuOpen(false); }}>
            <span>Export as PNG</span>
          </button>
          <button type="button" onClick={() => { svgRef.current && exportSvgAsImage(svgRef.current, 'pdf'); setMobileMenuOpen(false); }}>
            <span>Export as PDF</span>
          </button>
          <button type="button" onClick={() => { exportState(); setMobileMenuOpen(false); }}>
            <span>Export state</span>
          </button>
          <label>
            <span>Import state</span>
            <input
              type="file"
              accept="application/json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  // F17: swallow rejections so unhandled promise errors don't bubble up.
                  importState(file).catch((err) => {
                    console.warn('Import state failed', err);
                    if (typeof window !== 'undefined') {
                      window.alert('Could not import state: the file could not be read.');
                    }
                  });
                  event.target.value = '';
                  setMobileMenuOpen(false);
                }
              }}
            />
          </label>

          <h3>Help</h3>
          <button type="button" onClick={() => { setShowHelp(true); setMobileMenuOpen(false); }}>
            <span>Keyboard shortcuts &amp; help</span>
          </button>
        </div>
      </div>

      <div className="mindmap-layout">
        <div className="canvas-panel" aria-live="polite">
          <div ref={containerRef} className="mindmap-canvas" role="region" aria-label={`${manifest.title} visualization`}>
            <svg ref={svgRef} />

            {/* Zoom indicator (mobile) */}
            <div className={clsx('zoom-indicator', showZoomIndicator && 'visible')} aria-hidden="true">
              {Math.round(zoomLevel * 100)}%
            </div>

            {/* Gesture hint (mobile) */}
            <div className={clsx('gesture-hint', gestureHint && 'visible')} aria-hidden="true">
              {gestureHint}
            </div>
          </div>

          {selectedBreadcrumb.path.length > 0 && (
            <nav className="breadcrumbs" aria-label="Selected node breadcrumb">
              <div className="breadcrumb-items">
                {selectedBreadcrumb.path.map((segment, index) => (
                  <span key={`${segment}-${index}`} className="breadcrumb-segment">
                    {index < selectedBreadcrumb.path.length - 1 ? (
                      <button
                        type="button"
                        className="breadcrumb-link"
                        onClick={() => navigateToBreadcrumbNode(index)}
                        title={`Navigate to ${segment}`}
                      >
                        {segment}
                      </button>
                    ) : (
                      <span className="breadcrumb-current">{segment}</span>
                    )}
                    {index < selectedBreadcrumb.path.length - 1 && (
                      <span className="breadcrumb-separator" aria-hidden="true"> › </span>
                    )}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className={clsx('breadcrumb-copy', copiedLink && 'copied')}
                onClick={copyNodeLink}
                title="Copy link to this node"
                aria-label="Copy link to this node"
              >
                {copiedLink ? 'Copied' : 'Copy link'}
              </button>
            </nav>
          )}
          {/* A6: Mobile linear outline fallback — D3 graph is hard to use on touch
               so we render a native nested <details> outline below the canvas. */}
          {isMobile && tabs[activeTab] && (
            <section className="mindmap-outline" aria-label={`${manifest.title} outline view`}>
              <h3>Outline</h3>
              <p className="mindmap-outline__hint">
                Linear view of the active tab. Tap a row to expand its children.
              </p>
              {(function renderOutlineTree(node: RenderableNode, depth = 0): React.ReactNode {
                const children = node.children ?? [];
                const hasChildren = children.length > 0;
                const html = sanitizedTooltips.get(node.id);
                const isHighlighted = highlightSet.has(node.id);
                if (!hasChildren) {
                  return (
                    <div key={node.id} className={clsx('mindmap-outline__leaf', isHighlighted && 'highlighted')} style={{ paddingLeft: depth * 12 }}>
                      <button type="button" onClick={() => setSelectedNodeId(node.id)}>{node.name}</button>
                      {html && <div className="mindmap-outline__detail" dangerouslySetInnerHTML={{ __html: html }} />}
                    </div>
                  );
                }
                return (
                  <details key={node.id} className={clsx('mindmap-outline__node', isHighlighted && 'highlighted')} style={{ paddingLeft: depth * 12 }} open={depth < 1}>
                    <summary>
                      <button type="button" onClick={(e) => { e.preventDefault(); setSelectedNodeId(node.id); }}>{node.name}</button>
                      <span className="mindmap-outline__count">{children.length}</span>
                    </summary>
                    {html && <div className="mindmap-outline__detail" dangerouslySetInnerHTML={{ __html: html }} />}
                    {children.map((child) => renderOutlineTree(child, depth + 1))}
                  </details>
                );
              })(tabs[activeTab])}
            </section>
          )}
        </div>
        <aside
          ref={detailPanelRef}
          className={clsx('detail-panel', detailPanelExpanded && 'expanded')}
          aria-live="polite"
          onTouchStart={handleSheetTouchStart}
          onTouchMove={handleSheetTouchMove}
          onTouchEnd={handleSheetTouchEnd}
        >
          {/* Bottom sheet drag handle (mobile only) */}
          <div
            className="sheet-handle"
            onClick={toggleDetailPanel}
            role="button"
            aria-label={detailPanelExpanded ? 'Collapse details' : 'Expand details'}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && toggleDetailPanel()}
          />

          <h2 onClick={toggleDetailPanel} style={{ cursor: isMobile ? 'pointer' : 'default' }}>
            Details {isMobile && (detailPanelExpanded ? '▼' : '▲')}
          </h2>
          {selectedNodeId ? (
            <>
              <div className="tooltip-content" dangerouslySetInnerHTML={{ __html: selectedTooltipHtml }} />
            </>
          ) : (
            // A5: default Details pane shows topic intro instead of "Select a node..."
            <div className="details-intro">
              <p className="details-intro__lede">{manifest.title}</p>
              <p>
                Browse the {manifest.tabs.length} tab{manifest.tabs.length === 1 ? '' : 's'} above to explore diagnostic, classification, and treatment perspectives.
                Click any node to pin its details here.
              </p>
              <ul className="details-intro__hints">
                <li><strong>Search</strong> nodes and tooltips with the box above the canvas.</li>
                <li><strong>Collapse</strong> branches to focus, or <strong>Expand</strong> to see everything.</li>
                <li><strong>Export PNG / PDF / state</strong> from the Export menu for teaching or backup.</li>
              </ul>
              <p className="details-intro__small">
                {`${manifest.tabs.length} tabs · `}
                {(() => {
                  let count = 0;
                  const stack: RenderableNode[] = manifest.tabs.map((t) => tabs[t.id]).filter(Boolean);
                  while (stack.length) {
                    const node = stack.pop()!;
                    count += 1;
                    (node.children ?? []).forEach((c) => stack.push(c));
                  }
                  return `${count} nodes`;
                })()}
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Floating Action Button (mobile) - Quick access to detail panel */}
      <button
        type="button"
        className="mobile-fab"
        onClick={() => setDetailPanelExpanded((prev) => !prev)}
        aria-label={detailPanelExpanded ? 'Collapse details' : 'View details'}
      >
        {detailPanelExpanded ? 'Close' : 'Details'}
      </button>

      {showHelp && (
        <div className="help-overlay" role="dialog" aria-modal="true" aria-labelledby="mindmap-help-title">
          <div className="help-content">
            <h2 id="mindmap-help-title">Keyboard & feature guide</h2>
            <ul>
              <li>Use Tab to move between controls, Enter/Space to toggle nodes.</li>
              <li>Arrow Up/Down move focus between nearby nodes.</li>
              <li>Press ? at any time to open or close this help.</li>
              <li>Export your current state to share across devices.</li>
            </ul>

            <h2>Touch gestures (mobile)</h2>
            <ul>
              <li>
                <strong>Pinch</strong> to zoom in and out of the mind map.
              </li>
              <li>
                <strong>Drag</strong> with one finger to pan around the map.
              </li>
              <li>
                <strong>Tap</strong> on a node to select it and view details.
              </li>
              <li>
                <strong>Swipe</strong> the tabs to scroll through views.
              </li>
              <li>
                <strong>Drag</strong> the bottom panel handle to expand or collapse.
              </li>
              <li>
                Use the <strong>menu</strong> button for more options.
              </li>
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

export { AtlasView };
export default AtlasView;
