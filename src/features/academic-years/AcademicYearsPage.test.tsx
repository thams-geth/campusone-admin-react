import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '@/features/auth/authContext'
import { AcademicYearsPage } from '@/features/academic-years/AcademicYearsPage'
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
        <AcademicYearsPage />
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireAcademicYear {
  id: string
  tenantId: string
  name: string
  startDate: string
  endDate: string
  isCurrent: boolean
  status: string
  createdAt: string
  updatedAt: string
}

let years: WireAcademicYear[]
let nextId: number

function seedYear(overrides: Partial<WireAcademicYear>): WireAcademicYear {
  return {
    id: `year-${nextId++}`,
    tenantId: 'tenant-1',
    name: 'Year',
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2027-05-31T00:00:00.000Z',
    isCurrent: false,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  nextId = 1
  years = [
    seedYear({ id: 'year-2026', name: '2026-2027', isCurrent: true }),
    seedYear({
      id: 'year-2025',
      name: '2025-2026',
      startDate: '2025-06-01T00:00:00.000Z',
      endDate: '2026-05-31T00:00:00.000Z',
      status: 'CLOSED',
    }),
  ]

  mockFetch.get('/academic-years', ({ query }): MockFetchResult => {
    const status = query.get('status')
    const data = status ? years.filter((y) => y.status === status) : years
    return { body: { data, meta: { page: 1, pageSize: 10, total: data.length, totalPages: 1 } } }
  })

  mockFetch.post('/academic-years', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const created = seedYear({
      name: input.name as string,
      startDate: input.startDate as string,
      endDate: input.endDate as string,
      isCurrent: (input.isCurrent as boolean) ?? false,
      status: (input.status as string) ?? 'ACTIVE',
    })
    years.push(created)
    return { status: 201, body: created }
  })

  mockFetch.put('/academic-years/:id', ({ params, body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const year = years.find((y) => y.id === params.id)
    if (!year) return { status: 404, body: { message: 'Not found', code: 'NOT_FOUND' } }
    Object.assign(year, {
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      isCurrent: input.isCurrent,
      status: input.status,
    })
    if (year.isCurrent) {
      for (const other of years) {
        if (other.id !== year.id) other.isCurrent = false
      }
    }
    return { body: year }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('AcademicYearsPage', () => {
  it('lists the seeded academic years with the current-year indicator', async () => {
    mockUseAuth.mockReturnValue(authValue({}))
    renderPage()
    expect(await screen.findByText('2026-2027')).toBeInTheDocument()
    expect(screen.getByText('2025-2026')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
  })

  it('filters by status', async () => {
    mockUseAuth.mockReturnValue(authValue({}))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('2026-2027')

    const statusSelect = screen.getAllByText('Status').map((el) => el.closest('.ant-select')).find(Boolean)!
    await user.click(statusSelect)
    await user.click(await screen.findByTitle('Closed'))

    await waitFor(() => {
      expect(screen.getByText('2025-2026')).toBeInTheDocument()
      expect(screen.queryByText('2026-2027')).not.toBeInTheDocument()
    })
  })

  it('creates a new academic year through the drawer form', async () => {
    mockUseAuth.mockReturnValue(authValue({}))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('2026-2027')

    await user.click(screen.getByRole('button', { name: /add academic year/i }))
    const drawer = await screen.findByRole('dialog')

    await user.type(within(drawer).getByPlaceholderText('2026-2027'), '2027-2028')
    await user.click(within(drawer).getByRole('button', { name: /create academic year/i }))

    expect(await screen.findByText(/start date is required/i)).toBeInTheDocument()
  })

  it('sets a non-current year as current', async () => {
    mockUseAuth.mockReturnValue(authValue({}))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('2026-2027')

    const row = screen.getByText('2025-2026').closest('tr')!
    await user.click(within(row).getByRole('button', { name: /set as current/i }))

    await waitFor(() => {
      const updatedRow = screen.getByText('2025-2026').closest('tr')!
      expect(within(updatedRow).getByText('Current')).toBeInTheDocument()
    })
  })

  it('hides mutating actions for non-admin roles', async () => {
    mockUseAuth.mockReturnValue(authValue({ hasRole: () => false }))
    renderPage()
    await screen.findByText('2026-2027')

    expect(screen.queryByRole('button', { name: /add academic year/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /set as current/i })).not.toBeInTheDocument()
  })
})
