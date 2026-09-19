import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BooksTab, IssuesTab, LibraryPage } from '@/features/library/LibraryPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function withProviders(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>{children}</AntApp>
    </QueryClientProvider>,
  )
}

interface WireBook {
  id: string
  tenantId: string
  title: string
  author: string
  publisher?: string
  category?: string
  isbn?: string
  totalCopies: number
  availableCopies: number
  createdAt: string
  updatedAt: string
}

interface WireIssue {
  id: string
  tenantId: string
  bookId: string
  ownerType: 'STUDENT' | 'FACULTY'
  ownerId: string
  issuedAt: string
  dueDate: string
  returnedAt?: string | null
  fineAmount?: number | null
  createdAt: string
  updatedAt: string
}

let books: WireBook[]
let issues: WireIssue[]

function seedBook(overrides: Partial<WireBook>): WireBook {
  return {
    id: 'book-1',
    tenantId: 'tenant-1',
    title: 'Book',
    author: 'Author',
    totalCopies: 5,
    availableCopies: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function seedIssue(overrides: Partial<WireIssue>): WireIssue {
  return {
    id: 'issue-1',
    tenantId: 'tenant-1',
    bookId: 'book-1',
    ownerType: 'STUDENT',
    ownerId: 'student-1',
    issuedAt: '2026-01-01T00:00:00.000Z',
    dueDate: '2026-01-10T00:00:00.000Z',
    returnedAt: null,
    fineAmount: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const STUDENT = {
  id: 'student-1',
  tenantId: 'tenant-1',
  firstName: 'Asha',
  lastName: 'Rao',
  email: 'asha@example.com',
  phone: '9999999999',
  rollNumber: 'CSE001',
  departmentId: 'dept-1',
  gender: 'FEMALE',
  dateOfBirth: '2004-01-01',
  admissionDate: '2022-06-01',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function setupBackend() {
  books = [seedBook({ id: 'book-cs', title: 'Introduction to Algorithms', author: 'Cormen', category: 'CS' })]
  issues = [seedIssue({ id: 'issue-overdue', dueDate: '2020-01-01T00:00:00.000Z' })]

  mockFetch.get('/library/books', (): MockFetchResult => ({
    body: { data: books, meta: { page: 1, pageSize: 10, total: books.length, totalPages: 1 } },
  }))

  mockFetch.post('/library/books', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const created = seedBook({
      id: `book-${books.length + 1}`,
      title: input.title as string,
      author: input.author as string,
      totalCopies: input.totalCopies as number,
      availableCopies: input.totalCopies as number,
    })
    books.push(created)
    return { status: 201, body: created }
  })

  mockFetch.delete('/library/books/:id', ({ params }): MockFetchResult => {
    books = books.filter((b) => b.id !== params.id)
    return { status: 204 }
  })

  mockFetch.get('/library/issues', (): MockFetchResult => ({
    body: { data: issues, meta: { page: 1, pageSize: 10, total: issues.length, totalPages: 1 } },
  }))

  mockFetch.post('/library/issues/:id/return', ({ params }): MockFetchResult => {
    const issue = issues.find((i) => i.id === params.id)
    if (!issue) return { status: 404, body: { message: 'Not found', code: 'NOT_FOUND' } }
    issue.returnedAt = '2026-01-05T00:00:00.000Z'
    issue.fineAmount = 50
    return { body: issue }
  })

  mockFetch.get('/students', (): MockFetchResult => ({
    body: { data: [STUDENT], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } },
  }))

  mockFetch.get('/faculty', (): MockFetchResult => ({
    body: { data: [], meta: { page: 1, pageSize: 100, total: 0, totalPages: 1 } },
  }))
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('LibraryPage', () => {
  it('shows the Books tab by default with the seeded books', async () => {
    withProviders(<LibraryPage />)
    expect(await screen.findByText('Introduction to Algorithms')).toBeInTheDocument()
    expect(screen.getByText('Cormen')).toBeInTheDocument()
  })
})

describe('BooksTab', () => {
  it('creates a new book through the drawer form', async () => {
    const user = userEvent.setup()
    withProviders(<BooksTab />)
    await screen.findByText('Introduction to Algorithms')

    await user.click(screen.getByRole('button', { name: /add book/i }))
    const drawer = await screen.findByRole('dialog')

    await user.type(within(drawer).getByPlaceholderText('Introduction to Algorithms'), 'Clean Code')
    await user.type(within(drawer).getByPlaceholderText('Thomas H. Cormen'), 'Robert C. Martin')
    await user.click(within(drawer).getByRole('button', { name: /^add book$/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('Clean Code')).toBeInTheDocument()
  })
})

describe('IssuesTab', () => {
  it('marks an overdue issue and returns it, surfacing the fine amount', async () => {
    const user = userEvent.setup()
    withProviders(<IssuesTab />)

    expect(await screen.findByText('OVERDUE')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /return/i }))
    const confirmButtons = await screen.findAllByRole('button', { name: /^return$/i })
    await user.click(confirmButtons[confirmButtons.length - 1])

    expect(await screen.findByText('RETURNED')).toBeInTheDocument()
  })
})
