import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '@/App'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { setStoredToken } from '@/features/auth/session'
import type { AuthUser } from '@/types/user'
import { installMockFetch, mockFetch, resetMockFetch } from '@/test/mockFetch'

/** Antd's `lg` breakpoint (matches AdminLayout's mobile/desktop switch) is `min-width: 992px`. */
function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
  window.dispatchEvent(new Event('resize'))
}

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

const SUPER_ADMIN_USER: AuthUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  name: 'Asha Rao',
  email: 'super.admin@demo-college.test',
  role: 'SUPER_ADMIN',
  isActive: true,
  mfaEnabled: false,
}

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

const ORIGINAL_WIDTH = window.innerWidth

beforeEach(() => {
  installMockFetch()
  sessionStorage.clear()
})

afterEach(() => {
  resetMockFetch()
  setViewportWidth(ORIGINAL_WIDTH)
})

// The left sidebar (Sider/Drawer) is hidden for now — AdminLayout's
// SHOW_LEFT_NAV flag — in favor of the dashboard's nav card grid, so these
// cover the header's "CampusOne" home link and the card grid it replaced
// the sidebar with, on both desktop and mobile.
describe('AdminLayout — desktop', () => {
  it('shows no sidebar or hamburger, and the CampusOne brand navigates home', async () => {
    setViewportWidth(1280)
    mockSignedInAs(SUPER_ADMIN_USER)
    mockDashboardData()
    mockFetch.get('/departments', { body: { data: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 } } })

    const user = userEvent.setup()
    renderApp(['/departments'])

    await screen.findByRole('heading', { name: 'Departments' })
    expect(screen.queryByLabelText(/open navigation/i)).not.toBeInTheDocument()
    expect(screen.getByText(TENANT.name)).toBeInTheDocument()

    await user.click(screen.getByText('CampusOne'))
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('shows the nav card grid, grouped, and a card navigates to its page', async () => {
    setViewportWidth(1280)
    mockSignedInAs(SUPER_ADMIN_USER)
    mockDashboardData()
    mockFetch.get('/departments', { body: { data: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 } } })

    const user = userEvent.setup()
    renderApp(['/'])

    await screen.findByRole('heading', { name: 'Dashboard' })
    expect(screen.getByText('Academic Structure')).toBeInTheDocument()
    expect(screen.getByText('Campus Operations')).toBeInTheDocument()

    await user.click(screen.getByText('Departments'))
    expect(await screen.findByRole('heading', { name: 'Departments' })).toBeInTheDocument()
  })
})

describe('AdminLayout — mobile', () => {
  it('hides the tenant name and hamburger, but still shows the CampusOne home link', async () => {
    setViewportWidth(375)
    mockSignedInAs(SUPER_ADMIN_USER)
    mockDashboardData()

    renderApp(['/'])

    await screen.findByRole('heading', { name: 'Dashboard' })
    expect(screen.queryByText(TENANT.name)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/open navigation/i)).not.toBeInTheDocument()
    expect(screen.getByText('CampusOne')).toBeInTheDocument()
  })

  it('still shows the nav card grid on mobile', async () => {
    setViewportWidth(375)
    mockSignedInAs(SUPER_ADMIN_USER)
    mockDashboardData()

    renderApp(['/'])

    await screen.findByRole('heading', { name: 'Dashboard' })
    expect(screen.getByText('People')).toBeInTheDocument()
    expect(screen.getByText('Students')).toBeInTheDocument()
  })
})
