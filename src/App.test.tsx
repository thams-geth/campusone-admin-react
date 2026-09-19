import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '@/App'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { setStoredToken } from '@/features/auth/session'
import type { AuthUser } from '@/types/user'
import { installMockFetch, mockFetch, resetMockFetch } from '@/test/mockFetch'

function renderApp(initialEntries: string[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const TENANT = {
  id: 'tenant-1',
  name: 'Demo College',
  slug: 'demo-college',
  primaryColor: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const SUPER_ADMIN_USER = {
  id: 'user-1',
  tenantId: 'tenant-1',
  name: 'Asha Rao',
  email: 'super.admin@demo-college.test',
  role: 'SUPER_ADMIN' as const,
  isActive: true,
  mfaEnabled: false,
}

const FACULTY_USER = {
  ...SUPER_ADMIN_USER,
  id: 'user-2',
  role: 'FACULTY' as const,
  name: 'Priya Nair',
  email: 'faculty@demo-college.test',
}

/** Seeds the session as already signed in — `AuthProvider` rehydrates from this on mount. */
function mockSignedInAs(user: AuthUser) {
  setStoredToken('test-token')
  mockFetch.get('/auth/me', { body: { user } })
  mockFetch.get('/institution', { body: TENANT })
}

function mockDashboardData() {
  mockFetch.get('/dashboard/summary', {
    body: { totalStudents: 10, activeStudents: 9, totalDepartments: 2, totalFaculty: 4, pendingAdmissions: 1 },
  })
  mockFetch.get('/dashboard/trend', { body: [] })
  mockFetch.get('/dashboard/distribution', { body: [] })
  mockFetch.get('/dashboard/activity', { body: [] })
}

beforeEach(() => {
  installMockFetch()
  sessionStorage.clear()
})

afterEach(() => resetMockFetch())

describe('App routing', () => {
  it('redirects an unauthenticated visitor to /login', async () => {
    renderApp(['/'])
    expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows the dashboard for an authenticated user and hides Departments from FACULTY', async () => {
    mockSignedInAs(FACULTY_USER)
    mockDashboardData()

    renderApp(['/'])

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText(FACULTY_USER.name)).toBeInTheDocument()
    expect(screen.queryByText('Departments')).not.toBeInTheDocument()
  })

  it('blocks FACULTY from /departments with a 403', async () => {
    mockSignedInAs(FACULTY_USER)

    renderApp(['/departments'])

    expect(await screen.findByText('403')).toBeInTheDocument()
  })

  it('allows SUPER_ADMIN to see and open Departments', async () => {
    mockSignedInAs(SUPER_ADMIN_USER)
    mockFetch.get('/departments', { body: { data: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 } } })

    renderApp(['/departments'])

    expect(await screen.findByRole('heading', { name: 'Departments' })).toBeInTheDocument()
  })

  it('shows a 404 for an unknown route', async () => {
    mockSignedInAs(SUPER_ADMIN_USER)

    renderApp(['/nowhere'])

    expect(await screen.findByText('404')).toBeInTheDocument()
  })

  it('signs out via the header menu and returns to login', async () => {
    const user = userEvent.setup()
    mockSignedInAs(SUPER_ADMIN_USER)
    mockDashboardData()
    mockFetch.post('/auth/logout', { status: 204 })

    renderApp(['/'])
    await screen.findByRole('heading', { name: 'Dashboard' })

    await user.click(screen.getByText(SUPER_ADMIN_USER.name))
    await user.click(await screen.findByText('Sign out'))

    await waitFor(() => expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument())
  })
})
