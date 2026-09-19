import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FacultyFormPage } from '@/features/faculty/FacultyFormPage'
import { createFaculty } from '@/services/api/facultyApi'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage(initialEntries: string[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/faculty" element={<div>Faculty list page</div>} />
            <Route path="/faculty/new" element={<FacultyFormPage />} />
            <Route path="/faculty/:id/edit" element={<FacultyFormPage />} />
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

function setupBackend() {
  nextId = 1
  faculty = []

  mockFetch.get('/departments', { body: { data: [DEPARTMENT], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })

  mockFetch.post('/faculty', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const created: WireFaculty = {
      id: `faculty-${nextId++}`,
      tenantId: 'tenant-1',
      userId: `user-${nextId}`,
      employeeCode: input.employeeCode as string,
      departmentId: input.departmentId as string,
      designation: input.designation as string,
      qualification: (input.qualification as string) ?? null,
      experienceYears: (input.experienceYears as number) ?? 0,
      joiningDate: input.joiningDate as string,
      status: (input.status as string) ?? 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      name: input.name as string,
      email: input.email as string,
      isActive: true,
    }
    faculty.push(created)
    return { status: 201, body: created }
  })

  mockFetch.get('/faculty/:id', ({ params }): MockFetchResult => {
    const found = faculty.find((f) => f.id === params.id)
    if (!found) return { status: 404, body: { message: 'Faculty not found.', code: 'NOT_FOUND' } }
    return { body: found }
  })

  mockFetch.put('/faculty/:id', ({ params, body }): MockFetchResult => {
    const found = faculty.find((f) => f.id === params.id)
    if (!found) return { status: 404, body: { message: 'Faculty not found.', code: 'NOT_FOUND' } }
    const input = body as Record<string, unknown>
    Object.assign(found, {
      employeeCode: input.employeeCode,
      departmentId: input.departmentId,
      designation: input.designation,
      qualification: input.qualification ?? null,
      experienceYears: input.experienceYears,
      joiningDate: input.joiningDate,
      status: input.status,
      name: input.name,
    })
    return { body: found }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('FacultyFormPage', () => {
  it('shows the email/password fields only when creating', async () => {
    renderPage(['/faculty/new'])

    await screen.findByLabelText('Name')
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('shows validation errors on empty submit when creating', async () => {
    const user = userEvent.setup()
    renderPage(['/faculty/new'])

    await user.click(screen.getByRole('button', { name: /add faculty/i }))

    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText(/password must be at least/i)).toBeInTheDocument()
  })

  it('creates a faculty member and redirects to the list page', async () => {
    const user = userEvent.setup()
    renderPage(['/faculty/new'])

    await user.type(screen.getByLabelText('Name'), 'Dr. Test Faculty')
    await user.type(screen.getByLabelText('Email'), `test.faculty.${Date.now()}@demo-college.test`)
    await user.type(screen.getByLabelText('Password'), 'Passw0rd!123')
    await user.type(screen.getByLabelText('Employee code'), `EMP-${Date.now()}`)

    await user.click(screen.getByLabelText('Department'))
    await user.click(await screen.findByTitle(/Computer Science & Engineering/))

    await user.type(screen.getByLabelText('Designation'), 'Assistant Professor')
    await user.type(screen.getByLabelText('Joining date'), '2023-06-01')
    await user.keyboard('{Enter}')

    await user.click(screen.getByRole('button', { name: /add faculty/i }))

    expect(await screen.findByText('Faculty list page')).toBeInTheDocument()
  })

  it('pre-fills the form when editing and hides email/password', async () => {
    const created = await createFaculty({
      name: 'Existing Faculty',
      email: `existing.${Date.now()}@demo-college.test`,
      password: 'Passw0rd!123',
      employeeCode: `E-${Date.now()}`,
      departmentId: 'dept-1',
      designation: 'Professor',
      joiningDate: '2020-06-01T00:00:00.000Z',
    })

    renderPage([`/faculty/${created.id}/edit`])

    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('Existing Faculty'))
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })
})
