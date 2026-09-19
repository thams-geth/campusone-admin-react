import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AssignmentsPage } from '@/features/assignments/AssignmentsPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={['/assignments']}>
          <AssignmentsPage />
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

interface WireAssignment {
  id: string
  tenantId: string
  subjectId: string
  facultyId: string
  sectionId: string
  title: string
  description: string | null
  startDate: string
  dueDate: string
  maxMarks: number
  status: string
  createdAt: string
  updatedAt: string
}

let assignments: WireAssignment[]
let nextId: number

function seedAssignment(overrides: Partial<WireAssignment>): WireAssignment {
  return {
    id: `assign-${nextId++}`,
    tenantId: 'tenant-1',
    subjectId: 'subj-1',
    facultyId: 'faculty-1',
    sectionId: 'sec-1',
    title: 'Assignment',
    description: null,
    startDate: '2026-01-01T00:00:00.000Z',
    dueDate: '2026-01-15T00:00:00.000Z',
    maxMarks: 100,
    status: 'DRAFT',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  nextId = 1
  assignments = [
    seedAssignment({ id: 'assign-ds', title: 'Linked List Lab', status: 'DRAFT' }),
    seedAssignment({ id: 'assign-published', title: 'Sorting Algorithms', status: 'PUBLISHED' }),
  ]

  mockFetch.get('/subjects', { body: { data: [SUBJECT], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })
  mockFetch.get('/sections', { body: { data: [SECTION], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })

  mockFetch.get('/assignments', (): MockFetchResult => {
    return { body: { data: assignments, meta: { page: 1, pageSize: 10, total: assignments.length, totalPages: 1 } } }
  })

  mockFetch.post('/assignments', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const created = seedAssignment({
      title: input.title as string,
      description: (input.description as string) ?? null,
      subjectId: input.subjectId as string,
      sectionId: input.sectionId as string,
      startDate: input.startDate as string,
      dueDate: input.dueDate as string,
      maxMarks: input.maxMarks as number,
    })
    assignments.push(created)
    return { status: 201, body: created }
  })

  mockFetch.post('/assignments/:id/publish', ({ params }): MockFetchResult => {
    const assignment = assignments.find((a) => a.id === params.id)
    if (!assignment) return { status: 404, body: { message: 'Not found', code: 'NOT_FOUND' } }
    assignment.status = 'PUBLISHED'
    return { body: assignment }
  })

  mockFetch.delete('/assignments/:id', ({ params }): MockFetchResult => {
    assignments = assignments.filter((a) => a.id !== params.id)
    return { status: 204 }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('AssignmentsPage', () => {
  it('lists the seeded assignments with resolved subject/section names', async () => {
    renderPage()

    expect(await screen.findByText('Linked List Lab')).toBeInTheDocument()
    expect(screen.getByText('Sorting Algorithms')).toBeInTheDocument()
    expect(screen.getAllByText('Data Structures (CS301)').length).toBeGreaterThan(0)
    expect(screen.getAllByText('CSE-A').length).toBeGreaterThan(0)
  })

  it(
    'publishes a draft assignment',
    async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByText('Linked List Lab')

      const row = screen.getByText('Linked List Lab').closest('tr')!
      await user.click(within(row).getByRole('button', { name: /publish/i }))
      const confirmButtons = await screen.findAllByRole('button', { name: /^publish$/i })
      await user.click(confirmButtons[confirmButtons.length - 1])

      await waitFor(() => {
        const updatedRow = screen.getByText('Linked List Lab').closest('tr')!
        expect(within(updatedRow).getByText('PUBLISHED')).toBeInTheDocument()
      })
    },
    15_000,
  )

  it('creates a new assignment through the drawer form', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Linked List Lab')

    await user.click(screen.getByRole('button', { name: /add assignment/i }))
    const drawer = await screen.findByRole('dialog')

    await user.type(within(drawer).getByPlaceholderText('Unit 3 problem set'), 'Graph Traversal Homework')

    // Select subject and section from the drawer's dropdowns (identified by
    // ARIA combobox role — no placeholder text is rendered while the
    // controlled value is an empty string, same as the students form).
    const [subjectCombobox, sectionCombobox] = within(drawer).getAllByRole('combobox')
    await user.click(subjectCombobox)
    await user.click(await screen.findByTitle('Data Structures (CS301)'))

    await user.click(sectionCombobox)
    await user.click(await screen.findByTitle('CSE-A'))

    const dateInputs = within(drawer).getAllByPlaceholderText('Select date')
    await user.type(dateInputs[0], '2026-02-01{Enter}')
    await user.type(dateInputs[1], '2026-02-15{Enter}')
    await user.keyboard('{Escape}')

    await user.click(within(drawer).getByRole('button', { name: /create assignment/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('Graph Traversal Homework')).toBeInTheDocument()
  })
})
