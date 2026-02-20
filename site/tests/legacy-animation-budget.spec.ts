import { expect, test } from '@playwright/test'
import { getLegacyHtmlApps } from './inventory.js'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

type AnimationBudgetSnapshot = {
  runningCount: number
  viewportTargetCount: number
  viewportElementCount: number
  ratio: number
  sampleNames: string[]
}

async function snapshotOnLoadAnimations(page): Promise<AnimationBudgetSnapshot> {
  return page.evaluate(() => {
    const animations = document.getAnimations({ subtree: true })
    const running = animations.filter((a) => a.playState === 'running')

    const viewport = { width: window.innerWidth, height: window.innerHeight }

    const isInViewport = (rect: DOMRect): boolean => {
      if (!rect || rect.width === 0 || rect.height === 0) return false
      return rect.bottom > 0 && rect.right > 0 && rect.top < viewport.height && rect.left < viewport.width
    }

    const visibleElements = Array.from(document.querySelectorAll('body *')).filter((el) => {
      const style = window.getComputedStyle(el)
      if (style.visibility === 'hidden' || style.display === 'none') return false
      const rect = el.getBoundingClientRect()
      return isInViewport(rect)
    })

    const targets = running
      .map((a) => {
        // @ts-expect-error: effect.target exists for CSS animations.
        const target = a.effect?.target as Element | undefined
        return target || null
      })
      .filter((t): t is Element => Boolean(t))

    const uniqueTargets = Array.from(new Set(targets))
    const viewportTargets = uniqueTargets.filter((el) => isInViewport(el.getBoundingClientRect()))

    const ratio = visibleElements.length === 0 ? 0 : viewportTargets.length / visibleElements.length

    const sampleNames = viewportTargets.slice(0, 10).map((el) => {
      const tag = el.tagName.toLowerCase()
      const id = el.id ? `#${el.id}` : ''
      const cls = el.classList?.length ? `.${Array.from(el.classList).slice(0, 2).join('.')}` : ''
      return `${tag}${id}${cls}`
    })

    return {
      runningCount: running.length,
      viewportTargetCount: viewportTargets.length,
      viewportElementCount: visibleElements.length,
      ratio,
      sampleNames
    }
  })
}

test.describe('legacy apps animation budget (hover-only, no noisy on-load motion)', () => {
  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page, { width: 1280, height: 900 })
    await blockExternalRequests(page)
    // For animation budget checks we explicitly do NOT force reduced-motion,
    // since we want to catch unintended default motion.
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  })

  const legacyApps = getLegacyHtmlApps().filter((app) => !app.redirectTo)

  for (const entry of legacyApps) {
    test(`on-load animations stay under budget: ${entry.route}`, async ({ page }) => {
      const runtime = watchRuntime(page)
      await page.goto(entry.route, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('toolbar', { name: 'Page tools' })).toBeVisible()

      // Let any accidental load-triggered animations start.
      await page.waitForTimeout(750)

      const snap = await snapshotOnLoadAnimations(page)

      // Contract: legacy apps should be "clinical tool" style — hover transitions are fine,
      // but on-load running animations should be rare and never dominate the viewport.
      expect(snap.ratio, `animation ratio=${snap.ratio} targets=${snap.sampleNames.join(', ')}`).toBeLessThanOrEqual(0.3)
      expect(snap.runningCount, `running=${snap.runningCount} targets=${snap.sampleNames.join(', ')}`).toBeLessThanOrEqual(12)

      runtime.assertClean()
    })
  }
})

