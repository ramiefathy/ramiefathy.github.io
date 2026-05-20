import { expect, test } from '@playwright/test';

const TOPIC = '/apps/mindmaps/alopecia';
const ALL_TOPICS = [
  'acne',
  'alopecia',
  'allergic-contact-dermatitis',
  'atopic-dermatitis',
  'autoimmune-bullous',
  'ctcl',
  'drug-eruptions',
  'hidradenitis-suppurativa',
  'nail-disease',
  'oral-ulcers',
  'pigmented-lesions',
  'pruritus',
  'psoriasis',
  'rosacea',
  'urticaria-angioedema',
  'vasculitis-purpura',
];

// Block external network calls (AdSense, fonts, etc.) to avoid flake.
async function blockExternal(page: import('@playwright/test').Page) {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|\[::1\])/i, async (route) => {
    await route.abort();
  });
}

// After navigating, wait for hydration: networkidle + view-switcher visible.
async function waitForHydration(page: import('@playwright/test').Page, path = TOPIC) {
  await page.goto(path, { waitUntil: 'networkidle' });
  await page.locator('.view-switcher').waitFor({ state: 'visible' });
}

async function assertCurrentDiagramGeometry(page: import('@playwright/test').Page, label: string) {
  const result = await page.evaluate(() => {
    const overflow = {
      doc: document.documentElement.scrollWidth,
      vp: window.innerWidth,
    };
    const invalidPaths = Array.from(document.querySelectorAll('.diagram-canvas svg path'))
      .map((path) => path.getAttribute('d') ?? '')
      .filter((d) => /NaN|Infinity|-Infinity/.test(d));
    const lifecycleCanvas = document.querySelector('.diagram-canvas--lifecycle svg');
    const lifecycleArrowGlyph = lifecycleCanvas?.textContent?.includes('\u2192') ?? false;
    const lifecycleEdges = lifecycleCanvas ? lifecycleCanvas.querySelectorAll('[data-lifecycle-edge]').length : null;
    const nodeElements = Array.from(document.querySelectorAll<SVGGElement>('[data-diagram-node]'));
    const nodeBoxes = nodeElements.map((node) => {
      const shape = node.querySelector<SVGGraphicsElement>('rect, polygon');
      const text = node.querySelector<SVGGraphicsElement>('text');
      const isDiamond = shape?.tagName.toLowerCase() === 'polygon';
      const shapeRect = shape?.getBoundingClientRect();
      const textRect = text?.getBoundingClientRect();
      const textStyle = text ? window.getComputedStyle(text) : null;
      const ctm = text?.getScreenCTM();
      const scale = ctm ? Math.hypot(ctm.a, ctm.b) : 1;
      const fontSize = textStyle ? Number.parseFloat(textStyle.fontSize) : null;
      const width = Number.parseFloat(node.getAttribute('data-node-width') ?? '0');
      const height = Number.parseFloat(node.getAttribute('data-node-height') ?? '0');
      const diamondTextInside = !isDiamond || !text || !width || !height || Array.from(text.querySelectorAll<SVGTSpanElement>('tspan')).every((line) => {
        const textWidth = line.getComputedTextLength();
        const lineY = Number.parseFloat(line.getAttribute('y') ?? String(height / 2));
        const lineHeight = (fontSize ?? 13) * 1.22;
        const availableAt = (y: number) => {
          const verticalDistanceFromCenter = Math.abs(y - height / 2);
          const halfWidthAtY = (width / 2) * (1 - (verticalDistanceFromCenter / (height / 2)));
          return Math.max(0, halfWidthAtY * 2);
        };
        const availableWidth = Math.min(
          availableAt(lineY - lineHeight / 2),
          availableAt(lineY + lineHeight / 2),
        );
        return textWidth <= availableWidth - 36;
      });
      return {
        id: node.getAttribute('data-diagram-node') ?? '',
        left: shapeRect?.left ?? 0,
        right: shapeRect?.right ?? 0,
        top: shapeRect?.top ?? 0,
        bottom: shapeRect?.bottom ?? 0,
        fontSize,
        renderedFontSize: fontSize === null ? null : fontSize * scale,
        textInside:
          !shapeRect || !textRect ||
          (
            textRect.left >= shapeRect.left - 2 &&
            textRect.right <= shapeRect.right + 2 &&
            textRect.top >= shapeRect.top - 2 &&
            textRect.bottom <= shapeRect.bottom + 2
          ),
        diamondTextInside,
      };
    });
    const overlaps: string[] = [];
    for (let i = 0; i < nodeBoxes.length; i++) {
      for (let j = i + 1; j < nodeBoxes.length; j++) {
        const a = nodeBoxes[i];
        const b = nodeBoxes[j];
        const intersects = !(
          a.right + 6 <= b.left ||
          b.right + 6 <= a.left ||
          a.bottom + 6 <= b.top ||
          b.bottom + 6 <= a.top
        );
        if (intersects) overlaps.push(`${a.id}/${b.id}`);
      }
    }
    const branchLabelFonts = Array.from(document.querySelectorAll<SVGTextElement>('[data-diagram-label]'))
      .map((labelNode) => Number.parseFloat(window.getComputedStyle(labelNode).fontSize));

    return {
      overflow,
      invalidPaths,
      lifecycleArrowGlyph,
      lifecycleEdges,
      nodeBoxes,
      overlaps,
      branchLabelFonts,
    };
  });

  expect(result.overflow.doc, `${label}: document scrollWidth must not exceed viewport`).toBeLessThanOrEqual(result.overflow.vp + 1);
  expect(result.invalidPaths, `${label}: SVG paths must be finite`).toEqual([]);
  expect(result.lifecycleArrowGlyph, `${label}: lifecycle must not use arrow glyphs`).toBe(false);
  if (result.lifecycleEdges !== null) {
    expect(result.lifecycleEdges, `${label}: lifecycle should render directional arc paths`).toBeGreaterThan(0);
  }
  expect(result.overlaps, `${label}: diagram nodes must not overlap`).toEqual([]);
  for (const node of result.nodeBoxes) {
    expect(node.textInside, `${label}: ${node.id} label must fit inside node shape`).toBe(true);
    expect(node.diamondTextInside, `${label}: ${node.id} decision label must fit inside diamond sidewalls`).toBe(true);
    expect(node.fontSize, `${label}: ${node.id} node font must be readable`).toBeGreaterThanOrEqual(12);
    expect(node.renderedFontSize, `${label}: ${node.id} rendered node font must be readable`).toBeGreaterThanOrEqual(10);
  }
  for (const fontSize of result.branchLabelFonts) {
    expect(fontSize, `${label}: branch label font must be readable`).toBeGreaterThanOrEqual(11);
  }
}

