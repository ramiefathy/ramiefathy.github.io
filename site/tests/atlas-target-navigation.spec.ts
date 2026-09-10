import { test, expect } from '@playwright/test';
import { blockExternalRequests, watchRuntime } from './helpers/network.js';
const target = '/apps/dermatotarget-atlas/';
test.beforeEach(async ({ page }) => { await blockExternalRequests(page); });

for (const [disease, gene, label] of [
  ['atopic_dermatitis', 'PDE4D', 'Atopic dermatitis'],
  ['psoriasis', 'IL2RA', 'Psoriasis'],
  ['cutaneous_lupus_erythematosus', 'TRAF3IP2', 'Cutaneous lupus erythematosus'],
]) {
  test(`ranked disease table preserves ${disease} when opening ${gene}`, async ({ page }) => {
    const runtime = watchRuntime(page);
    await page.goto(target + '#/disease/' + disease, { waitUntil: 'networkidle' });
    const section = page.locator('.section').filter({ has: page.getByRole('heading', { name: 'Ranked targets', exact: true }) });
    const link = section.getByRole('link', { name: new RegExp('^' + gene + '(?: |$)') });
    await expect(link).toHaveAttribute('href', `#/target/${gene}?d=${disease}`);
    await link.focus(); await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`#/target/${gene}\\?d=${disease}$`));
    await expect(page.getByRole('heading', { name: 'Score decomposition — ' + label, exact: true })).toBeVisible();
    await expect(page.locator('.chips .active')).toContainText(label);
    runtime.assertClean();
  });
}

test('disease row background clicks and browser back retain indication', async ({ page }) => {
  await page.goto(target + '#/disease/atopic_dermatitis', { waitUntil: 'networkidle' });
  const row = page.locator('table tbody tr').filter({ has: page.getByRole('link', { name: /^PDE4D(?: |$)/ }) });
  await row.locator('td').first().click();
  await expect(page).toHaveURL(/#\/target\/PDE4D\?d=atopic_dermatitis$/);
  await page.getByRole('button', { name: '← back', exact: true }).click();
  await expect(page).toHaveURL(/#\/disease\/atopic_dermatitis$/);
});

test('unknown disease fails explicitly while the default disease route remains usable', async ({ page }) => {
  await page.goto(target + '#/disease/unrecorded_disease', { waitUntil: 'networkidle' });
  await expect(page.getByRole('alert')).toContainText('Unknown disease context');
  await expect(page.getByRole('heading', { name: 'Ranked targets', exact: true })).toHaveCount(0);
  await page.goto(target + '#/disease', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Ranked targets', exact: true })).toBeVisible();
});

test('table sorting supports keyboard activation, state announcement and focus retention', async ({ page }) => {
  await page.goto(target + '#/disease/psoriasis', { waitUntil: 'networkidle' });
  const section = page.locator('.section').filter({ has: page.getByRole('heading', { name: 'Ranked targets', exact: true }) });
  const sort = section.getByRole('button', { name: 'Sort by Composite', exact: true });
  await expect(sort.locator('..')).toHaveAttribute('aria-sort', 'descending');
  await sort.focus(); await page.keyboard.press('Enter');
  await expect(sort).toBeFocused();
  await expect(sort.locator('..')).toHaveAttribute('aria-sort', 'ascending');
  const scores = await section.locator('tbody tr td:nth-child(4)').allTextContents();
  expect(scores.map(Number)).toEqual(scores.map(Number).sort((a, b) => a - b));
  await page.keyboard.press('Space');
  await expect(sort).toBeFocused();
  await expect(sort.locator('..')).toHaveAttribute('aria-sort', 'descending');
});
