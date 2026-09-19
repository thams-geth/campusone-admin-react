import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { StudentsPage } from '@/features/students/StudentsPage'
import { installMockFetch, mockFetch, resetMockFetch } from '@/test/mockFetch'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={['/students']}>
          <Routes>
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/new" element={<div>Add student page</div>} />
            <Route path="/students/:id" element={<div>Student details page</div>} />
            <Route path="/students/:id/edit" element={<div>Edit student page</div>} />
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
  studentCount: 2,
  facultyCount: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const STUDENTS = [
  {
    id: 'student-1',
    tenantId: 'tenant-1',
    firstName: 'Asha',
    lastName: 'Verma',
    email: 'asha.verma@demo-college.test',
    phone: '+91 9000000001',
    rollNumber: 'CSE-001',
    departmentId: 'dept-1',
    gender: 'FEMALE',
    dateOfBirth: '2003-01-01T00:00:00.000Z',
    admissionDate: '2023-06-01T00:00:00.000Z',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'student-2',
    tenantId: 'tenant-1',
    firstName: 'Rohan',
    lastName: 'Gupta',
    email: 'rohan.gupta@demo-college.test',
    phone: '+91 9000000002',
    rollNumber: 'CSE-002',
    departmentId: 'dept-1',
    gender: 'MALE',
    dateOfBirth: '2003-02-02T00:00:00.000Z',
    admissionDate: '2023-06-01T00:00:00.000Z',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
]

function setupBackend() {
  mockFetch.get('/departments', { body: { data: [DEPARTMENT], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })

  mockFetch.get('/students', ({ query }) => {
    let data = STUDENTS
    const departmentId = query.get('departmentId')
    if (departmentId) data = data.filter((s) => s.departmentId === departmentId)
    const search = query.get('search')?.toLowerCase()
    if (search) {
      data = data.filter(
        (s) =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(search) ||
          s.email.toLowerCase().includes(search) ||
          s.rollNumber.toLowerCase().includes(search),
      )
    }
    return { body: { data, meta: { page: 1, pageSize: 10, total: data.length, totalPages: 1 } } }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('StudentsPage', () => {
  it('lists seeded students with a resolved department name', async () => {
    renderPage()
    const rows = await screen.findAllByText('Computer Science & Engineering')
    expect(rows.length).toBeGreaterThan(0)
  })

  it('filters by search text', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Computer Science & Engineering')

    await user.type(screen.getByPlaceholderText('Search by name, email, or roll number'), 'zzzzunlikely')

    await waitFor(() => expect(screen.getAllByText('No data').length).toBeGreaterThan(0))
  })

  it('navigates to the add-student page', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Computer Science & Engineering')

    await user.click(screen.getByRole('button', { name: /add student/i }))
    expect(await screen.findByText('Add student page')).toBeInTheDocument()
  })

  it('navigates to the student details page', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Computer Science & Engineering')

    const row = screen.getAllByRole('row')[1]
    await user.click(within(row).getByRole('button', { name: /view/i }))
    expect(await screen.findByText('Student details page')).toBeInTheDocument()
  })
})
