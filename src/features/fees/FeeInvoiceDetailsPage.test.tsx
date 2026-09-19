import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FeeInvoiceDetailsPage } from '@/features/fees/FeeInvoiceDetailsPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage(id = 'inv-1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={[`/fees/invoices/${id}`]}>
          <Routes>
            <Route path="/fees/invoices/:id" element={<FeeInvoiceDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WirePayment {
  id: string
  tenantId: string
  invoiceId: string
  amount: number
  method: string
  isRefund: boolean
  originalPaymentId: string | null
  transactionRef: string | null
  recordedByUserId: string
  createdAt: string
}

let invoice: {
  id: string
  tenantId: string
  studentId: string
  feeStructureId: string | null
  category: string
  amount: number
  dueDate: string
  status: string
  createdAt: string
  updatedAt: string
  payments: WirePayment[]
  adjustments: unknown[]
}

function setupBackend() {
  invoice = {
    id: 'inv-1',
    tenantId: 'tenant-1',
    studentId: 'student-1',
    feeStructureId: null,
    category: 'TUITION',
    amount: 50000,
    dueDate: '2026-03-01',
    status: 'PENDING',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    payments: [],
    adjustments: [],
  }

  mockFetch.get('/students', (): MockFetchResult => ({
    body: {
      data: [
        {
          id: 'student-1',
          tenantId: 'tenant-1',
          firstName: 'Asha',
          lastName: 'Rao',
          email: 'asha@example.com',
          phone: '9999999999',
          rollNumber: 'CSE001',
          departmentId: 'dept-1',
          gender: 'FEMALE',
          dateOfBirth: '2004-01-01',
          admissionDate: '2022-06-01',
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
    },
  }))

  mockFetch.get('/fees/invoices/:id', (): MockFetchResult => ({ body: invoice }))

  mockFetch.post('/fees/invoices/:id/payments', ({ body }): MockFetchResult => {
    const input = body as { amount: number; method: string; transactionRef?: string }
    const payment: WirePayment = {
      id: 'pay-1',
      tenantId: 'tenant-1',
      invoiceId: invoice.id,
      amount: input.amount,
      method: input.method,
      isRefund: false,
      originalPaymentId: null,
      transactionRef: input.transactionRef ?? null,
      recordedByUserId: 'user-1',
      createdAt: '2026-01-02T00:00:00.000Z',
    }
    invoice.payments = [...invoice.payments, payment]
    // Backend recomputes status on every ledger write — mirror that here.
    invoice.status = input.amount >= invoice.amount ? 'PAID' : 'PARTIAL'
    return { status: 201, body: payment }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('FeeInvoiceDetailsPage', () => {
  it('shows invoice header info resolved from the student', async () => {
    renderPage()
    expect(await screen.findByText('Asha Rao (CSE001)')).toBeInTheDocument()
    expect(screen.getAllByText('PENDING').length).toBeGreaterThan(0)
    expect(screen.getByText('₹50,000')).toBeInTheDocument()
  })

  it('records a payment and refetches the invoice to reflect the recomputed status', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Asha Rao (CSE001)')

    await user.click(screen.getByRole('button', { name: /record payment/i }))
    const modal = await screen.findByRole('dialog')

    const amountInput = within(modal).getByRole('spinbutton')
    await user.clear(amountInput)
    await user.type(amountInput, '50000')

    await user.click(within(modal).getByRole('button', { name: /record payment/i }))

    // Status recomputed server-side to PAID, and the new payment row appears —
    // both only visible if the page refetched rather than trusting a stale
    // cache (recordPayment's response is just the Payment row, not the
    // updated invoice — see the "ambiguity resolved" note in hooks.ts).
    // Not asserting the modal itself unmounts: antd's Modal close animation
    // leaves its DOM node attached during the (jsdom-only, never-completing)
    // CSS transition, same as the evaluate-submission modal elsewhere.
    await waitFor(() => expect(screen.getAllByText('PAID').length).toBeGreaterThan(0))
    expect(screen.getByText('CASH')).toBeInTheDocument()
  })
})
