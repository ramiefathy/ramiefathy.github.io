import { RenderQueue } from './render-queue.js'

/**
 * Lazy thumbnail rendering helper using IntersectionObserver and cancelable queue.
 */
export class ThumbnailVirtualizer {
  constructor({ container, onRender, rootMargin = '240px', concurrency = 2 }) {
    this.container = container
    this.onRender = onRender
    this.queue = new RenderQueue({ concurrency })
    this.observed = new Map()

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const key = entry.target.getAttribute('data-thumb-key')
          if (!key) return
          if (entry.isIntersecting) {
            this.#enqueue(key)
          } else {
            this.queue.cancel(key)
          }
        })
      },
      {
        root: container,
        rootMargin,
        threshold: 0.01
      }
    )
  }

  register(element, key, payload) {
    element.setAttribute('data-thumb-key', key)
    this.observed.set(key, { element, payload })
    this.observer.observe(element)
  }

  unregisterAll() {
    this.queue.cancelAll()
    this.observer.disconnect()
    this.observed.clear()
  }

  #enqueue(key) {
    const entry = this.observed.get(key)
    if (!entry) return
    this.queue.enqueue(key, async (signal) => {
      await this.onRender(entry.element, entry.payload, signal)
    }).catch((error) => {
      if (error?.name !== 'AbortError') {
        console.error('Thumbnail render error', error)
      }
    })
  }
}
