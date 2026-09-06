import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '@/App'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { login } from '@/services/api/authApi'
import { setStoredToken } from '@/features/auth/session'

function renderApp(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('App routing', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('redirects an unauthenticated visitor to /login', async () => {
    renderApp(['/'])
    expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows the dashboard for an authenticated user and hides Departments from FACULTY', async () => {
    const { token } = await login({ email: 'faculty@aurora.edu', password: 'Passw0rd!' })
    setStoredToken(token)

    renderApp(['/'])

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Rahul Menon')).toBeInTheDocument()
    expect(screen.queryByText('Departments')).not.toBeInTheDocument()
  })

  it('blocks FACULTY from /departments with a 403', async () => {
    const { token } = await login({ email: 'faculty@aurora.edu', password: 'Passw0rd!' })
    setStoredToken(token)

    renderApp(['/departments'])

    expect(await screen.findByText('403')).toBeInTheDocument()
  })

  it('allows SUPER_ADMIN to see and open Departments', async () => {
    const { token } = await login({ email: 'super.admin@aurora.edu', password: 'Passw0rd!' })
    setStoredToken(token)

    renderApp(['/departments'])

    expect(await screen.findByRole('heading', { name: 'Departments' })).toBeInTheDocument()
  })

  it('shows a 404 for an unknown route', async () => {
    const { token } = await login({ email: 'super.admin@aurora.edu', password: 'Passw0rd!' })
    setStoredToken(token)

    renderApp(['/nowhere'])

    expect(await screen.findByText('404')).toBeInTheDocument()
  })

  it('signs out via the header menu and returns to login', async () => {
    const user = userEvent.setup()
    const { token } = await login({ email: 'staff@aurora.edu', password: 'Passw0rd!' })
    setStoredToken(token)

    renderApp(['/'])
    await screen.findByRole('heading', { name: 'Dashboard' })

    await user.click(screen.getByText('Sneha Iyer'))
    await user.click(await screen.findByText('Sign out'))

    await waitFor(() => expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument())
  })
})
