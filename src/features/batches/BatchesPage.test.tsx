import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '@/features/auth/authContext'
import { BatchesPage } from '@/features/batches/BatchesPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('@/features/auth/useAuth', () => ({ useAuth: mockUseAuth }))

function authValue(overrides: Partial<AuthContextValue>): AuthContextValue {
  return {
    status: 'authenticated',
    user: null,
    tenant: null,
    modules: [],
    login: vi.fn(),
    logout: vi.fn(),
    hasRole: () => true,
    hasModule: () => true,
    ...overrides,
  }
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <BatchesPage />
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireBatch {
  id: string
  tenantId: string
  programId: string
  academicYearId: string
  name: string
  startYear: number
  endYear: number
  status: string
  createdAt: string
  updatedAt: string
}

let batches: WireBatch[]
let nextId: number

function seedBatch(overrides: Partial<WireBatch>): WireBatch {
  return {
    id: `batch-${nextId++}`,
    tenantId: 'tenant-1',
    programId: 'prog-cse',
    academicYearId: 'ay-1',
    name: 'Batch',
    startYear: 2024,
    endYear: 2028,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  nextId = 1
  batches = [
    seedBatch({ id: 'batch-cse-24', name: 'CSE 2024-28', programId: 'prog-cse', academicYearId: 'ay-1' }),
    seedBatch({ id: 'batch-civil-23', name: 'Civil 2023-27', programId: 'prog-civil', startYear: 2023, endYear: 2027 }),
  ]

  mockFetch.get('/programs', (): MockFetchResult => ({
    body: {
      data: [
        { id: 'prog-cse', tenantId: 't1', departmentId: 'd1', name: 'Computer Science', code: 'CSE', durationYears: 4, status: 'ACTIVE', createdAt: '', updatedAt: '' },
        { id: 'prog-civil', tenantId: 't1', departmentId: 'd2', name: 'Civil Engineering', code: 'CIVIL', durationYears: 4, status: 'ACTIVE', createdAt: '', updatedAt: '' },
      ],
      meta: { page: 1, pageSize: 100, total: 2, totalPages: 1 },
    },
  }))

  mockFetch.get('/academic-years', (): MockFetchResult => ({
    body: {
      data: [{ id: 'ay-1', tenantId: 't1', name: '2024-25', startDate: '2024-06-01', endDate: '2025-05-31', isCurrent: true, status: 'ACTIVE', createdAt: '', updatedAt: '' }],
      meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
    },
  }))

  mockFetch.get('/batches', (): MockFetchResult => ({
    body: { data: batches, meta: { page: 1, pageSize: 10, total: batches.length, totalPages: 1 } },
  }))

  mockFetch.post('/batches', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const created = seedBatch({
      name: input.name as string,
      programId: input.programId as string,
      academicYearId: input.academicYearId as string,
      startYear: input.startYear as number,
      endYear: input.endYear as number,
      status: (input.status as string) ?? 'ACTIVE',
    })
    batches.push(created)
    return { status: 201, body: created }
  })

  mockFetch.delete('/batches/:id', ({ params }): MockFetchResult => {
    batches = batches.filter((b) => b.id !== params.id)
    return { status: 204 }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
  mockUseAuth.mockReturnValue(authValue({}))
})

afterEach(() => resetMockFetch())

describe('BatchesPage', () => {
  it('lists the seeded batches with resolved program and academic year names', async () => {
    renderPage()
    expect(await screen.findByText('CSE 2024-28')).toBeInTheDocument()
    expect(await screen.findByText('Computer Science')).toBeInTheDocument()
    // Both seeded batches share the same academic year, so this resolves
    // to two table cells (plus the filter's own option, once opened) —
    // assert presence via getAllByText rather than the single-match finder.
    expect(screen.getAllByText('2024-25').length).toBeGreaterThan(0)
  })

  it('creates a new batch through the drawer form', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('CSE 2024-28')

    await user.click(screen.getByRole('button', { name: /add batch/i }))
    const drawer = await screen.findByRole('dialog')

    // Selects identified by ARIA combobox role, in field order — no
    // placeholder text is rendered while the controlled value is an empty
    // string, same as the fees/assignments forms elsewhere in this app.
    const [programCombobox, academicYearCombobox] = within(drawer).getAllByRole('combobox')
    await user.click(programCombobox)
    await user.click(await screen.findByTitle('CSE — Computer Science'))
    await user.click(academicYearCombobox)
    await user.click(await screen.findByTitle('2024-25'))
    await user.type(within(drawer).getByPlaceholderText('Batch 2024-28'), 'New Batch 2025-29')

    await user.click(within(drawer).getByRole('button', { name: /create batch/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('New Batch 2025-29')).toBeInTheDocument()
  })

  it('hides mutating actions for non-admin roles', async () => {
    mockUseAuth.mockReturnValue(authValue({ hasRole: () => false }))
    renderPage()
    await screen.findByText('CSE 2024-28')

    expect(screen.queryByRole('button', { name: /add batch/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument()
  })
})
