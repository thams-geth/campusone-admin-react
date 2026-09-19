import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ExamResultsTab } from '@/features/reports/ExamResultsTab'
import { installMockFetch, mockFetch, resetMockFetch } from '@/test/mockFetch'

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  installMockFetch()
  mockFetch.get('/examinations/exams', {
    body: {
      data: [
        {
          id: 'exam-1',
          tenantId: 'tenant-1',
          name: 'Semester 1 Finals',
          examType: 'FINAL',
          academicYearId: 'ay-1',
          semesterNumber: 1,
          startDate: '2026-01-01',
          endDate: '2026-01-10',
          status: 'COMPLETED',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
    },
  })
  mockFetch.get('/reports/exam-results', {
    body: {
      examId: 'exam-1',
      examName: 'Semester 1 Finals',
      totalAssessed: 50,
      passCount: 45,
      failCount: 5,
      averagePercentage: 72.5,
    },
  })
})
afterEach(() => resetMockFetch())

describe('ExamResultsTab', () => {
  it('shows an empty state until an exam is picked, then loads its results', async () => {
    const user = userEvent.setup()
    renderWithClient(<ExamResultsTab />)

    expect(await screen.findByText('Select an exam above to view its results')).toBeInTheDocument()
    expect(screen.queryByText('Total assessed')).not.toBeInTheDocument()

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByTitle('Semester 1 Finals'))

    expect(screen.queryByText('Select an exam above to view its results')).not.toBeInTheDocument()
    expect(await screen.findByText('Total assessed')).toBeInTheDocument()
    expect(await screen.findByText('50')).toBeInTheDocument()
    expect(await screen.findByText('Passed')).toBeInTheDocument()
    expect(await screen.findByText('Failed')).toBeInTheDocument()
  })
})
