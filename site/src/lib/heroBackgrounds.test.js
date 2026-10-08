import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  HERO_BACKGROUNDS,
  HERO_BACKGROUND_IDS,
  noise3,
  readHeroOverride,
  resolveHeroBackground
} from './heroBackgrounds.js';

const REQUIRED_KEYS = ['id', 'name', 'hint', 'settleFrames', 'create'];

describe('hero background registry', () => {
  it('ships the eight approved variants and nothing else', () => {
    expect(HERO_BACKGROUND_IDS).toEqual(['flow', 'fluid', 'ripple', 'graph', 'boids', 'contour', 'ink', 'cells']);
    expect(HERO_BACKGROUNDS).toHaveLength(8);
  });

  it('never includes the rejected reaction-diffusion variant', () => {
    expect(HERO_BACKGROUND_IDS).not.toContain('turing');
  });

  it('has unique ids and a complete, well-typed definition for every variant', () => {
    expect(new Set(HERO_BACKGROUND_IDS).size).toBe(HERO_BACKGROUNDS.length);
    for (const variant of HERO_BACKGROUNDS) {
      for (const key of REQUIRED_KEYS) expect(variant, `${variant.id} is missing ${key}`).toHaveProperty(key);
      expect(typeof variant.id).toBe('string');
      expect(typeof variant.name).toBe('string');
      expect(typeof variant.hint).toBe('string');
      expect(variant.hint.length).toBeGreaterThan(0);
      expect(Number.isInteger(variant.settleFrames) && variant.settleFrames > 0).toBe(true);
      expect(typeof variant.create).toBe('function');
    }
  });
});

describe('resolveHeroBackground', () => {
  it('picks uniformly from the registry using the injected random source', () => {
    expect(resolveHeroBackground({ random: () => 0 }).id).toBe(HERO_BACKGROUND_IDS[0]);
    expect(resolveHeroBackground({ random: () => 0.999999 }).id).toBe(HERO_BACKGROUND_IDS.at(-1));
    expect(resolveHeroBackground({ random: () => 0.5 }).id).toBe(HERO_BACKGROUND_IDS[4]);
  });

  it('honours a valid override instead of the random source', () => {
    const random = vi.fn(() => 0);
    expect(resolveHeroBackground({ random, override: 'cells' }).id).toBe('cells');
    expect(random).not.toHaveBeenCalled();
  });

  it('falls back to a random pick when the override is unknown or the rejected variant', () => {
    expect(resolveHeroBackground({ random: () => 0, override: 'turing' }).id).toBe('flow');
    expect(resolveHeroBackground({ random: () => 0, override: 'nope' }).id).toBe('flow');
    expect(resolveHeroBackground({ random: () => 0, override: '' }).id).toBe('flow');
  });

  it('clamps a misbehaving random source into range', () => {
    expect(resolveHeroBackground({ random: () => 1 }).id).toBe(HERO_BACKGROUND_IDS.at(-1));
    expect(resolveHeroBackground({ random: () => -3 }).id).toBe(HERO_BACKGROUND_IDS[0]);
    expect(resolveHeroBackground({ random: () => Number.NaN }).id).toBe(HERO_BACKGROUND_IDS[0]);
  });
});

describe('readHeroOverride', () => {
  const storage = (value) => ({ getItem: (key) => (key === 'ff_heroVariant' ? value : null) });

  it('reads ?hero= from the query string first', () => {
    expect(readHeroOverride({ search: '?hero=fluid', storage: storage('cells') })).toBe('fluid');
  });

  it('falls back to the ff_heroVariant localStorage flag', () => {
    expect(readHeroOverride({ search: '', storage: storage('cells') })).toBe('cells');
  });

  it('returns null when nothing is set', () => {
    expect(readHeroOverride({ search: '', storage: storage(null) })).toBeNull();
    expect(readHeroOverride({ search: undefined, storage: undefined })).toBeNull();
  });

  it('survives a storage accessor that throws (private mode, blocked site data)', () => {
    const throwing = { getItem: () => { throw new Error('denied'); } };
    expect(readHeroOverride({ search: '', storage: throwing })).toBeNull();
  });
});

describe('variant factories', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('return null instead of throwing when no canvas context is available', () => {
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => null, setAttribute() {}, getBoundingClientRect: () => ({ width: 1, height: 1 }) }) });
    vi.stubGlobal('window', { devicePixelRatio: 1 });
    const pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, active: false, tap: false };
    for (const variant of HERO_BACKGROUNDS) {
      expect(variant.create(pointer), `${variant.id} should degrade to null`).toBeNull();
    }
  });
});

describe('noise3', () => {
  it('is deterministic and bounded to [0, 1]', () => {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < 2000; i += 1) {
      const x = (i * 0.37) % 13, y = (i * 0.91) % 7, z = (i * 0.11) % 5;
      const v = noise3(x, y, z);
      expect(v).toBe(noise3(x, y, z));
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    expect(min).toBeGreaterThanOrEqual(0);
    expect(max).toBeLessThanOrEqual(1);
    expect(max - min).toBeGreaterThan(0.3);
  });
});
