import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement matchMedia; Ant Design's responsive Grid hooks
// (used by e.g. Flex) call it on mount.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}
