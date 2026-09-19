import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DepartmentsPage } from '@/features/departments/DepartmentsPage'
import { createDepartment } from '@/services/api/departmentsApi'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <DepartmentsPage />
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireDepartment {
  id: string
  tenantId: string
  name: string
  code: string
  headOfDepartment?: string
  description?: string
  status: string
  studentCount: number
  facultyCount: number
  createdAt: string
  updatedAt: string
}

let departments: WireDepartment[]
let nextId: number

function seedDepartment(overrides: Partial<WireDepartment>): WireDepartment {
  return {
    id: `dept-${nextId++}`,
    tenantId: 'tenant-1',
    name: 'Department',
    code: 'DEPT',
    status: 'ACTIVE',
    studentCount: 0,
    facultyCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  nextId = 1
  departments = [
    seedDepartment({
      id: 'dept-cse',
      name: 'Computer Science & Engineering',
      code: 'CSE',
      headOfDepartment: 'Dr. Asha Rao',
      studentCount: 3,
    }),
    seedDepartment({ id: 'dept-civil', name: 'Civil Engineering', code: 'CIVIL', studentCount: 0 }),
  ]

  mockFetch.get('/departments', ({ query }): MockFetchResult => {
    const search = query.get('search')?.toLowerCase()
    const data = search
      ? departments.filter(
          (d) =>
            d.name.toLowerCase().includes(search) ||
            d.code.toLowerCase().includes(search) ||
            (d.headOfDepartment ?? '').toLowerCase().includes(search),
        )
      : departments
    return { body: { data, meta: { page: 1, pageSize: 10, total: data.length, totalPages: 1 } } }
  })

  mockFetch.post('/departments', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    if (departments.some((d) => d.code === input.code)) {
      return { status: 409, body: { message: 'Department code already in use.', code: 'DUPLICATE_CODE' } }
    }
    const created = seedDepartment({
      name: input.name as string,
      code: input.code as string,
      headOfDepartment: input.headOfDepartment as string | undefined,
      description: input.description as string | undefined,
      status: (input.status as string) ?? 'ACTIVE',
    })
    departments.push(created)
    return { status: 201, body: created }
  })

  mockFetch.delete('/departments/:id', ({ params }): MockFetchResult => {
    const dept = departments.find((d) => d.id === params.id)
    if (dept && dept.studentCount > 0) {
      return {
        status: 409,
        body: { message: 'Cannot delete a department with students assigned to it.', code: 'DEPARTMENT_IN_USE' },
      }
    }
    departments = departments.filter((d) => d.id !== params.id)
    return { status: 204 }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('DepartmentsPage', () => {
  it('lists the seeded departments', async () => {
    renderPage()
    expect(await screen.findByText('Computer Science & Engineering')).toBeInTheDocument()
    expect(screen.getByText('CSE')).toBeInTheDocument()
  })

  it('filters by search text', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Computer Science & Engineering')

    await user.type(screen.getByPlaceholderText('Search by name, code, or HOD'), 'Civil')

    await waitFor(() => {
      expect(screen.getByText('Civil Engineering')).toBeInTheDocument()
      expect(screen.queryByText('Computer Science & Engineering')).not.toBeInTheDocument()
    })
  })

  it('creates a new department through the drawer form', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Computer Science & Engineering')

    await user.click(screen.getByRole('button', { name: /add department/i }))
    const drawer = await screen.findByRole('dialog')

    await user.type(within(drawer).getByPlaceholderText('Computer Science & Engineering'), 'Robotics Engineering')
    await user.type(within(drawer).getByPlaceholderText('CSE'), `RB${Date.now() % 100000}`)
    await user.click(within(drawer).getByRole('button', { name: /create department/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('Robotics Engineering')).toBeInTheDocument()
  })

  it('shows a validation error for a duplicate department code', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Computer Science & Engineering')

    await user.click(screen.getByRole('button', { name: /add department/i }))
    const drawer = await screen.findByRole('dialog')

    await user.type(within(drawer).getByPlaceholderText('Computer Science & Engineering'), 'Duplicate Dept')
    await user.type(within(drawer).getByPlaceholderText('CSE'), 'CSE')
    await user.click(within(drawer).getByRole('button', { name: /create department/i }))

    expect(await screen.findByText(/already in use/i)).toBeInTheDocument()
  })

  it(
    'blocks deleting a department that still has students',
    async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByText('Computer Science & Engineering')

      const row = screen.getByText('Computer Science & Engineering').closest('tr')!
      await user.click(within(row).getByRole('button', { name: /delete/i }))
      const confirmButtons = await screen.findAllByRole('button', { name: /^delete$/i })
      await user.click(confirmButtons[confirmButtons.length - 1])

      expect(await screen.findByText(/students assigned to it/i)).toBeInTheDocument()
    },
    15_000,
  )

  it(
    'deletes a department with no students',
    async () => {
      const created = await createDepartment({ name: 'Temp Dept For Delete', code: `TMP-${Date.now()}`, status: 'active' })
      const user = userEvent.setup()
      renderPage()

      await screen.findByText(created.name)
      const row = screen.getByText(created.name).closest('tr')!
      await user.click(within(row).getByRole('button', { name: /delete/i }))
      const confirmButtons = await screen.findAllByRole('button', { name: /^delete$/i })
      await user.click(confirmButtons[confirmButtons.length - 1])

      await waitFor(() => expect(screen.queryByText(created.name)).not.toBeInTheDocument())
    },
    15_000,
  )
})
