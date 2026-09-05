import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const source = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8');
function harness() {
  const events: Record<string, (event: any) => void> = {};
  const cache = { addAll: vi.fn(async () => {}), put: vi.fn(async () => {}), match: vi.fn(async (): Promise<any> => undefined) };
  const caches = { open: vi.fn(async () => cache), keys: vi.fn(async () => ['rf-site-static-v1', 'rf-site-static-v2', 'another-app-cache']), delete: vi.fn(async () => true) };
  const fetch = vi.fn(async (): Promise<any> => ({ ok: true, type: 'basic', redirected: false, headers: new Headers(), clone() { return this; } }));
  const self = { location: { origin: 'https://reference.test' }, addEventListener: (type: string, handler: any) => { events[type] = handler; }, skipWaiting: vi.fn(async () => {}), clients: { claim: vi.fn(async () => {}) } };
  vm.runInNewContext(source, { self, caches, fetch, URL, Response });
  return { events, cache, caches, fetch, self };
}
const request = (path: string, headers = {}, method = 'GET') => new Request(`https://reference.test${path}`, { headers, method });
function dispatch(h: ReturnType<typeof harness>, req: Request) {
  const respondWith = vi.fn(); h.events.fetch({ request: req, respondWith });
  return respondWith;
}

describe('site service worker clinical-data boundary', () => {
  it.each(['/apps/biologic-monitoring-dashboard/data.js', '/apps/dermatology-scribe/index.html', '/research/dermoscopy-llm-dashboard', '/data/dermoscopy-llm-eval.json', '/?token=synthetic'])('does not intercept or cache %s', (path) => {
    const h = harness(); expect(dispatch(h, request(path))).not.toHaveBeenCalled(); expect(h.fetch).not.toHaveBeenCalled();
  });
  it('does not handle authenticated, cross-origin, or non-GET requests', () => {
    const h = harness();
    for (const req of [request('/', { Authorization: 'Bearer synthetic' }), request('/', {}, 'POST'), new Request('https://reference.test.evil.example/')]) {
      expect(dispatch(h, req)).not.toHaveBeenCalled();
    }
  });
  it('uses fresh shell responses and waits for the bounded cache write', async () => {
    const h = harness(); const result = await dispatch(h, request('/')).mock.calls[0][0];
    expect(result.ok).toBe(true); expect(h.fetch).toHaveBeenCalledOnce(); expect(h.cache.put).toHaveBeenCalledOnce(); expect(h.cache.match).not.toHaveBeenCalled();
  });
  it.each(['error', 'redirect', 'private', 'no-store'])('does not cache %s responses', async (kind) => {
    const h = harness(); h.fetch.mockResolvedValue({ ok: kind !== 'error', type: 'basic', redirected: kind === 'redirect', headers: new Headers({ 'cache-control': kind }), clone: vi.fn() });
    await dispatch(h, request('/')).mock.calls[0][0]; expect(h.cache.put).not.toHaveBeenCalled();
  });
  it('preserves unrelated app caches during upgrade', async () => {
    const h = harness(); const waitUntil = vi.fn(); h.events.activate({ waitUntil }); await waitUntil.mock.calls[0][0];
    expect(h.caches.delete.mock.calls).toEqual([['rf-site-static-v1']]); expect(h.self.clients.claim).toHaveBeenCalledOnce();
  });
  it('replaces the old worker even if optional precaching fails', async () => {
    const h = harness(); h.cache.addAll.mockRejectedValue(new Error('denied')); const waitUntil = vi.fn();
    h.events.install({ waitUntil }); await waitUntil.mock.calls[0][0]; expect(h.self.skipWaiting).toHaveBeenCalledOnce();
  });
  it('returns only its own cached shell while offline', async () => {
    const h = harness(); h.fetch.mockRejectedValue(new Error('offline')); const cached = new Response('cached public shell'); h.cache.match.mockResolvedValue(cached);
    expect(await dispatch(h, request('/')).mock.calls[0][0]).toBe(cached); expect(h.caches.open).toHaveBeenCalledWith('rf-site-static-v2');
  });
  it('gives an explicit offline error when both network and cache are unavailable', async () => {
    const h = harness(); h.fetch.mockRejectedValue(new Error('offline')); h.caches.open.mockRejectedValue(new Error('denied'));
    const result = await dispatch(h, request('/')).mock.calls[0][0]; expect(result.status).toBe(503);
  });
});
