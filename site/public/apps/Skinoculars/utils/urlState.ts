/**
 * URL State Encoding Module
 *
 * Provides functions to encode and decode application state to/from URL parameters,
 * enabling shareable links that preserve the current view configuration.
 */

import { DiseaseId, ZoomLevelId, TimelineId, SkinLayerVisibility, LangCode } from '../types';

/**
 * Application state that can be encoded in URL
 */
export interface ShareableState {
  // View state
  diseaseId?: DiseaseId;
  zoomLevelId?: ZoomLevelId;
  timelineId?: TimelineId;
  timelineT?: number;

  // Layer visibility
  visibility?: SkinLayerVisibility;

  // View controls
  explodeValue?: number;
  clipping?: number;

  // Selected structure
  selectedStructure?: string;

  // Tour state
  tourId?: string;
  tourStep?: number;

  // UI state
  lang?: LangCode;

  // Camera position (for exact view sharing)
  camera?: {
    position: [number, number, number];
    target: [number, number, number];
  };
}

/**
 * Short keys for URL parameters (to keep URLs concise)
 */
const PARAM_KEYS = {
  diseaseId: 'd',
  zoomLevelId: 'z',
  timelineId: 'tl',
  timelineT: 'tt',
  explodeValue: 'e',
  clipping: 'c',
  selectedStructure: 's',
  tourId: 'tr',
  tourStep: 'ts',
  lang: 'l',
  camera: 'cam',
  // Visibility flags (packed into single param)
  visibility: 'v'
} as const;

/**
 * Encode visibility flags into a compact string
 * Format: "edhHSCNV" where each letter indicates a flag is ON
 * e=epidermis, d=dermis, h=hypodermis, H=hair, S=sweat, C=collagen, N=nerves, V=vessels
 */
function encodeVisibility(vis: SkinLayerVisibility): string {
  let flags = '';
  if (vis.epidermis) flags += 'e';
  if (vis.dermis) flags += 'd';
  if (vis.hypodermis) flags += 'h';
  if (vis.structures.hair) flags += 'H';
  if (vis.structures.sweat) flags += 'S';
  if (vis.structures.collagen) flags += 'C';
  if (vis.structures.nerves) flags += 'N';
  if (vis.structures.vessels) flags += 'V';
  return flags || 'none';
}

/**
 * Decode visibility flags from compact string
 */
function decodeVisibility(flags: string): SkinLayerVisibility | null {
  if (!flags || flags === 'none') {
    return {
      epidermis: false,
      dermis: false,
      hypodermis: false,
      structures: {
        hair: false,
        sweat: false,
        collagen: false,
        nerves: false,
        vessels: false
      }
    };
  }

  return {
    epidermis: flags.includes('e'),
    dermis: flags.includes('d'),
    hypodermis: flags.includes('h'),
    structures: {
      hair: flags.includes('H'),
      sweat: flags.includes('S'),
      collagen: flags.includes('C'),
      nerves: flags.includes('N'),
      vessels: flags.includes('V')
    }
  };
}

/**
 * Encode camera position to compact string
 */
function encodeCamera(camera: NonNullable<ShareableState['camera']>): string {
  const pos = camera.position.map(n => n.toFixed(2)).join(',');
  const tgt = camera.target.map(n => n.toFixed(2)).join(',');
  return `${pos}_${tgt}`;
}

/**
 * Decode camera position from compact string
 */
function decodeCamera(str: string): ShareableState['camera'] | null {
  try {
    const [posStr, tgtStr] = str.split('_');
    const position = posStr.split(',').map(Number) as [number, number, number];
    const target = tgtStr.split(',').map(Number) as [number, number, number];

    if (position.length !== 3 || target.length !== 3) return null;
    if (position.some(isNaN) || target.some(isNaN)) return null;

    return { position, target };
  } catch {
    return null;
  }
}

/**
 * Encode application state to URL search params
 */
export function encodeStateToURL(state: ShareableState): string {
  const params = new URLSearchParams();

  if (state.diseaseId && state.diseaseId !== 'normal') {
    params.set(PARAM_KEYS.diseaseId, state.diseaseId);
  }

  if (state.zoomLevelId && state.zoomLevelId !== 'macro') {
    params.set(PARAM_KEYS.zoomLevelId, state.zoomLevelId);
  }

  if (state.timelineId && state.timelineId !== 'none') {
    params.set(PARAM_KEYS.timelineId, state.timelineId);
  }

  if (state.timelineT !== undefined && state.timelineT !== 0) {
    params.set(PARAM_KEYS.timelineT, state.timelineT.toFixed(2));
  }

  if (state.explodeValue !== undefined && state.explodeValue !== 0) {
    params.set(PARAM_KEYS.explodeValue, state.explodeValue.toFixed(2));
  }

  if (state.clipping !== undefined && state.clipping !== null) {
    params.set(PARAM_KEYS.clipping, state.clipping.toFixed(2));
  }

  if (state.selectedStructure) {
    params.set(PARAM_KEYS.selectedStructure, state.selectedStructure);
  }

  if (state.tourId) {
    params.set(PARAM_KEYS.tourId, state.tourId);
    if (state.tourStep !== undefined && state.tourStep !== 0) {
      params.set(PARAM_KEYS.tourStep, state.tourStep.toString());
    }
  }

  if (state.lang && state.lang !== 'en') {
    params.set(PARAM_KEYS.lang, state.lang);
  }

  if (state.visibility) {
    const visFlags = encodeVisibility(state.visibility);
    // Only include if not all layers are visible (default state)
    const allVisible = visFlags === 'edhHSCNV';
    if (!allVisible) {
      params.set(PARAM_KEYS.visibility, visFlags);
    }
  }

  if (state.camera) {
    params.set(PARAM_KEYS.camera, encodeCamera(state.camera));
  }

  return params.toString();
}

