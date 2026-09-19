import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { installMockFetch, mockFetch, resetMockFetch } from '@/test/mockFetch'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<div>Reset password page</div>} />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => installMockFetch())
afterEach(() => resetMockFetch())

describe('ForgotPasswordPage', () => {
  it('shows a validation error for an invalid email', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByPlaceholderText('you@college.edu'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
  })

  it('shows the generic success message regardless of whether the email exists', async () => {
    mockFetch.post('/auth/forgot-password', {
      body: { message: 'If that email has an account, a reset link has been sent.' },
    })

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByPlaceholderText('you@college.edu'), 'nobody@demo-college.test')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByText(/reset link has been sent/i)).toBeInTheDocument()
  })

  it('surfaces the dev-only reset token as a direct link when the API returns one', async () => {
    mockFetch.post('/auth/forgot-password', {
      body: {
        message: 'If that email has an account, a reset link has been sent.',
        resetToken: 'dev-token-123',
      },
    })

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByPlaceholderText('you@college.edu'), 'admin@demo-college.test')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    const link = await screen.findByRole('link', { name: /reset your password/i })
    expect(link).toHaveAttribute('href', '/reset-password?token=dev-token-123')
  })
})
