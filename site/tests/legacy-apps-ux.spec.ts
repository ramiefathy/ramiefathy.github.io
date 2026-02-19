import { expect, test } from '@playwright/test'
import { getLegacyHtmlApps } from './inventory.js'

const legacyApps = getLegacyHtmlApps()
const interactivePages = legacyApps.filter((entry) => !entry.redirectTo).map((entry) => entry.route)
const redirectPages = legacyApps.filter((entry) => entry.redirectTo)
const pdfWorkflowRoutes = [
  '/apps/pdf-studio.html?tool=assemble',
  '/apps/pdf-studio.html?tool=extract',
  '/apps/pdf-studio.html?tool=textextract'
]
const mindmapRoutes = [
  '/apps/MindMaps/CTCL/CTCLMindMaps.html',
  '/apps/MindMaps/Psoriasis/PsoriasisMindMaps.html',
  '/apps/MindMaps/Alopecia/AlopeciaMindMaps.html'
]
const bannedMindmapColors = ['#c4b5fd', '#ddd6fe', '#e9d5ff', '#f3e8ff', '#faf5ff']

  test.describe('legacy app UX modernization baseline', () => {
  for (const path of interactivePages) {
    test(`${path} renders legacy shell and keyboard focus affordances`, async ({ page }) => {
      const consoleErrors: string[] = []
      const pageErrors: string[] = []
      const requestFailures: string[] = []

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })
      page.on('pageerror', (error) => pageErrors.push(error.message))
      page.on('requestfailed', (request) => {
        const url = request.url()
        if (url.startsWith('http://127.0.0.1:4321/')) {
          requestFailures.push(`${request.method()} ${url} :: ${request.failure()?.errorText || 'unknown'}`)
        }
      })

      await page.goto(path, { waitUntil: 'networkidle' })
      await expect(page.locator('.legacy-shell')).toBeVisible()
      await expect(page.locator('.legacy-shell__action[data-action="help"]')).toBeVisible()

      await page.keyboard.press('Tab')
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase() || '')
      expect(focusedTag.length).toBeGreaterThan(0)

      expect(consoleErrors).toEqual([])
      expect(pageErrors).toEqual([])
      expect(requestFailures).toEqual([])
    })
  }

  test('legacy redirect routes forward to PDF Studio deep links', async ({ page }) => {
    for (const redirectEntry of redirectPages) {
      if (!redirectEntry.route.includes('PDF') && !redirectEntry.route.includes('textExtractor')) continue

      await page.goto(redirectEntry.route, { waitUntil: 'domcontentloaded' })
      await expect(page).toHaveURL(new RegExp(redirectEntry.redirectTo!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    }
  })

  test('legacy shell help dialog renders per-app help steps when provided', async ({ page }) => {
    await page.goto('/apps/pdf-studio.html?tool=assemble', { waitUntil: 'networkidle' })
    await page.click('.legacy-shell__action[data-action="help"]')
    await expect(page.locator('#legacy-shell-help')).toHaveAttribute('aria-hidden', 'false')
    await expect(page.locator('.legacy-shell__help-steps')).toBeVisible()
    await expect(page.locator('.legacy-shell__help-steps')).toContainText('Pick a tool in the left panel')
  })

  test('mindmap search supports next/previous result navigation and details panel', async ({ page }) => {
    await page.goto('/apps/MindMaps/CTCL/CTCLMindMaps.html', { waitUntil: 'networkidle' })
    await page.fill('#search-input', 'treatment')
    await page.waitForTimeout(500)
    await expect(page.locator('#search-next')).toBeVisible()
    await expect(page.locator('#search-prev')).toBeVisible()
    await page.click('#search-next')
    await expect(page.locator('#selected-node-title')).not.toHaveText('Select a node')
  })

  test('pdf merger shows preflight before merge action', async ({ page }) => {
    await page.goto('/apps/pdf-studio.html?tool=assemble', { waitUntil: 'networkidle' })
    await expect(page.locator('#pdf-studio-secondary')).toContainText('Preflight')
    await expect(page.locator('#pdf-studio-secondary')).toContainText('Add PDFs')
  })

  test('scribe surfaces autosave recovery banner confidence', async ({ page }) => {
    await page.addInitScript(() => {
      const snapshot = JSON.stringify({
        id: 991,
        type: 'autosave',
        timestamp: new Date().toISOString(),
        transcript: 'Recovered transcript text'
      })
      localStorage.setItem('legacy_recovery_seed', snapshot)
    })
    await page.goto('/apps/dermatology-scribe/index.html', { waitUntil: 'networkidle' })
    await expect(page.locator('#recovery-banner')).toBeVisible()
    await expect(page.locator('#recovery-banner')).toContainText('Recovered from')
  })

  test('scribe default theme uses shared legacy background tokens', async ({ page }) => {
    await page.goto('/apps/dermatology-scribe/index.html', { waitUntil: 'networkidle' })
    const backgroundColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(backgroundColor).toBe('rgb(240, 253, 250)')
  })

  test('scribe landing loads without overlapping fixed or absolute overlays', async ({ page }) => {
    await page.setViewportSize({ width: 1365, height: 900 })
    await page.goto('/apps/dermatology-scribe/index.html', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const hasOverlap = await page.evaluate(() => {
      const landingCard = document.querySelector('.landing-card')
      if (!landingCard) return true

      const landingRect = landingCard.getBoundingClientRect()
      const overlayCandidates = Array.from(document.body.querySelectorAll('*')).filter((el) => {
        const styles = getComputedStyle(el)
        if (!styles) return false
        if (!['fixed', 'absolute'].includes(styles.position)) return false
        if (styles.display === 'none' || styles.visibility === 'hidden' || Number(styles.opacity) === 0) return false
        if (el.closest('.legacy-shell')) return false
        return true
      })

      return overlayCandidates.some((element) => {
        const rect = element.getBoundingClientRect()
        if (rect.width < 8 || rect.height < 8) return false
        return !(
          rect.right <= landingRect.left ||
          rect.left >= landingRect.right ||
          rect.bottom <= landingRect.top ||
          rect.top >= landingRect.bottom
        )
      })
    })

    expect(hasOverlap).toBe(false)
    await expect(page.getByText('Skip to notes')).toHaveCount(0)
    await expect(page.getByText('Skip to controls')).toHaveCount(0)
    await expect(page.locator('.quick-actions-bar')).toHaveCount(0)
    await expect(page.locator('.theme-toggle-button')).toHaveCount(0)
    await expect(page.locator('.focus-mode-controls')).toHaveCount(0)

    const hierarchyOrder = await page.evaluate(() => {
      const modeGrid = document.querySelector('.mode-grid')
      const connectionSettings = document.querySelector('#connectionSettings')
      if (!modeGrid || !connectionSettings) return null
      const modePos = modeGrid.compareDocumentPosition(connectionSettings)
      return {
        modeBeforeConnection: Boolean(modePos & Node.DOCUMENT_POSITION_FOLLOWING)
      }
    })

    expect(hierarchyOrder).not.toBeNull()
    expect((hierarchyOrder as { modeBeforeConnection: boolean }).modeBeforeConnection).toBe(true)
  })

  test('shell remains top-stacked for shell-enabled PDF pages', async ({ page }) => {
    await page.setViewportSize({ width: 1365, height: 900 })

    for (const route of ['/apps/pdf-studio.html?tool=extract', '/apps/pdf-studio.html?tool=textextract']) {
      await page.goto(route, { waitUntil: 'networkidle' })
      const metrics = await page.evaluate(() => {
        const shell = document.querySelector('.legacy-shell')
        const workflow = document.querySelector('[data-workflow="pdf"]')
        if (!shell || !workflow) {
          return null
        }
        const shellRect = shell.getBoundingClientRect()
        const workflowRect = workflow.getBoundingClientRect()
        return { shellBottom: shellRect.bottom, workflowTop: workflowRect.top }
      })

      expect(metrics, `${route} is missing shell/workflow structure`).not.toBeNull()
      expect((metrics as { shellBottom: number; workflowTop: number }).shellBottom).toBeLessThan(
        (metrics as { shellBottom: number; workflowTop: number }).workflowTop
      )
    }
  })

  test('scribe UI test page does not render the old celebratory gradient toast', async ({ page }) => {
    await page.goto('/apps/dermatology-scribe/test-ui-enhancements.html', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1400)
    await expect(page.getByText('Welcome to UI Enhancements! 🎉')).toHaveCount(0)
  })

  test('mindmaps avoid banned purple node palette and render with sufficient initial framing', async ({ page }) => {
    await page.setViewportSize({ width: 1365, height: 900 })

    for (const route of mindmapRoutes) {
      await page.goto(route, { waitUntil: 'networkidle' })
      await page.waitForTimeout(300)

      const data = await page.evaluate((banned) => {
        const circles = Array.from(document.querySelectorAll('.nodes-group circle'))
        const fills = circles
          .map((circle) => getComputedStyle(circle as SVGCircleElement).fill.trim().toLowerCase())
          .filter(Boolean)
        const hasBannedFill = fills.some((fill) => banned.includes(fill))
        const hasBlackFill = fills.some((fill) => fill === 'rgb(0, 0, 0)' || fill === 'rgba(0, 0, 0, 0)')

        const svg = document.querySelector('#mind-map-container svg') as SVGSVGElement | null
        const nodeGroup = document.querySelector('.nodes-group') as SVGGElement | null
        if (!svg || !nodeGroup) {
          return {
            hasBannedFill,
            hasBlackFill,
            widthCoverage: 0,
            heightCoverage: 0
          }
        }

        const viewBox = svg.viewBox.baseVal
        const mapWidth = viewBox?.width || svg.clientWidth || 1
        const mapHeight = viewBox?.height || svg.clientHeight || 1
        const bbox = nodeGroup.getBBox()

        return {
          hasBannedFill,
          hasBlackFill,
          widthCoverage: bbox.width / mapWidth,
          heightCoverage: bbox.height / mapHeight
        }
      }, bannedMindmapColors)

      expect(data.hasBannedFill, `${route} still uses banned purple fills`).toBe(false)
      expect(data.hasBlackFill, `${route} has invalid black/transparent node fills (likely CSS var resolution failure)`).toBe(false)
      expect(data.widthCoverage, `${route} initial map footprint is too small (width)`).toBeGreaterThan(0.16)
      expect(data.heightCoverage, `${route} initial map footprint is too small (height)`).toBeGreaterThan(0.16)
    }
  })

  test('mindmaps initial node circles are fully visible and toolbar does not overlap graph nodes', async ({ page }) => {
    await page.setViewportSize({ width: 1365, height: 900 })

    for (const route of mindmapRoutes) {
      await page.goto(route, { waitUntil: 'networkidle' })
      await page.waitForTimeout(300)

      const analysis = await page.evaluate(() => {
        const svg = document.querySelector('#mind-map-container svg') as SVGSVGElement | null
        if (!svg) return { clippedNodes: 1, overlapCount: 1, labelOverflowCount: 1 }

        const svgRect = svg.getBoundingClientRect()
        const circles = Array.from(document.querySelectorAll('.nodes-group circle')) as SVGCircleElement[]
        const clippedNodes = circles.filter((circle) => {
          const rect = circle.getBoundingClientRect()
          return (
            rect.left < svgRect.left ||
            rect.top < svgRect.top ||
            rect.right > svgRect.right ||
            rect.bottom > svgRect.bottom
          )
        }).length

        const toolbar = document.querySelector('.mindmap-toolbar') as HTMLElement | null
        let overlapCount = 0
        if (toolbar) {
          const toolbarRect = toolbar.getBoundingClientRect()
          overlapCount = circles.filter((circle) => {
            const rect = circle.getBoundingClientRect()
            return !(
              rect.right <= toolbarRect.left ||
              rect.left >= toolbarRect.right ||
              rect.bottom <= toolbarRect.top ||
              rect.top >= toolbarRect.bottom
            )
          }).length
        }

        const nodes = Array.from(document.querySelectorAll('.nodes-group .node')) as SVGElement[]
        const labelOverflowCount = nodes.filter((node) => {
          const circle = node.querySelector('circle') as SVGCircleElement | null
          const text = node.querySelector('text') as SVGTextElement | null
          if (!circle || !text) return false
          const radius = Number.parseFloat(circle.getAttribute('r') || '0')
          if (!Number.isFinite(radius) || radius <= 0) return false

          const textBox = text.getBBox()
          if (textBox.width <= 0 || textBox.height <= 0) return false

          const corners = [
            { x: textBox.x, y: textBox.y },
            { x: textBox.x + textBox.width, y: textBox.y },
            { x: textBox.x, y: textBox.y + textBox.height },
            { x: textBox.x + textBox.width, y: textBox.y + textBox.height }
          ]

          const padding = 0.5
          return corners.some((corner) => Math.hypot(corner.x, corner.y) > radius - padding)
        }).length

        return { clippedNodes, overlapCount, labelOverflowCount }
      })

      expect(analysis.clippedNodes, `${route} has clipped node circles`).toBe(0)
      expect(analysis.overlapCount, `${route} toolbar overlaps node circles`).toBe(0)
      expect(analysis.labelOverflowCount, `${route} has labels overflowing node bounds`).toBe(0)
    }
  })

  test('mindmaps node labels stay readable without shard-line truncation', async ({ page }) => {
    await page.setViewportSize({ width: 1365, height: 900 })

    for (const route of mindmapRoutes) {
      await page.goto(route, { waitUntil: 'networkidle' })
      await page.waitForTimeout(350)

      const findings = await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll('.nodes-group .node')) as SVGElement[]
        const offenders: Array<{ label: string; lines: string[]; reason: string; fontSize: number }> = []
        let fontSizeViolations = 0

        const isMicroLine = (line: string): boolean => /^[A-Za-z]{1,2}(?:…)?$/.test(line)

        nodes.forEach((node) => {
          const text = node.querySelector('text') as SVGTextElement | null
          if (!text) return

          const fontSize = Number.parseFloat(getComputedStyle(text).fontSize || '0')
          if (!Number.isFinite(fontSize) || fontSize < 14) {
            fontSizeViolations += 1
          }

          const label = (text.textContent || '').trim()
          const tspans = Array.from(text.querySelectorAll('tspan')) as SVGTSpanElement[]
          const lines = (tspans.length ? tspans : [text as unknown as SVGTSpanElement])
            .map((tspan) => (tspan.textContent || '').trim())
            .filter(Boolean)

          if (!lines.length) return

          const ellipsisCount = lines.filter((line) => line.endsWith('…')).length
          if (ellipsisCount > 1) {
            offenders.push({ label, lines, reason: 'multiple-ellipsis-lines', fontSize })
            return
          }

          lines.forEach((line, idx) => {
            const isLast = idx === lines.length - 1
            if (!isLast && line.endsWith('…')) {
              offenders.push({ label, lines, reason: 'ellipsis-on-nonfinal-line', fontSize })
              return
            }

            if (lines.length > 1 && isMicroLine(line)) {
              offenders.push({ label, lines, reason: isLast ? 'micro-final-line' : 'micro-line', fontSize })
            }
          })
        })

        return {
          fontSizeViolations,
          offenderCount: offenders.length,
          examples: offenders.slice(0, 4)
        }
      })

      expect(findings.fontSizeViolations, `${route} has node labels smaller than 14px`).toBe(0)
      expect(
        findings.offenderCount,
        `${route} has shard-line truncation issues: ${JSON.stringify(findings.examples)}`
      ).toBe(0)
    }
  })

  test('psoriasis mindmap bottom child node is fully visible at initial render', async ({ page }) => {
    await page.setViewportSize({ width: 1365, height: 900 })
    await page.goto('/apps/MindMaps/Psoriasis/PsoriasisMindMaps.html', { waitUntil: 'networkidle' })
    await page.waitForTimeout(350)

    const clippedBottomNode = await page.evaluate(() => {
      const svg = document.querySelector('#mind-map-container svg') as SVGSVGElement | null
      if (!svg) return true
      const svgRect = svg.getBoundingClientRect()
      const labels = Array.from(document.querySelectorAll('.nodes-group .node text')) as SVGTextElement[]
      const bottomNodeLabel = labels.find((label) => label.textContent?.toLowerCase().includes('il-23'))
      if (!bottomNodeLabel) return true

      const node = bottomNodeLabel.closest('.node') as SVGElement | null
      const circle = node?.querySelector('circle') as SVGCircleElement | null
      if (!circle) return true

      const rect = circle.getBoundingClientRect()
      return (
        rect.left < svgRect.left ||
        rect.top < svgRect.top ||
        rect.right > svgRect.right ||
        rect.bottom > svgRect.bottom
      )
    })

    expect(clippedBottomNode).toBe(false)
  })

  test('woundcare archive keeps reference banner and generated TOC', async ({ page }) => {
    await page.goto('/apps/WoundCareWebpages.html', { waitUntil: 'networkidle' })
    await expect(page.locator('.cl-archive-banner')).toBeVisible()

    const tocLinkCount = await page.locator('#generated-toc a').count()
    expect(tocLinkCount).toBeGreaterThan(0)
  })

  test('biologic dashboard keeps sticky jump navigation and avoids banned purple badge color', async ({ page }) => {
    await page.setViewportSize({ width: 1365, height: 900 })
    await page.goto('/apps/biologic-monitoring-dashboard/index.html', { waitUntil: 'networkidle' })

    await expect(page.locator('.jump-nav')).toBeVisible()
    const jumpNavPosition = await page.evaluate(() => {
      const nav = document.querySelector('.jump-nav')
      if (!nav) return null
      return getComputedStyle(nav).position
    })
    expect(jumpNavPosition).toBe('sticky')

    const hasBannedBadgeColor = await page.evaluate(() => {
      const badge = document.querySelector('.badge-rems') as HTMLElement | null
      if (!badge) return false
      const color = getComputedStyle(badge).color
      return color === 'rgb(124, 58, 237)'
    })
    expect(hasBannedBadgeColor).toBe(false)
  })

  test('PDF tools expose a consistent 60/40 workflow split on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1365, height: 900 })

    for (const route of pdfWorkflowRoutes) {
      await page.goto(route, { waitUntil: 'networkidle' })
      const split = await page.evaluate(() => {
        const workflow = document.querySelector('[data-workflow="pdf"]')
        const primary = document.querySelector('.legacy-workflow__primary')
        const secondary = document.querySelector('.legacy-workflow__secondary')
        if (!workflow || !primary || !secondary) {
          return null
        }
        const primaryRect = primary.getBoundingClientRect()
        const secondaryRect = secondary.getBoundingClientRect()
        const total = primaryRect.width + secondaryRect.width || 1
        return {
          primaryRatio: primaryRect.width / total,
          secondaryRatio: secondaryRect.width / total
        }
      })

      expect(split, `${route} missing workflow layout hooks`).not.toBeNull()
      expect((split as { primaryRatio: number }).primaryRatio).toBeGreaterThanOrEqual(0.54)
      expect((split as { primaryRatio: number }).primaryRatio).toBeLessThanOrEqual(0.68)
      expect((split as { secondaryRatio: number }).secondaryRatio).toBeGreaterThanOrEqual(0.32)
      expect((split as { secondaryRatio: number }).secondaryRatio).toBeLessThanOrEqual(0.46)
    }
  })

  test('PDF tools share the same file-input component class structure', async ({ page }) => {
    for (const route of ['/apps/pdf-studio.html?tool=organizer', '/apps/pdf-studio.html?tool=extract', '/apps/pdf-studio.html?tool=textextract']) {
      await page.goto(route, { waitUntil: 'networkidle' })
      await expect(page.locator('.cl-file-input')).toHaveCount(1)
      await expect(page.locator('.cl-file-input__trigger')).toHaveCount(1)
      await expect(page.locator('.cl-file-input__status')).toHaveCount(1)
    }
  })

  test('differentials defaults to primary tab set and hides zero favorites badge', async ({ page }) => {
    await page.goto('/apps/dermatopathology-differentials.html', { waitUntil: 'networkidle' })

    const visibleTabs = page.locator('#tab-nav [role="tab"]:visible')
    await expect(visibleTabs).toHaveCount(4)

    const advancedVisible = page.locator('#tab-nav [role="tab"][data-tier="advanced"]:visible')
    await expect(advancedVisible).toHaveCount(0)

    const favoritesBadge = page.locator('#favorites-count')
    await expect(favoritesBadge).toHaveCount(0)
  })

  test('dermatopathology stabilized page removes old subtitle and de-emphasizes streak', async ({ page }) => {
    await page.goto('/apps/dermatopathology-modern/index-fixed.html', { waitUntil: 'networkidle' })
    await expect(page.getByText('Modern Learning Experience')).toHaveCount(0)
    await expect(page.locator('.streak-badge:visible')).toHaveCount(0)
  })

  test('legacy apps index footer year is current', async ({ page }) => {
    await page.goto('/apps/index.html', { waitUntil: 'networkidle' })
    await expect(page.locator('footer')).toContainText('© 2026')
  })

  test('legacy PDF pages use non-full-width primary CTA buttons', async ({ page }) => {
    await page.setViewportSize({ width: 1365, height: 900 })
    for (const route of pdfWorkflowRoutes) {
      await page.goto(route, { waitUntil: 'networkidle' })
      const ratio = await page.evaluate(() => {
        const cta = document.querySelector('.cl-btn-primary') as HTMLElement | null
        if (!cta) return null

        const containingPanel = cta.closest('.legacy-workflow__panel') as HTMLElement | null
        if (!containingPanel) return null

        return cta.getBoundingClientRect().width / containingPanel.getBoundingClientRect().width
      })

      expect(ratio, `${route} missing panel/primary CTA`).not.toBeNull()
      expect(ratio as number, `${route} primary CTA appears full-width`).toBeLessThan(0.8)
    }
  })

  test('user-facing pages keep runtime body font size at or above 14px', async ({ page }) => {
    for (const route of interactivePages) {
      await page.goto(route, { waitUntil: 'networkidle' })
      const fontSize = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.body).fontSize))
      expect(fontSize, `${route} body font size is below 14px`).toBeGreaterThanOrEqual(14)
    }
  })

	  test('suite uses neutral page background outside MindMaps and cards have a subtle rest shadow', async ({ page }) => {
	    await page.setViewportSize({ width: 1280, height: 800 })

    const nonMindmapRoutes = [
      '/apps/index.html',
      '/apps/dermatopathology-differentials.html',
      '/apps/biologic-monitoring-dashboard/index.html',
      '/apps/pdf-studio.html?tool=organizer',
      '/apps/dermatopathology-modern/index-fixed.html',
      '/apps/dermatology-scribe/index.html'
    ]

	    for (const route of nonMindmapRoutes) {
	      await page.goto(route, { waitUntil: 'networkidle' })
	      const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
	      expect(bodyBg, `${route} body background should be neutral slate-50`).toBe('rgb(248, 250, 252)')
	    }

	    await page.goto('/apps/PDF%20Merger.html', { waitUntil: 'networkidle' })
	    const panelShadow = await page.evaluate(() => {
	      const panel = document.querySelector('.legacy-workflow__panel') as HTMLElement | null
	      if (!panel) return null
	      return getComputedStyle(panel).boxShadow
	    })
	    expect(panelShadow, 'Expected at least one .legacy-workflow__panel to exist for rest-shadow check').not.toBeNull()
	    expect(panelShadow as string, 'Expected panels to have a non-none rest shadow').not.toBe('none')
	  })

  test('MindMaps preserve teal canvas boundary color on the map container', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/apps/MindMaps/CTCL/CTCLMindMaps.html', { waitUntil: 'networkidle' })
    await page.waitForTimeout(200)

    const canvasBg = await page.evaluate(() => {
      const container = document.querySelector('#mind-map-container') as HTMLElement | null
      if (!container) return null
      return getComputedStyle(container).backgroundColor
    })
    expect(canvasBg, 'MindMaps CTCL missing #mind-map-container').not.toBeNull()
    expect(canvasBg as string, 'MindMaps canvas background should remain teal-tinted').toBe('rgb(240, 253, 250)')
  })
})
