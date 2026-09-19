import type { BookIssue } from '@/services/api/libraryApi'

export type IssueStatus = 'ISSUED' | 'OVERDUE' | 'RETURNED'

/** Derived client-side — not stored on the wire (see libraryApi.ts). */
export function deriveIssueStatus(issue: Pick<BookIssue, 'returnedAt' | 'dueDate'>): IssueStatus {
  if (issue.returnedAt) return 'RETURNED'
  if (new Date(issue.dueDate).getTime() < Date.now()) return 'OVERDUE'
  return 'ISSUED'
}
