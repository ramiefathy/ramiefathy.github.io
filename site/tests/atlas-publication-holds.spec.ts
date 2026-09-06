import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { blockExternalRequests, watchRuntime } from './helpers/network.js';
const route = '/apps/rheum-derm-immune-atlas/#sources';

test.beforeEach(async ({ page }) => { await blockExternalRequests(page); });

for (const mobile of [false, true]) {
  test(`partial correction review preserves both holds (${mobile ? 'mobile' : 'desktop'})`, async ({ page }, info) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    const runtime = watchRuntime(page);
    await page.goto(route, { waitUntil: 'networkidle' });
    const workbench = page.locator('#atlas-source-review');
    await workbench.getByRole('combobox', { name: 'Atlas source record category' }).selectOption('PUBLICATION_HOLDS');
    await expect(workbench.locator('.review-records details')).toHaveCount(2);
    await workbench.getByRole('searchbox', { name: 'Search Atlas source records' }).fill('focuSSced');
    const record = workbench.locator('.review-records details');
    await expect(record).toHaveCount(1); await record.locator('summary').click();
    expect(await workbench.locator('.review-records').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
    await expect(page.locator('#sources')).not.toContainText('undefined');
    await expect(record).toContainText('NOTICE_CONTENT_EXAMINED');
    await expect(record).toContainText('METADATA_ONLY_NOT_RECONCILED');
    await expect(record).toContainText('0.1');
    await expect(record).toContainText('not the all-participant between-group treatment difference');
    await expect(record).toContainText('does not resolve other notices or release the trial');
    await expect(record.getByRole('link', { name: 'Indexed correction: PMID 33667402', exact: true })).toHaveAttribute('href', 'https://pubmed.ncbi.nlm.nih.gov/33667402/');
    await expect(record.getByRole('link', { name: 'Indexed correction: PMID 33007286', exact: true })).toBeVisible();
    await info.attach(`correction-hold-${mobile ? 'mobile' : 'desktop'}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    runtime.assertClean();
  });
}

test('filtered correction export retains unresolved status and distinguishes the examined notice', async ({ page }) => {
  await page.goto(route, { waitUntil: 'networkidle' });
  const workbench = page.locator('#atlas-source-review');
  await workbench.getByRole('combobox', { name: 'Atlas source record category' }).selectOption('PUBLICATION_HOLDS');
  await workbench.getByRole('searchbox', { name: 'Search Atlas source records' }).fill('focuSSced');
  const downloadPromise = page.waitForEvent('download');
  await workbench.getByRole('button', { name: 'Export filtered evidence (CSV)', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('atlas_source_review.csv');
  const file = await download.path(); expect(file).not.toBeNull();
  const text = await readFile(file!, 'utf8');
  for (const value of ['33007286', '33667402', 'NOTICE_CONTENT_EXAMINED', 'METADATA_ONLY_NOT_RECONCILED', 'PUBLICATION_CORRECTION_REVIEW_PENDING', 'clinically_validated']) expect(text).toContain(value);
  expect(text).not.toContain('AURORA 1');
  expect(text).not.toContain('SUPPORTED_WITHIN_ABSTRACT_SCOPE');
  const state = await page.evaluate(() => (0, eval)('({active:DATA.effects.length, quarantined:DATA.quarantinedEffects.length, accepted:DATA.scopedClaims.length, holds:DATA.publicationReviewHolds.map(h=>({id:h.id,status:h.disposition,validated:h.clinicallyValidated}))})'));
  expect(state.active).toBe(138); expect(state.quarantined).toBe(5); expect(state.holds).toHaveLength(2);
  expect(state.holds.every((h: any) => h.status === 'NOT_ADJUDICATED' && h.validated === false)).toBe(true);
});
