import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AdmissionApplicationDetailsPage } from '@/features/admissions/AdmissionApplicationDetailsPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage(id: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={[`/admissions/${id}`]}>
          <Routes>
            <Route path="/admissions/:id" element={<AdmissionApplicationDetailsPage />} />
            <Route path="/admissions" element={<div>Admissions list page</div>} />
            <Route path="/students/:id" element={<div>Student details page</div>} />
          </Routes>
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
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

let application: WireApplication

function setupBackend(initialStatus = 'APPLIED') {
  application = {
    id: 'app-1',
    tenantId: 'tenant-1',
    firstName: 'Ravi',
    lastName: 'Kumar',
    email: 'ravi@example.com',
    phone: '+91 9000000000',
    dateOfBirth: '2005-01-01T00:00:00.000Z',
    programId: 'prog-1',
    status: initialStatus,
    reviewedByUserId: null,
    reviewNotes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }

  mockFetch.get('/admissions/:id', (): MockFetchResult => ({ body: application }))
  mockFetch.get('/programs', (): MockFetchResult => ({
    body: { data: [PROGRAM], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } },
  }))
  mockFetch.get('/sections', (): MockFetchResult => ({
    body: { data: [], meta: { page: 1, pageSize: 100, total: 0, totalPages: 1 } },
  }))

  mockFetch.post('/admissions/:id/advance', (): MockFetchResult => {
    application = { ...application, status: 'DOCUMENT_VERIFICATION' }
    return { body: application }
  })
  mockFetch.post('/admissions/:id/reject', (): MockFetchResult => {
    application = { ...application, status: 'REJECTED' }
    return { body: application }
  })
  mockFetch.post('/admissions/:id/withdraw', (): MockFetchResult => {
    application = { ...application, status: 'WITHDRAWN' }
    return { body: application }
  })
  mockFetch.post('/admissions/:id/enroll', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    return {
      status: 201,
      body: {
        id: 'student-new-1',
        tenantId: 'tenant-1',
        firstName: application.firstName,
        lastName: application.lastName,
        email: application.email,
        phone: application.phone,
        rollNumber: input.rollNumber as string,
        departmentId: 'dept-1',
        sectionId: (input.sectionId as string | undefined) ?? null,
        gender: input.gender as string,
        dateOfBirth: application.dateOfBirth,
        admissionDate: '2026-01-01T00:00:00.000Z',
        status: 'ACTIVE',
        admissionApplicationId: application.id,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    }
  })
}

afterEach(() => resetMockFetch())

describe('AdmissionApplicationDetailsPage', () => {
  it('shows application details and the current status', async () => {
    installMockFetch()
    setupBackend('APPLIED')
    renderPage('app-1')

    expect(await screen.findByText('Ravi Kumar')).toBeInTheDocument()
    expect(screen.getByText('APPLIED')).toBeInTheDocument()
    expect(screen.getByText(/B\.Tech Computer Science/)).toBeInTheDocument()
  })

  it(
    'advances the application to the next stage with an optional note',
    async () => {
      installMockFetch()
      setupBackend('APPLIED')
      const user = userEvent.setup()
      renderPage('app-1')
      await screen.findByText('Ravi Kumar')

      await user.click(screen.getByRole('button', { name: /^advance$/i }))
      const modal = await screen.findByRole('dialog')
      await user.type(within(modal).getByPlaceholderText(/add a note/i), 'Docs look good')
      await user.click(within(modal).getByRole('button', { name: /^advance$/i }))

      await waitFor(() => expect(screen.getByText('DOCUMENT VERIFICATION')).toBeInTheDocument())
    },
    15_000,
  )

  it(
    'shows the enroll form once the application is ACCEPTED and enrolls the applicant',
    async () => {
      installMockFetch()
      setupBackend('ACCEPTED')
      const user = userEvent.setup()
      renderPage('app-1')
      await screen.findByText('Ravi Kumar')

      expect(screen.getByText(/enroll applicant/i)).toBeInTheDocument()
      await user.type(screen.getByPlaceholderText(/CSE2026-001/i), 'CSE2026-042')
      await user.click(screen.getByRole('button', { name: /^enroll$/i }))

      // The same success text is also briefly shown in antd's message toast
      // (which also carries role="alert"), so scope to the link instead of
      // matching by text/role alone — its presence is enough to confirm the
      // enroll Alert rendered, and the link only exists in that Alert.
      const viewStudentLink = await screen.findByRole('link', { name: /view student/i })
      expect(viewStudentLink).toHaveAttribute('href', '/students/student-new-1')
      expect(screen.getAllByText(/Enrolled as Ravi Kumar/i).length).toBeGreaterThanOrEqual(1)
    },
    15_000,
  )
})
