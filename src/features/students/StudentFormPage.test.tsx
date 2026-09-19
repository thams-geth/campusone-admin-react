import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { StudentFormPage } from '@/features/students/StudentFormPage'
import { createStudent } from '@/services/api/studentsApi'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage(initialEntries: string[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/students/new" element={<StudentFormPage />} />
            <Route path="/students/:id/edit" element={<StudentFormPage />} />
            <Route path="/students/:id" element={<div>Student details page</div>} />
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
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('StudentFormPage', () => {
  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup()
    renderPage(['/students/new'])

    await user.click(screen.getByRole('button', { name: /add student/i }))

    expect(await screen.findByText('First name is required')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid phone number')).toBeInTheDocument()
  })

  it('creates a student and redirects to the details page', async () => {
    const user = userEvent.setup()
    renderPage(['/students/new'])

    await user.type(screen.getByLabelText('First name'), 'Test')
    await user.type(screen.getByLabelText('Last name'), 'Learner')
    await user.type(screen.getByLabelText('Email'), `test.learner.${Date.now()}@demo-college.test`)
    await user.type(screen.getByLabelText('Phone'), '+91 9123456780')
    await user.type(screen.getByLabelText('Roll number'), `T-${Date.now()}`)

    await user.click(screen.getByLabelText('Department'))
    await user.click(await screen.findByTitle(/Computer Science & Engineering/))

    await user.type(screen.getByLabelText('Date of birth'), '2003-01-01')
    await user.keyboard('{Enter}')
    await user.type(screen.getByLabelText('Admission date'), '2023-06-01')
    // Pressing Enter in the last field submits the form natively — no
    // separate button click needed (and the page navigates away already).
    await user.keyboard('{Enter}')

    expect(await screen.findByText('Student details page')).toBeInTheDocument()
  })

  it('pre-fills the form when editing an existing student', async () => {
    const created = await createStudent({
      firstName: 'Existing',
      lastName: 'Student',
      email: `existing.${Date.now()}@demo-college.test`,
      phone: '+91 9123456781',
      rollNumber: `E-${Date.now()}`,
      departmentId: 'dept-1',
      gender: 'other',
      dateOfBirth: '2003-01-01T00:00:00.000Z',
      admissionDate: '2023-06-01T00:00:00.000Z',
      status: 'active',
    })

    renderPage([`/students/${created.id}/edit`])

    await waitFor(() => expect(screen.getByLabelText('First name')).toHaveValue('Existing'))
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })
})
