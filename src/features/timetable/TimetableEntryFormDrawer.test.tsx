import type { ComponentProps } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TimetableEntryFormDrawer } from '@/features/timetable/TimetableEntryFormDrawer'
import { calls, installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderDrawer(props: Partial<ComponentProps<typeof TimetableEntryFormDrawer>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <TimetableEntryFormDrawer open onClose={() => {}} {...props} />
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
const PERIOD_3 = { id: 'period-4', tenantId: 't1', label: 'Period 3', type: 'TEACHING', startTime: '10:50', endTime: '11:40', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }

function setupBackend() {
  mockFetch.get('/sections', { body: { data: [SECTION], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })
  mockFetch.get('/subjects', { body: { data: [SUBJECT], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })
  mockFetch.get('/faculty', { body: { data: [FACULTY], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })
  mockFetch.get('/rooms', { body: { data: [ROOM], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } } })
  mockFetch.get('/timetable/periods', (): MockFetchResult => ({ body: [PERIOD_1, PERIOD_BREAK, PERIOD_2, PERIOD_3] }))

  mockFetch.post('/timetable', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    return {
      status: 201,
      body: {
        id: 'new-entry',
        tenantId: 't1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        ...input,
      },
    }
  })

  mockFetch.put('/timetable/:id', ({ params, body }): MockFetchResult => ({
    body: {
      id: params.id,
      tenantId: 't1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      ...(body as Record<string, unknown>),
    },
  }))
}

async function fillCommonFields(user: ReturnType<typeof userEvent.setup>, drawer: HTMLElement) {
  const [sectionCombobox, subjectCombobox, facultyCombobox, roomCombobox] = within(drawer).getAllByRole('combobox')
  await user.click(sectionCombobox)
  await user.click(await screen.findByTitle('CSE-A'))
  await user.click(subjectCombobox)
  await user.click(await screen.findByTitle('CS301 — Operating Systems'))
  await user.click(facultyCombobox)
  await user.click(await screen.findByTitle('Dr. Asha Rao'))
  await user.click(roomCombobox)
  await user.click(await screen.findByTitle('Lecture Hall 1 (LH1)'))
}

/**
 * Start period and End period share the exact same option pool (both list
 * every TEACHING period), and antd/rc-select doesn't remove a dropdown's
 * option list from the DOM just because it closed — the closing popup stays
 * mounted (mid slide-up-leave transition) alongside whichever dropdown is
 * open next, so `findAllByTitle` can match both. The closing one is marked
 * `pointer-events: none` inline (the currently-open one never is), so filter
 * that out rather than guessing by DOM order.
 */
async function selectOption(user: ReturnType<typeof userEvent.setup>, name: string) {
  const options = await screen.findAllByTitle(name)
  const isClosing = (o: HTMLElement) =>
    (o.closest('.ant-select-dropdown')?.getAttribute('style') ?? '').includes('pointer-events: none')
  const openOption = options.find((o) => !isClosing(o)) ?? options[options.length - 1]
  await user.click(openOption)
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('TimetableEntryFormDrawer', () => {
  it('populates the period selects from TEACHING periods only', async () => {
    const user = userEvent.setup()
    renderDrawer()
    const drawer = await screen.findByRole('dialog')

    const [, , , , , startPeriodCombobox] = within(drawer).getAllByRole('combobox')
    await user.click(startPeriodCombobox)

    expect(await screen.findByText('Period 1 (09:00–09:50)')).toBeInTheDocument()
    expect(screen.getByText('Period 2 (10:00–10:50)')).toBeInTheDocument()
    expect(screen.getByText('Period 3 (10:50–11:40)')).toBeInTheDocument()
    expect(screen.queryByText(/break/i)).not.toBeInTheDocument()
  })

  it('auto-sets a matching end period when a start period is picked', async () => {
    const user = userEvent.setup()
    renderDrawer()
    const drawer = await screen.findByRole('dialog')

    const [, , , , , startPeriodCombobox] = within(drawer).getAllByRole('combobox')
    await user.click(startPeriodCombobox)
    await selectOption(user, 'Period 1 (09:00–09:50)')

    // { selector } excludes rc-select's hidden aria-live announcer span,
    // which also picks up the just-selected label text.
    expect(within(drawer).getAllByText('Period 1 (09:00–09:50)', { selector: '.ant-select-content' })).toHaveLength(2)
  })

  it('rejects a range that crosses a break, blocking submission', async () => {
    const user = userEvent.setup()
    renderDrawer()
    const drawer = await screen.findByRole('dialog')

    const [, , , , , startPeriodCombobox, endPeriodCombobox] = within(drawer).getAllByRole('combobox')
    await user.click(startPeriodCombobox)
    await selectOption(user, 'Period 1 (09:00–09:50)')
    await user.click(endPeriodCombobox)
    await selectOption(user, 'Period 2 (10:00–10:50)')

    expect(
      await screen.findByText("Can't schedule across a break — choose periods that don't span one."),
    ).toBeInTheDocument()

    const submitButton = within(drawer).getByRole('button', { name: /add entry/i })
    expect(submitButton).toBeDisabled()
  })

  it('computes and submits the correct derived start/end times for a valid multi-period selection', async () => {
    const user = userEvent.setup()
    renderDrawer()
    const drawer = await screen.findByRole('dialog')

    await fillCommonFields(user, drawer)

    const [, , , , , startPeriodCombobox, endPeriodCombobox] = within(drawer).getAllByRole('combobox')
    await user.click(startPeriodCombobox)
    await selectOption(user, 'Period 2 (10:00–10:50)')
    await user.click(endPeriodCombobox)
    await selectOption(user, 'Period 3 (10:50–11:40)')

    await user.click(within(drawer).getByRole('button', { name: /add entry/i }))

    expect(await screen.findByText('Timetable entry added')).toBeInTheDocument()
    const postCall = calls.find((c) => c.method === 'POST' && c.path === '/timetable')
    expect(postCall?.body).toMatchObject({ startTime: '10:00', endTime: '11:40', dayOfWeek: 'MONDAY' })
  })

  it('pre-fills the right start/end period for an existing entry in edit mode', async () => {
    renderDrawer({
      entry: {
        id: 'entry-1',
        tenantId: 't1',
        sectionId: SECTION.id,
        subjectId: SUBJECT.id,
        facultyId: FACULTY.id,
        roomId: ROOM.id,
        dayOfWeek: 'TUESDAY',
        startTime: '10:00',
        endTime: '11:40',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    })
    const drawer = await screen.findByRole('dialog')

    expect(within(drawer).getByText('Edit timetable entry')).toBeInTheDocument()
    expect(within(drawer).getByRole('button', { name: /remove/i })).toBeInTheDocument()
    expect(await within(drawer).findByText('Period 2 (10:00–10:50)')).toBeInTheDocument()
    expect(within(drawer).getByText('Period 3 (10:50–11:40)')).toBeInTheDocument()
  })
})
