import { useEffect, useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Plain BrowserRouter (not the data router) has no built-in scroll
 * restoration, and the browser's own history.scrollRestoration can't help
 * either: every route's data loads asynchronously (lazy chunks + react-query),
 * so on a back/forward navigation the page is briefly much shorter than its
 * final content while it reloads — that clamps scrollY to 0, and nothing
 * scrolls back down once the real content grows in. This remembers each
 * history entry's scroll position and, on POP navigation, waits for the
 * content to actually be tall enough before restoring it.
 */
const scrollPositions = new Map<string, number>()

export function ScrollManager() {
  const location = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  // Continuously remember the current page's scroll position under its
  // history key, so it's there to restore if the user comes back to it.
  useEffect(() => {
    function handleScroll() {
      scrollPositions.set(location.key, window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [location.key])

  useLayoutEffect(() => {
    if (navigationType === 'POP') {
      const target = scrollPositions.get(location.key)
      if (target !== undefined) {
        restoreScrollWhenTallEnough(target)
        return
      }
    }
    window.scrollTo(0, 0)
  }, [location.key, navigationType])

  return null
}

function restoreScrollWhenTallEnough(target: number, attemptsLeft = 30) {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight
  if (maxScroll >= target || attemptsLeft <= 0) {
    window.scrollTo(0, target)
    return
  }
  requestAnimationFrame(() => restoreScrollWhenTallEnough(target, attemptsLeft - 1))
}
