import type { ReactNode } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RoutesVehiclesTab, TransportAllocationsTab, TransportPage } from '@/features/transport/TransportPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderWithProviders(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>{node}</AntApp>
    </QueryClientProvider>,
  )
}

interface WireVehicle {
  id: string
  tenantId: string
  registrationNumber: string
  driverName: string
  driverPhone: string
  capacity: number
  createdAt: string
  updatedAt: string
}

interface WireStop {
  id: string
  tenantId: string
  routeId: string
  name: string
  sequence: number
  createdAt: string
}

interface WireRoute {
  id: string
  tenantId: string
  name: string
  vehicleId: string | null
  createdAt: string
  updatedAt: string
  stops: WireStop[]
}

interface WireAllocation {
  id: string
  tenantId: string
  studentId: string
  routeId: string
  stopId: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

let vehicles: WireVehicle[]
let routes: WireRoute[]
let allocations: WireAllocation[]

function setupBackend() {
  vehicles = [
    { id: 'vehicle-1', tenantId: 'tenant-1', registrationNumber: 'KA-01-AB-1234', driverName: 'Ramesh Kumar', driverPhone: '9876543210', capacity: 40, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  ]
  routes = [
    {
      id: 'route-1',
      tenantId: 'tenant-1',
      name: 'Route 1 — City Center',
      vehicleId: 'vehicle-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      stops: [{ id: 'stop-1', tenantId: 'tenant-1', routeId: 'route-1', name: 'Gandhi Nagar', sequence: 1, createdAt: '2026-01-01T00:00:00.000Z' }],
    },
  ]
  allocations = [
    {
      id: 'alloc-1',
      tenantId: 'tenant-1',
      studentId: 'student-1',
      routeId: 'route-1',
      stopId: 'stop-1',
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ]

  mockFetch.get('/transport/vehicles', (): MockFetchResult => ({ body: vehicles }))

  mockFetch.post('/transport/vehicles', ({ body }): MockFetchResult => {
    const input = body as Omit<WireVehicle, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
    const created: WireVehicle = {
      id: `vehicle-${vehicles.length + 1}`,
      tenantId: 'tenant-1',
      ...input,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    vehicles.push(created)
    return { body: created }
  })

  mockFetch.delete('/transport/vehicles/:id', ({ params }): MockFetchResult => {
    vehicles = vehicles.filter((v) => v.id !== params.id)
    return {}
  })

  mockFetch.get('/transport/routes', (): MockFetchResult => ({ body: routes }))

  mockFetch.post('/transport/routes', ({ body }): MockFetchResult => {
    const input = body as { name: string; vehicleId?: string }
    const created: WireRoute = {
      id: `route-${routes.length + 1}`,
      tenantId: 'tenant-1',
      name: input.name,
      vehicleId: input.vehicleId ?? null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      stops: [],
    }
    routes.push(created)
    return { body: created }
  })

  mockFetch.delete('/transport/routes/:id', ({ params }): MockFetchResult => {
    routes = routes.filter((r) => r.id !== params.id)
    return {}
  })

  mockFetch.post('/transport/routes/:routeId/stops', ({ params, body }): MockFetchResult => {
    const input = body as { name: string; sequence: number }
    const route = routes.find((r) => r.id === params.routeId)
    const created: WireStop = {
      id: `stop-${Date.now()}`,
      tenantId: 'tenant-1',
      routeId: params.routeId,
      name: input.name,
      sequence: input.sequence,
      createdAt: '2026-01-01T00:00:00.000Z',
    }
    route?.stops.push(created)
    return { body: created }
  })

  mockFetch.delete('/transport/stops/:id', ({ params }): MockFetchResult => {
    for (const route of routes) {
      route.stops = route.stops.filter((s) => s.id !== params.id)
    }
    return {}
  })

  mockFetch.get('/transport/allocations', (): MockFetchResult => ({
    body: { data: allocations, meta: { page: 1, pageSize: 10, total: allocations.length, totalPages: 1 } },
  }))

  mockFetch.post('/transport/allocations', ({ body }): MockFetchResult => {
    const input = body as { studentId: string; routeId: string; stopId: string }
    const created: WireAllocation = {
      id: `alloc-${allocations.length + 1}`,
      tenantId: 'tenant-1',
      ...input,
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    allocations.push(created)
    return { body: created }
  })

  mockFetch.post('/transport/allocations/:id/remove', ({ params }): MockFetchResult => {
    const allocation = allocations.find((a) => a.id === params.id)
    if (!allocation) return { status: 404, body: { message: 'Not found', code: 'NOT_FOUND' } }
    allocation.status = 'INACTIVE'
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

describe('TransportPage', () => {
  it('lists vehicles and routes', async () => {
    renderWithProviders(<TransportPage />)
    // "KA-01-AB-1234" appears twice — once in the Vehicles table, once as
    // the Route's resolved Vehicle column — so assert on the count instead
    // of a single unique match.
    expect(await screen.findAllByText('KA-01-AB-1234')).toHaveLength(2)
    expect(screen.getByText('Route 1 — City Center')).toBeInTheDocument()
  })

  it('lists allocations with student, route and stop resolved', async () => {
    renderWithProviders(<TransportAllocationsTab />)
    expect(await screen.findByText('Asha Rao (CSE001)')).toBeInTheDocument()
    expect(screen.getByText('Route 1 — City Center')).toBeInTheDocument()
    expect(screen.getByText('Gandhi Nagar')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })

  it('removes an active allocation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransportAllocationsTab />)
    await screen.findByText('Asha Rao (CSE001)')

    const row = screen.getByText('Asha Rao (CSE001)').closest('tr')!
    await user.click(within(row).getByRole('button', { name: /remove/i }))
    const confirmButtons = await screen.findAllByRole('button', { name: /^remove$/i })
    await user.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(screen.getByText('INACTIVE')).toBeInTheDocument())
  })

  it('deletes a vehicle', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RoutesVehiclesTab />)
    // "KA-01-AB-1234" appears twice — the Vehicles table row (first in the
    // DOM) and the Route's resolved Vehicle column — so target the first
    // match, which is the Vehicles table's row.
    const matches = await screen.findAllByText('KA-01-AB-1234')
    expect(matches).toHaveLength(2)

    const row = matches[0].closest('tr')!
    await user.click(within(row).getByRole('button', { name: /delete/i }))
    const confirmButtons = await screen.findAllByRole('button', { name: /^delete$/i })
    await user.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(screen.queryAllByText('KA-01-AB-1234')).toHaveLength(0))
  })
})
