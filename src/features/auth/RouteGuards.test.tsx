import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { RequireAuth, RequireModule, RequireRole } from '@/features/auth/RouteGuards'
import type { AuthContextValue } from '@/features/auth/authContext'

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('@/features/auth/useAuth', () => ({ useAuth: mockUseAuth }))

function authValue(overrides: Partial<AuthContextValue>): AuthContextValue {
  return {
    status: 'authenticated',
    user: null,
    tenant: null,
    modules: [],
    login: vi.fn(),
    logout: vi.fn(),
    hasRole: () => true,
    hasModule: () => true,
    ...overrides,
  }
}

function renderWithRouter(ui: ReactElement, initialEntries = ['/protected']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/protected" element={ui} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireAuth', () => {
  it('redirects to /login when not authenticated', () => {
    mockUseAuth.mockReturnValue(authValue({ status: 'unauthenticated' }))
    renderWithRouter(
      <RequireAuth>
        <div>Secret content</div>
      </RequireAuth>,
    )
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue(authValue({ status: 'authenticated' }))
    renderWithRouter(
      <RequireAuth>
        <div>Secret content</div>
      </RequireAuth>,
    )
    expect(screen.getByText('Secret content')).toBeInTheDocument()
  })
})

describe('RequireRole', () => {
  it('shows a 403 result when the role is not allowed', () => {
    mockUseAuth.mockReturnValue(authValue({ hasRole: () => false }))
    renderWithRouter(
      <RequireRole roles={['SUPER_ADMIN']}>
        <div>Admin only</div>
      </RequireRole>,
    )
    expect(screen.getByText('403')).toBeInTheDocument()
    expect(screen.queryByText('Admin only')).not.toBeInTheDocument()
  })

  it('renders children when the role is allowed', () => {
    mockUseAuth.mockReturnValue(authValue({ hasRole: () => true }))
    renderWithRouter(
      <RequireRole roles={['SUPER_ADMIN']}>
        <div>Admin only</div>
      </RequireRole>,
    )
    expect(screen.getByText('Admin only')).toBeInTheDocument()
  })
})

describe('RequireModule', () => {
  it('shows a warning result when the module is disabled', () => {
    mockUseAuth.mockReturnValue(authValue({ hasModule: () => false }))
    renderWithRouter(
      <RequireModule moduleId="finance">
        <div>Finance dashboard</div>
      </RequireModule>,
    )
    expect(screen.getByText('Module not enabled')).toBeInTheDocument()
  })

  it('renders children when the module is enabled', () => {
    mockUseAuth.mockReturnValue(authValue({ hasModule: () => true }))
    renderWithRouter(
      <RequireModule moduleId="core">
        <div>Finance dashboard</div>
      </RequireModule>,
    )
    expect(screen.getByText('Finance dashboard')).toBeInTheDocument()
  })
})
