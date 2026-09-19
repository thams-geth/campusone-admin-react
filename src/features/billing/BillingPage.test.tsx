import type { ReactElement } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BillingPage, InvoicesTab, SubscriptionTab } from '@/features/billing/BillingPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <BillingPage />
      </AntApp>
    </QueryClientProvider>,
  )
}

/**
 * Renders a single tab's content directly, without antd's `Tabs` wrapper.
 * `Tabs` + a `Popconfirm` interaction inside a tab pane causes a severe
 * (60s+) slowdown under jsdom (not a real bug — confirmed fine in real
 * browsers), so tests that click a Popconfirm render the tab directly. See
 * LeavePage.test.tsx for the same pattern.
 */
function renderTab(children: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>{children}</AntApp>
    </QueryClientProvider>,
  )
}

const plan = {
  id: 'plan-pro',
  name: 'Pro',
  studentLimit: 500,
  facultyLimit: 50,
  priceMonthly: 4999,
  description: 'For growing colleges',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const subscription = {
  id: 'sub-1',
  tenantId: 'tenant-1',
  planId: plan.id,
  plan,
  status: 'ACTIVE',
  currentPeriodStart: '2026-01-01T00:00:00.000Z',
  currentPeriodEnd: '2026-02-01T00:00:00.000Z',
  cancelAtPeriodEnd: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

interface WireInvoice {
  id: string
  tenantId: string
  subscriptionId: string
  amount: number
  status: 'PENDING' | 'PAID' | 'OVERDUE'
  periodStart: string
  periodEnd: string
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

let invoices: WireInvoice[]

function seedInvoice(overrides: Partial<WireInvoice>): WireInvoice {
  return {
    id: 'inv-1',
    tenantId: 'tenant-1',
    subscriptionId: 'sub-1',
    amount: 4999,
    status: 'PENDING',
    periodStart: '2026-01-01T00:00:00.000Z',
    periodEnd: '2026-02-01T00:00:00.000Z',
    paidAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  invoices = [seedInvoice({})]

  mockFetch.get('/billing/plans', (): MockFetchResult => ({ body: [plan] }))
  mockFetch.get('/billing/subscription', (): MockFetchResult => ({ body: subscription }))
  mockFetch.get('/billing/invoices', (): MockFetchResult => ({
    body: { data: invoices, meta: { page: 1, pageSize: 10, total: invoices.length, totalPages: 1 } },
  }))
  mockFetch.get('/billing/usage', (): MockFetchResult => ({
    body: { plan: plan.name, students: { used: 120, limit: 500 }, faculty: { used: 10, limit: null } },
  }))
  mockFetch.post('/billing/invoices/:id/pay', ({ params }): MockFetchResult => {
    const invoice = invoices.find((i) => i.id === params.id)
    if (!invoice) return { status: 404, body: { message: 'Not found', code: 'NOT_FOUND' } }
    invoice.status = 'PAID'
    invoice.paidAt = '2026-01-15T00:00:00.000Z'
    return { body: invoice }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('BillingPage', () => {
  it('shows the current subscription plan and status', async () => {
    renderPage()
    expect(await screen.findByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })

  it('shows an empty state when the tenant has no subscription yet', async () => {
    resetMockFetch()
    installMockFetch()
    mockFetch.get('/billing/plans', (): MockFetchResult => ({ body: [plan] }))
    mockFetch.get('/billing/subscription', (): MockFetchResult => ({
      status: 404,
      body: { message: 'No subscription found for this tenant', code: 'NOT_FOUND' },
    }))

    renderTab(<SubscriptionTab />)
    expect(await screen.findByText(/hasn't picked a plan yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /choose a plan/i })).toBeInTheDocument()
  })

  it('pays a pending invoice', async () => {
    const user = userEvent.setup()
    renderTab(<InvoicesTab />)
    await screen.findByText('PENDING')

    const row = screen.getByText('PENDING').closest('tr')!
    await user.click(within(row).getByRole('button', { name: /pay/i }))
    const confirmButtons = await screen.findAllByRole('button', { name: /^pay$/i })
    await user.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(screen.getByText('PAID')).toBeInTheDocument())
  })
})
