import { expect, test } from '@playwright/test';
import { blockExternalRequests, watchRuntime } from './helpers/network.js';
const route = '/apps/biologic-monitoring-dashboard/index.html';
const cards = '#results article.entry-card';

test.describe('Clinical reference safety regressions', () => {
  test.beforeEach(async ({ page }) => { await blockExternalRequests(page); });
  test('original dataset date, review limits and temporary-record warning stay visible', async ({ page }, info) => {
    const runtime = watchRuntime(page);
    await page.goto(route, { waitUntil: 'networkidle' });
    await expect(page.locator(cards)).toHaveCount(23);
    await expect(page.locator('#clinical-safety-notice')).toBeVisible();
    await expect(page.locator('#clinical-safety-notice')).toContainText('not');
    await expect(page.locator('.entry-review').first()).toContainText('not a complete monograph validation');
    await info.attach('monitoring-desktop', { body: await page.screenshot({ fullPage: false }), contentType: 'image/png' });
    runtime.assertClean();
  });
  test('legacy and new checklist marks cannot silently carry across page reloads', async ({ page }) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.setItem('biologic-dashboard:checklist', JSON.stringify({ 'tnf-inhibitors': { baseline: { cbc: true } } } })));
    await page.reload({ waitUntil: 'networkidle' });
    expect(await page.evaluate(() => localStorage.getItem('biologic-dashboard:checklist'))).toBeNull();
    const first = page.locator(cards).first();
    await first.locator('[data-action=toggle-details]').click();
    const mark = first.locator('input[data-action=checklist]').first();
    await expect(mark).not.toBeChecked();
    await mark.check(); await expect(mark).toBeChecked();
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator(cards).first().locator('[data-action=toggle-details]').click();
    await expect(page.locator(cards).first().locator('input[data-action=checklist]').first()).not.toBeChecked();
  });
  test('explicit clear removes marks for the next encounter', async ({ page }) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    await page.locator(cards).first().locator('[data-action=toggle-details]').click();
    await page.locator('input[data-action=checklist]').first().check();
    await page.click('#clear-checklists');
    await expect(page.locator('input[data-action=checklist]:checked')).toHaveCount(0);
    await expect(page.locator('.toast').last()).toContainText('cleared');
  });
  for (const unavailable of [true, false]) {
    test(`clipboard ${unavailable ? 'unavailable' : 'permission denied'} never reports success`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' });
      await page.evaluate((missing) => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: missing ? undefined : { writeText: async () => { throw new Error('permission denied'); } } }), unavailable);
      await page.locator(cards).first().locator('[data-action=export-checklist]').click();
      await expect(page.locator('.toast[role=alert]')).toContainText('Nothing was copied');
      await expect(page.locator('.toast')).not.toContainText('Copied to clipboard');
    });
  }
  test('clipboard reference retains contraindications, sources, review date and temporary mark context', async ({ page }) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { (window as any).__copied = text; } } }));
    await page.fill('#search-input', 'abrocitinib');
    await expect(page.locator(cards)).toHaveCount(1);
    await page.locator('[data-action=export-checklist]').click();
    const output = await page.evaluate(() => (window as any).__copied);
    expect(output).toContain('id=16652'); expect(output).toContain('81 mg');
    expect(output).toContain('not a patient record'); expect(output).toContain('2025-09-23');
    expect(output).toContain('Contraindications'); expect(output).toContain('Hold / adjustment');
  });
  test('malformed clinical dataset fails closed before rendering or exporting any entries', async ({ page }) => {
    await page.route('**/biologic-monitoring-dashboard/data.js', (request) => request.fulfill({ status: 200, contentType: 'application/javascript', body: 'export const dataVersion="2025-09-23";export const safetyRevision="2026-09-04";export const monitoringEntries=[];' }));
    await page.goto(route, { waitUntil: 'networkidle' });
    await expect(page.locator('#results [role=alert]')).toContainText('could not be validated');
    await expect(page.locator(cards)).toHaveCount(0);
    await expect(page.locator('#export-csv')).toBeDisabled();
    await expect(page.locator('#search-input')).toBeDisabled();
  });
  test('blocked storage does not prevent reference rendering, search, or favorites', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage unavailable', 'SecurityError'); } }); });
    const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(route, { waitUntil: 'networkidle' });
    await expect(page.locator(cards)).toHaveCount(23);
    await page.locator('.favorite-btn').first().click();
    await expect(page.locator('.favorite-btn').first()).toHaveAttribute('aria-pressed', 'true');
    expect(errors).toEqual([]);
  });
  test('mobile touch without optional panels is safe and the warning fits the viewport', async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const runtime = watchRuntime(page);
    await page.goto(route, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      for (const type of ['touchstart', 'touchend']) {
        const event = new Event(type, { bubbles: true });
        Object.defineProperty(event, 'changedTouches', { value: [{ screenX: type === 'touchstart' ? 10 : 150 }] });
        document.dispatchEvent(event);
      }
    });
    const notice = page.locator('#clinical-safety-notice'); await expect(notice).toBeVisible();
    const box = await notice.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(391);
    await info.attach('monitoring-mobile', { body: await page.screenshot({ fullPage: false }), contentType: 'image/png' });
    runtime.assertClean();
  });
  test('table view retains full safety context instead of truncating to cautions', async ({ page }) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    await page.fill('#search-input', 'abrocitinib'); await expect(page.locator(cards)).toHaveCount(1);
    await page.click('#view-toggle');
    await page.getByText('Full safety context and sources', { exact: true }).click();
    await expect(page.locator('.table-safety')).toContainText('id=16652');
    await expect(page.locator('.table-safety')).toContainText('81 mg');
  });
});

