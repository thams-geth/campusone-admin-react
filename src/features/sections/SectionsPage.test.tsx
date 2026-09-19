import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '@/features/auth/authContext'
import { SectionsPage } from '@/features/sections/SectionsPage'
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
        <SectionsPage />
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireSection {
  id: string
  tenantId: string
  batchId: string
  name: string
  currentSemester: number
  capacity: number | null
  status: string
  createdAt: string
  updatedAt: string
}

let sections: WireSection[]
let nextId: number

function seedSection(overrides: Partial<WireSection>): WireSection {
  return {
    id: `section-${nextId++}`,
    tenantId: 'tenant-1',
    batchId: 'batch-cse-24',
    name: 'Section',
    currentSemester: 1,
    capacity: 60,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  nextId = 1
  sections = [
    seedSection({ id: 'sec-a', name: 'Section A', batchId: 'batch-cse-24' }),
    seedSection({ id: 'sec-b', name: 'Section B', batchId: 'batch-civil-23', capacity: null }),
  ]

  mockFetch.get('/batches', (): MockFetchResult => ({
    body: {
      data: [
        { id: 'batch-cse-24', tenantId: 't1', programId: 'p1', academicYearId: 'ay1', name: 'CSE 2024-28', startYear: 2024, endYear: 2028, status: 'ACTIVE', createdAt: '', updatedAt: '' },
        { id: 'batch-civil-23', tenantId: 't1', programId: 'p2', academicYearId: 'ay1', name: 'Civil 2023-27', startYear: 2023, endYear: 2027, status: 'ACTIVE', createdAt: '', updatedAt: '' },
      ],
      meta: { page: 1, pageSize: 100, total: 2, totalPages: 1 },
    },
  }))

  mockFetch.get('/sections', (): MockFetchResult => ({
    body: { data: sections, meta: { page: 1, pageSize: 10, total: sections.length, totalPages: 1 } },
  }))

  mockFetch.post('/sections', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const created = seedSection({
      name: input.name as string,
      batchId: input.batchId as string,
      currentSemester: input.currentSemester as number,
      capacity: (input.capacity as number | undefined) ?? null,
      status: (input.status as string) ?? 'ACTIVE',
    })
    sections.push(created)
    return { status: 201, body: created }
  })

  mockFetch.delete('/sections/:id', ({ params }): MockFetchResult => {
    sections = sections.filter((s) => s.id !== params.id)
    return { status: 204 }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
  mockUseAuth.mockReturnValue(authValue({}))
})

afterEach(() => resetMockFetch())

describe('SectionsPage', () => {
  it('lists the seeded sections with resolved batch name and a dash for null capacity', async () => {
    renderPage()
    expect(await screen.findByText('Section A')).toBeInTheDocument()
    expect(await screen.findByText('CSE 2024-28')).toBeInTheDocument()
    expect(await screen.findByText('Section B')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('creates a new section through the drawer form', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Section A')

    await user.click(screen.getByRole('button', { name: /add section/i }))
    const drawer = await screen.findByRole('dialog')

    // Select identified by ARIA combobox role — no placeholder text is
    // rendered while the controlled value is an empty string, same as the
    // fees/assignments forms elsewhere in this app.
    const [batchCombobox] = within(drawer).getAllByRole('combobox')
    await user.click(batchCombobox)
    await user.click(await screen.findByTitle('CSE 2024-28'))
    await user.type(within(drawer).getByPlaceholderText('Section A'), 'Section C')

    await user.click(within(drawer).getByRole('button', { name: /create section/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('Section C')).toBeInTheDocument()
  })

  it('hides mutating actions for non-admin roles', async () => {
    mockUseAuth.mockReturnValue(authValue({ hasRole: () => false }))
    renderPage()
    await screen.findByText('Section A')

    expect(screen.queryByRole('button', { name: /add section/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument()
  })
})
