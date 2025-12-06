import { chromium, Browser, Page } from '@playwright/test';

interface UXIssue {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
  element?: string;
}

async function evaluateUX() {
  const issues: UXIssue[] = [];
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    console.log('🔍 Starting UI/UX Evaluation...\n');

    // Navigate to the app
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait for 3D scene to initialize

    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/01-initial-load.png', fullPage: true });
    console.log('📸 Screenshot: Initial load captured');

    // ============================================
    // 1. LOADING & PERFORMANCE ANALYSIS
    // ============================================
    console.log('\n📊 1. Analyzing Loading & Performance...');

    // Check if loading state is shown
    const loadingSpinner = await page.$('.animate-spin');
    if (!loadingSpinner) {
      issues.push({
        category: 'Loading',
        severity: 'medium',
        description: 'No loading indicator visible during initial load',
        recommendation: 'Add a visible loading state while 3D scene initializes'
      });
    }

    // Measure time to interactive
    const performanceMetrics = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0
      };
    });
    console.log(`  - DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`  - Load Complete: ${performanceMetrics.loadComplete}ms`);

    if (performanceMetrics.loadComplete > 5000) {
      issues.push({
        category: 'Performance',
        severity: 'high',
        description: `Page load time is ${performanceMetrics.loadComplete}ms (>5s)`,
        recommendation: 'Optimize bundle size, lazy load Three.js, or add code splitting'
      });
    }

    // ============================================
    // 2. LAYOUT & VISUAL HIERARCHY
    // ============================================
    console.log('\n🎨 2. Analyzing Layout & Visual Hierarchy...');

    // Check main layout elements
    const controlsPanel = await page.$('[class*="Controls"]');
    const infoPanel = await page.$('[class*="InfoPanel"]');
    const canvas = await page.$('canvas');

    if (!canvas) {
      issues.push({
        category: 'Layout',
        severity: 'critical',
        description: 'Canvas element not found - 3D scene may not be rendering',
        recommendation: 'Check WebGL initialization and error handling'
      });
    }

    // Check z-index layering
    const overlappingElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="absolute"]');
      const overlaps: string[] = [];
      elements.forEach((el, i) => {
        elements.forEach((el2, j) => {
          if (i < j) {
            const rect1 = el.getBoundingClientRect();
            const rect2 = el2.getBoundingClientRect();
            if (rect1.left < rect2.right && rect1.right > rect2.left &&
                rect1.top < rect2.bottom && rect1.bottom > rect2.top) {
              overlaps.push(`${el.className} overlaps ${el2.className}`);
            }
          }
        });
      });
      return overlaps;
    });

    if (overlappingElements.length > 0) {
      console.log(`  - Found ${overlappingElements.length} overlapping UI elements`);
    }

    // ============================================
    // 3. CONTROLS & INTERACTIVITY
    // ============================================
    console.log('\n🎮 3. Analyzing Controls & Interactivity...');

    // Find all buttons
    const buttons = await page.$$('button');
    console.log(`  - Found ${buttons.length} buttons`);

    // Check button accessibility
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const button = buttons[i];
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaPressed = await button.getAttribute('aria-pressed');
      const text = await button.textContent();

      if (!ariaLabel && !text?.trim()) {
        issues.push({
          category: 'Accessibility',
          severity: 'high',
          description: `Button ${i + 1} has no accessible label`,
          recommendation: 'Add aria-label or visible text to all buttons',
          element: await button.evaluate(el => el.outerHTML.substring(0, 100))
        });
      }
    }

    // Test toggle buttons
    const toggleButtons = await page.$$('button[aria-pressed]');
    console.log(`  - Found ${toggleButtons.length} toggle buttons with aria-pressed`);

    if (toggleButtons.length === 0) {
      issues.push({
        category: 'Accessibility',
        severity: 'medium',
        description: 'Toggle buttons missing aria-pressed attribute',
        recommendation: 'Add aria-pressed to indicate toggle state'
      });
    }

    // Test button click interactions
    const epidermisToggle = await page.$('button:has-text("Epidermis")');
    if (epidermisToggle) {
      await epidermisToggle.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/02-epidermis-toggled.png', fullPage: true });
      console.log('📸 Screenshot: Epidermis toggled');

      // Toggle back
      await epidermisToggle.click();
      await page.waitForTimeout(500);
    }

    // ============================================
    // 4. ZOOM LEVEL CONTROLS
    // ============================================
    console.log('\n🔍 4. Analyzing Zoom Controls...');

    const zoomButtons = await page.$$('button:has-text("Layers"), button:has-text("Follicle"), button:has-text("Cells")');
    console.log(`  - Found ${zoomButtons.length} zoom level buttons`);

    if (zoomButtons.length > 0) {
      // Test each zoom level
      for (const btn of zoomButtons) {
        const text = await btn.textContent();
        await btn.click();
        await page.waitForTimeout(1000);
        console.log(`  - Clicked zoom level: ${text?.trim()}`);
      }
      await page.screenshot({ path: 'screenshots/03-zoom-cells.png', fullPage: true });
      console.log('📸 Screenshot: Cells zoom level');
    } else {
      issues.push({
        category: 'Navigation',
        severity: 'medium',
        description: 'Zoom level controls not found or not labeled',
        recommendation: 'Ensure zoom controls are visible and properly labeled'
      });
    }

    // ============================================
    // 5. INFO PANEL ANALYSIS
    // ============================================
    console.log('\n📋 5. Analyzing Info Panel...');

    // Click on canvas to select a structure
    const canvasEl = await page.$('canvas');
    if (canvasEl) {
      const box = await canvasEl.boundingBox();
      if (box) {
        // Click in center of canvas
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/04-structure-selected.png', fullPage: true });
        console.log('📸 Screenshot: Structure selected');

        // Check if info panel shows content
        const infoContent = await page.$('[class*="InfoPanel"]');
        if (infoContent) {
          const hasContent = await infoContent.evaluate(el => el.textContent?.length || 0);
          console.log(`  - Info panel content length: ${hasContent} chars`);
        }
      }
    }

    // ============================================
    // 6. LANGUAGE SELECTOR
    // ============================================
    console.log('\n🌐 6. Analyzing Language Selector...');

    const langButtons = await page.$$('button:has-text("EN"), button:has-text("AR")');
    console.log(`  - Found ${langButtons.length} language buttons`);

    // Test Arabic mode
    const arButton = await page.$('button:has-text("AR")');
    if (arButton) {
      await arButton.click();
      await page.waitForTimeout(500);

      // Check RTL
      const htmlDir = await page.evaluate(() => document.documentElement.dir);
      console.log(`  - HTML dir attribute: ${htmlDir}`);

      if (htmlDir !== 'rtl') {
        issues.push({
          category: 'Internationalization',
          severity: 'high',
          description: 'RTL not applied when Arabic language selected',
          recommendation: 'Set dir="rtl" on root element when Arabic is selected'
        });
      }

      await page.screenshot({ path: 'screenshots/05-arabic-mode.png', fullPage: true });
      console.log('📸 Screenshot: Arabic mode');

      // Switch back to English
      const enButton = await page.$('button:has-text("EN")');
      if (enButton) await enButton.click();
      await page.waitForTimeout(500);
    }

    // ============================================
    // 7. QUIZ MODE
    // ============================================
    console.log('\n❓ 7. Analyzing Quiz Mode...');

    const quizButton = await page.$('button:has-text("Quiz")');
    if (quizButton) {
      await quizButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/06-quiz-mode.png', fullPage: true });
      console.log('📸 Screenshot: Quiz mode');

      // Check quiz prompt visibility
      const quizPrompt = await page.$('text=/Click on/');
      if (!quizPrompt) {
        issues.push({
          category: 'Quiz',
          severity: 'medium',
          description: 'Quiz prompt not clearly visible',
          recommendation: 'Make quiz instructions more prominent'
        });
      }

      // Exit quiz
      await quizButton.click();
      await page.waitForTimeout(500);
    }

    // ============================================
    // 8. TOUR MODE
    // ============================================
    console.log('\n🎬 8. Analyzing Tour Mode...');

    const tourButton = await page.$('button:has-text("Tour")');
    if (tourButton) {
      await tourButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/07-tour-mode.png', fullPage: true });
      console.log('📸 Screenshot: Tour mode');

      // Check for tour controls
      const nextButton = await page.$('button:has-text("Next")');
      const prevButton = await page.$('button:has-text("Previous")');

      if (!nextButton) {
        issues.push({
          category: 'Tour',
          severity: 'medium',
          description: 'Tour navigation controls not found',
          recommendation: 'Add clear Next/Previous buttons during tour'
        });
      }

      // Exit tour
      const exitTourBtn = await page.$('button:has-text("Exit")');
      if (exitTourBtn) await exitTourBtn.click();
      await page.waitForTimeout(500);
    }

    // ============================================
    // 9. SLICE VIEW
    // ============================================
    console.log('\n🔪 9. Analyzing Slice View...');

    const sliceToggle = await page.$('input[type="checkbox"]');
    if (sliceToggle) {
      await sliceToggle.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/08-slice-view.png', fullPage: true });
      console.log('📸 Screenshot: Slice view enabled');

      // Check for slider
      const slider = await page.$('input[type="range"]');
      if (slider) {
        // Test slider
        await slider.fill('50');
        await page.waitForTimeout(300);
        console.log('  - Slice slider found and tested');
      } else {
        issues.push({
          category: 'Controls',
          severity: 'low',
          description: 'Slice depth slider not found',
          recommendation: 'Add slider to control slice depth'
        });
      }
    }

    // ============================================
    // 10. MOBILE RESPONSIVENESS
    // ============================================
    console.log('\n📱 10. Analyzing Mobile Responsiveness...');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/09-mobile-view.png', fullPage: true });
    console.log('📸 Screenshot: Mobile view');

    // Check if controls are accessible on mobile
    const mobileControls = await page.evaluate(() => {
      const controls = document.querySelectorAll('button');
      let visibleCount = 0;
      let overflowingCount = 0;

      controls.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          visibleCount++;
          if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
            overflowingCount++;
          }
        }
      });

      return { visibleCount, overflowingCount };
    });

    console.log(`  - Visible buttons: ${mobileControls.visibleCount}`);
    console.log(`  - Overflowing buttons: ${mobileControls.overflowingCount}`);

    if (mobileControls.overflowingCount > 0) {
      issues.push({
        category: 'Responsiveness',
        severity: 'medium',
        description: `${mobileControls.overflowingCount} buttons overflow on mobile`,
        recommendation: 'Adjust layout for mobile, use collapsible menus'
      });
    }

    // Check touch targets
    const smallButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      let smallCount = 0;
      buttons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
          smallCount++;
        }
      });
      return smallCount;
    });

    if (smallButtons > 0) {
      issues.push({
        category: 'Mobile UX',
        severity: 'medium',
        description: `${smallButtons} buttons are smaller than 44x44px touch target`,
        recommendation: 'Increase button sizes to at least 44x44px for touch'
      });
    }

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/10-tablet-view.png', fullPage: true });
    console.log('📸 Screenshot: Tablet view');

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });

    // ============================================
    // 11. KEYBOARD NAVIGATION
    // ============================================
    console.log('\n⌨️ 11. Analyzing Keyboard Navigation...');

    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el?.tagName,
        hasOutline: window.getComputedStyle(el as Element).outline !== 'none',
        ariaLabel: el?.getAttribute('aria-label')
      };
    });

    console.log(`  - First focused element: ${focusedElement.tag}`);
    console.log(`  - Has visible focus: ${focusedElement.hasOutline}`);

    if (!focusedElement.hasOutline) {
      issues.push({
        category: 'Accessibility',
        severity: 'high',
        description: 'Focus indicator not visible on keyboard navigation',
        recommendation: 'Add visible focus styles (outline or ring) to interactive elements'
      });
    }

    // Test escape key to close panels
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // ============================================
    // 12. COLOR CONTRAST & READABILITY
    // ============================================
    console.log('\n🎨 12. Analyzing Color Contrast...');

    const contrastIssues = await page.evaluate(() => {
      const issues: string[] = [];
      const elements = document.querySelectorAll('*');

      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        const bgColor = style.backgroundColor;

        // Check for very light text on light backgrounds
        if (color.includes('rgb')) {
          const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (match) {
            const [_, r, g, b] = match.map(Number);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            if (luminance > 0.8 && el.textContent?.trim()) {
              issues.push(`Light text (${color}) on element: ${el.className}`);
            }
          }
        }
      });

      return issues.slice(0, 5);
    });

    if (contrastIssues.length > 0) {
      console.log(`  - Found ${contrastIssues.length} potential contrast issues`);
    }

    // ============================================
    // 13. ERROR STATES
    // ============================================
    console.log('\n⚠️ 13. Analyzing Error States...');

    // Check for error boundary
    const errorBoundary = await page.evaluate(() => {
      // Try to find error boundary elements
      const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
      return errorElements.length;
    });
    console.log(`  - Error UI elements found: ${errorBoundary}`);

    // ============================================
    // 14. ANIMATIONS & TRANSITIONS
    // ============================================
    console.log('\n✨ 14. Analyzing Animations & Transitions...');

    // Check for prefers-reduced-motion support
    const reducedMotionSupport = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets).flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules || []).map(r => r.cssText);
        } catch {
          return [];
        }
      });
      return styles.some(s => s.includes('prefers-reduced-motion'));
    });

    if (!reducedMotionSupport) {
      issues.push({
        category: 'Accessibility',
        severity: 'low',
        description: 'No prefers-reduced-motion support detected',
        recommendation: 'Add @media (prefers-reduced-motion) to disable animations for users who prefer reduced motion'
      });
    }

    // ============================================
    // 15. CONTENT ANALYSIS
    // ============================================
    console.log('\n📝 15. Analyzing Content...');

    // Check for empty states
    const emptyStates = await page.evaluate(() => {
      const panels = document.querySelectorAll('[class*="Panel"]');
      let hasEmptyState = false;
      panels.forEach(p => {
        if (!p.textContent?.trim() || p.textContent.trim().length < 10) {
          hasEmptyState = true;
        }
      });
      return hasEmptyState;
    });

    // Check heading hierarchy
    const headings = await page.evaluate(() => {
      const h1 = document.querySelectorAll('h1').length;
      const h2 = document.querySelectorAll('h2').length;
      const h3 = document.querySelectorAll('h3').length;
      return { h1, h2, h3 };
    });

    console.log(`  - Headings: h1=${headings.h1}, h2=${headings.h2}, h3=${headings.h3}`);

    if (headings.h1 === 0) {
      issues.push({
        category: 'SEO/Accessibility',
        severity: 'medium',
        description: 'No h1 heading found on page',
        recommendation: 'Add a main h1 heading for better SEO and screen reader navigation'
      });
    }

    // ============================================
    // FINAL SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(50));
    console.log('📊 UI/UX EVALUATION SUMMARY');
    console.log('='.repeat(50));

    // Group issues by severity
    const critical = issues.filter(i => i.severity === 'critical');
    const high = issues.filter(i => i.severity === 'high');
    const medium = issues.filter(i => i.severity === 'medium');
    const low = issues.filter(i => i.severity === 'low');

    console.log(`\n🔴 Critical Issues: ${critical.length}`);
    critical.forEach(i => console.log(`   - [${i.category}] ${i.description}`));

    console.log(`\n🟠 High Issues: ${high.length}`);
    high.forEach(i => console.log(`   - [${i.category}] ${i.description}`));

    console.log(`\n🟡 Medium Issues: ${medium.length}`);
    medium.forEach(i => console.log(`   - [${i.category}] ${i.description}`));

    console.log(`\n🟢 Low Issues: ${low.length}`);
    low.forEach(i => console.log(`   - [${i.category}] ${i.description}`));

    console.log(`\n📸 Screenshots saved to ./screenshots/`);

    // Return detailed issues for further analysis
    return issues;

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run evaluation
evaluateUX()
  .then(issues => {
    console.log('\n\n📋 DETAILED RECOMMENDATIONS:');
    console.log('='.repeat(50));
    issues.forEach((issue, i) => {
      console.log(`\n${i + 1}. ${issue.description}`);
      console.log(`   Category: ${issue.category}`);
      console.log(`   Severity: ${issue.severity.toUpperCase()}`);
      console.log(`   Fix: ${issue.recommendation}`);
      if (issue.element) {
        console.log(`   Element: ${issue.element}`);
      }
    });
  })
  .catch(err => {
    console.error('Error during evaluation:', err);
    process.exit(1);
  });
