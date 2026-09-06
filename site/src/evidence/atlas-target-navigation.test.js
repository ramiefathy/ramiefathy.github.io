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
