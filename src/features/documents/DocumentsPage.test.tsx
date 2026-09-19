import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DocumentsPage } from '@/features/documents/DocumentsPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <DocumentsPage />
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireDocument {
  id: string
  tenantId: string
  ownerType: 'STUDENT' | 'FACULTY' | 'APPLICANT'
  ownerId: string
  type: string
  fileUrl: string
  version: number
  uploadedByUserId: string
  verifiedByUserId: string | null
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  expiryDate: string | null
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

let documents: WireDocument[]
let nextId: number

function seedDocument(overrides: Partial<WireDocument>): WireDocument {
  return {
    id: `doc-${nextId++}`,
    tenantId: 'tenant-1',
    ownerType: 'STUDENT',
    ownerId: 'student-1',
    type: 'BONAFIDE',
    fileUrl: 'https://example.com/doc.pdf',
    version: 1,
    uploadedByUserId: 'user-1',
    verifiedByUserId: null,
    status: 'PENDING',
    expiryDate: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function setupBackend() {
  nextId = 1
  documents = [seedDocument({ id: 'doc-bonafide', type: 'BONAFIDE', status: 'PENDING' })]

  mockFetch.get('/students', (): MockFetchResult => ({
    body: { data: [STUDENT], meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } },
  }))
  mockFetch.get('/faculty', (): MockFetchResult => ({
    body: { data: [], meta: { page: 1, pageSize: 100, total: 0, totalPages: 1 } },
  }))
  mockFetch.get('/admissions', (): MockFetchResult => ({
    body: { data: [], meta: { page: 1, pageSize: 100, total: 0, totalPages: 1 } },
  }))

  mockFetch.get('/documents', (): MockFetchResult => ({
    body: { data: documents, meta: { page: 1, pageSize: 10, total: documents.length, totalPages: 1 } },
  }))

  mockFetch.post('/documents/:id/verify', ({ params }): MockFetchResult => {
    const doc = documents.find((d) => d.id === params.id)
    if (doc) doc.status = 'VERIFIED'
    return { body: doc }
  })

  mockFetch.post('/documents/:id/reject', ({ params }): MockFetchResult => {
    const doc = documents.find((d) => d.id === params.id)
    if (doc) doc.status = 'REJECTED'
    return { body: doc }
  })

  mockFetch.delete('/documents/:id', ({ params }): MockFetchResult => {
    documents = documents.filter((d) => d.id !== params.id)
    return { status: 204 }
  })
}

beforeEach(() => {
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('DocumentsPage', () => {
  it('lists documents with resolved owner name and status', async () => {
    renderPage()
    expect(await screen.findByText('Asha Rao')).toBeInTheDocument()
    expect(screen.getByText('Bonafide')).toBeInTheDocument()
    expect(screen.getByText('PENDING')).toBeInTheDocument()
  })

  it('verifies a pending document', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Asha Rao')

    const row = screen.getByText('Asha Rao').closest('tr')!
    await user.click(within(row).getByRole('button', { name: /verify/i }))
    const confirmButtons = await screen.findAllByRole('button', { name: /^verify$/i })
    await user.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(screen.getByText('VERIFIED')).toBeInTheDocument())
  })

  it('deletes a document', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Asha Rao')

    const row = screen.getByText('Asha Rao').closest('tr')!
    await user.click(within(row).getByRole('button', { name: /delete/i }))
    const confirmButtons = await screen.findAllByRole('button', { name: /^delete$/i })
    await user.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(screen.queryByText('Asha Rao')).not.toBeInTheDocument())
  })
})
