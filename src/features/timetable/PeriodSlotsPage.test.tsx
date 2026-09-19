import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PeriodSlotsPage } from '@/features/timetable/PeriodSlotsPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={['/timetable/periods']}>
          <Routes>
            <Route path="/timetable/periods" element={<PeriodSlotsPage />} />
            <Route path="/timetable" element={<div>Timetable page opened</div>} />
          </Routes>
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WirePeriodSlot {
  id: string
  tenantId: string
  label: string
  type: 'TEACHING' | 'BREAK' | 'LUNCH'
  startTime: string
  endTime: string
  createdAt: string
  updatedAt: string
}

let periods: WirePeriodSlot[]
let nextId: number

function seedPeriod(overrides: Partial<WirePeriodSlot>): WirePeriodSlot {
  return {
    id: `period-${nextId++}`,
    tenantId: 'tenant-1',
    label: 'Period',
    type: 'TEACHING',
    startTime: '09:00',
    endTime: '09:50',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  nextId = 1
  periods = []

  mockFetch.get('/timetable/periods', (): MockFetchResult => ({ body: periods }))

  mockFetch.post('/timetable/periods', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const conflict = periods.find(
      (p) => (input.startTime as string) < p.endTime && (input.endTime as string) > p.startTime,
    )
    if (conflict) {
      return {
        status: 409,
        body: {
          message: `That time overlaps "${conflict.label}" (${conflict.startTime}–${conflict.endTime}).`,
          code: 'PERIOD_OVERLAP',
        },
      }
    }
    const created = seedPeriod({
      label: input.label as string,
      type: input.type as WirePeriodSlot['type'],
      startTime: input.startTime as string,
      endTime: input.endTime as string,
    })
    periods.push(created)
    periods.sort((a, b) => a.startTime.localeCompare(b.startTime))
    return { status: 201, body: created }
  })

  mockFetch.put('/timetable/periods/:id', ({ params, body }): MockFetchResult => {
    const period = periods.find((p) => p.id === params.id)
    if (!period) return { status: 404, body: { message: 'Not found', code: 'NOT_FOUND' } }
    Object.assign(period, body as Record<string, unknown>)
    periods.sort((a, b) => a.startTime.localeCompare(b.startTime))
    return { body: period }
  })

  mockFetch.delete('/timetable/periods/:id', ({ params }): MockFetchResult => {
    periods = periods.filter((p) => p.id !== params.id)
    return { status: 204 }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('PeriodSlotsPage', () => {
  it('shows the empty state with no periods configured', async () => {
    renderPage()
    expect(
      await screen.findByText(/no periods configured yet/i),
    ).toBeInTheDocument()
  })

  it('lists periods in chronological order', async () => {
    periods.push(
      seedPeriod({ id: 'p1', label: 'Period 1', type: 'TEACHING', startTime: '09:00', endTime: '09:50' }),
      seedPeriod({ id: 'p2', label: 'Morning Break', type: 'BREAK', startTime: '09:50', endTime: '10:00' }),
      seedPeriod({ id: 'p3', label: 'Period 2', type: 'TEACHING', startTime: '10:00', endTime: '10:50' }),
    )

    const { container } = renderPage()

    expect(await screen.findByText('Period 1')).toBeInTheDocument()
    expect(screen.getByText('Morning Break')).toBeInTheDocument()
    expect(screen.getByText('Period 2')).toBeInTheDocument()

    // Query only the top-level rows (class "ant-list-item") — getAllByRole('listitem')
    // would also match the nested Edit/Delete <li>s inside each row's action list.
    const rows = Array.from(container.querySelectorAll('li.ant-list-item')).map((row) => row.textContent)
    expect(rows).toEqual([
      expect.stringContaining('Period 1'),
      expect.stringContaining('Morning Break'),
      expect.stringContaining('Period 2'),
    ])
  })

  it('adds a new period through the modal form', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText(/no periods configured yet/i)

    // The button's icon (PlusOutlined, role="img" aria-label="plus") contributes
    // to its accessible name, so match unanchored rather than an exact string.
    const addPeriodButtons = screen.getAllByRole('button', { name: /add period/i })
    await user.click(addPeriodButtons[0])
    const modal = await screen.findByRole('dialog')

    expect(within(modal).getByDisplayValue('Period 1')).toBeInTheDocument()

    const timeInputs = within(modal).getAllByPlaceholderText('Select time')
    await user.type(timeInputs[0], '09:00{Enter}')
    await user.type(timeInputs[1], '09:50{Enter}')

    await user.click(within(modal).getByRole('button', { name: /^add$/i }))

    await waitFor(() => expect(screen.getByText('09:00–09:50')).toBeInTheDocument())
    expect(screen.queryByText(/no periods configured yet/i)).not.toBeInTheDocument()
  })

  it('surfaces the backend PERIOD_OVERLAP message verbatim', async () => {
    periods.push(seedPeriod({ id: 'p1', label: 'Period 1', type: 'TEACHING', startTime: '09:00', endTime: '09:50' }))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Period 1')

    await user.click(screen.getByRole('button', { name: /add break/i }))
    const modal = await screen.findByRole('dialog')

    const timeInputs = within(modal).getAllByPlaceholderText('Select time')
    await user.type(timeInputs[0], '09:15{Enter}')
    await user.type(timeInputs[1], '09:30{Enter}')

    await user.click(within(modal).getByRole('button', { name: /^add$/i }))

    expect(await screen.findByText('That time overlaps "Period 1" (09:00–09:50).')).toBeInTheDocument()
  })

  it('edits an existing period', async () => {
    periods.push(seedPeriod({ id: 'p1', label: 'Period 1', type: 'TEACHING', startTime: '09:00', endTime: '09:50' }))
    const user = userEvent.setup()
    renderPage()
    const row = (await screen.findByText('Period 1')).closest('li')!

    await user.click(within(row).getByRole('button', { name: /edit/i }))
    const modal = await screen.findByRole('dialog')

    const labelInput = within(modal).getByDisplayValue('Period 1')
    await user.clear(labelInput)
    await user.type(labelInput, 'Period 1 (Renamed)')

    await user.click(within(modal).getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText('Period 1 (Renamed)')).toBeInTheDocument()
  })

  it('deletes a period via Popconfirm', async () => {
    periods.push(seedPeriod({ id: 'p1', label: 'Period 1', type: 'TEACHING', startTime: '09:00', endTime: '09:50' }))
    const user = userEvent.setup()
    renderPage()
    const row = (await screen.findByText('Period 1')).closest('li')!

    await user.click(within(row).getByRole('button', { name: /delete/i }))
    const confirmButtons = await screen.findAllByRole('button', { name: /^delete$/i })
    await user.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(screen.queryByText('Period 1')).not.toBeInTheDocument())
  })
})
