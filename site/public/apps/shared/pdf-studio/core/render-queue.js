export class RenderQueue {
  constructor({ concurrency = 2 } = {}) {
    this.concurrency = Math.max(1, concurrency)
    this.pending = []
    this.running = new Map()
    this.taskMap = new Map()
  }

  enqueue(key, task) {
    if (typeof task !== 'function') {
      throw new Error('RenderQueue task must be a function that accepts an AbortSignal.')
    }

    this.cancel(key)

    const controller = new AbortController()
    const queueItem = { key, task, controller, resolve: null, reject: null }

    const promise = new Promise((resolve, reject) => {
      queueItem.resolve = resolve
      queueItem.reject = reject
    })

    this.taskMap.set(key, queueItem)
    this.pending.push(queueItem)
    this.#pump()
    return promise
  }

  cancel(key) {
    const active = this.taskMap.get(key)
    if (!active) return false

    active.controller.abort()

    if (this.running.has(key)) {
      this.running.delete(key)
    } else {
      this.pending = this.pending.filter((item) => item.key !== key)
    }

    this.taskMap.delete(key)
    active.reject?.(new DOMException('Cancelled', 'AbortError'))
    return true
  }

  cancelAll() {
    for (const key of Array.from(this.taskMap.keys())) {
      this.cancel(key)
    }
  }

  #pump() {
    while (this.running.size < this.concurrency && this.pending.length > 0) {
      const item = this.pending.shift()
      this.running.set(item.key, item)
      this.#run(item)
    }
  }

  async #run(item) {
    try {
      const result = await item.task(item.controller.signal)
      if (!item.controller.signal.aborted) {
        item.resolve(result)
      }
    } catch (error) {
      item.reject(error)
    } finally {
      this.running.delete(item.key)
      this.taskMap.delete(item.key)
      this.#pump()
    }
  }
}
