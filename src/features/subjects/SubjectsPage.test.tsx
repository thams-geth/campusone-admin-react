import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SubjectsPage } from '@/features/subjects/SubjectsPage'
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
        <SubjectsPage />
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireProgram {
  id: string
  departmentId: string
  name: string
  code: string
  durationYears: number
  status: string
}

interface WireFaculty {
  id: string
  departmentId: string
  name: string
}

interface WireSubject {
  id: string
  tenantId: string
  programId: string
  semesterNumber: number
  code: string
  name: string
  credits: number
  type: string
  facultyId: string | null
  createdAt: string
  updatedAt: string
}

let programs: WireProgram[]
let faculty: WireFaculty[]
let subjects: WireSubject[]
let nextId: number

function seedSubject(overrides: Partial<WireSubject>): WireSubject {
  return {
    id: `subject-${nextId++}`,
    tenantId: 'tenant-1',
    programId: 'program-cse',
    semesterNumber: 3,
    code: 'CS301',
    name: 'Subject',
    credits: 3,
    type: 'CORE',
    facultyId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  nextId = 1
  programs = [{ id: 'program-cse', departmentId: 'dept-cse', name: 'B.Tech Computer Science', code: 'BTECH-CSE', durationYears: 4, status: 'ACTIVE' }]
  faculty = [{ id: 'faculty-1', departmentId: 'dept-cse', name: 'Dr. Asha Rao' }]
  subjects = [
    seedSubject({ id: 'subject-ds', code: 'CS301', name: 'Data Structures', facultyId: 'faculty-1' }),
    seedSubject({ id: 'subject-os', code: 'CS302', name: 'Operating Systems', type: 'LAB' }),
  ]

  mockFetch.get('/programs', (): MockFetchResult => ({
    body: { data: programs, meta: { page: 1, pageSize: 100, total: programs.length, totalPages: 1 } },
  }))

  mockFetch.get('/faculty', (): MockFetchResult => ({
    body: { data: faculty, meta: { page: 1, pageSize: 100, total: faculty.length, totalPages: 1 } },
  }))

  mockFetch.get('/subjects', ({ query }): MockFetchResult => {
    const programId = query.get('programId') ?? undefined
    const type = query.get('type') ?? undefined
    const data = subjects.filter((s) => (!programId || s.programId === programId) && (!type || s.type === type))
    return { body: { data, meta: { page: 1, pageSize: 10, total: data.length, totalPages: 1 } } }
  })

  mockFetch.post('/subjects', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const created = seedSubject({
      name: input.name as string,
      code: input.code as string,
      programId: input.programId as string,
      semesterNumber: input.semesterNumber as number,
      credits: input.credits as number,
      type: (input.type as string) ?? 'CORE',
      facultyId: (input.facultyId as string) ?? null,
    })
    subjects.push(created)
    return { status: 201, body: created }
  })

  mockFetch.delete('/subjects/:id', ({ params }): MockFetchResult => {
    subjects = subjects.filter((s) => s.id !== params.id)
    return { status: 204 }
  })
}

beforeEach(() => {
  mockUseAuth.mockReturnValue(authValue())
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('SubjectsPage', () => {
  it('lists the seeded subjects with resolved program and faculty names', async () => {
    renderPage()
    expect(await screen.findByText('Data Structures')).toBeInTheDocument()
    expect(await screen.findAllByText('B.Tech Computer Science')).toHaveLength(2)
    expect(await screen.findByText('Dr. Asha Rao')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('creates a new subject through the drawer form', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Data Structures')

    await user.click(screen.getByRole('button', { name: /add subject/i }))
    const drawer = await screen.findByRole('dialog')

    const [programCombobox] = within(drawer).getAllByRole('combobox')
    await user.click(programCombobox)
    await user.click(await screen.findByTitle('B.Tech Computer Science'))
    await user.type(within(drawer).getByPlaceholderText('CS301'), 'CS401')
    await user.type(within(drawer).getByPlaceholderText('Data Structures & Algorithms'), 'Compiler Design')
    await user.click(within(drawer).getByRole('button', { name: /create subject/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('Compiler Design')).toBeInTheDocument()
  })

  it('hides mutating actions for non-admin roles', async () => {
    mockUseAuth.mockReturnValue(authValue({ hasRole: () => false }))
    renderPage()
    await screen.findByText('Data Structures')

    expect(screen.queryByRole('button', { name: /add subject/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
  })
})
