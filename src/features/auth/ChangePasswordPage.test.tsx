import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage'
import { installMockFetch, mockFetch, resetMockFetch } from '@/test/mockFetch'

beforeEach(() => installMockFetch())
afterEach(() => resetMockFetch())

describe('ChangePasswordPage', () => {
  it('rejects a new password shorter than 8 characters', async () => {
    const user = userEvent.setup()
    render(<ChangePasswordPage />)

    await user.type(screen.getByPlaceholderText('Current password'), 'Passw0rd!')
    await user.type(screen.getByPlaceholderText('New password'), 'short')
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'short')
    await user.click(screen.getByRole('button', { name: /change password/i }))

    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument()
  })

  it('rejects mismatched confirmation', async () => {
    const user = userEvent.setup()
    render(<ChangePasswordPage />)

    await user.type(screen.getByPlaceholderText('Current password'), 'Passw0rd!')
    await user.type(screen.getByPlaceholderText('New password'), 'newpassword1')
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'newpassword2')
    await user.click(screen.getByRole('button', { name: /change password/i }))

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
  })

  it('shows the API error when the current password is wrong', async () => {
    mockFetch.post('/auth/change-password', {
      status: 401,
      body: { message: 'Current password is incorrect.', code: 'INVALID_CREDENTIALS' },
    })

    const user = userEvent.setup()
    render(<ChangePasswordPage />)

    await user.type(screen.getByPlaceholderText('Current password'), 'wrong-password')
    await user.type(screen.getByPlaceholderText('New password'), 'newpassword1')
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'newpassword1')
    await user.click(screen.getByRole('button', { name: /change password/i }))

    expect(await screen.findByText('Current password is incorrect.')).toBeInTheDocument()
  })

  it('changes the password successfully and resets the form', async () => {
    mockFetch.post('/auth/change-password', {})

    const user = userEvent.setup()
    render(<ChangePasswordPage />)

    await user.type(screen.getByPlaceholderText('Current password'), 'Passw0rd!')
    await user.type(screen.getByPlaceholderText('New password'), 'newpassword1')
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'newpassword1')
    await user.click(screen.getByRole('button', { name: /change password/i }))

    expect(await screen.findByText('Password changed successfully.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Current password')).toHaveValue('')
  })
})
