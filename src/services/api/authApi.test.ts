import { describe, expect, it } from 'vitest'
import { getCurrentUser, login, logout } from '@/services/api/authApi'

describe('authApi', () => {
  it('logs in with valid credentials and returns a public user without a password field', async () => {
    const { user, token } = await login({ email: 'super.admin@aurora.edu', password: 'Passw0rd!' })

    expect(user.role).toBe('SUPER_ADMIN')
    expect(user).not.toHaveProperty('password')
    expect(token).toEqual(expect.any(String))
  })

  it('rejects invalid credentials with a generic error', async () => {
    await expect(login({ email: 'super.admin@aurora.edu', password: 'wrong' })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    })
  })

  it('does not reveal whether the email exists', async () => {
    await expect(login({ email: 'nobody@aurora.edu', password: 'wrong' })).rejects.toMatchObject({
      message: 'Invalid email or password.',
    })
  })

  it('locks the account after repeated failed attempts', async () => {
    const email = `lockout-test-${crypto.randomUUID()}@aurora.edu`

    for (let i = 0; i < 5; i++) {
      await expect(login({ email, password: 'wrong' })).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
      })
    }

    await expect(login({ email, password: 'wrong' })).rejects.toMatchObject({
      code: 'ACCOUNT_LOCKED',
    })
  })

  it('resolves the session token to the same user via getCurrentUser', async () => {
    const { user, token } = await login({ email: 'college.admin@aurora.edu', password: 'Passw0rd!' })
    const resolved = await getCurrentUser(token)
    expect(resolved).toEqual(user)
  })

  it('rejects an unknown or logged-out token', async () => {
    const { token } = await login({ email: 'staff@aurora.edu', password: 'Passw0rd!' })
    await logout(token)
    await expect(getCurrentUser(token)).rejects.toMatchObject({ code: 'SESSION_EXPIRED' })
  })

  it('never leaks the password property on repeated logins', async () => {
    const { user } = await login({ email: 'faculty@aurora.edu', password: 'Passw0rd!' })
    expect(Object.keys(user)).not.toContain('password')
  })
})
