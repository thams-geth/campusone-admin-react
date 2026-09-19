import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LoginPage } from '@/features/auth/LoginPage'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { installMockFetch, mockFetch, resetMockFetch } from '@/test/mockFetch'

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
  email: 'admin@demo-college.test',
  role: 'SUPER_ADMIN' as const,
  isActive: true,
  mfaEnabled: false,
}

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Dashboard home</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  installMockFetch()
  sessionStorage.clear()
})

afterEach(() => resetMockFetch())

describe('LoginPage', () => {
  it('shows validation errors for empty submission', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
  })

  it('shows a generic error for invalid credentials', async () => {
    mockFetch.post('/auth/login', {
      status: 401,
      body: { message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' },
    })

    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByPlaceholderText('you@college.edu'), 'admin@demo-college.test')
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByTestId('login-error')).toHaveTextContent('Invalid email or password.')
  })

  it('logs in successfully and redirects to the intended page', async () => {
    mockFetch.post('/auth/login', { body: { user: SUPER_ADMIN_USER, token: 'token-1' } })
    mockFetch.get('/institution', { body: TENANT })

    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByPlaceholderText('you@college.edu'), 'admin@demo-college.test')
    await user.type(screen.getByPlaceholderText('••••••••'), 'Passw0rd!')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(screen.getByText('Dashboard home')).toBeInTheDocument())
  })

  it('fills the form from the seeded demo credential', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.click(screen.getByText(/use the seeded demo account/i))
    await user.click(screen.getByText(/admin@demo-college.test/i))

    expect(screen.getByPlaceholderText('you@college.edu')).toHaveValue('admin@demo-college.test')
    expect(screen.getByPlaceholderText('••••••••')).toHaveValue('Passw0rd!')
  })
})
