import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const script = readFileSync(new URL('../../public/apps/shared/legacy-shell.js', import.meta.url), 'utf8');
const openWindows: JSDOM[] = [];
afterEach(() => { for (const dom of openWindows.splice(0)) dom.window.close(); });
const setup = () => {
  const dom = new JSDOM('<!doctype html><title>Reference</title><body data-legacy-shell="true"><input></body>', { url: 'https://example.test/apps/reference/', runScripts: 'outside-only' });
  openWindows.push(dom);
  dom.window.eval(script);
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  return dom;
};
describe('shared shell truthful state and keyboard behavior', () => {
  it('does not claim any data was saved merely by loading or changing a filter', () => {
    const dom = setup(); const d = dom.window.document;
    expect(d.querySelector('[data-chip=saved]')?.textContent).toBe('Ready');
    expect(d.querySelector('[data-chip=time]')?.textContent).toBe('No save confirmed');
    d.querySelector('input')?.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    expect(d.querySelector('[data-chip=saved]')?.textContent).toBe('Ready');
    (dom.window as any).LegacyShell.setSaved(true);
    expect(d.querySelector('[data-chip=saved]')?.textContent).toBe('Saved');
  });
  it('describes reload honestly and contains no cross-app deletion path', () => {
    const dom = setup();
    expect(dom.window.document.querySelector('[data-action=reset]')?.getAttribute('aria-label')).toContain('without deleting');
    expect(script).not.toContain('localStorage.removeItem');
    expect(script).not.toContain('legacy-guidance-v1');
  });
  it('contains Tab focus and restores the help trigger for both exit paths', () => {
    const dom = setup(); const d = dom.window.document;
    const help = d.querySelector<HTMLButtonElement>('[data-action=help]')!;
    const close = d.querySelector<HTMLButtonElement>('[data-action=close-help]')!;
    help.click(); expect(d.activeElement).toBe(close);
    const tab = new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    close.dispatchEvent(tab); expect(tab.defaultPrevented).toBe(true); expect(d.activeElement).toBe(close);
    close.click(); expect(d.activeElement).toBe(help);
    help.click(); close.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(d.activeElement).toBe(help);
    expect(d.querySelector('#legacy-shell-help')?.getAttribute('aria-hidden')).toBe('true');
  });
});
