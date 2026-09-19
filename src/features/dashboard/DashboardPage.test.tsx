import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { AuthProvider } from '@/features/auth/AuthProvider'
import * as dashboardApi from '@/services/api/dashboardApi'
import { installMockFetch, mockFetch, resetMockFetch } from '@/test/mockFetch'

// DashboardPage now renders NavCardGrid (the dashboard's nav card grid),
// which needs both routing (useNavigate) and auth (useAuth's hasRole)
// context — with no stored token, AuthProvider settles to 'unauthenticated'
// synchronously without any network call, so no extra mocking is needed.
function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function mockDashboardData() {
  mockFetch.get('/dashboard/summary', {
    body: { totalStudents: 42, activeStudents: 39, totalDepartments: 5, totalFaculty: 11, pendingAdmissions: 3 },
  })
  mockFetch.get('/dashboard/trend', { body: [{ month: '2026-01', count: 5 }] })
  mockFetch.get('/dashboard/distribution', {
    body: [{ departmentId: 'dept-1', name: 'Computer Science & Engineering', code: 'CSE', studentCount: 20 }],
  })
  mockFetch.get('/dashboard/activity', {
    body: [{ id: 'act-1', message: 'added a new student to CSE', actor: 'Asha Rao', timestamp: '2026-01-01T00:00:00.000Z' }],
  })
}

beforeEach(() => installMockFetch())
afterEach(() => resetMockFetch())

describe('DashboardPage', () => {
  it('renders stat cards, chart headings, and recent activity once data loads', async () => {
    mockDashboardData()

    renderWithClient(<DashboardPage />)

    expect(await screen.findByText('Total students')).toBeInTheDocument()
    expect(screen.getByText('Enrollment trend')).toBeInTheDocument()
    expect(screen.getByText('Students by department')).toBeInTheDocument()
    expect(screen.getByText('Recent activity')).toBeInTheDocument()
    expect(await screen.findByText(/added a new student to CSE/)).toBeInTheDocument()
  })

  it('shows an error alert when a dashboard query fails', async () => {
    mockDashboardData()
    vi.spyOn(dashboardApi, 'getDashboardSummary').mockRejectedValueOnce(new Error('boom'))

    renderWithClient(<DashboardPage />)

    expect(await screen.findByText('Some dashboard data failed to load')).toBeInTheDocument()
  })
})
