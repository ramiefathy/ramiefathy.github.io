import { expect, type Page } from '@playwright/test'

type RuntimeWatchOptions = {
  /**
   * Some pages may log expected errors (rare). Prefer to keep this empty and
   * address the root cause instead of filtering aggressively.
   */
  allowConsoleError?: (message: string) => boolean
}

export type RuntimeWatch = {
  consoleErrors: string[]
  pageErrors: string[]
  requestFailures: string[]
  assertClean: () => void
}

function isLocalDevUrl(url: string): boolean {
  return url.startsWith('http://127.0.0.1') || url.startsWith('http://localhost') || url.startsWith('http://[::1]')
}

/**
 * Abort external network calls without intercepting local dev/preview server traffic.
 *
 * Why: Intercepting a catch-all glob route adds overhead and can cause hydration/navigation
 * timeouts under parallel Playwright workers. A regex route only matches remote requests.
 */
export async function blockExternalRequests(page: Page): Promise<void> {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|\[::1\])/i, async (route) => {
    await route.abort()
  })
}

/**
 * Capture runtime issues for the current page and provide a single assert to keep tests tidy.
 */
export function watchRuntime(page: Page, options?: RuntimeWatchOptions): RuntimeWatch {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  const requestFailures: string[] = []
  const allowConsoleError = options?.allowConsoleError

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (allowConsoleError && allowConsoleError(text)) return
    consoleErrors.push(text)
  })

  page.on('pageerror', (error) => {
    pageErrors.push(error.message)
  })

  page.on('requestfailed', (request) => {
    const url = request.url()
    if (!isLocalDevUrl(url)) return
    const errorText = request.failure()?.errorText || 'unknown'
    // Playwright/Chromium reports aborted in-flight requests during navigation as request failures.
    // These are expected when tests intentionally navigate away mid-load (e.g. link click + back).
    if (/net::ERR_ABORTED/i.test(errorText)) return
    requestFailures.push(`${request.method()} ${url} :: ${errorText}`)
  })

  return {
    consoleErrors,
    pageErrors,
    requestFailures,
    assertClean() {
      expect(requestFailures).toEqual([])
      expect(pageErrors).toEqual([])
      expect(consoleErrors).toEqual([])
    }
  }
}
