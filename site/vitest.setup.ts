import '@testing-library/jest-dom/vitest';

// Polyfill matchMedia for components that check it during tests.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false
  });
}

if (typeof window !== 'undefined') {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: memoryStorage,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: memoryStorage,
  });

  if (typeof File !== 'undefined' && typeof File.prototype.text !== 'function' && typeof FileReader !== 'undefined') {
    File.prototype.text = function text() {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(reader.error ?? new Error('Unable to read file'));
        reader.readAsText(this);
      });
    };
  }

  if (typeof document !== 'undefined' && typeof document.execCommand !== 'function') {
    document.execCommand = () => false;
  }

  Object.defineProperty(window, 'alert', {
    configurable: true,
    writable: true,
    value: () => undefined,
  });
}
