import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { JobOpeningDetailsPage } from '@/features/placements/JobOpeningDetailsPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage(id: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={[`/placements/${id}`]}>
          <Routes>
            <Route path="/placements/:id" element={<JobOpeningDetailsPage />} />
            <Route path="/placements" element={<div>Placements list page</div>} />
          </Routes>
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

const COMPANY = {
  id: 'company-1',
  tenantId: 'tenant-1',
  name: 'Acme Corp',
  website: 'https://acme.example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const JOB_OPENING = {
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
}

const STUDENT = {
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
}

interface WireApplication {
  id: string
  tenantId: string
  studentId: string
  jobOpeningId: string
  status: string
  notes: string | null
  offeredCtc: number | null
  createdAt: string
  updatedAt: string
}

let applications: WireApplication[]

function setupBackend() {
  applications = [
    {
      id: 'papp-1',
      tenantId: 'tenant-1',
      studentId: 'student-1',
      jobOpeningId: 'opening-1',
      status: 'APPLIED',
      notes: null,
      offeredCtc: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ]

  mockFetch.get('/placements/openings/:id', (): MockFetchResult => ({ body: JOB_OPENING }))
  mockFetch.get('/placements/companies', (): MockFetchResult => ({ body: [COMPANY] }))
  mockFetch.get('/placements/applications', (): MockFetchResult => ({
    body: { data: applications, meta: { page: 1, pageSize: 10, total: applications.length, totalPages: 1 } },
  }))
  mockFetch.get('/students', (): MockFetchResult => ({
    body: { data: [STUDENT], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } },
  }))
  mockFetch.put('/placements/applications/:id/status', ({ params, body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const application = applications.find((a) => a.id === params.id)
    if (!application) return { status: 404, body: { message: 'Not found', code: 'NOT_FOUND' } }
    application.status = input.status as string
    application.notes = (input.notes as string) ?? null
    application.offeredCtc = (input.offeredCtc as number) ?? null
    return { body: application }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('JobOpeningDetailsPage', () => {
  it('shows opening details and its applications with the student name resolved', async () => {
    renderPage('opening-1')

    expect(await screen.findByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Asha Rao')).toBeInTheDocument()
    expect(screen.getByText('APPLIED')).toBeInTheDocument()
  })

  it(
    'updates an application status',
    async () => {
      const user = userEvent.setup()
      renderPage('opening-1')
      await screen.findByText('Asha Rao')

      await user.click(screen.getByRole('button', { name: /update status/i }))
      const modal = await screen.findByRole('dialog')

      // The form defaults to "Shortlisted" already (the seeded application's
      // own status, APPLIED, isn't one of the selectable options), so pick a
      // different option here to avoid an ambiguous match against the
      // combobox's own already-selected display value.
      await user.click(within(modal).getByRole('combobox'))
      const options = await screen.findAllByTitle('Selected')
      await user.click(options[options.length - 1])
      await user.click(within(modal).getByRole('button', { name: /^save$/i }))

      // The request resolves and the table reflects the new status
      // immediately; the modal's own close animation (and its now-stale
      // dropdown option, which also renders the raw enum text) is a
      // separate (jsdom-unreliable) concern this smoke test doesn't assert
      // on — see the same pattern in AssignmentDetailsPage.test.tsx. Scope
      // to the application's own row so the leftover dropdown option and
      // the page's other (Descriptions-rendered) table aren't ambiguous matches.
      const row = await screen.findByText('Asha Rao').then((el) => el.closest('tr')!)
      expect(await within(row).findByText('SELECTED')).toBeInTheDocument()
    },
    15_000,
  )
})
