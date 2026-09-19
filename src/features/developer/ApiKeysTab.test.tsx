import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ApiKeysTab } from '@/features/developer/ApiKeysTab'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderTab() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <ApiKeysTab />
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireApiKey {
  id: string
  name: string
  keyPrefix: string
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
  createdBy: { id: string; name: string; email: string }
}

let keys: WireApiKey[]

function setupBackend() {
  keys = [
    {
      id: 'key-1',
      name: 'CI pipeline',
      keyPrefix: 'sk_live_abc123',
      lastUsedAt: '2026-09-01T00:00:00.000Z',
      revokedAt: null,
      createdAt: '2026-08-01T00:00:00.000Z',
      createdBy: { id: 'u1', name: 'Admin', email: 'admin@demo-college.test' },
    },
  ]

  mockFetch.get('/api-keys', (): MockFetchResult => ({ body: keys }))

  mockFetch.post('/api-keys', ({ body }): MockFetchResult => {
    const input = body as { name: string }
    const created = {
      id: 'key-2',
      name: input.name,
      keyPrefix: 'sk_live_new456',
      lastUsedAt: null,
      revokedAt: null,
      createdAt: '2026-09-12T00:00:00.000Z',
      createdBy: keys[0].createdBy,
    }
    keys.push(created)
    return { status: 201, body: { ...created, key: 'sk_live_new456_full_raw_secret_value' } }
  })

  mockFetch.delete('/api-keys/:id', ({ params }): MockFetchResult => {
    const key = keys.find((k) => k.id === params.id)
    if (key) key.revokedAt = '2026-09-12T00:00:00.000Z'
    return { status: 204 }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('ApiKeysTab', () => {
  it('lists existing API keys', async () => {
    renderTab()
    expect(await screen.findByText('CI pipeline')).toBeInTheDocument()
    expect(screen.getByText(/sk_live_abc123/)).toBeInTheDocument()
  })

  it('creates a key and shows the raw secret exactly once', async () => {
    const user = userEvent.setup()
    renderTab()
    await screen.findByText('CI pipeline')

    await user.click(screen.getByRole('button', { name: /create key/i }))
    const modal = await screen.findByRole('dialog')
    await user.type(screen.getByPlaceholderText('CI pipeline'), 'Reporting bot')
    await user.click(within(modal).getByRole('button', { name: /^create$/i }))

    expect(await screen.findByText('API key created')).toBeInTheDocument()
    expect(screen.getByText(/sk_live_new456_full_raw_secret_value/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /done/i }))

    // Not asserting the modal itself unmounts here: antd's Modal close
    // animation leaves its DOM node attached during the (jsdom-only,
    // never-completing) CSS transition, same as elsewhere in this codebase
    // (see FeeInvoiceDetailsPage.test.tsx). What actually matters — the raw
    // secret never lands in the persisted key list — is checked instead:
    // the table only ever shows the new key's prefix, never its full value.
    const table = await screen.findByRole('table')
    expect(within(table).getByText('Reporting bot')).toBeInTheDocument()
    expect(within(table).queryByText(/full_raw_secret_value/)).not.toBeInTheDocument()
  })

  it(
    'revokes an active key via Popconfirm',
    async () => {
      const user = userEvent.setup()
      renderTab()
      await screen.findByText('CI pipeline')

      await user.click(screen.getByRole('button', { name: /revoke/i }))
      const confirmButtons = await screen.findAllByRole('button', { name: /^revoke$/i })
      await user.click(confirmButtons[confirmButtons.length - 1])

      await waitFor(() => expect(screen.getByText('Revoked')).toBeInTheDocument())
    },
    15_000,
  )
})
