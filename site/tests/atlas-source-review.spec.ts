import { test, expect } from '@playwright/test';
import { blockExternalRequests, watchRuntime } from './helpers/network.js';
const target = '/apps/dermatotarget-atlas/';
const immune = '/apps/rheum-derm-immune-atlas/';
test.beforeEach(async ({ page }) => { await blockExternalRequests(page); });

test('the independent source workbench reconciles its denominator and retains identity holds', async ({ page }, info) => {
  const runtime = watchRuntime(page);
  await page.goto(target + '#/evidence', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Independent source cross-check', exact: true })).toBeVisible();
  await expect(page.locator('.source-counts')).toContainText('581 direct');
  await expect(page.locator('.source-counts')).toContainText('14 not returned');
  await expect(page.locator('.source-counts')).toContainText('5 identity');
  await page.getByLabel('Cross-check status', { exact: true }).selectOption('IDENTITY_UNRESOLVED');
  await expect(page.locator('.evidence-results table tbody tr')).toHaveCount(5);
  await page.getByLabel('Search source cross-check', { exact: true }).fill('PDE4C');
  await expect(page.locator('.evidence-results table tbody tr')).toHaveCount(4);
  await page.locator('.evidence-results summary').first().click();
  await expect(page.locator('.evidence-results')).toContainText('Clinical validity: not established');
  await expect(page.locator('.evidence-results')).toContainText('ENSG00000285188');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export filtered source records' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('atlas_source_crosscheck.csv');
  await info.attach('target-evidence-desktop', { body: await page.screenshot({ fullPage: false }), contentType: 'image/png' });
  runtime.assertClean();
});

test('not-returned evidence is not displayed as a zero and empty filters do not fabricate results', async ({ page }) => {
  await page.goto(target + '#/evidence', { waitUntil: 'networkidle' });
  await page.getByLabel('Cross-check status', { exact: true }).selectOption('NOT_RETURNED_BY_EXACT_QUERY');
  await expect(page.locator('.evidence-results table tbody tr')).toHaveCount(14);
  await expect(page.locator('.evidence-results table tbody tr').first()).toContainText('Not established');
  await page.getByLabel('Search source cross-check', { exact: true }).fill('no-such-record-xyz');
  await expect(page.getByRole('button', { name: 'Export filtered source records' })).toBeDisabled();
  await expect(page.locator('.evidence-results')).toContainText('No records match');
});

test('corrupt source identities block a trustworthy-looking source workbench', async ({ page }) => {
  await page.route('**/association-review.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"schema_version":1,"pairs":[]}' }));
  await page.goto(target + '#/evidence', { waitUntil: 'networkidle' });
  await expect(page.getByRole('alert')).toContainText('Failed to load dashboard data');
  await expect(page.locator('.source-counts')).toHaveCount(0);
});

test('gene detail preserves selected indication and makes other indications explicit', async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.goto(target + '#/target/IL2RA?d=atopic_dermatitis', { waitUntil: 'networkidle' });
  await expect(page.locator('.candidate-detail')).toHaveAttribute('data-disease', 'atopic_dermatitis');
  await expect(page.getByRole('heading', { name: 'Drug candidates — Atopic dermatitis', exact: true })).toBeVisible();
  const toggle = page.getByLabel('Include candidates recorded for other indications', { exact: true });
  await expect(toggle).not.toBeChecked();
  await toggle.check();
  await expect(page.locator('.candidate-detail')).toContainText('Recorded indication');
  await expect(page.locator('.candidate-detail')).toContainText('Drug-wide stage (not this indication)');
  await page.getByRole('button').filter({ hasText: 'Psoriasis ·' }).click();
  await expect(page).toHaveURL(/d=psoriasis$/);
  await expect(page.locator('.candidate-detail')).toHaveAttribute('data-disease', 'psoriasis');
  await expect(toggle).not.toBeChecked();
  runtime.assertClean();
});

