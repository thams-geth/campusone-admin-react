import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AttendancePage } from '@/features/attendance/AttendancePage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={['/attendance']}>
          <Routes>
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/attendance/sessions/:id" element={<div>Session detail opened</div>} />
            <Route path="/attendance/corrections" element={<div>Corrections page opened</div>} />
          </Routes>
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireSession {
  id: string
  tenantId: string
  sectionId: string
  subjectId: string
  facultyId: string
  date: string
  status: string
  createdAt: string
  updatedAt: string
}

const SECTION = {
  id: 'section-1',
  tenantId: 'tenant-1',
  batchId: 'batch-1',
  name: 'CSE-A',
  currentSemester: 3,
  capacity: 60,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const SUBJECT = {
  id: 'subject-1',
  tenantId: 'tenant-1',
  programId: 'program-1',
  semesterNumber: 3,
  code: 'CS301',
  name: 'Data Structures',
  credits: 4,
  type: 'CORE',
  facultyId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

let sessions: WireSession[]
let nextId: number

function seedSession(overrides: Partial<WireSession>): WireSession {
  return {
    id: `session-${nextId++}`,
    tenantId: 'tenant-1',
    sectionId: SECTION.id,
    subjectId: SUBJECT.id,
    facultyId: 'faculty-1',
    date: '2026-01-05T00:00:00.000Z',
    status: 'DRAFT',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  nextId = 1
  sessions = [seedSession({ id: 'session-locked', status: 'LOCKED' })]

  mockFetch.get('/sections', (): MockFetchResult => ({
    body: { data: [SECTION], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } },
  }))

  mockFetch.get('/subjects', (): MockFetchResult => ({
    body: { data: [SUBJECT], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } },
  }))

  mockFetch.get('/attendance/sessions', (): MockFetchResult => ({
    body: { data: sessions, meta: { page: 1, pageSize: 10, total: sessions.length, totalPages: 1 } },
  }))

  mockFetch.post('/attendance/sessions', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const created = seedSession({
      sectionId: input.sectionId as string,
      subjectId: input.subjectId as string,
      date: input.date as string,
    })
    sessions.push(created)
    return { status: 201, body: created }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('AttendancePage', () => {
  it('lists attendance sessions with resolved section/subject names and status', async () => {
    renderPage()
    expect(await screen.findByText('CSE-A')).toBeInTheDocument()
    expect(screen.getByText('CS301 — Data Structures')).toBeInTheDocument()
    expect(screen.getByText('LOCKED')).toBeInTheDocument()
  })

  it('creates a new session through the drawer and navigates to its detail page', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('CSE-A')

    await user.click(screen.getByRole('button', { name: /new session/i }))
    const drawer = await screen.findByRole('dialog')

    const [sectionCombobox, subjectCombobox] = within(drawer).getAllByRole('combobox')
    await user.click(sectionCombobox)
    await user.click(await screen.findByTitle('CSE-A'))

    await user.click(subjectCombobox)
    await user.click(await screen.findByTitle('CS301 — Data Structures'))

    const dateInput = within(drawer).getByPlaceholderText('Select date')
    await user.type(dateInput, '2026-02-01{Enter}')

    await user.click(within(drawer).getByRole('button', { name: /create session/i }))

    await waitFor(() => expect(screen.getByText('Session detail opened')).toBeInTheDocument())
  })

  it('navigates to the corrections page', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('CSE-A')

    await user.click(screen.getByRole('button', { name: /corrections/i }))
    expect(await screen.findByText('Corrections page opened')).toBeInTheDocument()
  })
})