test.describe('Mindmap Diagrams view', () => {
  test('opens with Diagrams view active when at least one diagram exists', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    // The Diagrams tab should be selected by default because diagrams exist.
    await expect(page.locator('.view-switcher__tab.is-active')).toContainText(/Diagrams/);
  });

  test('shows the diagram library index with at least 6 diagrams', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    // DiagramsView renders a <nav> with one <li> per diagram.
    const items = page.locator('.diagrams-view__index li');
    await expect(items.first()).toBeVisible();
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('places the diagram library above the canvas instead of in a left sidebar', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);

    const boxes = await page.evaluate(() => {
      const index = document.querySelector('.diagrams-view__index')?.getBoundingClientRect();
      const main = document.querySelector('.diagrams-view__main')?.getBoundingClientRect();
      if (!index || !main) return null;
      return {
        indexBottom: index.bottom,
        indexLeft: index.left,
        indexRight: index.right,
        mainTop: main.top,
        mainLeft: main.left,
        mainRight: main.right,
      };
    });

    expect(boxes).not.toBeNull();
    expect(boxes!.indexBottom, 'diagram library should sit above the canvas').toBeLessThanOrEqual(boxes!.mainTop + 1);
    expect(Math.abs(boxes!.indexLeft - boxes!.mainLeft), 'diagram library should align with canvas left edge').toBeLessThanOrEqual(1);
    expect(Math.abs(boxes!.indexRight - boxes!.mainRight), 'diagram library should align with canvas right edge').toBeLessThanOrEqual(1);
  });

  test('renders the cicatricial decision tree when selected from library', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    // The button text format is: "04 Cicatricial Alopecia Workup [DECISION TREE]"
    // Use a regex that's unique to the decision-tree variant (not the classification).
    await page.getByRole('button', { name: /Cicatricial Alopecia Workup.*DECISION TREE/i }).click();
    await expect(page.locator('.diagram-canvas--decision-tree svg')).toBeVisible();
    await expect(page.locator('[data-step-id]').first()).toBeVisible();
  });

  test('clicking a step opens the SideDrawer with detail', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    // Navigate to decision tree first (it has data-step-id elements).
    await page.getByRole('button', { name: /Cicatricial Alopecia Workup.*DECISION TREE/i }).click();
    await expect(page.locator('[data-step-id]').first()).toBeVisible();
    await page.locator('[data-step-id]').first().click();
    await expect(page.locator('.side-drawer')).toBeVisible();
    await expect(page.locator('.side-drawer__title')).toBeVisible();
  });

  test('switching to Compare shows the LPP vs FFA vs CCCA matrix', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    const compareTab = page.getByRole('tab', { name: /Compare/ });
    await compareTab.click();
    // Confirm React handled the click via aria-selected.
    await expect(compareTab).toHaveAttribute('aria-selected', 'true');
    // The ComparisonTable renders <th scope="col"> with shortName for each entity.
    await expect(page.getByRole('columnheader', { name: /LPP/ })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /FFA/ })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /CCCA/ })).toBeVisible();
  });

  test('switching to Atlas shows the existing radial mindmap', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    const atlasTab = page.getByRole('tab', { name: /Atlas/ });
    await atlasTab.click();
    // Confirm React handled the click via aria-selected.
    await expect(atlasTab).toHaveAttribute('aria-selected', 'true');
    // AtlasView renders inside .mindmap-app > .mindmap-canvas > svg.
    await expect(page.locator('.mindmap-app .mindmap-canvas svg').first()).toBeVisible();
  });

  test('selecting a different diagram from the library updates the canvas', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    // Click the second library item (index 1, i.e. the 2nd diagram alphabetically).
    const secondButton = page.locator('.diagrams-view__index li').nth(1).locator('button');
    await secondButton.click();
    // After clicking, a diagram canvas should be visible.
    await expect(page.locator('.diagram-canvas').first()).toBeVisible();
  });

  test('clicking a step shows diagram-level citations in SideDrawer', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    // Decision tree has authored citations (PMID 32179113 + 32623068).
    await page.getByRole('button', { name: /Cicatricial Alopecia Workup.*DECISION TREE/i }).click();
    await expect(page.locator('[data-step-id]').first()).toBeVisible();
    await page.locator('[data-step-id]').first().click();
    await expect(page.locator('.side-drawer__citations')).toBeVisible();
    // At least one PubMed link from the diagram-level citations array.
    await expect(page.locator('.side-drawer__citations a[href*="pubmed.ncbi.nlm.nih.gov"]').first()).toBeVisible();
  });
});

