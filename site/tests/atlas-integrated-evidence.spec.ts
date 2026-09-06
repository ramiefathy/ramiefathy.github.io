import { expect, test } from '@playwright/test';
import { blockExternalRequests, watchRuntime } from './helpers/network.js';
const app = '/apps/rheum-derm-immune-atlas/';
test.beforeEach(async ({ page }) => { await blockExternalRequests(page); });

test('primary study claims disclose scope and never claim human clinical approval', async ({ page }, info) => {
  const runtime = watchRuntime(page);
  await page.goto(app + '#sources', { waitUntil: 'networkidle' });
  await page.getByLabel('Atlas source record category', { exact: true }).selectOption('SCOPED_CLAIMS');
  await expect(page.locator('.review-records > details')).toHaveCount(17);
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
    const button = page.locator(`[data-p2-control="${control}"]`);
    await button.scrollIntoViewIfNeeded();
    expect(await button.evaluate(element => {
      const box = element.getBoundingClientRect();
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return element === hit || element.contains(hit);
    }), `${control} must not be occluded`).toBe(true);
    await button.click();
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


test('mobile camera controls remain reachable outside the canvas and preserve touch gestures', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 720 });
  const runtime = watchRuntime(page);
  await page.goto(app + '?task=explore3d&rep=free#network', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-atlas-p2-ready', 'true');
  const group = page.getByRole('group', { name: 'Non-drag graph controls' });
  await expect(group).toBeVisible();
  const boxes = await group.getByRole('button').evaluateAll(nodes => nodes.map(n => {
    const b = n.getBoundingClientRect(); return { width: b.width, height: b.height };
  }));
  expect(boxes).toHaveLength(8);
  expect(boxes.every(b => b.width >= 44 && b.height >= 44)).toBe(true);
  for (const name of ['Pan graph right', 'Pan graph down', 'Zoom graph in']) {
    await group.getByRole('button', { name, exact: true }).click();
  }
  await expect(page.locator('#network3d')).toHaveCSS('touch-action', 'none');
  await page.locator('#network3d').focus();
  await expect(page.locator('#network3d')).toBeFocused();
  expect(await page.locator('#network3d').evaluate(n => getComputedStyle(n).boxShadow)).not.toBe('none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await group.scrollIntoViewIfNeeded();
  await info.attach('integrated-mobile-camera-controls', { body: await page.screenshot(), contentType: 'image/png' });
  runtime.assertClean();
});


test('trial source inspection and export preserve comparator and noninferiority scope', async ({ page }) => {
  await page.goto(app + '#sources', { waitUntil: 'networkidle' });
  await page.getByLabel('Atlas source record category', { exact: true }).selectOption('SCOPED_CLAIMS');
  await page.getByLabel('Search Atlas source records', { exact: true }).fill('MANDARA');
  await expect(page.locator('.review-records > details')).toHaveCount(1);
  await page.locator('.review-records summary').click();
  const record = page.locator('.review-records');
  await expect(record).toContainText('noninferior, not superior');
  await expect(record).toContainText('140 adults');
  await expect(record).toContainText('−25 percentage points');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export filtered evidence (CSV)', exact: true }).click();
  const download = await downloadEvent;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = []; for await (const chunk of stream!) chunks.push(chunk);
  const exported = Buffer.concat(chunks).toString('utf8');
  expect(exported).toContain('MANDARA'); expect(exported).toContain('−25 percentage points');
  expect(exported).toContain('automaticGraphPromotion'); expect(exported).toContain('false');
  expect(exported).not.toContain('MIRRA');
});

test('connective-tissue trials retain primary-endpoint failures and indexed correction holds', async ({ page }, info) => {
  const runtime = watchRuntime(page);
  await page.goto(app + '#sources', { waitUntil: 'networkidle' });
  const category = page.getByLabel('Atlas source record category', { exact: true });
  const search = page.getByLabel('Search Atlas source records', { exact: true });
  await category.selectOption('SCOPED_CLAIMS'); await search.fill('ctd-rim');
  await expect(page.locator('.review-records > details')).toHaveCount(1);
  await page.locator('.review-records summary').click();
  await expect(page.locator('.review-records')).toContainText('NOT_MET');
  await expect(page.locator('.review-records')).toContainText('not a randomized treatment-effect estimate');
  await expect(page.locator('.review-records')).toContainText('abstract');
  await search.fill(''); await category.selectOption('PUBLICATION_HOLDS');
  await expect(page.locator('.review-records > details')).toHaveCount(2);
  await page.locator('.review-records summary').last().click();
  await expect(page.locator('.review-records')).toContainText('not a retraction');
  await expect(page.locator('.review-records a[href="https://pubmed.ncbi.nlm.nih.gov/33667402/"]')).toBeVisible();
  const promise=page.waitForEvent('download');
  await page.getByRole('button', {name:'Export filtered evidence (CSV)',exact:true}).click();
  const download=await promise;
  const stream=await download.createReadStream(); const chunks: Buffer[]=[];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const text=Buffer.concat(chunks).toString('utf8');
  expect(text).toContain('PUBLICATION_CORRECTION_REVIEW_PENDING');
  expect(text).toContain('34062140'); expect(text).toContain('33667402');
  await info.attach('connective-trial-review-holds', {body:await page.screenshot(),contentType:'image/png'});
  runtime.assertClean();
});
