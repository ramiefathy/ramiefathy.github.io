import { expect, test, type Page } from '@playwright/test';
import profile from '../src/data/profile.json' with { type: 'json' };
import timeline from '../src/data/timeline.json' with { type: 'json' };

const city = profile.location.split(',')[0].trim();
const fixedTime = new Date('2026-09-07T16:00:00Z');

async function assertCv(page: Page) {
  const sections = page.locator('.cv-section');
  for (const [index, types] of [
    ['education', 'training', 'fellowship'], ['leadership']
  ].entries()) {
    const expected = timeline.milestones.filter((item) => types.includes(item.type))
      .sort((a, b) => b.year - a.year || a.id.localeCompare(b.id));
    const rows = sections.nth(index).locator('[data-milestone-id]');
    await expect(rows).toHaveCount(expected.length);
    for (const [position, item] of expected.entries()) {
      const row = rows.nth(position);
      await expect(row).toHaveAttribute('data-milestone-id', item.id);
      await expect(row.locator('b')).toHaveText(item.title);
      await expect(row.locator('.role')).toHaveText(item.role);
      await expect(row.locator('.tag')).toHaveText(item.tag);
      const years = item.endYear === null ? `${item.year}—`
        : item.endYear === item.year ? String(item.year) : `${item.year}—${item.endYear}`;
      await expect(row.locator('.y')).toHaveText(years);
    }
  }
  await expect(sections.first().locator('.cv-section-label p'))
    .toHaveText('Training and degrees, in reverse chronological order.');
  await expect(page.locator('.status-bar__where')).toHaveText(`· ${profile.affiliation}`);
  await expect(page.locator('.layout-footer__tagline')).toHaveText(`Dermatology · Clinical AI · ${city}.`);
}

test.describe('About profile data integration', () => {
  // The status clock must use the author's profile timezone, not the visitor's.
  test.use({ timezoneId: 'Pacific/Honolulu' });

  for (const width of [1280, 390]) {
    test(`renders and hydrates the structured CV at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.clock.setFixedTime(fixedTime);
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      const response = await page.goto('/about');
      expect(response?.status()).toBe(200);
      await assertCv(page);
      const stamp = new Intl.DateTimeFormat('en-US', {
        timeZone: profile.timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).format(fixedTime);
      await expect(page.locator('.status-clock')).toHaveText(`${stamp} · ${city}`);
      await expect(page.locator('astro-island[component-url*="Header"]')).not.toHaveAttribute('ssr');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const screenshot = testInfo.outputPath(`about-${width}.png`);
      await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' });
      await testInfo.attach(`About ${width}px`, { path: screenshot, contentType: 'image/png' });
      if (width < 600) {
        const menu = page.getByRole('button', { name: 'Toggle navigation' });
        await menu.click();
        await expect(menu).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(menu).toHaveAttribute('aria-expanded', 'false');
      }
      expect(errors).toEqual([]);
    });
  }

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('ships CV content and the city placeholder as HTML', async ({ page }) => {
      expect((await page.goto('/about'))?.status()).toBe(200);
      await assertCv(page);
      await expect(page.locator('.status-clock')).toHaveText(city);
    });
  });
});
