import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { StudentStrengthTab } from '@/features/reports/StudentStrengthTab'
import { installMockFetch, mockFetch, resetMockFetch } from '@/test/mockFetch'

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

function emptyList() {
  return { data: [], meta: { page: 1, pageSize: 100, total: 0, totalPages: 0 } }
}

function mockLookups() {
  mockFetch.get('/departments', {
    body: {
      data: [{ id: 'dept-cse', name: 'Computer Science & Engineering', code: 'CSE', status: 'ACTIVE' }],
      meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
    },
  })
  mockFetch.get('/programs', { body: emptyList() })
  mockFetch.get('/batches', { body: emptyList() })
  mockFetch.get('/sections', { body: emptyList() })
}

beforeEach(() => installMockFetch())
afterEach(() => resetMockFetch())

describe('StudentStrengthTab', () => {
  it('renders the total stat and a per-department breakdown', async () => {
    mockLookups()
    mockFetch.get('/reports/student-strength', {
      body: { total: 120, byDepartment: [{ departmentId: 'dept-cse', count: 120 }] },
    })

    renderWithClient(<StudentStrengthTab />)

    expect(await screen.findByText('Total students')).toBeInTheDocument()
    expect(await screen.findByText('120')).toBeInTheDocument()
    // recharts renders nothing inside its ResponsiveContainer under jsdom
    // (zero layout width — same as the dashboard's DepartmentDistributionChart
    // tests), so this only asserts the chart card's own heading renders.
    expect(await screen.findByText('Students by department')).toBeInTheDocument()
  })
})
