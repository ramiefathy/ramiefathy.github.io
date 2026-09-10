import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, it, expect } from 'vitest';
import * as contract from '../../public/apps/dermatotarget-atlas/evidence-contract.js';
const root = new URL('../../public/apps/dermatotarget-atlas/', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8');
async function withApp(path, check) {
  const dom = new JSDOM(read('index.html'), { url: 'https://atlas.test/apps/dermatotarget-atlas/' + path, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window; w.scrollTo = () => {}; w.__contract = contract;
  w.fetch = async url => ({ ok: true, json: async () => JSON.parse(read(url)) });
  const source = read('app.js').replace(/^import \{([^}]+)\} from[^\n]+/, 'const {$1} = window.__contract;')
    .replace(/boot\(\);\s*$/, 'window.__boot = boot();');
  try { w.eval(source); await w.__boot; await check(w); } finally { w.close(); }
}

describe('Target explorer indication and keyboard contracts', () => {
  it.each([['atopic_dermatitis', 'PDE4D'], ['psoriasis', 'IL2RA'], ['cutaneous_lupus_erythematosus', 'TRAF3IP2']])('retains %s on %s ranked links and row clicks', async (disease, gene) => withApp('#/disease/' + disease, async w => {
    const link = [...w.document.querySelectorAll('table a.gene')].find(a => a.textContent.trim().startsWith(gene));
    expect(link?.getAttribute('href')).toBe(`#/target/${gene}?d=${disease}`);
    link.closest('tr').querySelector('td').click();
    expect(w.location.hash).toBe(`#/target/${gene}?d=${disease}`);
  }));
  it('does not intercept a native link modifier click with row navigation', async () => withApp('#/disease/psoriasis', w => {
    const link = w.document.querySelector('table a.gene');
    link.addEventListener('click', e => e.preventDefault()); // suppress JSDOM's unimplemented native navigation
    link.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
    expect(w.location.hash).toBe('#/disease/psoriasis');
  }));
  it('does not silently substitute an unrelated disease', async () => withApp('#/disease/not-in-source', w => {
    expect(w.document.querySelector('[role=alert]').textContent).toContain('Unknown disease context');
    expect(w.document.querySelectorAll('table').length).toBe(0);
  }));
  it('still supports the unqualified disease route', async () => withApp('#/disease', w => {
    expect(w.document.querySelector('[role=alert]')).toBeNull();
    expect(w.document.querySelector('h1').textContent).toBe('Alopecia areata');
  }));
  it('refuses an unknown disease on the evidence view with the same alert pattern as the other views', async () => withApp('#/evidence?d=not-in-source', w => {
    expect(w.document.querySelector('[role=alert]').textContent).toContain('Unknown disease context');
    expect(w.document.querySelectorAll('table').length).toBe(0);
  }));
  it('filters the evidence view by a recorded disease and leaves the identity column unsorted', async () => withApp('#/evidence?d=psoriasis', w => {
    expect(w.document.querySelector('[role=alert]')).toBeNull();
    expect(w.document.querySelector('[aria-label="Cross-check disease"]').value).toBe('psoriasis');
    const header = [...w.document.querySelectorAll('thead th')].find(th => th.textContent.includes('Identity / evidence'));
    expect(header.querySelector('button')).toBeNull();
    expect(w.document.querySelector('button[aria-label="Sort by Gene"]')).not.toBeNull();
  }));
  it('does not double-escape a gene name it renders as text', async () => withApp('#/target/A%26B', w => {
    const text = [...w.document.querySelectorAll('#view .callout')].map(n => n.textContent).find(t => t.includes('No scored pairs'));
    expect(text).toContain('No scored pairs for A&B.');
    expect(text).not.toContain('&amp;');
  }));
  it('describes other-indication candidates and the atlas as historical rather than validated', async () => {
    const source = read('app.js');
    expect(source).toContain('Include other indications (not exact indication-label matches; not counted for this disease)');
    expect(source).not.toContain('not evidence for this disease');
    expect(source).toContain('A historical, public-data prioritization atlas');
    expect(source).not.toContain('A reproducible, public-data prioritization atlas');
    expect(source).not.toContain('and validated candidates');
    expect(source).not.toContain('No scored pairs for ${esc(gene)}');
  });
  it('sorts with semantic buttons and preserves focus after header replacement', async () => withApp('#/disease/psoriasis', w => {
    const find = () => w.document.querySelector('button[aria-label="Sort by Composite"]');
    expect(find().parentElement.getAttribute('aria-sort')).toBe('descending');
    find().focus(); find().click();
    expect(find().parentElement.getAttribute('aria-sort')).toBe('ascending');
    expect(w.document.activeElement).toBe(find());
    const numbers = [...find().closest('table').querySelectorAll('tbody td:nth-child(4)')].map(n => Number(n.textContent));
    expect(numbers).toEqual([...numbers].sort((a,b) => a-b));
    find().click(); expect(find().parentElement.getAttribute('aria-sort')).toBe('descending');
  }));
});
