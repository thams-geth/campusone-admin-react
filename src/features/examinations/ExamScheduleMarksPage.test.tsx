import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ExamScheduleMarksPage } from '@/features/examinations/ExamScheduleMarksPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={['/examinations/schedules/sched-1']}>
          <Routes>
            <Route path="/examinations/schedules/:scheduleId" element={<ExamScheduleMarksPage />} />
          </Routes>
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireMark {
  id: string
  tenantId: string
  examScheduleId: string
  studentId: string
  marksObtained: number | null
  maxMarks: number
  status: string
  specialStatus: string | null
  enteredByUserId: string | null
  verifiedByUserId: string | null
  publishedByUserId: string | null
  createdAt: string
  updatedAt: string
  student: { firstName: string; lastName: string; rollNumber: string }
}

let marks: WireMark[]

function seedMark(overrides: Partial<WireMark>): WireMark {
  return {
    id: `mark-${Math.random().toString(36).slice(2, 8)}`,
    tenantId: 'tenant-1',
    examScheduleId: 'sched-1',
    studentId: 'student-1',
    marksObtained: 80,
    maxMarks: 100,
    status: 'DRAFT',
    specialStatus: null,
    enteredByUserId: 'user-1',
    verifiedByUserId: null,
    publishedByUserId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    student: { firstName: 'Asha', lastName: 'Rao', rollNumber: 'CSE-001' },
    ...overrides,
  }
}

function setupBackend() {
  marks = [seedMark({ id: 'mark-1', studentId: 'student-1' }), seedMark({ id: 'mark-2', studentId: 'student-2', student: { firstName: 'Ravi', lastName: 'Kumar', rollNumber: 'CSE-002' } })]

  mockFetch.get('/students', { body: { data: [], meta: { page: 1, pageSize: 100, total: 0, totalPages: 1 } } })

  mockFetch.get('/examinations/schedules/:id/marks', (): MockFetchResult => ({ body: marks }))

  mockFetch.post('/examinations/schedules/:id/marks/submit', (): MockFetchResult => {
    marks = marks.map((m) => (m.status === 'DRAFT' ? { ...m, status: 'SUBMITTED' } : m))
    return { body: marks }
  })

  mockFetch.post('/examinations/schedules/:id/marks/verify', (): MockFetchResult => {
    marks = marks.map((m) => (m.status === 'SUBMITTED' ? { ...m, status: 'VERIFIED' } : m))
    return { body: marks }
  })

  mockFetch.post('/examinations/schedules/:id/marks/publish', (): MockFetchResult => {
    marks = marks.map((m) => (m.status === 'VERIFIED' ? { ...m, status: 'PUBLISHED' } : m))
    return { body: marks }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('ExamScheduleMarksPage — workflow transitions', () => {
  it('shows the roster and enables only Submit when marks are DRAFT', async () => {
    renderPage()

    expect(await screen.findByText(/Asha Rao/)).toBeInTheDocument()
    expect(screen.getByText(/Ravi Kumar/)).toBeInTheDocument()
    expect(screen.getByText('DRAFT: 2')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /^submit$/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /^verify$/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^publish$/i })).toBeDisabled()
  })

  it('submitting marks moves them to SUBMITTED and flips the enabled action to Verify', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText(/Asha Rao/)

    await user.click(screen.getByRole('button', { name: /^submit$/i }))
    const confirmButton = await screen.findByRole('button', { name: /^ok$/i })
    await user.click(confirmButton)

    await waitFor(() => expect(screen.getByText('SUBMITTED: 2')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /^submit$/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^verify$/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /^publish$/i })).toBeDisabled()
  })

  it('walks marks all the way through to PUBLISHED', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText(/Asha Rao/)

    async function confirmLastOkButton() {
      const okButtons = await screen.findAllByRole('button', { name: /^ok$/i })
      await user.click(okButtons[okButtons.length - 1])
    }

    await user.click(screen.getByRole('button', { name: /^submit$/i }))
    await confirmLastOkButton()
    await waitFor(() => expect(screen.getByText('SUBMITTED: 2')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /^verify$/i }))
    await confirmLastOkButton()
    await waitFor(() => expect(screen.getByText('VERIFIED: 2')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /^publish$/i })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: /^publish$/i }))
    await confirmLastOkButton()
    await waitFor(() => expect(screen.getByText('PUBLISHED: 2')).toBeInTheDocument())

    // Once published, rows offer Revise instead of Edit.
    expect(screen.getAllByRole('button', { name: /^revise$/i })).toHaveLength(2)
  })
})
