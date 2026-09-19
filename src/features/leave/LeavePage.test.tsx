import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '@/features/auth/authContext'
import { LeavePage, LeaveRequestsTab } from '@/features/leave/LeavePage'
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
        <LeavePage />
      </AntApp>
    </QueryClientProvider>,
  )
}

/**
 * Renders the Requests tab's content directly, without antd's `Tabs`
 * wrapper. `Tabs` + a `Popconfirm` interaction inside a tab pane causes a
 * severe (60s+) slowdown under jsdom's zero-layout environment — real
 * browsers don't reproduce this (verified manually), so tests that click a
 * Popconfirm render this instead of the full `LeavePage`.
 */
function renderRequestsTab() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <LeaveRequestsTab />
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireLeaveRequest {
  id: string
  tenantId: string
  studentId: string
  leaveTypeId: string
  startDate: string
  endDate: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewedByUserId: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

let leaveRequests: WireLeaveRequest[]

function seedRequest(overrides: Partial<WireLeaveRequest>): WireLeaveRequest {
  return {
    id: 'lr-1',
    tenantId: 'tenant-1',
    studentId: 'student-1',
    leaveTypeId: 'lt-1',
    startDate: '2026-01-10',
    endDate: '2026-01-12',
    reason: 'Family function',
    status: 'PENDING',
    reviewedByUserId: null,
    reviewedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  leaveRequests = [seedRequest({})]

  mockFetch.get('/leave/requests', (): MockFetchResult => ({
    body: {
      data: leaveRequests,
      meta: { page: 1, pageSize: 10, total: leaveRequests.length, totalPages: 1 },
    },
  }))

  mockFetch.get('/leave/types', (): MockFetchResult => ({
    body: {
      data: [
        {
          id: 'lt-1',
          tenantId: 'tenant-1',
          name: 'Sick Leave',
          defaultDaysPerYear: 12,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
    },
  }))

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

  mockFetch.post('/leave/requests/:id/approve', ({ params }): MockFetchResult => {
    const request = leaveRequests.find((r) => r.id === params.id)
    if (!request) return { status: 404, body: { message: 'Not found', code: 'NOT_FOUND' } }
    request.status = 'APPROVED'
    request.reviewedAt = '2026-01-02T00:00:00.000Z'
    return { body: request }
  })

  mockFetch.post('/leave/requests/:id/reject', ({ params }): MockFetchResult => {
    const request = leaveRequests.find((r) => r.id === params.id)
    if (!request) return { status: 404, body: { message: 'Not found', code: 'NOT_FOUND' } }
    request.status = 'REJECTED'
    request.reviewedAt = '2026-01-02T00:00:00.000Z'
    return { body: request }
  })
}

beforeEach(() => {
  mockUseAuth.mockReturnValue(authValue({}))
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('LeavePage', () => {
  it('lists leave requests with student and leave type names resolved', async () => {
    renderPage()
    expect(await screen.findByText('Asha Rao')).toBeInTheDocument()
    expect(screen.getByText('Sick Leave')).toBeInTheDocument()
    expect(screen.getByText('PENDING')).toBeInTheDocument()
  })

  it('approves a pending leave request', async () => {
    const user = userEvent.setup()
    renderRequestsTab()
    await screen.findByText('Asha Rao')

    const row = screen.getByText('Asha Rao').closest('tr')!
    await user.click(within(row).getByRole('button', { name: /approve/i }))
    const confirmButtons = await screen.findAllByRole('button', { name: /^approve$/i })
    await user.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(screen.getByText('APPROVED')).toBeInTheDocument())
  })

  it('hides the Leave types tab for roles without leave-type management permission', async () => {
    mockUseAuth.mockReturnValue(authValue({ hasRole: () => false }))
    renderPage()
    await screen.findByText('Asha Rao')
    expect(screen.queryByText('Leave types')).not.toBeInTheDocument()
  })
})
