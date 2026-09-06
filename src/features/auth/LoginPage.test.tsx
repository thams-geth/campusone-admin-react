import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { LoginPage } from '@/features/auth/LoginPage'
import { AuthProvider } from '@/features/auth/AuthProvider'

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

describe('LoginPage', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('shows validation errors for empty submission', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
  })

  it('shows a generic error for invalid credentials', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByPlaceholderText('you@college.edu'), 'super.admin@aurora.edu')
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByTestId('login-error')).toHaveTextContent('Invalid email or password.')
  })

  it('logs in successfully and redirects to the intended page', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByPlaceholderText('you@college.edu'), 'super.admin@aurora.edu')
    await user.type(screen.getByPlaceholderText('••••••••'), 'Passw0rd!')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(screen.getByText('Dashboard home')).toBeInTheDocument())
  })

  it('fills the form from a demo credential', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.click(screen.getByText(/use a sample account/i))
    await user.click(screen.getByText(/super.admin@aurora.edu/i))

    expect(screen.getByPlaceholderText('you@college.edu')).toHaveValue('super.admin@aurora.edu')
    expect(screen.getByPlaceholderText('••••••••')).toHaveValue('Passw0rd!')
  })
})
