import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { IntegrationsTab } from '@/features/developer/IntegrationsTab'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderTab() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <IntegrationsTab />
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireIntegrationConfig {
  id: string
  tenantId: string
  provider: string
  enabled: boolean
  settings: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

let configs: WireIntegrationConfig[]

function setupBackend() {
  configs = [
    {
      id: 'int-1',
      tenantId: 'tenant-1',
      provider: 'EMAIL',
      enabled: true,
      settings: { host: 'smtp.example.com' },
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ]

  mockFetch.get('/integrations', (): MockFetchResult => ({ body: configs }))

  mockFetch.put('/integrations/:provider', ({ params, body }): MockFetchResult => {
    const input = body as { enabled: boolean; settings?: Record<string, unknown> }
    const existing = configs.find((c) => c.provider === params.provider)
    if (existing) {
      existing.enabled = input.enabled
      existing.settings = input.settings ?? existing.settings
      return { body: existing }
    }
    const created: WireIntegrationConfig = {
      id: `int-${configs.length + 1}`,
      tenantId: 'tenant-1',
      provider: params.provider,
      enabled: input.enabled,
      settings: input.settings ?? null,
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    }
    configs.push(created)
    return { status: 201, body: created }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('IntegrationsTab', () => {
  it('renders all 10 providers, configured or not', async () => {
    renderTab()
    // 'Configured' only appears once the query resolves (EMAIL is seeded as
    // configured) — awaiting it, rather than the always-present provider
    // labels, ensures the loading state has settled before asserting.
    expect(await screen.findByText('Configured')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Payment gateway')).toBeInTheDocument()
    expect(screen.getByText('Library system')).toBeInTheDocument()
    expect(screen.getAllByText('Not configured').length).toBeGreaterThan(0)
  })

  it('rejects invalid JSON in the settings editor', async () => {
    const user = userEvent.setup()
    renderTab()
    await screen.findByText('Configured')

    const rows = screen.getAllByRole('row')
    const emailRow = rows.find((row) => within(row).queryByText('Email'))!
    await user.click(within(emailRow).getByRole('button', { name: /edit settings/i }))

    const modal = await screen.findByRole('dialog')
    const textarea = within(modal).getByPlaceholderText(/apiKey/)
    fireEvent.change(textarea, { target: { value: '{ not valid json' } })
    await user.click(within(modal).getByRole('button', { name: /^save$/i }))

    expect(await within(modal).findByText('Must be valid JSON')).toBeInTheDocument()
  })

  it('saves valid JSON settings', async () => {
    const user = userEvent.setup()
    renderTab()
    await screen.findByText('Configured')

    const rows = screen.getAllByRole('row')
    const emailRow = rows.find((row) => within(row).queryByText('Email'))!
    await user.click(within(emailRow).getByRole('button', { name: /edit settings/i }))

    const modal = await screen.findByRole('dialog')
    const textarea = within(modal).getByPlaceholderText(/apiKey/)
    // fireEvent.change avoids userEvent.type's `{`/`[` special-key escaping,
    // which would otherwise make typing raw JSON awkward.
    fireEvent.change(textarea, { target: { value: '{"host":"smtp2.example.com"}' } })
    await user.click(within(modal).getByRole('button', { name: /^save$/i }))

    // Not asserting the modal unmounts (see the jsdom Modal-animation note in
    // ApiKeysTab.test.tsx) — the success toast is the observable confirmation
    // that the PUT went through and the form didn't reject the valid JSON.
    expect(await screen.findByText('Integration settings saved')).toBeInTheDocument()
  })
})
