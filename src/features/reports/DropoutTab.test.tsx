import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DropoutTab } from '@/features/reports/DropoutTab'
import { installMockFetch, mockFetch, resetMockFetch } from '@/test/mockFetch'

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  installMockFetch()
  mockFetch.get('/departments', {
    body: {
      data: [{ id: 'dept-cse', name: 'Computer Science & Engineering', code: 'CSE', status: 'ACTIVE' }],
      meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
    },
  })
  mockFetch.get('/reports/dropout', {
    body: {
      total: 1,
      byDepartment: [{ departmentId: 'dept-cse', count: 1 }],
      students: [{ id: 'student-1', firstName: 'Ravi', lastName: 'Kumar', rollNumber: 'CSE001', departmentId: 'dept-cse' }],
    },
  })
})
afterEach(() => resetMockFetch())

describe('DropoutTab', () => {
  it('renders the total, the per-department chart, and the dropped-out students table', async () => {
    renderWithClient(<DropoutTab />)

    expect(await screen.findByText('Total dropouts')).toBeInTheDocument()
    expect(await screen.findByText('1')).toBeInTheDocument()
    expect(await screen.findByText('Dropouts by department')).toBeInTheDocument()
    expect(await screen.findByText('Ravi Kumar')).toBeInTheDocument()
    expect(await screen.findByText('CSE001')).toBeInTheDocument()
    expect(screen.getAllByText('Computer Science & Engineering').length).toBeGreaterThan(0)
  })
})