test('shared shell does not fabricate save success and traps/restores help focus', async ({ page }) => {
  await blockExternalRequests(page); await page.goto(route, { waitUntil: 'networkidle' });
  await expect(page.locator('.legacy-shell [data-chip=saved]')).toHaveText('Ready');
  await expect(page.locator('.legacy-shell [data-chip=time]')).toHaveText('No save confirmed');
  const help = page.locator('.legacy-shell [data-action=help]'); await help.click();
  const close = page.locator('.legacy-shell [data-action=close-help]'); await expect(close).toBeFocused();
  await page.keyboard.press('Tab'); await expect(close).toBeFocused();
  await page.keyboard.press('Escape'); await expect(help).toBeFocused();
  await expect(page.locator('.legacy-shell [data-action=reset]')).toHaveAttribute('aria-label', /without deleting/);
});

test('scribe rejects provisional output after a provider failure or incomplete completion', async ({ page }) => {
  await blockExternalRequests(page); await page.goto('/apps/dermatology-scribe/index.html', { waitUntil: 'networkidle' });
  await page.click('#startTranscriptionModeCard');
  await page.evaluate(() => {
    (window as any).handleWebSocketMessage({ type: 'note_updated', draftNote: 'Previously completed note' });
    (window as any).handleWebSocketMessage({ type: 'stream_chunk', streamType: 'note', text: 'UNFINISHED DRAFT' });
  });
  await expect(page.locator('#soapNoteOutput')).toContainText('Provisional');
  await page.evaluate(() => (window as any).handleWebSocketMessage({ type: 'error', area: 'stream', message: 'Generation failed' }));
  await expect(page.locator('#soapNoteOutput')).toContainText('Previously completed note');
  await expect(page.locator('#soapNoteOutput')).not.toContainText('UNFINISHED DRAFT');
  await page.evaluate(() => {
    (window as any).handleWebSocketMessage({ type: 'stream_chunk', streamType: 'note', text: 'ANOTHER PARTIAL' });
    (window as any).handleWebSocketMessage({ type: 'stream_complete', streamType: 'note' });
  });
  await expect(page.locator('#soapNoteOutput')).toContainText('Previously completed note');
  await expect(page.locator('#soapNoteOutput')).not.toContainText('ANOTHER PARTIAL');
});


test('research dashboard distinguishes repeated evaluations from independent images', async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto('/research/dermoscopy-llm-dashboard', { waitUntil: 'networkidle' });
  const notice = page.getByRole('complementary', { name: 'Evidence limitations' });
  await expect(notice).toContainText('100 unique images');
  await expect(notice).toContainText('10,200 repeated');
  await expect(notice).toContainText('withheld');
  await expect(page.locator('.llm-dashboard__ci-error')).toHaveCount(0);
});

test.describe('Research failure injection without service-worker interception', () => {
  // A worker-owned fetch bypasses page.route. Other suites keep workers enabled.
  test.use({ serviceWorkers: 'block' });
  test('research dashboard rejects corrupt image-level denominators instead of rendering metrics', async ({ page }) => {
    await blockExternalRequests(page);
    let intercepted = 0;
    await page.route('**/data/dermoscopy-llm-eval.json', async (request) => {
      intercepted += 1;
      await request.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ overallStats: { uniqueImages: 10200 }, cases: { count: 100 } }) });
    });
    await page.goto('/research/dermoscopy-llm-dashboard', { waitUntil: 'networkidle' });
    await expect.poll(() => intercepted).toBeGreaterThan(0);
    await expect(page.getByRole('alert')).toContainText('Unable to load dashboard data');
    await expect(page.getByRole('tablist', { name: 'Dashboard sections' })).toHaveCount(0);
  });
});

test('active site worker never serves cached clinical research data', async ({ page, context }) => {
  await blockExternalRequests(page);
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  // Simulate an old cache surviving deletion: fetch eligibility must still exclude it.
  await page.evaluate(async () => {
    const cache = await caches.open('rf-site-static-v1');
    await cache.put('/data/dermoscopy-llm-eval.json', new Response('STALE_CLINICAL_DATA'));
  });
  const responsePromise = page.waitForResponse((response) => new URL(response.url()).pathname === '/data/dermoscopy-llm-eval.json');
  const text = await page.evaluate(async () => (await fetch('/data/dermoscopy-llm-eval.json')).text());
  const response = await responsePromise;
  expect(response.fromServiceWorker()).toBe(false);
  expect(text).not.toContain('STALE_CLINICAL_DATA');
  await context.setOffline(true);
  const offline = await page.evaluate(async () => {
    try { return await (await fetch('/data/dermoscopy-llm-eval.json', { cache: 'no-store' })).text(); }
    catch { return 'NETWORK_REQUIRED'; }
  });
  expect(offline).toBe('NETWORK_REQUIRED');
});
