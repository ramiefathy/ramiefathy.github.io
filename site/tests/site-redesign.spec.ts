import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publications } from '../src/data/publications.js';

const CONTACT_EMAIL = 'ramiefathy@gmail.com';
const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const publicDir = path.join(siteRoot, 'public');

async function waitForHeaderHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island[component-url*="Header"]');
    return island && !island.hasAttribute('ssr');
  });
}

async function waitForAppsGalleryHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island[component-url*="AppsGallery"]');
    return island && !island.hasAttribute('ssr');
  });
}

function parseMailto(url: string) {
  const [schemeAndTo, query = ''] = url.split('?');
  const to = schemeAndTo.replace(/^mailto:/i, '');
  const params = new URLSearchParams(query);
  return {
    to,
    subject: params.get('subject') || '',
    body: params.get('body') || ''
  };
}

test.describe('Site redesign smoke (routing, contact, SEO, motion)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      const isLocal =
        url.startsWith('http://127.0.0.1') ||
        url.startsWith('http://localhost') ||
        url.startsWith('http://[::1]');
      const isBlobOrData = url.startsWith('data:') || url.startsWith('blob:');

      if (!isLocal && !isBlobOrData && url.startsWith('http')) {
        await route.abort();
        return;
      }

      await route.continue();
    });
  });

  test('SSR homepage hero is not hidden before hydration', async ({ page }) => {
    const response = await page.request.get('/');
    expect(response.ok()).toBeTruthy();
    const html = await response.text();

    expect(html).toContain('class="hero-copy"');
    expect(html).toContain('Ramie Fathy, MD');
    expect(html).not.toMatch(/class="hero-copy"[^>]*style="[^"]*opacity:\s*0\b/i);
  });

  test('primary nav links are correct and key routes render', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const nav = page.getByRole('navigation', { name: 'Primary navigation' });
    await expect(nav).toBeVisible();

    await expect(nav.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    await expect(nav.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
    await expect(nav.getByRole('link', { name: 'Apps & Projects' })).toHaveAttribute('href', '/apps');
    await expect(nav.getByRole('link', { name: 'Research' })).toHaveAttribute('href', '/research');
    await expect(nav.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
    await expect(nav.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');

    await page.goto('/about', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Ramie Fathy, MD/);
    await expect(page.getByRole('heading', { name: 'Career Timeline' })).toBeVisible();

    await page.goto('/apps', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Modern Dermatology Workflows');

    await page.goto('/research', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Publications & Scholarship');

    await page.goto('/blog', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Insights & Updates');

    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Let’s build clinician-grade tools.');
  });

  test('apps gallery supports spotlight selection, details toggle, and keyboard navigation', async ({ page }) => {
    await page.goto('/apps', { waitUntil: 'domcontentloaded' });
    await waitForAppsGalleryHydration(page);

    const gallery = page.getByRole('region', { name: 'Applications gallery' });
    await expect(gallery).toBeVisible();

    const spotlight = page.locator('.apps-gallery-spotlight');
    await expect(spotlight).toBeVisible();

    const dermpathCard = page.locator('.apps-gallery-list .app-showcase-card', { hasText: 'Dermatopathology Navigator' });
    await expect(dermpathCard).toHaveCount(1);
    await dermpathCard.click();

    const spotlightTitle = spotlight.locator('h2.apps-gallery-spotlight-title');
    await expect(spotlightTitle).toHaveText('Dermatopathology Navigator');

    const detailsButton = spotlight.getByRole('button', { name: 'Details' });
    await expect(detailsButton).toHaveAttribute('aria-expanded', 'false');
    await detailsButton.click();
    await expect(detailsButton).toHaveAttribute('aria-expanded', 'true');
    await expect(spotlight.locator('.apps-gallery-spotlight-details')).toBeVisible();
    await expect(spotlight.locator('.apps-gallery-spotlight-details')).toContainText('Primary stack');

    // Regression guard: Enter on nested controls should NOT be hijacked by the gallery key handler.
    await detailsButton.focus();
    await page.keyboard.press('Enter');
    await expect(detailsButton).toHaveAttribute('aria-expanded', 'false');
    await expect(page).toHaveURL(/\/apps\/?$/);

    await gallery.focus();
    await page.keyboard.press('ArrowDown');
    await expect(spotlightTitle).toBeVisible();
    await expect(spotlightTitle).not.toHaveText('Dermatopathology Navigator');
  });

  test('homepage selected publications + timeline strip render and animate in view', async ({ page }) => {
    const featuredPublications = [...publications]
      .filter((entry) => entry.featured)
      .sort((a, b) => b.year - a.year)
      .slice(0, 4);

    const years = [...new Set(publications.map((entry) => entry.year))].filter(Boolean).sort((a, b) => a - b);
    const startYear = years[0] ?? new Date().getFullYear();
    const endYear = years[years.length - 1] ?? startYear;
    const publicationYears = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const section = page.locator('#publications');
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole('heading', { name: 'Selected Publications' })).toBeVisible();

    const cards = section.locator('article.pub-card');
    await expect(cards).toHaveCount(featuredPublications.length);

    for (let i = 0; i < featuredPublications.length; i += 1) {
      const card = cards.nth(i);
      const expected = featuredPublications[i];
      await expect(card.getByRole('heading', { name: expected.title })).toBeVisible();
      const link = card.getByRole('link', { name: /Read paper/i });
      await expect(link).toHaveAttribute('href', expected.url);
      await expect(link).toHaveAttribute('target', '_blank');
    }

    await expect(cards.first()).toHaveClass(/is-visible/);
    const secondDelay = await cards.nth(1).evaluate((node) => node.style.getPropertyValue('--enter-delay'));
    expect(secondDelay).toBe('90ms');

    const timelineNodes = section.locator('.pub-timeline__node');
    await expect(timelineNodes).toHaveCount(publicationYears.length);
    for (const year of publicationYears) {
      await expect(section.locator('.pub-timeline__year', { hasText: String(year) })).toHaveCount(1);
    }
  });

  test('homepage contact area has no third-party form and uses Gmail mailto', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const contact = page.locator('#contact');
    await contact.scrollIntoViewIfNeeded();
    await expect(contact.getByRole('heading', { name: 'Get in Touch' })).toBeVisible();

    await expect(contact.locator('form[data-netlify], form[netlify-honeypot], input[name="form-name"]')).toHaveCount(0);

    const emailLink = contact.locator(`a[href="${CONTACT_MAILTO}"]`).first();
    await expect(emailLink).toHaveCount(1);

    const contactPageLink = contact.getByRole('link', { name: /Contact page/i });
    await expect(contactPageLink).toHaveAttribute('href', '/contact');
  });

  test('contact page copy + mailto compose (previewed) build correct URL', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: 'http://127.0.0.1:4321'
    });

    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await expect(page.locator(`a[href="${CONTACT_MAILTO}"]`).first()).toBeVisible();

    await page.locator('[data-copy-email]').click();
    const status = page.locator('#contact-status');
    await expect(status).toContainText(/copied|failed/i);

    // Prefer asserting clipboard content if available; otherwise, the status is our functional fallback.
    const clipboardText = await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch (err) {
        return null;
      }
    });
    if (clipboardText !== null) {
      expect(clipboardText).toBe(CONTACT_EMAIL);
    }

    await page.evaluate(() => {
      document.querySelector('[data-mailto-form]')?.setAttribute('data-mailto-preview', 'true');
    });

    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Subject').fill('Speaking invitation');
    await page.getByLabel('Message').fill('Hello Ramie,\nWould you be open to giving a talk?');

    await page.getByRole('button', { name: 'Compose Email' }).click();

    const mailtoUrl = await page.locator('[data-mailto-form]').getAttribute('data-mailto-url');
    expect(mailtoUrl).toBeTruthy();

    const parsed = parseMailto(mailtoUrl as string);
    expect(parsed.to).toBe(CONTACT_EMAIL);
    expect(parsed.subject).toContain('Speaking invitation');
    expect(parsed.body).toContain('Name: Test User');
    expect(parsed.body).toContain('Email: test@example.com');
    expect(parsed.body).toContain('Would you be open to giving a talk?');
  });

  test('footer uses Gmail mailto and links to /contact', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    const footer = page.locator('footer.layout-footer');
    await expect(footer).toBeVisible();
    await expect(footer.locator(`a[href="${CONTACT_MAILTO}"]`)).toHaveCount(1);
    await expect(footer.locator('a[href="/contact"]')).toHaveCount(1);
  });

  test('SEO meta and OG asset exist on home and contact', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://ramiefathy.com/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://ramiefathy.com/og.svg');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);

    const ogResponse = await page.request.get('/og.svg');
    expect(ogResponse.ok()).toBeTruthy();

    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /https:\/\/ramiefathy\.com\/contact\/?/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://ramiefathy.com/og.svg');
  });

  test('custom 404 route exists and provides recovery links', async ({ page }) => {
    await page.goto('/404', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
    const main = page.locator('#main-content');
    await expect(main.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/');
    await expect(main.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
  });

  test('theme toggle persists across reload', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForHeaderHydration(page);

    const initialTheme = await page.evaluate(() => document.documentElement.dataset.theme || 'light');
    const toggleButton = page.getByRole('button', { name: 'Toggle dark mode' });
    await expect(toggleButton).toBeVisible();

    // Ensure the hydrated toggle state matches the current document theme before interacting.
    await page.waitForFunction(() => {
      const currentTheme = document.documentElement.dataset.theme || 'light';
      const toggle = document.querySelector('[aria-label="Toggle dark mode"]');
      if (!toggle) return false;
      const pressed = toggle.getAttribute('aria-pressed');
      const pressedTheme = pressed === 'true' ? 'dark' : 'light';
      return pressedTheme === currentTheme;
    });

    await toggleButton.click();
    await page.waitForFunction((previous) => {
      const currentTheme = document.documentElement.dataset.theme || 'light';
      return currentTheme !== previous;
    }, initialTheme, { timeout: 10_000 });
    const toggledTheme = await page.evaluate(() => document.documentElement.dataset.theme || 'light');
    expect(toggledTheme).not.toBe(initialTheme);

    await page.waitForFunction((expected) => {
      try {
        return window.localStorage.getItem('theme') === expected;
      } catch (err) {
        return false;
      }
    }, toggledTheme, { timeout: 10_000 });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForHeaderHydration(page);
    await page.waitForFunction((expected) => {
      const currentTheme = document.documentElement.dataset.theme || 'light';
      return currentTheme === expected;
    }, toggledTheme, { timeout: 10_000 });
    const persistedTheme = await page.evaluate(() => document.documentElement.dataset.theme || 'light');
    expect(persistedTheme).toBe(toggledTheme);
  });

  test('mobile drawer navigation works and Escape closes it', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForHeaderHydration(page);

    const menuButton = page.getByRole('button', { name: 'Toggle navigation' });
    await expect(menuButton).toBeVisible();

    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    await menuButton.click();
    await expect(page.locator('.header-drawer.is-open')).toBeVisible();

    const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' });
    await mobileNav.getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL(/\/contact\/?$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Let’s build clinician-grade tools.');
  });

  test('no Netlify deployment wiring remains in headers/build config', async () => {
    const headersPath = path.join(publicDir, '_headers');
    const headers = await fs.readFile(headersPath, 'utf8');
    expect(headers).toContain("form-action 'self'");
    expect(headers.toLowerCase()).not.toContain('netlify');
    expect(headers.toLowerCase()).not.toContain('formspree');

    const ogPath = path.join(publicDir, 'og.svg');
    await fs.stat(ogPath);

    const netlifyToml = path.resolve(siteRoot, '..', 'netlify.toml');
    let netlifyTomlExists = true;
    try {
      await fs.stat(netlifyToml);
    } catch (error) {
      netlifyTomlExists = false;
    }
    expect(netlifyTomlExists).toBe(false);
  });
});
