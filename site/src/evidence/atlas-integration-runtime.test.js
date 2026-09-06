import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { JSDOM } from 'jsdom';
import { describe, it, expect } from 'vitest';
const root = new URL('../../public/apps/rheum-derm-immune-atlas/', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');

// Run actual classic scripts with a lexical DATA binding. Only drawing and layout APIs
// are stubbed: this is a data/DOM integration check, not a browser visual acceptance test.
async function atlas() {
  const html = read('index.html');
  const dom = new JSDOM(html, { url: 'https://atlas.test/apps/rheum-derm-immune-atlas/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  w.requestAnimationFrame = () => 0;
  w.TextEncoder = TextEncoder;
  Object.defineProperty(w, 'crypto', { value: webcrypto });
  w.CSS = { escape: text => text };
  w.HTMLCanvasElement.prototype.getContext = () => new Proxy({
    measureText: text => ({ width: String(text).length * 6 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
  }, { get: (o, p) => o[p] || (() => {}), set: (o, p, v) => { o[p] = v; return true; } });
  w.HTMLElement.prototype.scrollIntoView = () => {};
  // JSDOM eval does not preserve separate eval lexical environments; run source
  // scripts in one common scope, as classic browser script bindings require.
  const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].map(m => {
    const src = m[1].match(/src="([^"?]+)/)?.[1];
    return src ? read(src) : m[2];
  });
  try {
    w.eval(scripts.join('\n;\n'));
    await w.__ATLAS_INIT_PROMISE__;
    w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
    for (let i = 0; i < 5; i++) await new Promise(r => setTimeout(r, 0));
    return { dom, w, data: w.__ATLAS_P0__.data };
  } catch (error) { dom.window.close(); throw error; }
}

async function usingAtlas(run) { const a = await atlas(); try { await run(a); } finally { a.dom.window.close(); } }

describe('Combined clinical quarantine, P0 and P1/P2 runtime contracts', () => {
  it('initializes the governance layer against the real lexical DATA object', async () => usingAtlas(({ w }) => {
    expect(w.document.documentElement.dataset.atlasP2Ready).toBe('true');
    expect(w.__ATLAS_P0__.validate()).toEqual({ ok: true, errors: [] });
    expect(w.__ATLAS_P1__.validate().errors).toEqual([]);
    expect(w.__ATLAS_P1__.relations.length).toBeGreaterThan(100);
  }));
  it('preserves every original efficacy record exactly once without steroid endotype cloning', async () => usingAtlas(({ data }) => {
    expect(data.effects).toHaveLength(138); expect(data.quarantinedEffects).toHaveLength(5);
    expect(new Set([...data.effects, ...data.quarantinedEffects].map(r => r.sourceRecordId)).size).toBe(143);
    const steroids = data.effects.filter(r => r.sourceRecordId === 'effect-072');
    expect(steroids).toHaveLength(1); expect(steroids[0].condition).toBe('aav');
    expect(data.effects.some(r => r.med === 'avacopan')).toBe(false);
  }));
  it('does not convert embedded-synthesis matches or editorial rules into clinical review', async () => usingAtlas(({ data }) => {
    expect(data.defaultManifestationLinks.length).toBeGreaterThan(0);
    expect(data.defaultManifestationLinks.every(r => r.curationStatus === 'unreviewed' && r.clinicallyValidated === false)).toBe(true);
    expect(data.defaultManifestationLinks.some(r => r.relationOrigin === 'editorial-hypothesis')).toBe(false);
    expect(data.exploratoryManifestationLinks.some(r => r.relationOrigin === 'editorial-hypothesis')).toBe(true);
    expect(data.sourceManifestationLinks).toHaveLength(239);
    expect(data.defaultManifestationLinks.length + data.exploratoryManifestationLinks.length + data.rejectedManifestationLinks.length).toBe(239);
  }));
  it('retains scalar scope, explicit zero and evidence uncertainty when projecting raw relations', async () => usingAtlas(({ w }) => {
    const row = w.__ATLAS_P1__.normalizeRelation({ id: 'test', endotypeScope: 'aav', tissueScope: 'kidney', contextConditionId: 'aav', baseState: 'explicit-zero', origin: 'direct', refs: ['R28'], curationStatus: 'reviewed' });
    expect(row.scope.conditionIds).toEqual(['aav']); expect(row.scope.endotypeIds).toEqual(['aav']); expect(row.scope.tissueIds).toEqual(['kidney']);
    expect(row.availability).toBe('explicit-zero'); expect(row.evidence.consensus).toBe('not-assessed'); expect(row.curation.status).toBe('unreviewed');
  }));
  it('filters condition scope and partitions the same eligible set used for export', async () => usingAtlas(({ w }) => {
    const select = w.document.querySelector('#networkCondition'); select.value = 'aav';
    const rows = w.__ATLAS_P2__.visibleSubset(), counts = w.__ATLAS_P2__.denominators();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(r => r.scope.conditionIds.includes('aav') && r.curation.status !== 'rejected')).toBe(true);
    expect(rows.some(r => r.defaultVisible === false)).toBe(false);
    expect(counts.visibleEligible).toBe(rows.length);
    expect(counts.visible + counts.filtered).toBe(counts.total);
    expect(counts.present + counts.explicitZero + counts.unknown + counts.unavailable).toBe(counts.total);
  }));
  it('does not select an arbitrary evidence record from a generic condition label', async () => usingAtlas(({ w }) => {
    w.document.querySelector('#nodeInfo').textContent = 'psa — Plaque psoriasis';
    w.__ATLAS_P2__.refresh();
    expect(w.document.querySelector('#networkProvenanceInspector').classList.contains('has-relation')).toBe(false);
  }));
  it('renders hostile evidence text as text rather than HTML', async () => usingAtlas(({ w, data }) => {
    const raw = data.defaultManifestationLinks[0];
    raw.sourceSpan = '<img src=x onerror="window.__attacked=1">'; raw.applicability = '<script>attack</script>';
    w.__ATLAS_P1__.rebuild(); w.__ATLAS_P2__.selectRelation(raw.id);
    expect(w.document.querySelector('#networkProvenanceSources img')).toBeNull();
    expect(w.document.querySelector('#networkProvenanceSources script')).toBeNull();
    expect(w.document.querySelector('#networkProvenanceSources').textContent).toContain('<img');
  }));
  it('reports unavailable or denied clipboard without false success or async event misuse', async () => usingAtlas(async ({ w }) => {
    const button = w.document.querySelector('#networkCopyViewLink');
    expect(await w.__ATLAS_P1__.copyText(button, 'synthetic', 'Copied')).toBe(false);
    expect(w.document.querySelector('#networkExportStatus').textContent).toContain('Nothing was copied');
    Object.defineProperty(w.navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } });
    expect(await w.__ATLAS_P1__.copyText(button, 'synthetic', 'Copied')).toBe(false);
    Object.defineProperty(w.navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } });
    expect(await w.__ATLAS_P1__.copyText(button, 'synthetic', 'Copied')).toBe(true);
  }));
  it('non-drag controls adjust camera state without fabricating pointer ownership', async () => usingAtlas(({ w }) => {
    const canvas = w.document.querySelector('#network3d');
    canvas.setPointerCapture = () => { throw new Error('Synthetic pointer must not be used'); };
    const result = w.atlasAdjustView('pan-right');
    expect(result.after.panX - result.before.panX).toBe(42);
    const zoom = w.atlasAdjustView('zoom-in'); expect(zoom.after.zoom).toBeGreaterThan(zoom.before.zoom);
    expect(() => w.atlasAdjustView('invalid')).toThrow('Unknown graph camera control');
    w.document.querySelector('[data-p2-control="rotate-left"]').click();
    expect(w.document.querySelector('#networkSelectionStatus').textContent).toContain('rotate left');
  }));
  it('records only scoped primary findings and preserves the historical source workbench denominator', async () => usingAtlas(({ data, w }) => {
    expect(data.scopedClaims).toHaveLength(17);
    expect(data.scopedClaims.every(r => r.humanApproved === false && r.clinicallyValidated === false && r.automaticGraphPromotion === false && r.quote.split(/\s+/).length <= 25)).toBe(true);
    const igav = data.scopedClaims.find(r => r.id === 'vasculitis-v05'); expect(igav.limitations).toContain('no renal involvement');
    const select = w.document.querySelector('[aria-label="Atlas source record category"]'); select.value = 'DERIVED'; select.dispatchEvent(new w.Event('change'));
    expect(w.document.querySelectorAll('.review-records details')).toHaveLength(239);
  }));
});
