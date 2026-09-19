import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AttendanceSessionPage } from '@/features/attendance/AttendanceSessionPage'
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

function renderPage(sessionId = 'session-1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={[`/attendance/sessions/${sessionId}`]}>
          <Routes>
            <Route path="/attendance" element={<div>Attendance list</div>} />
            <Route path="/attendance/sessions/:id" element={<AttendanceSessionPage />} />
          </Routes>
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

const STUDENT = {
  id: 'student-1',
  tenantId: 'tenant-1',
  firstName: 'Smoke',
  lastName: 'Student',
  email: 'smoke@example.com',
  phone: '+91 9000000000',
  rollNumber: 'SMK1',
  departmentId: 'dept-1',
  sectionId: 'section-1',
  currentSemester: null,
  gender: 'OTHER',
  dateOfBirth: '2003-01-01T00:00:00.000Z',
  admissionDate: '2023-06-01T00:00:00.000Z',
  status: 'ACTIVE',
  guardianName: null,
  guardianPhone: null,
  address: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const SECTION = {
  id: 'section-1',
  tenantId: 'tenant-1',
  batchId: 'batch-1',
  name: 'CSE-A',
  currentSemester: 3,
  capacity: 60,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const SUBJECT = {
  id: 'subject-1',
  tenantId: 'tenant-1',
  programId: 'program-1',
  semesterNumber: 3,
  code: 'CS301',
  name: 'Data Structures',
  credits: 4,
  type: 'CORE',
  facultyId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

interface Session {
  id: string
  tenantId: string
  sectionId: string
  subjectId: string
  facultyId: string
  date: string
  status: string
  createdAt: string
  updatedAt: string
  records: {
    id: string
    tenantId: string
    sessionId: string
    studentId: string
    status: string
    createdAt: string
    updatedAt: string
    student: typeof STUDENT
  }[]
}

let session: Session

function setupBackend() {
  session = {
    id: 'session-1',
    tenantId: 'tenant-1',
    sectionId: SECTION.id,
    subjectId: SUBJECT.id,
    facultyId: 'faculty-1',
    date: '2026-01-05T00:00:00.000Z',
    status: 'DRAFT',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    records: [
      {
        id: 'record-1',
        tenantId: 'tenant-1',
        sessionId: 'session-1',
        studentId: STUDENT.id,
        status: 'PRESENT',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        student: STUDENT,
      },
    ],
  }

  mockFetch.get('/sections', (): MockFetchResult => ({
    body: { data: [SECTION], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } },
  }))
  mockFetch.get('/subjects', (): MockFetchResult => ({
    body: { data: [SUBJECT], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } },
  }))

  mockFetch.get('/attendance/sessions/:id', (): MockFetchResult => ({ body: session }))

  mockFetch.put('/attendance/sessions/:id/records', ({ body }): MockFetchResult => {
    const input = body as { records: { studentId: string; status: string }[] }
    for (const entry of input.records) {
      const record = session.records.find((r) => r.studentId === entry.studentId)
      if (record) record.status = entry.status
    }
    return { body: session }
  })

  mockFetch.post('/attendance/sessions/:id/submit', (): MockFetchResult => {
    session.status = 'SUBMITTED'
    return { body: session }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
  mockUseAuth.mockReturnValue(authValue())
})

afterEach(() => resetMockFetch())

describe('AttendanceSessionPage', () => {
  it('renders the roster from the session records', async () => {
    renderPage()
    expect(await screen.findByText('Smoke Student')).toBeInTheDocument()
    expect(screen.getByText('SMK1')).toBeInTheDocument()
    expect(screen.getByText('CSE-A')).toBeInTheDocument()
    expect(screen.getByText('CS301 — Data Structures')).toBeInTheDocument()
  })

  it('marks a status change and saves it', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Smoke Student')

    const statusCombobox = screen.getByRole('combobox')
    await user.click(statusCombobox)
    await user.click(await screen.findByTitle('Absent'))

    await user.click(screen.getByRole('button', { name: /save attendance/i }))

    expect(await screen.findByText('Attendance saved')).toBeInTheDocument()
    expect(session.records[0].status).toBe('ABSENT')
  })

  it('submits a DRAFT session', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Smoke Student')

    await user.click(screen.getByRole('button', { name: /^submit$/i }))

    await waitFor(() => expect(session.status).toBe('SUBMITTED'))
    expect(await screen.findByText('Session submitted')).toBeInTheDocument()
  })
})
