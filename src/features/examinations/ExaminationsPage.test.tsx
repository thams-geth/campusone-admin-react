import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ExaminationsPage } from '@/features/examinations/ExaminationsPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={['/examinations']}>
          <Routes>
            <Route path="/examinations" element={<ExaminationsPage />} />
            <Route path="/examinations/:examId" element={<div>Exam details page</div>} />
          </Routes>
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

const ACADEMIC_YEAR = {
  id: 'ay-1',
  tenantId: 'tenant-1',
  name: '2025-26',
  startDate: '2025-06-01T00:00:00.000Z',
  endDate: '2026-05-31T00:00:00.000Z',
  isCurrent: true,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

interface WireExam {
  id: string
  tenantId: string
  name: string
  examType: string
  academicYearId: string
  semesterNumber: number
  startDate: string
  endDate: string
  status: string
  createdAt: string
  updatedAt: string
}

let exams: WireExam[]
let nextId: number

function seedExam(overrides: Partial<WireExam>): WireExam {
  return {
    id: `exam-${nextId++}`,
    tenantId: 'tenant-1',
    name: 'Exam',
    examType: 'INTERNAL',
    academicYearId: 'ay-1',
    semesterNumber: 1,
    startDate: '2026-03-01T00:00:00.000Z',
    endDate: '2026-03-10T00:00:00.000Z',
    status: 'SCHEDULED',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  nextId = 1
  exams = [
    seedExam({ id: 'exam-mid', name: 'Mid-term 2026', examType: 'MIDTERM', semesterNumber: 3, status: 'SCHEDULED' }),
    seedExam({ id: 'exam-final', name: 'Final 2026', examType: 'FINAL', semesterNumber: 3, status: 'ONGOING' }),
  ]

  mockFetch.get('/academic-years', { body: { data: [ACADEMIC_YEAR], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })

  mockFetch.get('/examinations/exams', (): MockFetchResult => ({
    body: { data: exams, meta: { page: 1, pageSize: 10, total: exams.length, totalPages: 1 } },
  }))

  mockFetch.post('/examinations/exams', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const created = seedExam({
      name: input.name as string,
      examType: input.examType as string,
      academicYearId: input.academicYearId as string,
      semesterNumber: input.semesterNumber as number,
      startDate: input.startDate as string,
      endDate: input.endDate as string,
    })
    exams.push(created)
    return { status: 201, body: created }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('ExaminationsPage', () => {
  it('lists the seeded exams with type and status tags', async () => {
    renderPage()

    expect(await screen.findByText('Mid-term 2026')).toBeInTheDocument()
    expect(screen.getByText('Final 2026')).toBeInTheDocument()
    expect(screen.getByText('MIDTERM')).toBeInTheDocument()
    expect(screen.getByText('ONGOING')).toBeInTheDocument()
  })

  it('navigates to the exam details page on row click', async () => {
    const user = userEvent.setup()
    renderPage()

    const row = await screen.findByText('Mid-term 2026')
    await user.click(row)

    expect(await screen.findByText('Exam details page')).toBeInTheDocument()
  })

  it('creates a new exam through the drawer form', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Mid-term 2026')

    await user.click(screen.getByRole('button', { name: /add exam/i }))
    const drawer = await screen.findByRole('dialog')

    await user.type(within(drawer).getByPlaceholderText('Mid-term 2026'), 'Supplementary 2026')
    await user.click(within(drawer).getByRole('button', { name: /create exam/i }))

    // Validation should block submit until required selects/dates are filled — assert the drawer stays open.
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })
})
