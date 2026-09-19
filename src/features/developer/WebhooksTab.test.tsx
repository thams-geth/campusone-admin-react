import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { WebhooksTab } from '@/features/developer/WebhooksTab'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderTab() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <WebhooksTab />
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireWebhookEndpoint {
  id: string
  tenantId: string
  url: string
  secret: string
  eventTypes: string[]
  enabled: boolean
  createdAt: string
  updatedAt: string
}

let endpoints: WireWebhookEndpoint[]

function setupBackend() {
  endpoints = [
    {
      id: 'wh-1',
      tenantId: 'tenant-1',
      url: 'https://example.com/hooks/campusone',
      secret: 'whsec_supersecretvalue',
      eventTypes: ['student.created', 'fee.paid'],
      enabled: true,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ]

  mockFetch.get('/webhooks', (): MockFetchResult => ({ body: endpoints }))

  mockFetch.patch('/webhooks/:id', ({ params, body }): MockFetchResult => {
    const endpoint = endpoints.find((e) => e.id === params.id)
    if (!endpoint) return { status: 404, body: { message: 'Not found', code: 'NOT_FOUND' } }
    Object.assign(endpoint, body as Record<string, unknown>)
    return { body: endpoint }
  })

  mockFetch.delete('/webhooks/:id', ({ params }): MockFetchResult => {
    endpoints = endpoints.filter((e) => e.id !== params.id)
    return { status: 204 }
  })

  mockFetch.get('/webhooks/:id/deliveries', (): MockFetchResult => ({
    body: {
      data: [
        {
          id: 'del-1',
          tenantId: 'tenant-1',
          webhookEndpointId: 'wh-1',
          eventType: 'student.created',
          payload: {},
          status: 'DELIVERED',
          attempts: 1,
          responseStatus: 200,
          lastAttemptAt: '2026-09-01T00:00:00.000Z',
          createdAt: '2026-09-01T00:00:00.000Z',
        },
      ],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    },
  }))
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('WebhooksTab', () => {
  it('lists endpoints with masked secret and event type tags', async () => {
    renderTab()
    expect(await screen.findByText('https://example.com/hooks/campusone')).toBeInTheDocument()
    expect(screen.getByText('student.created')).toBeInTheDocument()
    expect(screen.getByText('fee.paid')).toBeInTheDocument()
    expect(screen.queryByText('whsec_supersecretvalue')).not.toBeInTheDocument()
  })

  it('reveals the secret on click', async () => {
    const user = userEvent.setup()
    renderTab()
    await screen.findByText('https://example.com/hooks/campusone')

    await user.click(screen.getByLabelText('Reveal secret'))
    expect(await screen.findByText('whsec_supersecretvalue')).toBeInTheDocument()
  })

  it('shows delivery history for an endpoint', async () => {
    const user = userEvent.setup()
    renderTab()
    await screen.findByText('https://example.com/hooks/campusone')

    await user.click(screen.getByRole('button', { name: /deliveries/i }))
    const drawer = await screen.findByRole('dialog')
    expect(await within(drawer).findByText('DELIVERED')).toBeInTheDocument()
  })

  it(
    'deletes an endpoint via Popconfirm',
    async () => {
      const user = userEvent.setup()
      renderTab()
      await screen.findByText('https://example.com/hooks/campusone')

      await user.click(screen.getByRole('button', { name: /^delete$/i }))
      const confirmButtons = await screen.findAllByRole('button', { name: /^delete$/i })
      await user.click(confirmButtons[confirmButtons.length - 1])

      await waitFor(() =>
        expect(screen.queryByText('https://example.com/hooks/campusone')).not.toBeInTheDocument(),
      )
    },
    15_000,
  )
})
