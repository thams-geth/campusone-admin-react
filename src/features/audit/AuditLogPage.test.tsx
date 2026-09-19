import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AuditLogPage } from '@/features/audit/AuditLogPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <AuditLogPage />
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireAuditLog {
  id: string
  tenantId: string
  actorUserId: string | null
  actorName: string
  message: string
  entity: string | null
  entityId: string | null
  action: string | null
  before: unknown
  after: unknown
  ipAddress: string | null
  userAgent: string | null
  requestId: string | null
  createdAt: string
}

let entries: WireAuditLog[]

function seedEntry(overrides: Partial<WireAuditLog>): WireAuditLog {
  return {
    id: `audit-${Math.random()}`,
    tenantId: 'tenant-1',
    actorUserId: 'user-1',
    actorName: 'Asha Rao',
    message: 'did something',
    entity: null,
    entityId: null,
    action: null,
    before: null,
    after: null,
    ipAddress: null,
    userAgent: null,
    requestId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  entries = [
    seedEntry({
      id: 'audit-1',
      actorName: 'Asha Rao',
      message: 'Updated student record',
      entity: 'Student',
      entityId: 'stu-1',
      action: 'UPDATE',
      before: { status: 'active' },
      after: { status: 'inactive' },
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
      requestId: 'req-1',
    }),
    seedEntry({
      id: 'audit-2',
      actorName: 'Ravi Kumar',
      message: 'Created fee invoice',
      entity: 'FeeInvoice',
      entityId: 'inv-1',
      action: 'CREATE',
    }),
  ]

  mockFetch.get('/audit-logs', ({ query }): MockFetchResult => {
    const entity = query.get('entity')
    const data = entity ? entries.filter((e) => e.entity === entity) : entries
    return { body: { data, meta: { page: 1, pageSize: 10, total: data.length, totalPages: 1 } } }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('AuditLogPage', () => {
  it('lists audit log entries', async () => {
    renderPage()
    expect(await screen.findByText('Updated student record')).toBeInTheDocument()
    expect(screen.getByText('Created fee invoice')).toBeInTheDocument()
    expect(screen.getByText('Student · stu-1')).toBeInTheDocument()
  })

  it('filters by entity', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Updated student record')

    await user.type(screen.getByPlaceholderText(/filter by entity/i), 'Student')

    await waitFor(() => {
      expect(screen.getByText('Updated student record')).toBeInTheDocument()
      expect(screen.queryByText('Created fee invoice')).not.toBeInTheDocument()
    })
  })

  it('opens the details modal showing before/after JSON', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Updated student record')

    await user.click(screen.getAllByRole('button', { name: /details/i })[0])

    expect(await screen.findByText('Audit log entry')).toBeInTheDocument()
    expect(screen.getByText(/"status": "active"/)).toBeInTheDocument()
    expect(screen.getByText(/"status": "inactive"/)).toBeInTheDocument()
    expect(screen.getByText('req-1')).toBeInTheDocument()
  })
})
