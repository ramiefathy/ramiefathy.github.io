import { expect, test } from '@playwright/test';
import { blockExternalRequests, watchRuntime } from './helpers/network.js';
const app = '/apps/rheum-derm-immune-atlas/';
test.beforeEach(async ({ page }) => { await blockExternalRequests(page); });

test('primary study claims disclose scope and never claim human clinical approval', async ({ page }, info) => {
  const runtime = watchRuntime(page);
  await page.goto(app + '#sources', { waitUntil: 'networkidle' });
  await page.getByLabel('Atlas source record category', { exact: true }).selectOption('SCOPED_CLAIMS');
  await expect(page.locator('.review-records > details')).toHaveCount(5);
  await page.getByLabel('Search Atlas source records', { exact: true }).fill('proteomic');
  await expect(page.locator('.review-records > details')).toHaveCount(1);
  await page.locator('.review-records summary').click();
  await expect(page.locator('.review-records')).toContainText('no renal involvement');
  await expect(page.locator('.review-records')).toContainText('AI_ASSISTED_SOURCE_ADJUDICATION');
  await info.attach('integrated-study-scope', { body: await page.screenshot(), contentType: 'image/png' });
  runtime.assertClean();
});

test('all non-drag camera controls work without synthetic pointer capture errors', async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.goto(app + '?task=explore3d&rep=free#network', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-atlas-p2-ready', 'true');
  for (const control of ['rotate-left','rotate-right','zoom-in','zoom-out','pan-left','pan-right','pan-up','pan-down']) {
    await page.locator(`[data-p2-control="${control}"]`).click();
    await expect(page.locator('#networkSelectionStatus')).toContainText(control.replace('-', ' '));
  }
  runtime.assertClean();
});

test('restored exploratory URLs keep quarantine and independent-review states intact', async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.goto(app + '?condition=aav&exploratory=1&canonical=1&evidence=D#network', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-atlas-p2-ready', 'true');
  const result = await page.evaluate(() => {
    const w = window as any, d = w.__ATLAS_P0__.data;
    return { effects: d.effects.length, archives: d.quarantinedEffects.length,
      avacopan: d.effects.filter((e: any) => e.med === 'avacopan').length,
      defaultsReviewed: d.defaultManifestationLinks.filter((e: any) => e.curationStatus === 'reviewed' || e.clinicallyValidated).length,
      defaultEditorial: d.defaultManifestationLinks.filter((e: any) => e.relationOrigin === 'editorial-hypothesis').length,
      exportedOutside: w.__ATLAS_P2__.visibleSubset().filter((e: any) => !e.scope.conditionIds.includes('aav')).length };
  });
  expect(result).toEqual({ effects: 138, archives: 5, avacopan: 0, defaultsReviewed: 0, defaultEditorial: 0, exportedOutside: 0 });
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-atlas-exploratory-mappings', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-atlas-canonical-background', 'true');
  runtime.assertClean();
});

test('mobile 2D governance preserves exact relation selection and visible export controls', async ({ page }, info) => {
  const runtime = watchRuntime(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(app + '?task=audit&rep=triptych#network', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-atlas-p2-ready', 'true');
  await expect(page.locator('#networkShareControls')).toBeVisible();
  const select = page.locator('#networkGovernedRelation');
  const value = await select.locator('option').nth(1).getAttribute('value');
  expect(value).toBeTruthy(); await select.selectOption(value!);
  await expect(page.locator('#networkProvenanceInspector')).toHaveClass(/has-relation/);
  await expect(page.locator('#networkProvenanceSources')).toContainText('support unassessed');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await select.scrollIntoViewIfNeeded();
  await info.attach('integrated-mobile-inspector', { body: await page.screenshot(), contentType: 'image/png' });
  runtime.assertClean();
});
