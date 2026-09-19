import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AssignmentDetailsPage } from '@/features/assignments/AssignmentDetailsPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage(id: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={[`/assignments/${id}`]}>
          <Routes>
            <Route path="/assignments/:id" element={<AssignmentDetailsPage />} />
            <Route path="/assignments" element={<div>Assignments list page</div>} />
          </Routes>
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

const SUBJECT = {
  id: 'subj-1',
  tenantId: 'tenant-1',
  programId: 'prog-1',
  semesterNumber: 3,
  code: 'CS301',
  name: 'Data Structures',
  credits: 4,
  type: 'CORE',
  facultyId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const SECTION = {
  id: 'sec-1',
  tenantId: 'tenant-1',
  batchId: 'batch-1',
  name: 'CSE-A',
  currentSemester: 3,
  capacity: 60,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const STUDENT = {
  id: 'student-1',
  tenantId: 'tenant-1',
  firstName: 'Asha',
  lastName: 'Rao',
  email: 'asha.rao@demo-college.test',
  phone: '+91 9123456789',
  rollNumber: 'CSE-101',
  departmentId: 'dept-1',
  gender: 'FEMALE',
  dateOfBirth: '2004-01-01T00:00:00.000Z',
  admissionDate: '2023-06-01T00:00:00.000Z',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const ASSIGNMENT = {
  id: 'assign-1',
  tenantId: 'tenant-1',
  subjectId: 'subj-1',
  facultyId: 'faculty-1',
  sectionId: 'sec-1',
  title: 'Sorting Algorithms',
  description: 'Implement quicksort and mergesort',
  startDate: '2026-01-01T00:00:00.000Z',
  dueDate: '2026-01-15T00:00:00.000Z',
  maxMarks: 50,
  status: 'PUBLISHED',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

interface WireSubmission {
  id: string
  tenantId: string
  assignmentId: string
  studentId: string
  submittedAt: string
  attachmentUrl: string | null
  status: string
  marksObtained: number | null
  feedback: string | null
  evaluatedByUserId: string | null
  createdAt: string
  updatedAt: string
}

let submissions: WireSubmission[]

function setupBackend() {
  submissions = [
    {
      id: 'sub-1',
      tenantId: 'tenant-1',
      assignmentId: 'assign-1',
      studentId: 'student-1',
      submittedAt: '2026-01-10T00:00:00.000Z',
      attachmentUrl: null,
      status: 'SUBMITTED',
      marksObtained: null,
      feedback: null,
      evaluatedByUserId: null,
      createdAt: '2026-01-10T00:00:00.000Z',
      updatedAt: '2026-01-10T00:00:00.000Z',
    },
  ]

  mockFetch.get('/subjects', { body: { data: [SUBJECT], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })
  mockFetch.get('/sections', { body: { data: [SECTION], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })
  mockFetch.get('/students', { body: { data: [STUDENT], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })

  mockFetch.get('/assignments/:id', ({ params }): MockFetchResult => {
    if (params.id !== ASSIGNMENT.id) return { status: 404, body: { message: 'Not found', code: 'NOT_FOUND' } }
    return { body: ASSIGNMENT }
  })

  mockFetch.get('/assignments/:id/submissions', (): MockFetchResult => {
    return { body: { data: submissions, meta: { page: 1, pageSize: 10, total: submissions.length, totalPages: 1 } } }
  })

  mockFetch.put('/assignments/submissions/:submissionId/evaluate', ({ params, body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const submission = submissions.find((s) => s.id === params.submissionId)
    if (!submission) return { status: 404, body: { message: 'Not found', code: 'NOT_FOUND' } }
    submission.marksObtained = input.marksObtained as number
    submission.feedback = (input.feedback as string) ?? null
    submission.status = 'EVALUATED'
    return { body: submission }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('AssignmentDetailsPage', () => {
  it('shows assignment info and its submissions', async () => {
    renderPage(ASSIGNMENT.id)

    expect(await screen.findByText('Sorting Algorithms')).toBeInTheDocument()
    expect(screen.getByText('Data Structures (CS301)')).toBeInTheDocument()
    expect(screen.getByText('CSE-A')).toBeInTheDocument()
    expect(screen.getByText(/Asha Rao \(CSE-101\)/)).toBeInTheDocument()
    expect(screen.getByText('SUBMITTED')).toBeInTheDocument()
  })

  it('evaluates a submission', async () => {
    const user = userEvent.setup()
    renderPage(ASSIGNMENT.id)

    await screen.findByText(/Asha Rao/)
    await user.click(screen.getByRole('button', { name: /evaluate/i }))

    const modal = await screen.findByRole('dialog')
    const marksInput = within(modal).getByRole('spinbutton')
    await user.clear(marksInput)
    await user.type(marksInput, '45')
    await user.click(within(modal).getByRole('button', { name: /save evaluation/i }))

    // The evaluation request resolves and the table reflects the new
    // marks/status immediately; the modal's own close animation is a
    // separate (jsdom-unreliable) concern this smoke test doesn't assert on.
    await waitFor(() => expect(screen.getByText('45 / 50')).toBeInTheDocument())
    expect(screen.getByText('EVALUATED')).toBeInTheDocument()
  })
})
