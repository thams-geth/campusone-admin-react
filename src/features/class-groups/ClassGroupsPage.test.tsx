import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ClassGroupsPage } from '@/features/class-groups/ClassGroupsPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <ClassGroupsPage />
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireMessage {
  id: string
  tenantId: string
  sectionId: string
  authorUserId: string
  author: { id: string; name: string }
  body: string
  createdAt: string
}

let messages: WireMessage[]
let nextId: number

function setupBackend() {
  nextId = 1
  messages = [
    {
      id: 'msg-1',
      tenantId: 'tenant-1',
      sectionId: 'section-1',
      authorUserId: 'user-1',
      author: { id: 'user-1', name: 'Dr. Asha Rao' },
      body: 'Welcome to the class group!',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ]

  mockFetch.get('/sections', (): MockFetchResult => {
    return {
      body: {
        data: [{ id: 'section-1', tenantId: 'tenant-1', batchId: 'batch-1', name: 'CSE-A', currentSemester: 3, capacity: 60, status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
        meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
      },
    }
  })

  mockFetch.get('/batches', (): MockFetchResult => {
    return {
      body: {
        data: [{ id: 'batch-1', tenantId: 'tenant-1', programId: 'program-1', academicYearId: 'ay-1', name: '2023-2027', startYear: 2023, endYear: 2027, status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
        meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
      },
    }
  })

  mockFetch.get('/class-groups/:sectionId/messages', ({ params }): MockFetchResult => {
    const data = messages.filter((m) => m.sectionId === params.sectionId)
    return { body: { data, meta: { page: 1, pageSize: 100, total: data.length, totalPages: 1 } } }
  })

  mockFetch.post('/class-groups/:sectionId/messages', ({ params, body }): MockFetchResult => {
    const input = body as { body: string }
    const created: WireMessage = {
      id: `msg-${++nextId}`,
      tenantId: 'tenant-1',
      sectionId: params.sectionId,
      authorUserId: 'user-1',
      author: { id: 'user-1', name: 'Dr. Asha Rao' },
      body: input.body,
      createdAt: '2026-01-02T00:00:00.000Z',
    }
    messages.push(created)
    return { status: 201, body: created }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('ClassGroupsPage', () => {
  it('shows a section picker before any section is chosen', async () => {
    renderPage()
    expect(await screen.findByText('Pick a section to view its class group')).toBeInTheDocument()
  })

  it('lists messages for the selected section and posts a new one', async () => {
    const user = userEvent.setup()
    renderPage()

    // Select from the section dropdown, identified by ARIA combobox role —
    // no placeholder text is rendered while unopened, same as other Select pickers.
    const picker = screen.getByRole('combobox')
    await user.click(picker)
    await user.click(await screen.findByTitle('CSE-A (2023-2027)'))

    expect(await screen.findByText('Welcome to the class group!')).toBeInTheDocument()

    const input = screen.getByPlaceholderText('Write a message to this class group…')
    await user.type(input, 'Homework due Friday')
    await user.click(screen.getByRole('button', { name: /post/i }))

    await waitFor(() => expect(screen.getByText('Homework due Friday')).toBeInTheDocument())
  })
})
