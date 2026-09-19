import type { PaginatedResponse } from '@/types/common'
import { http } from '@/services/api/httpClient'

/**
 * Mirrors campusone-api's Library module (`src/modules/library`) wire
 * format exactly — enum casing included, no lowercase translation. Dates
 * stay ISO strings. BookIssue's issued/returned/overdue state is derived
 * from returnedAt/dueDate on the client, not stored as its own field.
 */

export type PersonType = 'STUDENT' | 'FACULTY'

export interface Book {
  id: string
  tenantId: string
  title: string
  author: string
  publisher?: string | null
  category?: string | null
  isbn?: string | null
  totalCopies: number
  availableCopies: number
  createdAt: string
  updatedAt: string
}

export interface BookInput {
  title: string
  author: string
  publisher?: string
  category?: string
  isbn?: string
  totalCopies: number
}

export interface ListBooksParams {
  page?: number
  pageSize?: number
  search?: string
  category?: string
}

export interface BookIssue {
  id: string
  tenantId: string
  bookId: string
  ownerType: PersonType
  ownerId: string
  issuedAt: string
  dueDate: string
  returnedAt?: string | null
  /** Set on return if returned after dueDate — FINE_PER_DAY_LATE (10) per day late. */
  fineAmount?: number | null
  createdAt: string
  updatedAt: string
}

export interface IssueBookInput {
  bookId: string
  ownerType: PersonType
  ownerId: string
  dueDate: string
}

export interface ListIssuesParams {
  page?: number
  pageSize?: number
  bookId?: string
  ownerType?: PersonType
  ownerId?: string
}

export async function listBooks(params: ListBooksParams = {}): Promise<PaginatedResponse<Book>> {
  return http.get<PaginatedResponse<Book>>('/library/books', { ...params })
}

export async function getBook(id: string): Promise<Book> {
  return http.get<Book>(`/library/books/${id}`)
}

export async function createBook(input: BookInput): Promise<Book> {
  return http.post<Book>('/library/books', input)
}

export async function updateBook(id: string, input: BookInput): Promise<Book> {
  return http.put<Book>(`/library/books/${id}`, input)
}

export async function deleteBook(id: string): Promise<void> {
  await http.delete<void>(`/library/books/${id}`)
}

/** Requires LIBRARY_MANAGE — see listMyBookIssues for the self-service equivalent. */
export async function listIssues(params: ListIssuesParams = {}): Promise<PaginatedResponse<BookIssue>> {
  return http.get<PaginatedResponse<BookIssue>>('/library/issues', { ...params })
}

/** The caller's own issues (resolved via Student.userId or Faculty.userId), not paginated. */
export async function listMyIssues(): Promise<BookIssue[]> {
  return http.get<BookIssue[]>('/library/issues/mine')
}

export async function issueBook(input: IssueBookInput): Promise<BookIssue> {
  return http.post<BookIssue>('/library/issues', input)
}

export async function returnBook(id: string): Promise<BookIssue> {
  return http.post<BookIssue>(`/library/issues/${id}/return`)
}
