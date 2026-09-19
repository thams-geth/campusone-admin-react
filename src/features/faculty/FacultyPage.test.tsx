import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '@/features/auth/authContext'
import { FacultyPage } from '@/features/faculty/FacultyPage'
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
        <MemoryRouter initialEntries={['/faculty']}>
          <FacultyPage />
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

const DEPARTMENT = {
  id: 'dept-1',
  tenantId: 'tenant-1',
  name: 'Computer Science & Engineering',
  code: 'CSE',
  status: 'ACTIVE',
  studentCount: 0,
  facultyCount: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

interface WireFaculty {
  id: string
  tenantId: string
  userId: string
  employeeCode: string
  departmentId: string
  designation: string
  qualification: string | null
  experienceYears: number
  joiningDate: string
  status: string
  createdAt: string
  updatedAt: string
  name: string
  email: string
  isActive: boolean
}

let faculty: WireFaculty[]
let nextId: number

function seedFaculty(overrides: Partial<WireFaculty>): WireFaculty {
  return {
    id: `faculty-${nextId++}`,
    tenantId: 'tenant-1',
    userId: `user-${nextId}`,
    employeeCode: 'EMP-001',
    departmentId: DEPARTMENT.id,
    designation: 'Assistant Professor',
    qualification: 'Ph.D.',
    experienceYears: 5,
    joiningDate: '2020-06-01T00:00:00.000Z',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    name: 'Dr. Asha Rao',
    email: 'asha.rao@demo-college.test',
    isActive: true,
    ...overrides,
  }
}

function setupBackend() {
  nextId = 1
  faculty = [
    seedFaculty({ id: 'faculty-1', name: 'Dr. Asha Rao', email: 'asha.rao@demo-college.test' }),
    seedFaculty({ id: 'faculty-2', name: 'Dr. Vikram Shah', email: 'vikram.shah@demo-college.test', status: 'INACTIVE' }),
  ]

  mockFetch.get('/departments', { body: { data: [DEPARTMENT], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })

  mockFetch.get('/faculty', ({ query }): MockFetchResult => {
    const status = query.get('status')
    const data = status ? faculty.filter((f) => f.status === status) : faculty
    return { body: { data, meta: { page: 1, pageSize: 10, total: data.length, totalPages: 1 } } }
  })

  mockFetch.delete('/faculty/:id', ({ params }): MockFetchResult => {
    faculty = faculty.filter((f) => f.id !== params.id)
    return { status: 204 }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('FacultyPage', () => {
  it('lists the seeded faculty with department names', async () => {
    mockUseAuth.mockReturnValue(authValue({}))
    renderPage()

    expect(await screen.findByText('Dr. Asha Rao')).toBeInTheDocument()
    expect(screen.getByText('Dr. Vikram Shah')).toBeInTheDocument()
    expect(screen.getAllByText('Computer Science & Engineering')).toHaveLength(2)
  })

  it('filters by status', async () => {
    mockUseAuth.mockReturnValue(authValue({}))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Dr. Asha Rao')

    // Department filter is the first combobox, status the second.
    const [, statusCombobox] = screen.getAllByRole('combobox')
    await user.click(statusCombobox)
    await user.click(await screen.findByTitle('Inactive'))

    await waitFor(() => {
      expect(screen.getByText('Dr. Vikram Shah')).toBeInTheDocument()
      expect(screen.queryByText('Dr. Asha Rao')).not.toBeInTheDocument()
    })
  })

  it('removes a faculty member', async () => {
    mockUseAuth.mockReturnValue(authValue({}))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Dr. Asha Rao')

    const row = screen.getByText('Dr. Asha Rao').closest('tr')!
    await user.click(within(row).getByRole('button', { name: /remove/i }))
    const confirmButtons = await screen.findAllByRole('button', { name: /^remove$/i })
    await user.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(screen.queryByText('Dr. Asha Rao')).not.toBeInTheDocument())
  })

  it('hides mutating actions for non-admin roles', async () => {
    mockUseAuth.mockReturnValue(authValue({ hasRole: () => false }))
    renderPage()
    await screen.findByText('Dr. Asha Rao')

    expect(screen.queryByRole('button', { name: /add faculty/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
  })
})
