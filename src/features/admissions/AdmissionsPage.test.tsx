import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AdmissionsPage } from '@/features/admissions/AdmissionsPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={['/admissions']}>
          <Routes>
            <Route path="/admissions" element={<AdmissionsPage />} />
            <Route path="/admissions/:id" element={<div>Application details page</div>} />
          </Routes>
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireApplication {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  programId: string
  status: string
  reviewedByUserId: string | null
  reviewNotes: string | null
  createdAt: string
  updatedAt: string
}

const PROGRAM = {
  id: 'prog-1',
  tenantId: 'tenant-1',
  departmentId: 'dept-1',
  name: 'B.Tech Computer Science',
  code: 'BTCS',
  durationYears: 4,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

let applications: WireApplication[]
let nextId: number

function seedApplication(overrides: Partial<WireApplication>): WireApplication {
  return {
    id: `app-${nextId++}`,
    tenantId: 'tenant-1',
    firstName: 'Ravi',
    lastName: 'Kumar',
    email: 'ravi@example.com',
    phone: '+91 9000000000',
    dateOfBirth: '2005-01-01T00:00:00.000Z',
    programId: 'prog-1',
    status: 'APPLIED',
    reviewedByUserId: null,
    reviewNotes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  nextId = 1
  applications = [seedApplication({ id: 'app-1', firstName: 'Ravi', lastName: 'Kumar', status: 'APPLIED' })]

  mockFetch.get('/admissions', (): MockFetchResult => ({
    body: { data: applications, meta: { page: 1, pageSize: 10, total: applications.length, totalPages: 1 } },
  }))

  mockFetch.get('/programs', (): MockFetchResult => ({
    body: { data: [PROGRAM], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } },
  }))

  mockFetch.post('/admissions', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const created = seedApplication({
      firstName: input.firstName as string,
      lastName: input.lastName as string,
      email: input.email as string,
      phone: input.phone as string,
      dateOfBirth: input.dateOfBirth as string,
      programId: input.programId as string,
    })
    applications.push(created)
    return { status: 201, body: created }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('AdmissionsPage', () => {
  it('lists applications with the program name resolved', async () => {
    renderPage()
    expect(await screen.findByText('Ravi Kumar')).toBeInTheDocument()
    expect(screen.getByText('B.Tech Computer Science')).toBeInTheDocument()
    expect(screen.getByText('APPLIED')).toBeInTheDocument()
  })

  it(
    'creates a new application through the drawer form',
    async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByText('Ravi Kumar')

      await user.click(screen.getByRole('button', { name: /new application/i }))
      const drawer = await screen.findByRole('dialog')

      await user.type(within(drawer).getByPlaceholderText('Asha'), 'Priya')
      await user.type(within(drawer).getByPlaceholderText('Rao'), 'Verma')
      await user.type(within(drawer).getByPlaceholderText('asha.rao@example.com'), 'priya.verma@example.com')
      await user.type(within(drawer).getByPlaceholderText('+91 9000000000'), '9123456789')
      await user.type(within(drawer).getByPlaceholderText('Select date'), '2005-01-01')
      await user.keyboard('{Enter}')

      await user.click(within(drawer).getByRole('combobox'))
      await user.click(await screen.findByTitle('B.Tech Computer Science'))

      await user.click(within(drawer).getByRole('button', { name: /submit application/i }))

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(await screen.findByText('Priya Verma')).toBeInTheDocument()
    },
    15_000,
  )

  it('navigates to the details page when an applicant name is clicked', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Ravi Kumar')

    await user.click(screen.getByText('Ravi Kumar'))

    expect(await screen.findByText('Application details page')).toBeInTheDocument()
  })
})
