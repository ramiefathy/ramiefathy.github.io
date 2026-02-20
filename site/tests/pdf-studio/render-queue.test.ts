import { describe, expect, it } from 'vitest'

import { RenderQueue } from '../../public/apps/shared/pdf-studio/core/render-queue.js'

describe('RenderQueue', () => {
  it('runs queued tasks and preserves completion', async () => {
    const queue = new RenderQueue({ concurrency: 1 })
    const order: string[] = []

    await queue.enqueue('a', async () => {
      order.push('a')
    })

    await queue.enqueue('b', async () => {
      order.push('b')
    })

    expect(order).toEqual(['a', 'b'])
  })

  it('cancels superseded work by key', async () => {
    const queue = new RenderQueue({ concurrency: 1 })
    const order: string[] = []

    const first = queue.enqueue('thumb-1', async (signal) => {
      await new Promise((resolve) => setTimeout(resolve, 20))
      if (signal.aborted) return
      order.push('old')
    })

    const second = queue.enqueue('thumb-1', async () => {
      order.push('new')
    })

    await expect(first).rejects.toThrow(/Cancelled|AbortError/)
    await second
    expect(order).toEqual(['new'])
  })
})
