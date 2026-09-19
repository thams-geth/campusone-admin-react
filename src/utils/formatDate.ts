/** Date-only (no time) — for due dates, birth dates, deadlines. '—' when unset. */
export function formatDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleDateString() : '—'
}

/** Date + time — for timestamps like createdAt/issuedAt/reviewedAt. '—' when unset. */
export function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString() : '—'
}