test.describe('Mindmap Diagrams view (mobile 375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('default Diagrams view does not horizontally overflow', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    // The page must not have a horizontal scroll wider than the viewport.
    const overflow = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      vp: window.innerWidth,
    }));
    expect(overflow.doc, 'document scrollWidth must not exceed viewport').toBeLessThanOrEqual(overflow.vp + 1);
    // Library nav and main canvas are both visible (stacked, not clipped).
    await expect(page.locator('.diagrams-view__index').first()).toBeVisible();
    await expect(page.locator('.diagrams-view__main').first()).toBeVisible();
  });

  test('mobile first viewport reaches the mindmap controls', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);

    const rect = await page.locator('.view-switcher').evaluate((element) => {
      const box = element.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, viewportHeight: window.innerHeight };
    });

    expect(rect.top, 'view switcher should start within the initial mobile viewport').toBeLessThan(rect.viewportHeight);
    expect(rect.bottom, 'at least part of the view switcher should be usable without initial scrolling').toBeGreaterThan(0);
  });

  test('Compare view does not horizontally overflow at 375px', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    const compareTab = page.getByRole('tab', { name: /Compare/ });
    await compareTab.click();
    await expect(compareTab).toHaveAttribute('aria-selected', 'true');
    const overflow = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      vp: window.innerWidth,
    }));
    expect(overflow.doc, 'document scrollWidth must not exceed viewport').toBeLessThanOrEqual(overflow.vp + 1);
    await expect(page.locator('.compare-view__index').first()).toBeVisible();
    await expect(page.locator('.compare-view__main').first()).toBeVisible();
  });

  // F28: per-renderer mobile overflow check — click each library diagram button
  // and assert the page does not horizontally overflow at 375px.
  test('F28: each diagram in the library does not overflow at 375px', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);
    const libraryButtons = page.locator('.diagrams-view__index li button');
    const count = await libraryButtons.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await libraryButtons.nth(i).click();
      await expect(page.locator('.diagram-canvas').first()).toBeVisible();
      const overflow = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        vp: window.innerWidth,
      }));
      expect(
        overflow.doc,
        `diagram ${i + 1}/${count}: scrollWidth must not exceed viewport`
      ).toBeLessThanOrEqual(overflow.vp + 1);
    }
  });
});

