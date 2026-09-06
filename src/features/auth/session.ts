const SESSION_TOKEN_KEY = 'campusone.session_token'

/**
 * sessionStorage, not localStorage: the token disappears when the tab
 * closes rather than persisting indefinitely, which limits the damage
 * window if an XSS bug ever leaks it. This is still a stopgap — once a
 * real backend exists it should issue an httpOnly, Secure, SameSite
 * cookie instead, so client-side JS never holds the credential at all.
 */
export function getStoredToken(): string | null {
  return sessionStorage.getItem(SESSION_TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  sessionStorage.setItem(SESSION_TOKEN_KEY, token)
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(SESSION_TOKEN_KEY)
}
