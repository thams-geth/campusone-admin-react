import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useNavigate } from 'react-router-dom'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ScrollManager } from '@/app/router/ScrollManager'

function PageA() {
  const navigate = useNavigate()
  return (
    <div>
      <span>Page A</span>
      <button onClick={() => navigate('/b')}>Go to B</button>
    </div>
  )
}

function PageB() {
  const navigate = useNavigate()
  return (
    <div>
      <span>Page B</span>
      <button onClick={() => navigate(-1)}>Back</button>
    </div>
  )
}

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/a']}>
      <ScrollManager />
      <Routes>
        <Route path="/a" element={<PageA />} />
        <Route path="/b" element={<PageB />} />
      </Routes>
    </MemoryRouter>,
  )
}

/** documentElement.scrollHeight is always 0 in jsdom (no real layout) — stub it per test. */
function mockScrollHeight(value: number) {
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value })
}

beforeEach(() => {
  mockScrollHeight(0)
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
  vi.spyOn(window, 'scrollTo').mockImplementation(((x: number | ScrollToOptions, y?: number) => {
    const target = typeof x === 'object' ? (x.top ?? 0) : (y ?? 0)
    Object.defineProperty(window, 'scrollY', { configurable: true, value: target })
  }) as typeof window.scrollTo)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ScrollManager', () => {
  it('scrolls to top on a forward (PUSH) navigation', async () => {
    const user = userEvent.setup()
    renderApp()

    await screen.findByText('Page A')
    await user.click(screen.getByText('Go to B'))

    await screen.findByText('Page B')
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('restores the remembered scroll position on a back (POP) navigation, once the page is tall enough', async () => {
    const user = userEvent.setup()
    renderApp()

    await screen.findByText('Page A')
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 640 })
    window.dispatchEvent(new Event('scroll'))

    await user.click(screen.getByText('Go to B'))
    await screen.findByText('Page B')

    await user.click(screen.getByText('Back'))
    await screen.findByText('Page A')

    // Page A starts back out "too short" (scrollHeight 0) while it reloads —
    // the restore should not fire yet.
    expect(window.scrollTo).not.toHaveBeenCalledWith(0, 640)

    // Once its content is tall enough again, the next animation frame restores it.
    mockScrollHeight(1440)
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    })

    expect(window.scrollTo).toHaveBeenCalledWith(0, 640)
  })
})
