import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import * as dashboardApi from '@/services/api/dashboardApi'

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('DashboardPage', () => {
  it('renders stat cards, chart headings, and recent activity once data loads', async () => {
    renderWithClient(<DashboardPage />)

    expect(await screen.findByText('Total students')).toBeInTheDocument()
    expect(screen.getByText('Enrollment trend')).toBeInTheDocument()
    expect(screen.getByText('Students by department')).toBeInTheDocument()
    expect(screen.getByText('Recent activity')).toBeInTheDocument()
    expect(await screen.findByText(/added a new student to CSE/)).toBeInTheDocument()
  })

  it('shows an error alert when a dashboard query fails', async () => {
    vi.spyOn(dashboardApi, 'getDashboardSummary').mockRejectedValueOnce(new Error('boom'))

    renderWithClient(<DashboardPage />)

    expect(await screen.findByText('Some dashboard data failed to load')).toBeInTheDocument()
  })
})
