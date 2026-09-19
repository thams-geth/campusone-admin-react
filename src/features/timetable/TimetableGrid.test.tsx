import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '@/features/auth/authContext'
import { TimetableGrid } from '@/features/timetable/TimetableGrid'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('@/features/auth/useAuth', () => ({ useAuth: mockUseAuth }))

function authValue(overrides: Partial<AuthContextValue>): AuthContextValue {
  return {
    status: 'authenticated',
    user: null,
    tenant: null,
    modules: [],
    login: vi.fn(),
    logout: vi.fn(),
    hasRole: () => true,
    hasModule: () => true,
    ...overrides,
  }
}

function renderGrid() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter>
          <TimetableGrid />
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

const SECTION = { id: 'section-1', tenantId: 't1', batchId: 'batch-1', name: 'CSE-A', currentSemester: 3, capacity: 60, status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
const SUBJECT_1 = { id: 'subject-1', tenantId: 't1', programId: 'program-1', semesterNumber: 3, code: 'CS301', name: 'Operating Systems', credits: 4, type: 'CORE', facultyId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
const SUBJECT_2 = { id: 'subject-2', tenantId: 't1', programId: 'program-1', semesterNumber: 3, code: 'CS302', name: 'Data Structures Lab', credits: 2, type: 'CORE', facultyId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
const FACULTY = { id: 'faculty-1', tenantId: 't1', userId: 'user-1', employeeCode: 'EMP-001', departmentId: 'dept-1', designation: 'Professor', qualification: 'Ph.D.', experienceYears: 10, joiningDate: '2015-06-01T00:00:00.000Z', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', name: 'Dr. Asha Rao', email: 'asha.rao@demo-college.test', isActive: true }
const ROOM = { id: 'room-1', tenantId: 't1', name: 'Lecture Hall 1', code: 'LH1', capacity: 80, status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }

const PERIOD_1 = { id: 'period-1', tenantId: 't1', label: 'Period 1', type: 'TEACHING', startTime: '09:00', endTime: '09:50', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
const PERIOD_BREAK = { id: 'period-2', tenantId: 't1', label: 'Break', type: 'BREAK', startTime: '09:50', endTime: '10:00', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
const PERIOD_2 = { id: 'period-3', tenantId: 't1', label: 'Period 2', type: 'TEACHING', startTime: '10:00', endTime: '10:50', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
const PERIOD_3 = { id: 'period-4', tenantId: 't1', label: 'Period 3', type: 'TEACHING', startTime: '10:50', endTime: '11:40', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }

const ENTRY_NORMAL = {
  id: 'entry-1',
  tenantId: 't1',
  sectionId: SECTION.id,
  subjectId: SUBJECT_1.id,
  facultyId: FACULTY.id,
  roomId: ROOM.id,
  dayOfWeek: 'MONDAY',
  startTime: '09:00',
  endTime: '09:50',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

// A lab spanning Period 2 + Period 3 back-to-back — one entry whose time
// range covers two period rows.
const ENTRY_LAB = {
  id: 'entry-2',
  tenantId: 't1',
  sectionId: SECTION.id,
  subjectId: SUBJECT_2.id,
  facultyId: FACULTY.id,
  roomId: ROOM.id,
  dayOfWeek: 'TUESDAY',
  startTime: '10:00',
  endTime: '11:40',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function setupBackend(entries: unknown[]) {
  mockFetch.get('/sections', { body: { data: [SECTION], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })
  mockFetch.get('/subjects', { body: { data: [SUBJECT_1, SUBJECT_2], meta: { page: 1, pageSize: 100, total: 2, totalPages: 1 } } })
  mockFetch.get('/faculty', { body: { data: [FACULTY], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })
  mockFetch.get('/rooms', { body: { data: [ROOM], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })
  mockFetch.get('/timetable/periods', (): MockFetchResult => ({ body: [PERIOD_1, PERIOD_BREAK, PERIOD_2, PERIOD_3] }))

  mockFetch.get('/timetable', ({ query }): MockFetchResult => {
    const sectionId = query.get('sectionId')
    const data = sectionId ? entries.filter((e) => (e as { sectionId: string }).sectionId === sectionId) : entries
    return { body: { data, meta: { page: 1, pageSize: 200, total: data.length, totalPages: 1 } } }
  })
}

beforeEach(() => {
  mockUseAuth.mockReturnValue(authValue({}))
  installMockFetch()
})

afterEach(() => resetMockFetch())

async function selectSection(user: ReturnType<typeof userEvent.setup>) {
  const sectionCombobox = screen.getByRole('combobox')
  await user.click(sectionCombobox)
  await user.click(await screen.findByTitle('CSE-A'))
  // Wait for the grid table (period rows) to render.
  await screen.findByText('Period 1')
}

describe('TimetableGrid', () => {
  it('prompts to select a section when none is chosen', async () => {
    setupBackend([])
    renderGrid()

    expect(await screen.findByText('Select a section to view its weekly timetable.')).toBeInTheDocument()
  })

  it('renders a normal single-period entry in the correct cell', async () => {
    setupBackend([ENTRY_NORMAL])
    const user = userEvent.setup()
    renderGrid()
    await selectSection(user)

    const cell = screen.getByText('CS301 — Operating Systems')
    expect(cell).toBeInTheDocument()
    const row = cell.closest('tr')!
    expect(within(row).getByText('Period 1')).toBeInTheDocument()
    expect(within(row).getByText('Dr. Asha Rao')).toBeInTheDocument()
  })

  it('renders a multi-period lab entry once, spanning the periods it covers, without duplicating it', async () => {
    setupBackend([ENTRY_LAB])
    const user = userEvent.setup()
    renderGrid()
    await selectSection(user)

    const labCells = screen.getAllByText('CS302 — Data Structures Lab')
    expect(labCells).toHaveLength(1)

    const td = labCells[0].closest('td')!
    expect(td.getAttribute('rowspan')).toBe('2')

    // Period 3's Tuesday column is covered by the lab's rowSpan — it must not
    // also render its own empty "+" slot.
    expect(screen.queryByRole('button', { name: 'Add entry — Tuesday Period 3' })).not.toBeInTheDocument()
  })

  it('renders a BREAK period as one merged band across all day columns, not per-day cells', async () => {
    setupBackend([])
    const user = userEvent.setup()
    renderGrid()
    await selectSection(user)

    const band = screen.getByText('Break — 09:50–10:00')
    const td = band.closest('td')!
    expect(td.getAttribute('colspan')).toBe('6')

    expect(screen.queryByRole('button', { name: /Add entry — Monday Break/ })).not.toBeInTheDocument()
  })

  it('opens the drawer pre-filled when an empty cell is clicked', async () => {
    setupBackend([ENTRY_NORMAL])
    const user = userEvent.setup()
    renderGrid()
    await selectSection(user)

    // Monday/Period 2 has no entry (only Monday/Period 1 is occupied).
    await user.click(screen.getByRole('button', { name: 'Add entry — Monday Period 2' }))
    const drawer = await screen.findByRole('dialog')

    expect(within(drawer).getByText('Add timetable entry')).toBeInTheDocument()
    expect(within(drawer).getByText('Monday')).toBeInTheDocument()
    expect(within(drawer).getAllByText('Period 2 (10:00–10:50)')).toHaveLength(2)
  })

  it('opens the drawer in edit mode when a filled cell is clicked', async () => {
    setupBackend([ENTRY_NORMAL])
    const user = userEvent.setup()
    renderGrid()
    await selectSection(user)

    await user.click(screen.getByRole('button', { name: 'Edit CS301 — Operating Systems on Monday' }))
    const drawer = await screen.findByRole('dialog')

    expect(within(drawer).getByText('Edit timetable entry')).toBeInTheDocument()
    expect(within(drawer).getByRole('button', { name: /remove/i })).toBeInTheDocument()
    expect(within(drawer).getByText('CSE-A')).toBeInTheDocument()
    expect(within(drawer).getByText('CS301 — Operating Systems')).toBeInTheDocument()
    expect(within(drawer).getAllByText('Period 1 (09:00–09:50)')).toHaveLength(2)
  })
})
