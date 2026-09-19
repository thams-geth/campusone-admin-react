import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement matchMedia; Ant Design's responsive Grid hooks
// (Grid.useBreakpoint, used by e.g. Flex and AdminLayout's mobile/desktop
// switch) call it on mount. jsdom's own default viewport (1024px) is a
// reasonable "desktop" default, so evaluate real min-width queries against
// it instead of hardcoding `matches: false` — otherwise every breakpoint
// reports false and components render as if on a phone in every test.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => {
    const minWidthMatch = /min-width:\s*(\d+(?:\.\d+)?)px/.exec(query)
    const matches = minWidthMatch ? window.innerWidth >= Number(minWidthMatch[1]) : false
    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }
  }
}

// jsdom doesn't implement ResizeObserver; used by Ant Design components
// like Dropdown/Menu that measure their content (via rc-resize-observer).
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}
