import { expect, test } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

const route = '/apps/rheum-derm-clinical-trials/'

test.describe('Rheum–Derm Clinical Trials release governance', () => {
  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page, { width: 1280, height: 900 })
    await blockExternalRequests(page)
  })

  test('renders an unavoidable research and source-transparency boundary', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto(route, { waitUntil: 'networkidle' })

    const boundary = page.locator('#rheum-derm-trials-research-boundary')
    await expect(boundary).toBeVisible()
    await expect(boundary).toContainText('Research evidence dashboard')
    await expect(boundary).toContainText('214 embedded study and program records')
    await expect(boundary).toContainText(/registered study is not evidence of positive efficacy/i)
    await expect(boundary).toContainText(/Normalized source records are not yet published/i)
    await expect(boundary.getByRole('link', { name: 'Source status' })).toHaveAttribute('href', './source-manifest.json')
    await expect(boundary.getByRole('link', { name: 'Release integrity' })).toHaveAttribute('href', './release-manifest.json')
    await expect(boundary.getByRole('link', { name: 'Accessible fallback' })).toHaveAttribute('href', './fallback.html')

    runtime.assertClean()
  })

  test('publishes matching source and deployed-artifact manifests', async ({ request }) => {
    const sourceResponse = await request.get(`${route}source-manifest.json`)
    const releaseResponse = await request.get(`${route}release-manifest.json`)

    expect(sourceResponse.status()).toBe(200)
    expect(releaseResponse.status()).toBe(200)

    const source = await sourceResponse.json()
    const release = await releaseResponse.json()

    expect(source.classification).toBe('research evidence dashboard')
    expect(source.clinicalUse).toBe('research only')
    expect(source.recordCountClaim).toBe(214)
    expect(source.normalizedSourceRecords.status).toBe('not-yet-published')
    expect(source.normalizedSourceRecords.releaseBlockerForReviewedReference).toBe(true)
    expect(source.verifiedPayload.decodedHtmlSha256).toBe('7da4751bb81838b1dfd7be71a4209d0b90fbcea0c0235b07d6e1da2f4f4e86dc')

    expect(release.classification).toBe(source.classification)
    expect(release.clinicalUse).toBe(source.clinicalUse)
    expect(release.recordCountClaim).toBe(source.recordCountClaim)
    expect(release.normalizedSourceStatus).toBe(source.normalizedSourceRecords.status)
    expect(release.sourceArtifact.sha256).toBe(source.verifiedPayload.decodedHtmlSha256)
    expect(release.sourceArtifact.gzipSha256).toBe(source.verifiedPayload.gzipSha256)
    expect(release.deployedArtifact.instrumentation).toBe('research-boundary-v1')
    expect(release.deployedArtifact.bytes).toBeGreaterThan(release.sourceArtifact.bytes)
    expect(release.files).toEqual(expect.arrayContaining(['index.html', 'source-manifest.json', 'release-manifest.json', 'fallback.html']))
  })

  test('serves an accessible fallback that does not overstate record transparency', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto(`${route}fallback.html`, { waitUntil: 'networkidle' })

    await expect(page.getByRole('heading', { name: 'Rheum–Derm Clinical Trials Evidence Dashboard' })).toBeVisible()
    await expect(page.locator('.boundary')).toContainText('214 embedded study and program records')
    await expect(page.locator('.boundary')).toContainText(/Normalized record-level source data are not yet published/i)
    await expect(page.getByRole('link', { name: 'Source-status manifest' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Release-integrity manifest' })).toBeVisible()

    runtime.assertClean()
  })
})
