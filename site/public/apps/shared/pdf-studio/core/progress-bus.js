export function createProgressBus() {
  const listeners = new Set()

  return {
    emit(payload) {
      listeners.forEach((listener) => listener(payload))
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
  }
}
