import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProgramsPage } from '@/features/programs/ProgramsPage'
import type { AuthContextValue } from '@/features/auth/authContext'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('@/features/auth/useAuth', () => ({ useAuth: mockUseAuth }))

function authValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
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
        <ProgramsPage />
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireDepartment {
  id: string
  name: string
  code: string
  status: string
}

interface WireProgram {
  id: string
  tenantId: string
  departmentId: string
  name: string
  code: string
  durationYears: number
  status: string
  createdAt: string
  updatedAt: string
}

let departments: WireDepartment[]
let programs: WireProgram[]
let nextId: number

function seedProgram(overrides: Partial<WireProgram>): WireProgram {
  return {
    id: `program-${nextId++}`,
    tenantId: 'tenant-1',
    departmentId: 'dept-cse',
    name: 'Program',
    code: 'PRG',
    durationYears: 4,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  nextId = 1
  departments = [
    { id: 'dept-cse', name: 'Computer Science & Engineering', code: 'CSE', status: 'ACTIVE' },
    { id: 'dept-civil', name: 'Civil Engineering', code: 'CIVIL', status: 'ACTIVE' },
  ]
  programs = [
    seedProgram({ id: 'program-btech-cse', name: 'B.Tech Computer Science', code: 'BTECH-CSE', departmentId: 'dept-cse' }),
    seedProgram({
      id: 'program-btech-civil',
      name: 'B.Tech Civil Engineering',
      code: 'BTECH-CIVIL',
      departmentId: 'dept-civil',
      status: 'INACTIVE',
    }),
  ]

  mockFetch.get('/departments', (): MockFetchResult => ({
    body: { data: departments, meta: { page: 1, pageSize: 100, total: departments.length, totalPages: 1 } },
  }))

  mockFetch.get('/programs', ({ query }): MockFetchResult => {
    const departmentId = query.get('departmentId') ?? undefined
    const status = query.get('status') ?? undefined
    const data = programs.filter(
      (p) => (!departmentId || p.departmentId === departmentId) && (!status || p.status === status),
    )
    return { body: { data, meta: { page: 1, pageSize: 10, total: data.length, totalPages: 1 } } }
  })

  mockFetch.post('/programs', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const created = seedProgram({
      name: input.name as string,
      code: input.code as string,
      departmentId: input.departmentId as string,
      durationYears: input.durationYears as number,
      status: (input.status as string) ?? 'ACTIVE',
    })
    programs.push(created)
    return { status: 201, body: created }
  })

  mockFetch.delete('/programs/:id', ({ params }): MockFetchResult => {
    programs = programs.filter((p) => p.id !== params.id)
    return { status: 204 }
  })
}

beforeEach(() => {
  mockUseAuth.mockReturnValue(authValue())
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('ProgramsPage', () => {
  it('lists the seeded programs with resolved department names', async () => {
    renderPage()
    expect(await screen.findByText('B.Tech Computer Science')).toBeInTheDocument()
    expect(await screen.findByText('Computer Science & Engineering')).toBeInTheDocument()
  })

  it('creates a new program through the drawer form', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('B.Tech Computer Science')

    await user.click(screen.getByRole('button', { name: /add program/i }))
    const drawer = await screen.findByRole('dialog')

    const [departmentCombobox] = within(drawer).getAllByRole('combobox')
    await user.click(departmentCombobox)
    await user.click(await screen.findByTitle('Computer Science & Engineering'))
    await user.type(within(drawer).getByPlaceholderText('Bachelor of Technology'), 'B.Sc Physics')
    await user.type(within(drawer).getByPlaceholderText('BTECH-CSE'), 'BSC-PHY')
    await user.click(within(drawer).getByRole('button', { name: /create program/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('B.Sc Physics')).toBeInTheDocument()
  })

  it('hides mutating actions for non-admin roles', async () => {
    mockUseAuth.mockReturnValue(authValue({ hasRole: () => false }))
    renderPage()
    await screen.findByText('B.Tech Computer Science')

    expect(screen.queryByRole('button', { name: /add program/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
  })
})
