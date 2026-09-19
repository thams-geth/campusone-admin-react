import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '@/features/auth/authContext'
import { RoomsPage } from '@/features/rooms/RoomsPage'
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
        <RoomsPage />
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireRoom {
  id: string
  tenantId: string
  name: string
  code: string
  capacity: number | null
  status: string
  createdAt: string
  updatedAt: string
}

let rooms: WireRoom[]
let nextId: number

function seedRoom(overrides: Partial<WireRoom>): WireRoom {
  return {
    id: `room-${nextId++}`,
    tenantId: 'tenant-1',
    name: 'Room',
    code: 'RM',
    capacity: null,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  nextId = 1
  rooms = [
    seedRoom({ id: 'room-lh1', name: 'Lecture Hall 1', code: 'LH-1', capacity: 120 }),
    seedRoom({ id: 'room-lab1', name: 'Physics Lab', code: 'PLAB-1', capacity: 40, status: 'INACTIVE' }),
  ]

  mockFetch.get('/rooms', ({ query }): MockFetchResult => {
    const status = query.get('status')
    const data = status ? rooms.filter((r) => r.status === status) : rooms
    return { body: { data, meta: { page: 1, pageSize: 10, total: data.length, totalPages: 1 } } }
  })

  mockFetch.post('/rooms', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    if (rooms.some((r) => r.code === input.code)) {
      return { status: 409, body: { message: 'Room code already in use.', code: 'DUPLICATE_CODE' } }
    }
    const created = seedRoom({
      name: input.name as string,
      code: input.code as string,
      capacity: (input.capacity as number) ?? null,
      status: (input.status as string) ?? 'ACTIVE',
    })
    rooms.push(created)
    return { status: 201, body: created }
  })

  mockFetch.delete('/rooms/:id', ({ params }): MockFetchResult => {
    rooms = rooms.filter((r) => r.id !== params.id)
    return { status: 204 }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('RoomsPage', () => {
  it('lists the seeded rooms', async () => {
    mockUseAuth.mockReturnValue(authValue({}))
    renderPage()
    expect(await screen.findByText('Lecture Hall 1')).toBeInTheDocument()
    expect(screen.getByText('LH-1')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
  })

  it('shows "—" for rooms with no capacity', async () => {
    mockUseAuth.mockReturnValue(authValue({}))
    rooms.push(seedRoom({ id: 'room-nocap', name: 'Open Yard', code: 'YARD', capacity: null }))
    renderPage()
    expect(await screen.findByText('Open Yard')).toBeInTheDocument()
    const row = screen.getByText('Open Yard').closest('tr')!
    expect(within(row).getByText('—')).toBeInTheDocument()
  })

  it('filters by status', async () => {
    mockUseAuth.mockReturnValue(authValue({}))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Lecture Hall 1')

    const statusSelect = screen.getAllByText('Status').map((el) => el.closest('.ant-select')).find(Boolean)!
    await user.click(statusSelect)
    await user.click(await screen.findByTitle('Inactive'))

    await waitFor(() => {
      expect(screen.getByText('Physics Lab')).toBeInTheDocument()
      expect(screen.queryByText('Lecture Hall 1')).not.toBeInTheDocument()
    })
  })

  it('creates a new room through the drawer form', async () => {
    mockUseAuth.mockReturnValue(authValue({}))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Lecture Hall 1')

    await user.click(screen.getByRole('button', { name: /add room/i }))
    const drawer = await screen.findByRole('dialog')

    await user.type(within(drawer).getByPlaceholderText('Lecture Hall 1'), 'Seminar Hall')
    await user.type(within(drawer).getByPlaceholderText('LH-1'), `SEM${Date.now() % 100000}`)
    await user.click(within(drawer).getByRole('button', { name: /create room/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('Seminar Hall')).toBeInTheDocument()
  })

  it(
    'deletes a room',
    async () => {
      const user = userEvent.setup()
      mockUseAuth.mockReturnValue(authValue({}))
      renderPage()
      await screen.findByText('Lecture Hall 1')

      const row = screen.getByText('Physics Lab').closest('tr')!
      await user.click(within(row).getByRole('button', { name: /delete/i }))
      const confirmButtons = await screen.findAllByRole('button', { name: /^delete$/i })
      await user.click(confirmButtons[confirmButtons.length - 1])

      await waitFor(() => expect(screen.queryByText('Physics Lab')).not.toBeInTheDocument())
    },
    15_000,
  )

  it('hides mutating actions for non-admin roles', async () => {
    mockUseAuth.mockReturnValue(authValue({ hasRole: () => false }))
    renderPage()
    await screen.findByText('Lecture Hall 1')

    expect(screen.queryByRole('button', { name: /add room/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
  })
})
