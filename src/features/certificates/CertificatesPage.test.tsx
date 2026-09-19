import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CertificateRequestsTab, CertificatesPage } from '@/features/certificates/CertificatesPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

function withProviders(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>{children}</AntApp>
    </QueryClientProvider>,
  )
}

interface WireCertificateType {
  id: string
  tenantId: string
  name: string
  category?: string | null
  createdAt: string
  updatedAt: string
}

interface WireCertificateRequest {
  id: string
  tenantId: string
  studentId: string
  certificateTypeId: string
  status: 'REQUESTED' | 'ISSUED' | 'REJECTED'
  issuedByUserId?: string | null
  issuedAt?: string | null
  verificationCode?: string | null
  rejectionReason?: string | null
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

let certificateTypes: WireCertificateType[]
let requests: WireCertificateRequest[]

function setupBackend() {
  certificateTypes = [
    {
      id: 'ct-1',
      tenantId: 'tenant-1',
      name: 'Bonafide Certificate',
      category: 'General',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ]
  requests = [
    {
      id: 'req-1',
      tenantId: 'tenant-1',
      studentId: 'student-1',
      certificateTypeId: 'ct-1',
      status: 'REQUESTED',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ]

  mockFetch.get('/certificates/types', (): MockFetchResult => ({ body: certificateTypes }))

  mockFetch.get('/certificates/requests', (): MockFetchResult => ({
    body: { data: requests, meta: { page: 1, pageSize: 10, total: requests.length, totalPages: 1 } },
  }))

  mockFetch.post('/certificates/requests/:id/issue', ({ params }): MockFetchResult => {
    const request = requests.find((r) => r.id === params.id)
    if (!request) return { status: 404, body: { message: 'Not found', code: 'NOT_FOUND' } }
    request.status = 'ISSUED'
    request.issuedAt = '2026-01-05T00:00:00.000Z'
    return { body: request }
  })

  mockFetch.post('/certificates/requests/:id/reject', ({ params, body }): MockFetchResult => {
    const request = requests.find((r) => r.id === params.id)
    if (!request) return { status: 404, body: { message: 'Not found', code: 'NOT_FOUND' } }
    request.status = 'REJECTED'
    request.rejectionReason = (body as { rejectionReason: string }).rejectionReason
    return { body: request }
  })

  mockFetch.get('/certificates/verify/:code', ({ params }): MockFetchResult => {
    if (params.code === 'VALIDCODE') {
      return {
        body: {
          valid: true,
          certificateType: 'Bonafide Certificate',
          studentName: 'Asha Rao',
          rollNumber: 'CSE001',
          issuedAt: '2026-01-05T00:00:00.000Z',
        },
      }
    }
    return { body: { valid: false } }
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

describe('CertificatesPage', () => {
  it('shows the Requests tab by default with student and certificate type names resolved', async () => {
    withProviders(<CertificatesPage />)
    expect(await screen.findByText('Asha Rao')).toBeInTheDocument()
    expect(screen.getByText('Bonafide Certificate')).toBeInTheDocument()
    expect(screen.getByText('REQUESTED')).toBeInTheDocument()
  })
})

describe('CertificateRequestsTab', () => {
  it('issues a requested certificate', async () => {
    const user = userEvent.setup()
    withProviders(<CertificateRequestsTab />)
    await screen.findByText('Asha Rao')

    await user.click(screen.getByRole('button', { name: /^issue$/i }))
    const confirmButtons = await screen.findAllByRole('button', { name: /^issue$/i })
    await user.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(screen.getByText('ISSUED')).toBeInTheDocument())
  })

  it('rejects a requested certificate with a reason', async () => {
    const user = userEvent.setup()
    withProviders(<CertificateRequestsTab />)
    await screen.findByText('Asha Rao')

    await user.click(screen.getByRole('button', { name: /^reject$/i }))
    const modal = await screen.findByRole('dialog')
    await user.type(within(modal).getByPlaceholderText(/outstanding library fine/i), 'Missing documents')
    await user.click(within(modal).getByRole('button', { name: /^reject$/i }))

    await waitFor(() => expect(screen.getByText('REJECTED')).toBeInTheDocument())
  })

  it('verifies a certificate by code', async () => {
    const user = userEvent.setup()
    withProviders(<CertificateRequestsTab />)
    await screen.findByText('Asha Rao')

    await user.type(screen.getByPlaceholderText('Verification code'), 'VALIDCODE')
    await user.click(screen.getByRole('button', { name: /verify/i }))

    expect(await screen.findByText('CSE001')).toBeInTheDocument()
  })
})
