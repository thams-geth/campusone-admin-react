import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CompaniesTab, PlacementsPage } from '@/features/placements/PlacementsPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={['/placements']}>
          <Routes>
            <Route path="/placements" element={<PlacementsPage />} />
            <Route path="/placements/:id" element={<div>Job opening details page</div>} />
          </Routes>
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

/**
 * Renders the Companies tab's content directly, without antd's `Tabs`
 * wrapper — Tabs + a Popconfirm interaction inside a tab pane hangs under
 * jsdom (see LeavePage.test.tsx for the same, confirmed-fine-in-browsers gotcha).
 */
function renderCompaniesTab() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <CompaniesTab />
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireCompany {
  id: string
  tenantId: string
  name: string
  website: string | null
  createdAt: string
  updatedAt: string
}

interface WireJobOpening {
  id: string
  tenantId: string
  companyId: string
  title: string
  description: string | null
  minCgpa: number | null
  ctcOffered: number | null
  applicationDeadline: string | null
  createdAt: string
  updatedAt: string
}

let companies: WireCompany[]
let jobOpenings: WireJobOpening[]

function seedCompany(overrides: Partial<WireCompany>): WireCompany {
  return {
    id: 'company-1',
    tenantId: 'tenant-1',
    name: 'Acme Corp',
    website: 'https://acme.example.com',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  companies = [seedCompany({})]
  jobOpenings = [
    {
      id: 'opening-1',
      tenantId: 'tenant-1',
      companyId: 'company-1',
      title: 'Software Engineer',
      description: 'Backend role',
      minCgpa: 7.5,
      ctcOffered: 12,
      applicationDeadline: '2026-03-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ]

  mockFetch.get('/placements/companies', (): MockFetchResult => ({ body: companies }))
  mockFetch.post('/placements/companies', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const created = seedCompany({ id: `company-${companies.length + 1}`, name: input.name as string, website: (input.website as string) ?? null })
    companies.push(created)
    return { status: 201, body: created }
  })
  mockFetch.delete('/placements/companies/:id', ({ params }): MockFetchResult => {
    companies = companies.filter((c) => c.id !== params.id)
    return { status: 204 }
  })

  mockFetch.get('/placements/openings', (): MockFetchResult => ({
    body: { data: jobOpenings, meta: { page: 1, pageSize: 10, total: jobOpenings.length, totalPages: 1 } },
  }))
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('PlacementsPage', () => {
  it('lists job openings with the company name resolved, in the default tab', async () => {
    renderPage()
    expect(await screen.findByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('12 LPA')).toBeInTheDocument()
  })

  it('navigates to the opening details page when a title is clicked', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Software Engineer')

    await user.click(screen.getByText('Software Engineer'))

    expect(await screen.findByText('Job opening details page')).toBeInTheDocument()
  })

  it(
    'switches to the Companies tab and lists companies',
    async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByText('Software Engineer')

      await user.click(screen.getByRole('tab', { name: /companies/i }))

      // antd keeps the inactive "Job openings" pane mounted (just
      // aria-hidden), and its table also shows "Acme Corp" as the resolved
      // company name for the seeded opening — so scope the query to the
      // visible tabpanel to avoid matching both.
      const panel = await screen.findByRole('tabpanel')
      expect(within(panel).getByText('Acme Corp')).toBeInTheDocument()
    },
    15_000,
  )
})

describe('CompaniesTab', () => {
  it(
    'creates a new company through the drawer form',
    async () => {
      const user = userEvent.setup()
      renderCompaniesTab()
      await screen.findByText('Acme Corp')

      await user.click(screen.getByRole('button', { name: /add company/i }))
      const drawer = await screen.findByRole('dialog')

      await user.type(within(drawer).getByPlaceholderText('Acme Corp'), 'Globex Inc')
      await user.click(within(drawer).getByRole('button', { name: /^add company$/i }))

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(await screen.findByText('Globex Inc')).toBeInTheDocument()
    },
    15_000,
  )

  it(
    'deletes a company via the Popconfirm',
    async () => {
      const user = userEvent.setup()
      renderCompaniesTab()
      await screen.findByText('Acme Corp')

      const row = screen.getByText('Acme Corp').closest('tr')!
      await user.click(within(row).getByRole('button', { name: /delete/i }))
      const confirmButtons = await screen.findAllByRole('button', { name: /^delete$/i })
      await user.click(confirmButtons[confirmButtons.length - 1])

      await waitFor(() => expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument())
    },
    15_000,
  )
})
