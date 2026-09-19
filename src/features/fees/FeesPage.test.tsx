import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FeesPage, FeeStructuresTab } from '@/features/fees/FeesPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter>
          <FeesPage />
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

/**
 * Renders the Fee structures tab's content directly, without antd's `Tabs`
 * wrapper — `Tabs` + a `Popconfirm` interaction inside a tab pane causes a
 * severe jsdom-only slowdown (not a real bug, confirmed fine in real
 * browsers). See LeavePage.tsx / LeavePage.test.tsx for the same pattern.
 */
function renderFeeStructuresTab() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter>
          <FeeStructuresTab />
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireInvoice {
  id: string
  tenantId: string
  studentId: string
  feeStructureId: string | null
  category: string
  amount: number
  dueDate: string
  status: string
  createdAt: string
  updatedAt: string
}

interface WireStructure {
  id: string
  tenantId: string
  programId: string
  academicYearId: string
  category: string
  amount: number
  createdAt: string
  updatedAt: string
}

let invoices: WireInvoice[]
let structures: WireStructure[]
let nextId: number

function seedInvoice(overrides: Partial<WireInvoice>): WireInvoice {
  return {
    id: `inv-${nextId++}`,
    tenantId: 'tenant-1',
    studentId: 'student-1',
    feeStructureId: null,
    category: 'TUITION',
    amount: 50000,
    dueDate: '2026-03-01',
    status: 'PENDING',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function seedStructure(overrides: Partial<WireStructure>): WireStructure {
  return {
    id: `fs-${nextId++}`,
    tenantId: 'tenant-1',
    programId: 'prog-1',
    academicYearId: 'ay-1',
    category: 'TUITION',
    amount: 50000,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  nextId = 1
  invoices = [seedInvoice({ id: 'inv-tuition', status: 'PENDING' })]
  structures = [seedStructure({ id: 'fs-tuition' })]

  mockFetch.get('/students', (): MockFetchResult => ({
    body: {
      data: [
        {
          id: 'student-1',
          tenantId: 'tenant-1',
          firstName: 'Asha',
          lastName: 'Rao',
          email: 'asha@example.com',
          phone: '9999999999',
          rollNumber: 'CSE001',
          departmentId: 'dept-1',
          gender: 'FEMALE',
          dateOfBirth: '2004-01-01',
          admissionDate: '2022-06-01',
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
    },
  }))

  mockFetch.get('/programs', (): MockFetchResult => ({
    body: {
      data: [{ id: 'prog-1', tenantId: 'tenant-1', departmentId: 'dept-1', name: 'B.Tech CSE', code: 'BTCSE', durationYears: 4, status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
    },
  }))

  mockFetch.get('/academic-years', (): MockFetchResult => ({
    body: {
      data: [{ id: 'ay-1', tenantId: 'tenant-1', name: '2025-26', startDate: '2025-06-01', endDate: '2026-05-31', isCurrent: true, status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
      meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
    },
  }))

  mockFetch.get('/fees/structures', (): MockFetchResult => ({
    body: { data: structures, meta: { page: 1, pageSize: 100, total: structures.length, totalPages: 1 } },
  }))

  mockFetch.delete('/fees/structures/:id', ({ params }): MockFetchResult => {
    structures = structures.filter((s) => s.id !== params.id)
    return { status: 204 }
  })

  mockFetch.get('/fees/invoices', ({ query }): MockFetchResult => {
    const status = query.get('status')
    const data = status ? invoices.filter((i) => i.status === status) : invoices
    return { body: { data, meta: { page: 1, pageSize: 10, total: data.length, totalPages: 1 } } }
  })

  mockFetch.post('/fees/invoices', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const created = seedInvoice({
      studentId: input.studentId as string,
      category: input.category as string,
      amount: input.amount as number,
      dueDate: input.dueDate as string,
    })
    invoices.push(created)
    return { status: 201, body: created }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('FeesPage', () => {
  it('lists invoices with the student name resolved and status tag', async () => {
    renderPage()
    expect(await screen.findByText('Asha Rao (CSE001)')).toBeInTheDocument()
    expect(screen.getByText('PENDING')).toBeInTheDocument()
    expect(screen.getByText('TUITION')).toBeInTheDocument()
  })

  it('creates a new invoice through the drawer form', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Asha Rao (CSE001)')

    await user.click(screen.getByRole('button', { name: /new invoice/i }))
    const drawer = await screen.findByRole('dialog')

    // Select student from the drawer's dropdown (identified by ARIA
    // combobox role, first of several — no placeholder text is rendered
    // while the controlled value is an empty string, same as the
    // assignments/students forms elsewhere in this app).
    const [studentCombobox] = within(drawer).getAllByRole('combobox')
    await user.click(studentCombobox)
    await user.click(await screen.findByTitle('Asha Rao (CSE001)'))

    const amountInput = within(drawer).getByRole('spinbutton')
    await user.clear(amountInput)
    await user.type(amountInput, '25000')

    await user.type(within(drawer).getByPlaceholderText('Select date'), '2026-03-01{Enter}')

    await user.click(within(drawer).getByRole('button', { name: /create invoice/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => {
      expect(screen.getAllByText('Asha Rao (CSE001)').length).toBeGreaterThan(1)
    })
  })

  it('shows fee structures and deletes one', async () => {
    const user = userEvent.setup()
    renderFeeStructuresTab()

    expect(await screen.findByText('B.Tech CSE (BTCSE)')).toBeInTheDocument()
    expect(screen.getByText('2025-26')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /delete/i }))
    const confirmButtons = await screen.findAllByRole('button', { name: /^delete$/i })
    await user.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(screen.queryByText('B.Tech CSE (BTCSE)')).not.toBeInTheDocument())
  })
})
