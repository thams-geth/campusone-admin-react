import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '@/features/auth/authContext'
import { FacultyDetailsPage } from '@/features/faculty/FacultyDetailsPage'
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

function renderPage(id: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={[`/faculty/${id}`]}>
          <Routes>
            <Route path="/faculty/:id" element={<FacultyDetailsPage />} />
            <Route path="/faculty/:id/edit" element={<div>Edit faculty page</div>} />
            <Route path="/faculty" element={<div>Faculty list page</div>} />
          </Routes>
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
  facultyCount: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const FACULTY_ID = 'faculty-1'

const WIRE_FACULTY = {
  id: FACULTY_ID,
  tenantId: 'tenant-1',
  userId: 'user-1',
  employeeCode: 'EMP-001',
  departmentId: DEPARTMENT.id,
  designation: 'Assistant Professor',
  qualification: 'Ph.D.',
  experienceYears: 5,
  joiningDate: '2020-06-01T00:00:00.000Z',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  name: 'Smoke Faculty',
  email: 'smoke.faculty@demo-college.test',
  isActive: true,
}

const SUMMARY_360 = {
  faculty: { ...WIRE_FACULTY, departmentName: DEPARTMENT.name },
  teaching: {
    subjectCount: 2,
    subjects: [
      { id: 'subj-1', code: 'CS101', name: 'Data Structures', semesterNumber: 3, credits: 4 },
      { id: 'subj-2', code: 'CS102', name: 'Algorithms', semesterNumber: 4, credits: 4 },
    ],
  },
  timetable: {
    weeklyPeriods: 12,
    entries: [
      {
        id: 'tt-1',
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '10:00',
        sectionName: 'CSE-A',
        subjectName: 'Data Structures',
        roomName: 'Room 101',
      },
    ],
  },
  attendance: {
    sessionsTaken: 18,
    recentSessions: [{ id: 'sess-1', date: '2026-01-05T00:00:00.000Z', status: 'COMPLETED', sectionName: 'CSE-A', subjectName: 'Data Structures' }],
  },
  assignments: {
    count: 3,
    recent: [{ id: 'asg-1', title: 'Assignment 1', status: 'PUBLISHED', dueDate: '2026-01-20T00:00:00.000Z' }],
  },
  leaveReviewed: { count: 4 },
}

function setupBackend() {
  let faculty: (typeof WIRE_FACULTY)[] = [WIRE_FACULTY]

  mockFetch.get('/departments', { body: { data: [DEPARTMENT], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })

  mockFetch.get('/faculty/:id', ({ params }): MockFetchResult => {
    const found = faculty.find((f) => f.id === params.id)
    if (!found) return { status: 404, body: { message: 'Faculty member not found.', code: 'NOT_FOUND' } }
    return { body: found }
  })

  mockFetch.get('/faculty/:id/360', ({ params }): MockFetchResult => {
    if (params.id !== FACULTY_ID) return { status: 404, body: { message: 'Faculty member not found.', code: 'NOT_FOUND' } }
    return { body: SUMMARY_360 }
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

describe('FacultyDetailsPage', () => {
  it('shows a loading skeleton before data resolves', () => {
    mockUseAuth.mockReturnValue(authValue({}))
    renderPage(FACULTY_ID)

    expect(screen.queryByText('Smoke Faculty')).not.toBeInTheDocument()
  })

  it('shows the faculty profile and 360 overview with real numbers', async () => {
    mockUseAuth.mockReturnValue(authValue({}))
    renderPage(FACULTY_ID)

    expect(await screen.findByText('Smoke Faculty')).toBeInTheDocument()
    expect(screen.getByText(/Computer Science & Engineering/)).toBeInTheDocument()
    expect(screen.getByText('smoke.faculty@demo-college.test')).toBeInTheDocument()

    expect(await screen.findByText('360 overview')).toBeInTheDocument()
    expect(await screen.findByText('Data Structures')).toBeInTheDocument()
    expect(screen.getByText('Room 101')).toBeInTheDocument()
    expect(screen.getByText('Assignment 1')).toBeInTheDocument()
  })

  it('shows a not-found message for a missing faculty member', async () => {
    mockUseAuth.mockReturnValue(authValue({}))
    renderPage('missing-faculty')

    expect(await screen.findByText('Faculty member not found.')).toBeInTheDocument()
  })

  it('navigates to the edit page', async () => {
    mockUseAuth.mockReturnValue(authValue({}))
    const user = userEvent.setup()
    renderPage(FACULTY_ID)
    await screen.findByText('Smoke Faculty')

    await user.click(screen.getByRole('button', { name: /edit/i }))
    expect(await screen.findByText('Edit faculty page')).toBeInTheDocument()
  })

  it('deletes the faculty member and redirects to the list', async () => {
    mockUseAuth.mockReturnValue(authValue({}))
    const user = userEvent.setup()
    renderPage(FACULTY_ID)
    await screen.findByText('Smoke Faculty')

    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    const confirmButtons = await screen.findAllByRole('button', { name: /^delete$/i })
    await user.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(screen.getByText('Faculty list page')).toBeInTheDocument())
  })

  it('hides edit/delete actions for non-admin roles', async () => {
    mockUseAuth.mockReturnValue(authValue({ hasRole: () => false }))
    renderPage(FACULTY_ID)
    await screen.findByText('Smoke Faculty')

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })
})
