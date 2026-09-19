import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AttendanceTab } from '@/features/reports/AttendanceTab'
import { installMockFetch, mockFetch, resetMockFetch } from '@/test/mockFetch'

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

function emptyList() {
  return { data: [], meta: { page: 1, pageSize: 100, total: 0, totalPages: 0 } }
}

beforeEach(() => {
  installMockFetch()
  mockFetch.get('/sections', { body: emptyList() })
  mockFetch.get('/subjects', { body: emptyList() })
})
afterEach(() => resetMockFetch())

describe('AttendanceTab', () => {
  it('renders session/record stat tiles and the attendance percentage', async () => {
    mockFetch.get('/reports/attendance', {
      body: { totalSessions: 40, totalRecords: 1000, presentCount: 900, attendancePercentage: 90 },
    })

    renderWithClient(<AttendanceTab />)

    expect(await screen.findByText('Total sessions')).toBeInTheDocument()
    expect(await screen.findByText('40')).toBeInTheDocument()
    expect(await screen.findByText('Total records')).toBeInTheDocument()
    expect(await screen.findByText('Present count')).toBeInTheDocument()
    expect(await screen.findByText('Attendance %')).toBeInTheDocument()
    expect(await screen.findByText('90%')).toBeInTheDocument()
  })
})
