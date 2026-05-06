import { expect, test } from '@playwright/test'

test.describe('Egypt AI podcast series', () => {
  test('renders unlisted podcast page with seven playable episodes', async ({ page, request }) => {
    await page.goto('/strategy/egypt-ai-portfolio/podcast')

    await expect(page).toHaveTitle(/Egypt AI Portfolio Podcast Series/)
    await expect(page.locator('meta[name="robots"][content="noindex, nofollow"]')).toHaveCount(1)
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Egypt AI Portfolio Podcast Series' })).toBeVisible()
    await expect(page.getByText('7 episodes')).toBeVisible()
    await expect(page.getByText('gemini-2.5-pro-preview-tts')).toBeVisible()
    await expect(page.getByText('Voice: Sadaltager')).toBeVisible()

    const episodeCards = page.locator('.episode-card')
    await expect(episodeCards).toHaveCount(7)
    await expect(page.locator('audio')).toHaveCount(7)

    const firstAudioSrc = await page.locator('audio').first().getAttribute('src')
    expect(firstAudioSrc).toBe('/strategy/egypt-ai-portfolio/podcast/episode-01.mp3')
    const audioResponse = await request.get(firstAudioSrc!)
    expect(audioResponse.status()).toBe(200)
    expect(audioResponse.headers()['content-type']).toMatch(/audio|mpeg|octet-stream/i)
  })

  test('dashboard links to podcast page without public-site navigation exposure', async ({ page }) => {
    await page.goto('/strategy/egypt-ai-portfolio/')
    const podcastLink = page.getByRole('link', { name: /listen to podcast series/i })
    await expect(podcastLink).toBeVisible()
    await expect(podcastLink).toHaveAttribute('href', '/strategy/egypt-ai-portfolio/podcast')
  })
})
