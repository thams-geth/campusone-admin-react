import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { StudentImportCard, StudentExportCard } from '@/features/import-export/ImportExportPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function withProviders(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>{children}</AntApp>
    </QueryClientProvider>,
  )
}

function setupBackend() {
  mockFetch.get('/departments', (): MockFetchResult => ({
    body: {
      data: [{ id: 'dept-1', tenantId: 'tenant-1', name: 'Computer Science', code: 'CSE', status: 'ACTIVE' }],
      meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
    },
  }))

  mockFetch.post('/import-export/students/preview', ({ body }): MockFetchResult => {
    const csv = (body as { csv: string }).csv
    const rows = csv.trim().split('\n')
    return {
      body: {
        totalRows: rows.length,
        validCount: rows.length,
        invalidCount: 0,
        results: rows.map((_, i) => ({ row: i + 1, valid: true })),
      },
    }
  })

  mockFetch.post('/import-export/students/commit', (): MockFetchResult => ({
    body: { createdCount: 1, failedCount: 0, failed: [] },
  }))
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('StudentImportCard', () => {
  it('previews then commits a CSV import', async () => {
    const user = userEvent.setup()
    withProviders(<StudentImportCard />)

    await user.type(screen.getByPlaceholderText(/firstName,lastName/), 'a,b,c,d,e')
    await user.click(screen.getByRole('button', { name: /preview/i }))

    expect(await screen.findByText(/Total rows: 1/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /commit/i }))

    await waitFor(() => expect(screen.getByText(/Created: 1/)).toBeInTheDocument())
  })
})

describe('StudentExportCard', () => {
  it('loads department options', async () => {
    withProviders(<StudentExportCard />)
    expect(await screen.findByRole('button', { name: /export csv/i })).toBeInTheDocument()
  })
})
