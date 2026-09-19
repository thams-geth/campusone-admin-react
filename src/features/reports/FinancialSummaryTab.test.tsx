import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FinancialSummaryTab } from '@/features/reports/FinancialSummaryTab'
import { installMockFetch, mockFetch, resetMockFetch } from '@/test/mockFetch'

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => installMockFetch())
afterEach(() => resetMockFetch())

describe('FinancialSummaryTab', () => {
  it('renders totals as currency and a per-category breakdown table', async () => {
    mockFetch.get('/reports/financial-summary', {
      body: {
        totalInvoiced: 500000,
        totalCollected: 350000,
        totalOutstanding: 150000,
        byCategory: [{ category: 'TUITION', invoiced: 500000, collected: 350000, outstanding: 150000 }],
      },
    })

    renderWithClient(<FinancialSummaryTab />)

    expect(await screen.findByText('Total invoiced')).toBeInTheDocument()
    expect(await screen.findByText('500,000')).toBeInTheDocument()
    expect(await screen.findByText('Total collected')).toBeInTheDocument()
    expect(await screen.findByText('Total outstanding')).toBeInTheDocument()
    expect(await screen.findByText('TUITION')).toBeInTheDocument()
    expect(await screen.findByText('₹150,000')).toBeInTheDocument()
  })
})