/**
 * Decode URL search params to application state
 */
export function decodeStateFromURL(search: string): Partial<ShareableState> {
  const params = new URLSearchParams(search);
  const state: Partial<ShareableState> = {};

  const diseaseId = params.get(PARAM_KEYS.diseaseId);
  if (diseaseId) {
    state.diseaseId = diseaseId as DiseaseId;
  }

  const zoomLevelId = params.get(PARAM_KEYS.zoomLevelId);
  if (zoomLevelId) {
    state.zoomLevelId = zoomLevelId as ZoomLevelId;
  }

  const timelineId = params.get(PARAM_KEYS.timelineId);
  if (timelineId) {
    state.timelineId = timelineId as TimelineId;
  }

  const timelineT = params.get(PARAM_KEYS.timelineT);
  if (timelineT) {
    const parsed = parseFloat(timelineT);
    if (!isNaN(parsed)) state.timelineT = parsed;
  }

  const explodeValue = params.get(PARAM_KEYS.explodeValue);
  if (explodeValue) {
    const parsed = parseFloat(explodeValue);
    if (!isNaN(parsed)) state.explodeValue = parsed;
  }

  const clipping = params.get(PARAM_KEYS.clipping);
  if (clipping) {
    const parsed = parseFloat(clipping);
    if (!isNaN(parsed)) state.clipping = parsed;
  }

  const selectedStructure = params.get(PARAM_KEYS.selectedStructure);
  if (selectedStructure) {
    state.selectedStructure = selectedStructure;
  }

  const tourId = params.get(PARAM_KEYS.tourId);
  if (tourId) {
    state.tourId = tourId;
    const tourStep = params.get(PARAM_KEYS.tourStep);
    if (tourStep) {
      const parsed = parseInt(tourStep, 10);
      if (!isNaN(parsed)) state.tourStep = parsed;
    }
  }

  const lang = params.get(PARAM_KEYS.lang);
  if (lang) {
    state.lang = lang as LangCode;
  }

  const visibility = params.get(PARAM_KEYS.visibility);
  if (visibility) {
    state.visibility = decodeVisibility(visibility) || undefined;
  }

  const camera = params.get(PARAM_KEYS.camera);
  if (camera) {
    state.camera = decodeCamera(camera) || undefined;
  }

  return state;
}

/**
 * Generate a shareable URL with the current state
 */
export function generateShareURL(state: ShareableState, baseUrl?: string): string {
  const base = baseUrl || window.location.origin + window.location.pathname;
  const encoded = encodeStateToURL(state);
  return encoded ? `${base}?${encoded}` : base;
}

/**
 * Read state from current URL
 */
export function readStateFromCurrentURL(): Partial<ShareableState> {
  return decodeStateFromURL(window.location.search);
}

/**
 * Update browser URL without reloading (for history management)
 */
export function updateBrowserURL(state: ShareableState, replace: boolean = false): void {
  const url = generateShareURL(state);

  if (replace) {
    window.history.replaceState({ state }, '', url);
  } else {
    window.history.pushState({ state }, '', url);
  }
}

/**
 * Hook-ready state synchronization helpers
 */
export const URLStateManager = {
  /**
   * Initialize state from URL on app load
   */
  initialize(): Partial<ShareableState> {
    return readStateFromCurrentURL();
  },

  /**
   * Sync state to URL
   */
  sync(state: ShareableState, replace: boolean = true): void {
    updateBrowserURL(state, replace);
  },

  /**
   * Generate shareable link
   */
  getShareLink(state: ShareableState): string {
    return generateShareURL(state);
  },

  /**
   * Copy share link to clipboard
   */
  async copyShareLink(state: ShareableState): Promise<boolean> {
    const url = generateShareURL(state);
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        return true;
      } catch {
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
  }
};

/**
 * React hook for URL state synchronization
 * Usage: const { state, updateState, getShareLink } = useURLState(initialState);
 */
export function createURLStateHook() {
  return {
    getInitialState: URLStateManager.initialize,
    updateURL: URLStateManager.sync,
    getShareLink: URLStateManager.getShareLink,
    copyShareLink: URLStateManager.copyShareLink
  };
}
