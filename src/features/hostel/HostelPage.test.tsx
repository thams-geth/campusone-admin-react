import type { ReactNode } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { HostelAllocationsTab, HostelPage, HostelRoomsTab } from '@/features/hostel/HostelPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderWithProviders(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>{node}</AntApp>
    </QueryClientProvider>,
  )
}

interface WireHostel {
  id: string
  tenantId: string
  name: string
  createdAt: string
  updatedAt: string
}

interface WireHostelRoom {
  id: string
  tenantId: string
  hostelId: string
  roomNumber: string
  capacity: number
  createdAt: string
  updatedAt: string
}

interface WireAllocation {
  id: string
  tenantId: string
  studentId: string
  hostelRoomId: string
  bedNumber: number
  status: 'ACTIVE' | 'INACTIVE'
  startDate: string
  endDate: string | null
  createdAt: string
  updatedAt: string
}

let hostels: WireHostel[]
let rooms: WireHostelRoom[]
let allocations: WireAllocation[]

function setupBackend() {
  hostels = [{ id: 'hostel-1', tenantId: 'tenant-1', name: 'Boys Hostel A', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }]
  rooms = [
    { id: 'room-1', tenantId: 'tenant-1', hostelId: 'hostel-1', roomNumber: 'A-101', capacity: 2, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  ]
  allocations = [
    {
      id: 'alloc-1',
      tenantId: 'tenant-1',
      studentId: 'student-1',
      hostelRoomId: 'room-1',
      bedNumber: 1,
      status: 'ACTIVE',
      startDate: '2026-01-01',
      endDate: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ]

  mockFetch.get('/hostel/hostels', (): MockFetchResult => ({ body: hostels }))

  mockFetch.post('/hostel/hostels', ({ body }): MockFetchResult => {
    const input = body as { name: string }
    const created: WireHostel = {
      id: `hostel-${hostels.length + 1}`,
      tenantId: 'tenant-1',
      name: input.name,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    hostels.push(created)
    return { body: created }
  })

  mockFetch.delete('/hostel/hostels/:id', ({ params }): MockFetchResult => {
    hostels = hostels.filter((h) => h.id !== params.id)
    return {}
  })

  mockFetch.get('/hostel/rooms', ({ query }): MockFetchResult => {
    const hostelId = query.get('hostelId')
    const data = hostelId ? rooms.filter((r) => r.hostelId === hostelId) : rooms
    return { body: { data, meta: { page: 1, pageSize: 10, total: data.length, totalPages: 1 } } }
  })

  mockFetch.post('/hostel/rooms', ({ body }): MockFetchResult => {
    const input = body as { hostelId: string; roomNumber: string; capacity: number }
    const created: WireHostelRoom = {
      id: `room-${rooms.length + 1}`,
      tenantId: 'tenant-1',
      ...input,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    rooms.push(created)
    return { body: created }
  })

  mockFetch.delete('/hostel/rooms/:id', ({ params }): MockFetchResult => {
    rooms = rooms.filter((r) => r.id !== params.id)
    return {}
  })

  mockFetch.get('/hostel/allocations', (): MockFetchResult => ({
    body: { data: allocations, meta: { page: 1, pageSize: 10, total: allocations.length, totalPages: 1 } },
  }))

  mockFetch.post('/hostel/allocations', ({ body }): MockFetchResult => {
    const input = body as { studentId: string; hostelRoomId: string; startDate: string }
    const created: WireAllocation = {
      id: `alloc-${allocations.length + 1}`,
      tenantId: 'tenant-1',
      studentId: input.studentId,
      hostelRoomId: input.hostelRoomId,
      bedNumber: 2,
      status: 'ACTIVE',
      startDate: input.startDate,
      endDate: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    allocations.push(created)
    return { body: created }
  })

  mockFetch.post('/hostel/allocations/:id/vacate', ({ params }): MockFetchResult => {
    const allocation = allocations.find((a) => a.id === params.id)
    if (!allocation) return { status: 404, body: { message: 'Not found', code: 'NOT_FOUND' } }
    allocation.status = 'INACTIVE'
    allocation.endDate = '2026-02-01'
    return { body: allocation }
  })

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
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('HostelPage', () => {
  it('lists rooms for the default-selected hostel', async () => {
    renderWithProviders(<HostelPage />)
    expect(await screen.findByText('A-101')).toBeInTheDocument()
  })

  it('lists allocations with student and room resolved', async () => {
    renderWithProviders(<HostelAllocationsTab />)
    expect(await screen.findByText('Asha Rao (CSE001)')).toBeInTheDocument()
    expect(screen.getByText('A-101')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })

  it('vacates an active allocation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HostelAllocationsTab />)
    await screen.findByText('Asha Rao (CSE001)')

    const row = screen.getByText('Asha Rao (CSE001)').closest('tr')!
    await user.click(within(row).getByRole('button', { name: /vacate/i }))
    const confirmButtons = await screen.findAllByRole('button', { name: /^vacate$/i })
    await user.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(screen.getByText('INACTIVE')).toBeInTheDocument())
  })

  it('deletes a room', async () => {
    const user = userEvent.setup()
    renderWithProviders(<HostelRoomsTab />)
    await screen.findByText('A-101')

    const row = screen.getByText('A-101').closest('tr')!
    await user.click(within(row).getByRole('button', { name: /delete/i }))
    const confirmButtons = await screen.findAllByRole('button', { name: /^delete$/i })
    await user.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(screen.queryByText('A-101')).not.toBeInTheDocument())
  })
})
