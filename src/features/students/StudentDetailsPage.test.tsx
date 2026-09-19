import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { StudentDetailsPage } from '@/features/students/StudentDetailsPage'
import { createStudent } from '@/services/api/studentsApi'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage(id: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={[`/students/${id}`]}>
          <Routes>
            <Route path="/students/:id" element={<StudentDetailsPage />} />
            <Route path="/students/:id/edit" element={<div>Edit student page</div>} />
            <Route path="/students" element={<div>Students list page</div>} />
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
  studentCount: 1,
  facultyCount: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

interface WireStudent {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  rollNumber: string
  departmentId: string
  gender: string
  dateOfBirth: string
  admissionDate: string
  status: string
  guardianName?: string
  guardianPhone?: string
  address?: string
  createdAt: string
  updatedAt: string
}

let students: WireStudent[]
let nextId: number

function setupBackend() {
  nextId = 1
  students = []

  mockFetch.get('/departments', { body: { data: [DEPARTMENT], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })

  mockFetch.post('/students', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const created: WireStudent = {
      id: `student-${nextId++}`,
      tenantId: 'tenant-1',
      firstName: input.firstName as string,
      lastName: input.lastName as string,
      email: input.email as string,
      phone: input.phone as string,
      rollNumber: input.rollNumber as string,
      departmentId: input.departmentId as string,
      gender: input.gender as string,
      dateOfBirth: input.dateOfBirth as string,
      admissionDate: input.admissionDate as string,
      status: input.status as string,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    students.push(created)
    return { status: 201, body: created }
  })

  mockFetch.get('/students/:id', ({ params }): MockFetchResult => {
    const student = students.find((s) => s.id === params.id)
    if (!student) return { status: 404, body: { message: 'Student not found.', code: 'NOT_FOUND' } }
    return { body: student }
  })

  mockFetch.delete('/students/:id', ({ params }): MockFetchResult => {
    students = students.filter((s) => s.id !== params.id)
    return { status: 204 }
  })

  mockFetch.get('/students/:id/360', ({ params }): MockFetchResult => {
    const student = students.find((s) => s.id === params.id)
    if (!student) return { status: 404, body: { message: 'Student not found.', code: 'NOT_FOUND' } }
    return {
      body: {
        student: {
          ...student,
          sectionId: null,
          currentSemester: null,
          userId: null,
          admissionApplicationId: null,
          guardianName: student.guardianName ?? null,
          guardianPhone: student.guardianPhone ?? null,
          address: student.address ?? null,
          departmentName: 'Computer Science & Engineering',
          sectionName: null,
        },
        attendance: {
          totalRecords: 40,
          presentCount: 34,
          absentCount: 4,
          lateCount: 1,
          excusedCount: 1,
          onLeaveCount: 0,
          attendancePercentage: 85,
        },
        academics: { cgpa: 8.42 },
        fees: { invoiceCount: 3, totalInvoiced: 90000, totalOutstanding: 15000, overdueCount: 1 },
        hostelAllocation: { hostelName: 'Sunrise Block', roomNumber: 'A-101', bedNumber: 2, status: 'ACTIVE' },
        transportAllocation: null,
        library: { activeIssueCount: 2, overdueIssueCount: 0 },
        documents: [{ id: 'doc-1', type: 'ID_PROOF', status: 'VERIFIED', createdAt: '2026-01-05T00:00:00.000Z' }],
        certificateRequests: [
          { id: 'cert-1', certificateTypeId: 'BONAFIDE', status: 'PENDING', createdAt: '2026-01-06T00:00:00.000Z' },
        ],
        activities: [{ id: 'act-1', type: 'SPORTS', title: 'Inter-college athletics', date: '2026-01-07T00:00:00.000Z' }],
        leave: {
          pendingCount: 1,
          approvedCount: 2,
          rejectedCount: 0,
          recent: [
            {
              id: 'leave-1',
              leaveTypeId: 'SICK',
              startDate: '2026-01-01T00:00:00.000Z',
              endDate: '2026-01-02T00:00:00.000Z',
              status: 'APPROVED',
              createdAt: '2025-12-30T00:00:00.000Z',
            },
          ],
        },
      },
    }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('StudentDetailsPage', () => {
  it('shows the student profile with a resolved department name', async () => {
    const created = await createStudent({
      firstName: 'Detail',
      lastName: 'View',
      email: 'detail.view@demo-college.test',
      phone: '+91 9123456782',
      rollNumber: 'D-001',
      departmentId: 'dept-1',
      gender: 'other',
      dateOfBirth: '2003-01-01T00:00:00.000Z',
      admissionDate: '2023-06-01T00:00:00.000Z',
      status: 'active',
    })

    renderPage(created.id)

    expect(await screen.findByText('Detail View')).toBeInTheDocument()
    expect(screen.getByText(/Computer Science & Engineering/)).toBeInTheDocument()
    expect(screen.getByText(created.email)).toBeInTheDocument()
  })

  it('shows the 360 overview with real numbers', async () => {
    const created = await createStudent({
      firstName: 'Overview',
      lastName: 'Student',
      email: 'overview.student@demo-college.test',
      phone: '+91 9123456785',
      rollNumber: 'OV-001',
      departmentId: 'dept-1',
      gender: 'other',
      dateOfBirth: '2003-01-01T00:00:00.000Z',
      admissionDate: '2023-06-01T00:00:00.000Z',
      status: 'active',
    })

    renderPage(created.id)

    expect(await screen.findByText('360 overview')).toBeInTheDocument()
    // antd's Statistic splits a decimal value across separate int/decimal spans, so match on
    // the rendered container text rather than a single text node.
    await waitFor(() => expect(screen.getByText('CGPA').closest('.ant-statistic')).toHaveTextContent('8.42'))
    expect(screen.getByText('Sunrise Block')).toBeInTheDocument()
    expect(screen.getByText('Not allocated.')).toBeInTheDocument() // transport
    expect(screen.getByText('ID_PROOF')).toBeInTheDocument()
    expect(screen.getByText('Inter-college athletics')).toBeInTheDocument()
  })

  it('navigates to the edit page', async () => {
    const created = await createStudent({
      firstName: 'EditNav',
      lastName: 'Test',
      email: 'editnav.test@demo-college.test',
      phone: '+91 9123456783',
      rollNumber: 'EN-001',
      departmentId: 'dept-1',
      gender: 'other',
      dateOfBirth: '2003-01-01T00:00:00.000Z',
      admissionDate: '2023-06-01T00:00:00.000Z',
      status: 'active',
    })

    const user = userEvent.setup()
    renderPage(created.id)
    await screen.findByText('EditNav Test')

    await user.click(screen.getByRole('button', { name: /edit/i }))
    expect(await screen.findByText('Edit student page')).toBeInTheDocument()
  })

  it(
    'deletes the student and redirects to the list',
    async () => {
      const created = await createStudent({
        firstName: 'DeleteMe',
        lastName: 'Test',
        email: 'deleteme.test@demo-college.test',
        phone: '+91 9123456784',
        rollNumber: 'DM-001',
        departmentId: 'dept-1',
        gender: 'other',
        dateOfBirth: '2003-01-01T00:00:00.000Z',
        admissionDate: '2023-06-01T00:00:00.000Z',
        status: 'active',
      })

      const user = userEvent.setup()
      renderPage(created.id)
      await screen.findByText('DeleteMe Test')

      await user.click(screen.getByRole('button', { name: /^delete$/i }))
      const confirmButtons = await screen.findAllByRole('button', { name: /^delete$/i })
      await user.click(confirmButtons[confirmButtons.length - 1])

      await waitFor(() => expect(screen.getByText('Students list page')).toBeInTheDocument(), { timeout: 10_000 })
    },
    15_000,
  )
})
