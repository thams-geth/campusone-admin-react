import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NavCardGrid } from '@/features/dashboard/components/NavCardGrid'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { setStoredToken } from '@/features/auth/session'
import type { AuthUser } from '@/types/user'
import { installMockFetch, mockFetch, resetMockFetch } from '@/test/mockFetch'

const TENANT = {
  id: 'tenant-1',
  name: 'Demo College',
  slug: 'demo-college',
  primaryColor: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const FACULTY_USER: AuthUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  name: 'Priya Nair',
  email: 'faculty@demo-college.test',
  role: 'FACULTY',
  isActive: true,
  mfaEnabled: false,
}

const SUPER_ADMIN_USER: AuthUser = {
  ...FACULTY_USER,
  id: 'user-2',
  name: 'Asha Rao',
  email: 'admin@demo-college.test',
  role: 'SUPER_ADMIN',
}

function mockSignedInAs(user: AuthUser) {
  setStoredToken('test-token')
  mockFetch.get('/auth/me', { body: { user } })
  mockFetch.get('/institution', { body: TENANT })
}

function renderGrid(initialEntries: string[] = ['/']) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<NavCardGrid />} />
            <Route path="/departments" element={<div>Departments page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => installMockFetch())
afterEach(() => resetMockFetch())

describe('NavCardGrid', () => {
  it('has no card for the dashboard itself', async () => {
    mockSignedInAs(FACULTY_USER)
    renderGrid()

    await screen.findByText('People')
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('hides cards the caller lacks the role for (Billing/Departments, for FACULTY)', async () => {
    mockSignedInAs(FACULTY_USER)
    renderGrid()

    await screen.findByText('People')
    expect(screen.queryByText('Billing')).not.toBeInTheDocument()
    expect(screen.queryByText('Departments')).not.toBeInTheDocument()
  })

  it('clicking a card navigates to its page', async () => {
    mockSignedInAs(SUPER_ADMIN_USER)
    const user = userEvent.setup()
    renderGrid()

    await screen.findByText('Academic Structure')
    await user.click(screen.getByText('Departments'))

    expect(await screen.findByText('Departments page')).toBeInTheDocument()
  })
})
