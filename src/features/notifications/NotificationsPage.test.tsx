import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <NotificationsPage />
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireNotification {
  id: string
  tenantId: string
  userId: string
  type: string
  title: string
  body: string
  entity: string | null
  entityId: string | null
  readAt: string | null
  createdAt: string
}

let notifications: WireNotification[]
let preferences: { channel: 'EMAIL' | 'SMS' | 'PUSH'; enabled: boolean }[]

function setupBackend() {
  notifications = [
    {
      id: 'notif-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      type: 'ANNOUNCEMENT',
      title: 'Mid-term schedule released',
      body: 'Check the exam portal for details.',
      entity: null,
      entityId: null,
      readAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ]
  preferences = [
    { channel: 'EMAIL', enabled: true },
    { channel: 'SMS', enabled: false },
    { channel: 'PUSH', enabled: true },
  ]

  mockFetch.get('/notifications', ({ query }): MockFetchResult => {
    const unreadOnly = query.get('unreadOnly') === 'true'
    const data = unreadOnly ? notifications.filter((n) => !n.readAt) : notifications
    return { body: { data, meta: { page: 1, pageSize: 20, total: data.length, totalPages: 1 } } }
  })

  mockFetch.get('/notifications/unread-count', (): MockFetchResult => {
    return { body: { count: notifications.filter((n) => !n.readAt).length } }
  })

  mockFetch.post('/notifications/:id/read', ({ params }): MockFetchResult => {
    const notif = notifications.find((n) => n.id === params.id)
    if (notif) notif.readAt = '2026-01-02T00:00:00.000Z'
    return { status: 204 }
  })

  mockFetch.post('/notifications/read-all', (): MockFetchResult => {
    for (const n of notifications) n.readAt = n.readAt ?? '2026-01-02T00:00:00.000Z'
    return { status: 204 }
  })

  mockFetch.get('/notifications/preferences', (): MockFetchResult => {
    return { body: preferences }
  })

  mockFetch.put('/notifications/preferences/:channel', ({ params, body }): MockFetchResult => {
    const input = body as { enabled: boolean }
    const pref = preferences.find((p) => p.channel === params.channel)
    if (pref) pref.enabled = input.enabled
    return { body: pref }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('NotificationsPage', () => {
  it('lists notifications and shows the unread count', async () => {
    renderPage()
    expect(await screen.findByText('Mid-term schedule released')).toBeInTheDocument()
    // antd's Badge count renders a `title` equal to the count; its zoom
    // transition can leave a duplicate node mid-animation in jsdom, so
    // assert at least one rather than exactly one.
    await waitFor(() => expect(screen.getAllByTitle('1').length).toBeGreaterThan(0))
  })

  it('marks a notification as read on click', async () => {
    const user = userEvent.setup()
    renderPage()
    const title = await screen.findByText('Mid-term schedule released')

    await user.click(title)

    await waitFor(() => expect(notifications[0].readAt).not.toBeNull())
  })

  it('toggles a delivery channel preference', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Delivery channel preferences')

    const switches = await screen.findAllByRole('switch')
    // EMAIL is first (enabled), SMS second (disabled) per seed order.
    await user.click(switches[1])

    await waitFor(() => expect(preferences.find((p) => p.channel === 'SMS')?.enabled).toBe(true))
  })
})