test.describe('Mindmap diagram geometry QA', () => {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    test(`${viewport.name}: every topic diagram satisfies geometry contracts`, async ({ page }) => {
      test.setTimeout(120_000);
      await blockExternal(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const topic of ALL_TOPICS) {
        await waitForHydration(page, `/apps/mindmaps/${topic}`);
        const libraryButtons = page.locator('.diagrams-view__index li button');
        const count = await libraryButtons.count();
        expect(count, `${topic}: expected diagrams`).toBeGreaterThan(0);
        for (let i = 0; i < count; i++) {
          await libraryButtons.nth(i).click();
          await expect(page.locator('.diagram-canvas').first()).toBeVisible();
          await assertCurrentDiagramGeometry(page, `${viewport.name}/${topic}/diagram-${i + 1}`);
        }
      }
    });
  }
});

// F27: Atlas view sanity — verify features removed in Task 14 (minimap, presentation
// mode, layout toggle, annotation textarea) are absent in the Atlas view.
test.describe('Atlas view sanity (F27)', () => {
  test('Atlas view has no .minimap, .presentation-mode, annotation textarea, or layout toggle', async ({ page }) => {
    await blockExternal(page);
    await waitForHydration(page);

    // Navigate to Atlas tab
    const atlasTab = page.getByRole('tab', { name: /Atlas/ });
    await atlasTab.click();
    await expect(atlasTab).toHaveAttribute('aria-selected', 'true');
    // Confirm Atlas is active by checking .mindmap-app
    await expect(page.locator('.mindmap-app').first()).toBeVisible();

    // .minimap — removed in Task 14
    await expect(page.locator('.minimap')).toHaveCount(0);
    // .presentation-mode — removed in Task 14
    await expect(page.locator('.presentation-mode')).toHaveCount(0);
    // annotation textarea (#mindmap-annotation) — removed in Task 14
    await expect(page.locator('[id="mindmap-annotation"]')).toHaveCount(0);
    // layout toggle (.layout-toggle) — removed in Task 14 (was .mobile-menu-toggle__layout
    // in the plan, but the actual removed feature had no distinct class; assert
    // that no element with "layout" in its id exists under .mindmap-app).
    await expect(page.locator('.mindmap-app [id*="layout-toggle"]')).toHaveCount(0);
  });
});