test('missing lazy candidate data has an explicit local error rather than an unhandled rejection', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/drug_candidates.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto(target + '#/target/IL2RA?d=atopic_dermatitis', { waitUntil: 'networkidle' });
  await expect(page.getByRole('alert')).toContainText('Candidate data could not be validated or loaded');
  expect(errors).toEqual([]);
});

test('malformed and mismatched target routes do not fall back to another disease silently', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(target + '#/target/%E0%A4', { waitUntil: 'networkidle' });
  await expect(page.getByRole('alert')).toContainText('This route could not be displayed');
  await page.goto(target + '#/target/IL2RA?d=not-a-disease', { waitUntil: 'networkidle' });
  await expect(page.getByRole('alert')).toContainText('no recorded pair');
  expect(errors).toEqual([]);
});

test('candidate explorer exposes raw-versus-distinct counts and an exact indication filter', async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.goto(target + '#/drugs', { waitUntil: 'networkidle' });
  await expect(page.getByText(/54,468 raw rows;/)).toBeVisible();
  const select = page.getByLabel('Exact candidate indication', { exact: true });
  await select.selectOption({ label: 'psoriasis' });
  await expect.poll(() => page.locator('.vrow').count()).toBeGreaterThan(0);
  const indications = await page.locator('.vrow > div:nth-child(6)').allTextContents();
  expect(indications.every(name => name.toLowerCase() === 'psoriasis')).toBe(true);
  runtime.assertClean();
});

test('Immune Atlas quarantines historical efficacy before constructing runtime views', async ({ page }, info) => {
  const runtime = watchRuntime(page);
  await page.goto(immune + '#sources', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Source-review workbench' })).toBeVisible();
  await expect(page.locator('.review-denominator')).toContainText('138 active + 5 quarantined = 143');
  const counts = await page.evaluate(() => {
    const d = (window as any).__RHEUM_DERM_ATLAS_DATA__;
    // DATA is a top-level lexical constant; evaluate the public contract through the browser realm.
    return (0, eval)('({active:DATA.effects.length,archived:DATA.quarantinedEffects.length,hasAvacopan:DATA.effects.some(r=>r.med==="avacopan"),derived:DATA.sourceManifestationLinks.length})');
  });
  expect(counts).toEqual({ active: 138, archived: 5, hasAvacopan: false, derived: 239 });
  await page.getByLabel('Atlas source record category', { exact: true }).selectOption('QUARANTINED');
  await expect(page.locator('.review-records > details')).toHaveCount(5);
  await page.getByLabel('Search Atlas source records', { exact: true }).fill('avacopan');
  await expect(page.locator('.review-records > details')).toHaveCount(1);
  await page.locator('.review-records summary').click();
  await expect(page.locator('.review-records')).toContainText('archived');
  await info.attach('immune-evidence-desktop', { body: await page.screenshot({ fullPage: false }), contentType: 'image/png' });
  runtime.assertClean();
});

test('derived manifestation links remain explicitly unvalidated and exportable with their status', async ({ page }) => {
  await page.goto(immune + '#sources', { waitUntil: 'networkidle' });
  await page.getByLabel('Atlas source record category', { exact: true }).selectOption('DERIVED');
  await expect(page.locator('.review-records > details')).toHaveCount(239);
  await page.locator('.review-records summary').first().click();
  await expect(page.locator('.review-records details').first()).toContainText('DERIVED_NOT_INDEPENDENTLY_VALIDATED');
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export filtered evidence (CSV)' }).click();
  expect((await download).suggestedFilename()).toBe('atlas_source_review.csv');
});

test('both workbenches remain usable on a narrow mobile viewport', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [name, url, selector] of [['target', target + '#/evidence', '.atlas-evidence-boundary'], ['immune', immune + '#sources', '.source-review-boundary']]) {
    await page.goto(url, { waitUntil: 'networkidle' });
    const box = await page.locator(selector).boundingBox(); expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(391);
    await info.attach(name + '-evidence-mobile', { body: await page.screenshot({ fullPage: false }), contentType: 'image/png' });
  }
});
