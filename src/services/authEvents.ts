/**
 * Lets code outside React (the TanStack Query cache, which is created
 * before any provider renders) notify the auth layer that the session
 * died server-side (expired/invalid token) so it can clear state and
 * redirect to login — without importing React context into the query
 * client config.
 */
type SessionExpiredHandler = () => void

let handler: SessionExpiredHandler | null = null

export function registerSessionExpiredHandler(next: SessionExpiredHandler): void {
  handler = next
}

export function notifySessionExpired(): void {
  handler?.()
}
