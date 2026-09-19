import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RolesPage } from '@/features/rbac/RolesPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <RolesPage />
      </AntApp>
    </QueryClientProvider>,
  )
}

function setupBackend() {
  mockFetch.get('/roles', (): MockFetchResult => ({
    body: [
      { id: 'role-1', name: 'SUPER_ADMIN', isSystem: true, permissions: ['STUDENT_READ', 'STUDENT_MANAGE'] },
      { id: 'role-2', name: 'FACULTY', isSystem: true, permissions: ['STUDENT_READ'] },
    ],
  }))

  mockFetch.get('/permissions', (): MockFetchResult => ({
    body: [
      { key: 'STUDENT_READ', description: 'View student records' },
      { key: 'STUDENT_MANAGE', description: 'Create, update, or delete student records' },
    ],
  }))

  mockFetch.get('/faculty', (): MockFetchResult => ({
    body: {
      data: [
        {
          id: 'fac-1',
          tenantId: 'tenant-1',
          userId: 'user-1',
          employeeCode: 'FAC001',
          departmentId: 'dept-1',
          designation: 'Professor',
          qualification: null,
          experienceYears: 5,
          joiningDate: '2020-01-01',
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          name: 'Asha Rao',
          email: 'asha.rao@example.com',
          isActive: true,
        },
      ],
      meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
    },
  }))

  mockFetch.post('/users/:id/role', ({ params, body }): MockFetchResult => {
    const input = body as { roleName: string }
    return { body: { userId: params.id, role: input.roleName } }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('RolesPage', () => {
  it('lists roles with a system tag', async () => {
    renderPage()
    expect(await screen.findByText('SUPER_ADMIN')).toBeInTheDocument()
    expect(screen.getByText('FACULTY')).toBeInTheDocument()
    expect(screen.getAllByText('System').length).toBeGreaterThan(0)
  })

  it('expands a role row to show its granted permissions', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('SUPER_ADMIN')

    const row = screen.getByText('SUPER_ADMIN').closest('tr')!
    const expandButton = within(row).getByLabelText(/expand row/i)
    await user.click(expandButton)

    expect(await screen.findByText('STUDENT_READ')).toBeInTheDocument()
    expect(screen.getByText('STUDENT_MANAGE')).toBeInTheDocument()
  })

  it('assigns a role to a faculty member from the Assign role tab', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('SUPER_ADMIN')

    await user.click(screen.getByRole('tab', { name: /assign role/i }))

    const [facultyCombobox, roleCombobox] = await screen.findAllByRole('combobox')
    await user.click(facultyCombobox)
    await user.type(facultyCombobox, 'Asha')
    await user.click(await screen.findByTitle(/Asha Rao \(asha\.rao@example\.com\)/))

    await user.click(roleCombobox)
    await user.click(await screen.findByTitle('FACULTY'))

    await user.click(screen.getByRole('button', { name: /assign/i }))

    await waitFor(() => expect(screen.getByText(/assigned role "FACULTY" to user user-1/i)).toBeInTheDocument())
  })
})
