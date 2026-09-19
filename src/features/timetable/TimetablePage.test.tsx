import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '@/features/auth/authContext'
import { TimetableListView, TimetablePage } from '@/features/timetable/TimetablePage'
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

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={['/timetable']}>
          <TimetablePage />
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

/**
 * Renders the List view tab's content directly, without antd's `Tabs`
 * wrapper — an inactive tab pane (Grid view is the default/active one) never
 * mounts its children, and `Tabs` + a `Popconfirm` inside a pane also causes
 * a severe jsdom-only slowdown. See TimetablePage.tsx's export comment and
 * FeesPage.tsx/FeesPage.test.tsx for the same pattern applied there.
 */
function renderListView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter>
          <TimetableListView />
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

const SECTION = { id: 'section-1', tenantId: 't1', batchId: 'batch-1', name: 'CSE-A', currentSemester: 3, capacity: 60, status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
const SUBJECT = { id: 'subject-1', tenantId: 't1', programId: 'program-1', semesterNumber: 3, code: 'CS301', name: 'Operating Systems', credits: 4, type: 'CORE', facultyId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
const FACULTY = { id: 'faculty-1', tenantId: 't1', userId: 'user-1', employeeCode: 'EMP-001', departmentId: 'dept-1', designation: 'Professor', qualification: 'Ph.D.', experienceYears: 10, joiningDate: '2015-06-01T00:00:00.000Z', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', name: 'Dr. Asha Rao', email: 'asha.rao@demo-college.test', isActive: true }
const ROOM = { id: 'room-1', tenantId: 't1', name: 'Lecture Hall 1', code: 'LH1', capacity: 80, status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }

const PERIOD_1 = { id: 'period-1', tenantId: 't1', label: 'Period 1', type: 'TEACHING', startTime: '09:00', endTime: '09:50', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
const PERIOD_BREAK = { id: 'period-2', tenantId: 't1', label: 'Break', type: 'BREAK', startTime: '09:50', endTime: '10:00', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
const PERIOD_2 = { id: 'period-3', tenantId: 't1', label: 'Period 2', type: 'TEACHING', startTime: '10:00', endTime: '10:50', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }

interface WireEntry {
  id: string
  tenantId: string
  sectionId: string
  subjectId: string
  facultyId: string
  roomId: string
  dayOfWeek: string
  startTime: string
  endTime: string
  createdAt: string
  updatedAt: string
}

let entries: WireEntry[]
let nextId: number

function seedEntry(overrides: Partial<WireEntry>): WireEntry {
  return {
    id: `entry-${nextId++}`,
    tenantId: 't1',
    sectionId: SECTION.id,
    subjectId: SUBJECT.id,
    facultyId: FACULTY.id,
    roomId: ROOM.id,
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '10:00',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  nextId = 1
  entries = [seedEntry({ id: 'entry-1' }), seedEntry({ id: 'entry-2', dayOfWeek: 'TUESDAY', startTime: '11:00', endTime: '12:00' })]

  mockFetch.get('/sections', { body: { data: [SECTION], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })
  mockFetch.get('/subjects', { body: { data: [SUBJECT], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })
  mockFetch.get('/faculty', { body: { data: [FACULTY], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })
  mockFetch.get('/rooms', { body: { data: [ROOM], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })
  mockFetch.get('/timetable/periods', (): MockFetchResult => ({ body: [PERIOD_1, PERIOD_BREAK, PERIOD_2] }))

  mockFetch.get('/timetable', ({ query }): MockFetchResult => {
    const dayOfWeek = query.get('dayOfWeek')
    const data = dayOfWeek ? entries.filter((e) => e.dayOfWeek === dayOfWeek) : entries
    return { body: { data, meta: { page: 1, pageSize: 10, total: data.length, totalPages: 1 } } }
  })

  mockFetch.post('/timetable', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const conflict = entries.some(
      (e) => e.dayOfWeek === input.dayOfWeek && e.facultyId === input.facultyId && e.startTime === input.startTime,
    )
    if (conflict) {
      return { status: 409, body: { message: 'Faculty is already booked at this time.', code: 'TIMETABLE_CONFLICT' } }
    }
    const created = seedEntry(input as Partial<WireEntry>)
    entries.push(created)
    return { status: 201, body: created }
  })

  mockFetch.delete('/timetable/:id', ({ params }): MockFetchResult => {
    entries = entries.filter((e) => e.id !== params.id)
    return { status: 204 }
  })
}

beforeEach(() => {
  mockUseAuth.mockReturnValue(authValue({}))
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('TimetableListView', () => {
  it('lists the seeded timetable entries with resolved names', async () => {
    renderListView()

    expect(await screen.findAllByText('CSE-A')).toHaveLength(2)
    expect(screen.getAllByText('CS301 — Operating Systems')).toHaveLength(2)
    expect(screen.getAllByText('Dr. Asha Rao')).toHaveLength(2)
    expect(screen.getAllByText('Lecture Hall 1 (LH1)')).toHaveLength(2)
  })

  it('filters by day of week', async () => {
    const user = userEvent.setup()
    renderListView()
    await screen.findAllByText('CSE-A')

    // Filter row order: Section, Faculty, Room, Day of week.
    const [, , , dayOfWeekCombobox] = screen.getAllByRole('combobox')
    await user.click(dayOfWeekCombobox)
    await user.click(await screen.findByTitle('Tuesday'))

    await waitFor(() => {
      expect(screen.getByText('11:00–12:00')).toBeInTheDocument()
      expect(screen.queryByText('09:00–10:00')).not.toBeInTheDocument()
    })
  })

  it('removes an entry via Popconfirm', async () => {
    const user = userEvent.setup()
    renderListView()
    const rows = await screen.findAllByText('CSE-A')
    expect(rows).toHaveLength(2)

    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    await user.click(removeButtons[0])
    const confirmButtons = await screen.findAllByRole('button', { name: /^remove$/i })
    await user.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(screen.getAllByText('CSE-A')).toHaveLength(1))
  })
})

describe('TimetablePage', () => {
  it('adds a new timetable entry through the drawer form', async () => {
    mockUseAuth.mockReturnValue(authValue({}))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Timetable')

    await user.click(screen.getByRole('button', { name: /add entry/i }))
    const drawer = await screen.findByRole('dialog')

    // Drawer combobox order: Section, Subject, Faculty, Room, Day of week,
    // Start period, End period (End period auto-follows Start period).
    const [sectionCombobox, subjectCombobox, facultyCombobox, roomCombobox, dayCombobox, startPeriodCombobox] =
      within(drawer).getAllByRole('combobox')

    await user.click(sectionCombobox)
    await user.click(await screen.findByTitle('CSE-A'))
    await user.click(subjectCombobox)
    await user.click(await screen.findByTitle('CS301 — Operating Systems'))
    await user.click(facultyCombobox)
    await user.click(await screen.findByTitle('Dr. Asha Rao'))
    await user.click(roomCombobox)
    await user.click(await screen.findByTitle('Lecture Hall 1 (LH1)'))
    await user.click(dayCombobox)
    await user.click(await screen.findByTitle('Wednesday'))
    await user.click(startPeriodCombobox)
    await user.click(await screen.findByTitle('Period 1 (09:00–09:50)'))

    await user.click(within(drawer).getByRole('button', { name: /add entry/i }))

    expect(await screen.findByText('Timetable entry added')).toBeInTheDocument()
  })

  it('surfaces a 409 conflict from the backend', async () => {
    mockUseAuth.mockReturnValue(authValue({}))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Timetable')

    await user.click(screen.getByRole('button', { name: /add entry/i }))
    const drawer = await screen.findByRole('dialog')

    const [sectionCombobox, subjectCombobox, facultyCombobox, roomCombobox, , startPeriodCombobox] =
      within(drawer).getAllByRole('combobox')

    await user.click(sectionCombobox)
    await user.click(await screen.findByTitle('CSE-A'))
    await user.click(subjectCombobox)
    await user.click(await screen.findByTitle('CS301 — Operating Systems'))
    await user.click(facultyCombobox)
    await user.click(await screen.findByTitle('Dr. Asha Rao'))
    await user.click(roomCombobox)
    await user.click(await screen.findByTitle('Lecture Hall 1 (LH1)'))
    // Day of week defaults to Monday — same day+faculty+startTime as seeded entry-1.
    await user.click(startPeriodCombobox)
    await user.click(await screen.findByTitle('Period 1 (09:00–09:50)'))

    await user.click(within(drawer).getByRole('button', { name: /add entry/i }))

    expect(await screen.findByText(/already booked/i)).toBeInTheDocument()
  })

  it('hides mutating actions for non-admin roles', async () => {
    mockUseAuth.mockReturnValue(authValue({ hasRole: () => false }))
    renderPage()
    await screen.findByText('Timetable')

    expect(screen.queryByRole('button', { name: /add entry/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /configure periods/i })).not.toBeInTheDocument()
  })
})
