import { expect, test } from '@playwright/test';
import { blockExternalRequests, watchRuntime } from './helpers/network.js';

test.beforeEach(async ({ page }) => { await blockExternalRequests(page); });

test('quarantine changes visible denominators without creating zero-effect evidence', async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.goto('/apps/rheum-derm-immune-atlas/', { waitUntil: 'networkidle' });
  await expect.poll(() => page.evaluate(() => Boolean((window as any).__ATLAS_V5__?.validation.ok))).toBe(true);
  const actual = await page.evaluate(() => (0, eval)(`(() => {
    const key = r => (r.condition === 'aav' ? 'vasculitis' : r.condition) + ':' + r.med;
    const held = new Set(DATA.quarantinedEffects.map(key));
    const counts = threshold => volumeData(threshold).reduce((out, row) => {
      out[row.state] = (out[row.state] || 0) + 1; return out;
    }, {});
    return {
      active: DATA.effects.length,
      original: DATA.sourceReview.originalEffectCount,
      archivedPairs: [...held].sort(),
      leakedEffects: DATA.effects.filter(row => held.has(key(row))).length,
      leakedRelations: DATA.relations.filter(row => row.sourceType === 'condition' &&
        row.targetType === 'medication' && held.has((row.sourceId === 'aav' ? 'vasculitis' : row.sourceId) + ':' + row.targetId)).length,
      B: counts('B'), D: counts('D'),
      remainingZeroCoordinates: volumeData('D').filter(row => row.state === 'explicit-zero')
        .map(row => row.cid + ':' + row.tid + ':' + row.pid).sort()
    };
  })()`));
  expect(actual).toEqual({
    active: 138, original: 143,
    archivedPairs: ['schnitzler:anakinra', 'schnitzler:hcq', 'schnitzler:rilon', 'schnitzler:tnfi_ada', 'vasculitis:avacopan'],
    leakedEffects: 0, leakedRelations: 0,
    B: { unknown: 27660, derived: 57, filtered: 66 },
    D: { unknown: 27659, derived: 123, 'explicit-zero': 1 },
    remainingZeroCoordinates: ['caps:tnfi_ada:pathway:neutrophil']
  });
  runtime.assertClean();
});

test('opening long source evidence keeps the gene visible on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/apps/dermatotarget-atlas/#/evidence', { waitUntil: 'networkidle' });
  await page.getByLabel('Search source cross-check', { exact: true }).fill('PDE4C');
  await page.locator('.evidence-results summary').first().click();
  const layout = await page.locator('.evidence-results .tbl-wrap').evaluate(wrap => {
    const gene = wrap.querySelector('tbody td')!.getBoundingClientRect();
    const box = wrap.getBoundingClientRect();
    return { scrollLeft: wrap.scrollLeft, geneLeft: gene.left, left: box.left, right: box.right, viewport: innerWidth };
  });
  expect(layout.scrollLeft).toBe(0);
  expect(layout.geneLeft).toBeGreaterThanOrEqual(layout.left);
  expect(layout.right).toBeLessThanOrEqual(layout.viewport);
  const exportButton = page.getByRole('button', { name: 'Export filtered source records' });
  expect((await exportButton.boundingBox())!.height).toBeGreaterThanOrEqual(44);
});
