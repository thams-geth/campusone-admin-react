import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ActivitiesPage } from '@/features/activities/ActivitiesPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <ActivitiesPage />
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireActivity {
  id: string
  tenantId: string
  studentId: string
  type: string
  title: string
  description?: string
  date: string
  certificateUrl?: string | null
  createdAt: string
  updatedAt: string
}

const STUDENT = {
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
}

let activities: WireActivity[]
let nextId: number

function seedActivity(overrides: Partial<WireActivity>): WireActivity {
  return {
    id: `activity-${nextId++}`,
    tenantId: 'tenant-1',
    studentId: 'student-1',
    type: 'ACHIEVEMENT',
    title: 'Activity',
    date: '2026-01-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  nextId = 1
  activities = [
    seedActivity({ id: 'act-1', title: 'State-level Chess Championship', type: 'COMPETITION' }),
  ]

  mockFetch.get('/activities', (): MockFetchResult => ({
    body: { data: activities, meta: { page: 1, pageSize: 10, total: activities.length, totalPages: 1 } },
  }))

  mockFetch.post('/activities', ({ body }): MockFetchResult => {
    const input = body as Record<string, unknown>
    const created = seedActivity({
      studentId: input.studentId as string,
      type: input.type as string,
      title: input.title as string,
      description: input.description as string | undefined,
      date: input.date as string,
      certificateUrl: input.certificateUrl as string | undefined,
    })
    activities.push(created)
    return { status: 201, body: created }
  })

  mockFetch.delete('/activities/:id', ({ params }): MockFetchResult => {
    activities = activities.filter((a) => a.id !== params.id)
    return { status: 204 }
  })

  mockFetch.get('/students', (): MockFetchResult => ({
    body: { data: [STUDENT], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } },
  }))
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('ActivitiesPage', () => {
  it('lists the seeded activities with the student name resolved', async () => {
    renderPage()
    expect(await screen.findByText('State-level Chess Championship')).toBeInTheDocument()
    expect(screen.getByText('Asha Rao')).toBeInTheDocument()
    expect(screen.getByText('COMPETITION')).toBeInTheDocument()
  })

  it(
    'deletes an activity',
    async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByText('State-level Chess Championship')

      const row = screen.getByText('State-level Chess Championship').closest('tr')!
      await user.click(within(row).getByRole('button', { name: /delete/i }))
      const confirmButtons = await screen.findAllByRole('button', { name: /^delete$/i })
      await user.click(confirmButtons[confirmButtons.length - 1])

      await waitFor(() =>
        expect(screen.queryByText('State-level Chess Championship')).not.toBeInTheDocument(),
      )
    },
    15_000,
  )
})
