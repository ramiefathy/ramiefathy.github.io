import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { expect, type Page, type Download } from '@playwright/test'

export type DownloadExpectation = {
  expectedFilename?: RegExp | string
  minBytes?: number
  textMustContain?: string
}

export type CapturedDownload = {
  suggestedFilename: string
  path: string
  bytes: number
  text?: string
}

function normalizeFilenameExpectation(expected: DownloadExpectation['expectedFilename']): RegExp | null {
  if (!expected) return null
  if (expected instanceof RegExp) return expected
  const escaped = expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(escaped)
}

async function saveDownload(download: Download, targetDir: string): Promise<{ filePath: string; bytes: number }> {
  const suggested = download.suggestedFilename()
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const filePath = path.join(targetDir, `${stamp}-${suggested}`)
  await download.saveAs(filePath)
  const stat = await fs.stat(filePath)
  return { filePath, bytes: stat.size }
}

/**
 * Capture a download and optionally validate its filename and minimal content invariants.
 *
 * This is intentionally "basic" validation: enough to catch broken export wiring, without making
 * tests brittle or slow.
 */
export async function captureDownload(
  page: Page,
  clickFn: () => Promise<void>,
  expectation?: DownloadExpectation
): Promise<CapturedDownload> {
  const downloadPromise = page.waitForEvent('download')
  await clickFn()
  const download = await downloadPromise

  const expected = normalizeFilenameExpectation(expectation?.expectedFilename)
  if (expected) {
    expect(download.suggestedFilename()).toMatch(expected)
  }

  const { filePath, bytes } = await saveDownload(download, os.tmpdir())
  if (expectation?.minBytes !== undefined) {
    expect(bytes).toBeGreaterThanOrEqual(expectation.minBytes)
  }

  let text: string | undefined
  if (expectation?.textMustContain) {
    text = await fs.readFile(filePath, 'utf8')
    expect(text).toContain(expectation.textMustContain)
  }

  return {
    suggestedFilename: download.suggestedFilename(),
    path: filePath,
    bytes,
    text
  }
}

