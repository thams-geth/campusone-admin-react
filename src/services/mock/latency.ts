const MIN_LATENCY_MS = 250
const MAX_LATENCY_MS = 650

/**
 * Simulates real network latency so loading states get exercised during
 * development. Skipped in the test environment so the suite stays fast.
 */
export function networkDelay(ms?: number): Promise<void> {
  if (import.meta.env.MODE === 'test') return Promise.resolve()

  const duration = ms ?? MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS)
  return new Promise((resolve) => setTimeout(resolve, duration))
}
