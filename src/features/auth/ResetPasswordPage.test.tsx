import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { installMockFetch, mockFetch, resetMockFetch } from '@/test/mockFetch'

function renderPage(initialPath = '/reset-password?token=valid-token') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => installMockFetch())
afterEach(() => resetMockFetch())

describe('ResetPasswordPage', () => {
  it('shows an error state when the URL has no token', () => {
    renderPage('/reset-password')

    expect(screen.getByText(/missing its token/i)).toBeInTheDocument()
  })

  it('validates that the two password fields match', async () => {
    const user = userEvent.setup()
    renderPage()

    const [newPassword, confirmPassword] = screen.getAllByPlaceholderText('••••••••')
    await user.type(newPassword, 'newpassword1')
    await user.type(confirmPassword, 'different1')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
  })

  it('resets the password and shows a sign-in prompt', async () => {
    mockFetch.post('/auth/reset-password', {})

    const user = userEvent.setup()
    renderPage()

    const [newPassword, confirmPassword] = screen.getAllByPlaceholderText('••••••••')
    await user.type(newPassword, 'newpassword1')
    await user.type(confirmPassword, 'newpassword1')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByText(/signed out of every other session/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /go to sign in/i })).toBeInTheDocument()
  })

  it('shows the API error for an invalid or expired token', async () => {
    mockFetch.post('/auth/reset-password', {
      status: 400,
      body: { message: 'This reset link is invalid or has expired.', code: 'INVALID_RESET_TOKEN' },
    })

    const user = userEvent.setup()
    renderPage()

    const [newPassword, confirmPassword] = screen.getAllByPlaceholderText('••••••••')
    await user.type(newPassword, 'newpassword1')
    await user.type(confirmPassword, 'newpassword1')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByText('This reset link is invalid or has expired.')).toBeInTheDocument()
  })
})
