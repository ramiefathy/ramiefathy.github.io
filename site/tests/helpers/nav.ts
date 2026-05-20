import { expect, type Locator, type Page } from '@playwright/test'
import { blockExternalRequests } from './network.js'

export type GotoOptions = {
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit'
  readyLocator?: Locator
}

export async function setDeterministicUi(page: Page, viewport = { width: 1280, height: 900 }): Promise<void> {
  await page.setViewportSize(viewport)
  await page.emulateMedia({ reducedMotion: 'reduce' })
}

export async function gotoAndWait(page: Page, route: string, options?: GotoOptions): Promise<void> {
  await blockExternalRequests(page)
  await page.goto(route, { waitUntil: options?.waitUntil || 'networkidle' })
  if (options?.readyLocator) {
    await expect(options.readyLocator).toBeVisible()
  }
}

export async function gotoLegacyAndWaitShell(page: Page, route: string): Promise<void> {
  await gotoAndWait(page, route, { waitUntil: 'networkidle' })
  await expect(page.locator('.legacy-shell')).toBeVisible()
}

