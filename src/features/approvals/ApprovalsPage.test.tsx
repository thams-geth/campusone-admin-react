import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ApprovalsPage } from '@/features/approvals/ApprovalsPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <ApprovalsPage />
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireApprovalRequest {
  id: string
  tenantId: string
  type: string
  entity: string
  entityId: string
  requestedByUserId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reason: string | null
  decidedByUserId: string | null
  decidedAt: string | null
  decisionNotes: string | null
  createdAt: string
  updatedAt: string
}

let requests: WireApprovalRequest[]

function seedRequest(overrides: Partial<WireApprovalRequest>): WireApprovalRequest {
  return {
    id: 'req-1',
    tenantId: 'tenant-1',
    type: 'LEAVE_OVERRIDE',
    entity: 'LeaveRequest',
    entityId: 'leave-1',
    requestedByUserId: 'user-1',
    status: 'PENDING',
    reason: null,
    decidedByUserId: null,
    decidedAt: null,
    decisionNotes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  requests = [
    seedRequest({ id: 'req-1', type: 'LEAVE_OVERRIDE', entity: 'LeaveRequest', entityId: 'leave-1', reason: 'Urgent travel' }),
  ]

  mockFetch.get('/approvals', (): MockFetchResult => {
    return { body: { data: requests, meta: { page: 1, pageSize: 10, total: requests.length, totalPages: 1 } } }
  })

  mockFetch.post('/approvals/:id/approve', ({ params, body }): MockFetchResult => {
    const input = body as Record<string, unknown> | undefined
    const request = requests.find((r) => r.id === params.id)
    if (!request) return { status: 404, body: { message: 'Not found', code: 'NOT_FOUND' } }
    request.status = 'APPROVED'
    request.decidedByUserId = 'user-admin'
    request.decidedAt = '2026-01-02T00:00:00.000Z'
    request.decisionNotes = (input?.decisionNotes as string) ?? null
    return { body: request }
  })

  mockFetch.post('/approvals/:id/reject', ({ params, body }): MockFetchResult => {
    const input = body as Record<string, unknown> | undefined
    const request = requests.find((r) => r.id === params.id)
    if (!request) return { status: 404, body: { message: 'Not found', code: 'NOT_FOUND' } }
    request.status = 'REJECTED'
    request.decidedByUserId = 'user-admin'
    request.decidedAt = '2026-01-02T00:00:00.000Z'
    request.decisionNotes = (input?.decisionNotes as string) ?? null
    return { body: request }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('ApprovalsPage', () => {
  it('lists pending approval requests', async () => {
    renderPage()
    expect(await screen.findByText('LEAVE_OVERRIDE')).toBeInTheDocument()
    expect(screen.getByText('Urgent travel')).toBeInTheDocument()
    expect(screen.getByText('PENDING')).toBeInTheDocument()
  })

  it('approves a pending request', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('LEAVE_OVERRIDE')

    await user.click(screen.getByRole('button', { name: /^approve$/i }))
    const modal = await screen.findByRole('dialog')
    await user.click(within(modal).getByRole('button', { name: /^approve$/i }))

    await waitFor(() => expect(screen.getByText('APPROVED')).toBeInTheDocument())
  })
})
