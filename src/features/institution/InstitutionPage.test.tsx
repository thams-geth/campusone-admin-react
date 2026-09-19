import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InstitutionPage } from '@/features/institution/InstitutionPage'
import { installMockFetch, mockFetch, resetMockFetch, type MockFetchResult } from '@/test/mockFetch'

const hasRoleMock = vi.fn(() => true)

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ hasRole: hasRoleMock }),
}))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <InstitutionPage />
      </AntApp>
    </QueryClientProvider>,
  )
}

interface WireInstitution {
  id: string
  name: string
  slug: string
  primaryColor: string | null
  createdAt: string
  updatedAt: string
}

let institution: WireInstitution

function setupBackend() {
  institution = {
    id: 'tenant-1',
    name: 'Demo College',
    slug: 'demo-college',
    primaryColor: '#1677FF',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }

  mockFetch.get('/institution', (): MockFetchResult => ({ body: institution }))

  mockFetch.put('/institution', ({ body }): MockFetchResult => {
    const input = body as { name: string; primaryColor?: string }
    institution = {
      ...institution,
      name: input.name,
      primaryColor: input.primaryColor === '' ? null : (input.primaryColor ?? institution.primaryColor),
    }
    return { body: institution }
  })
}

beforeEach(() => {
  hasRoleMock.mockReturnValue(true)
  installMockFetch()
  setupBackend()
})

afterEach(() => resetMockFetch())

describe('InstitutionPage', () => {
  it('shows institution details', async () => {
    renderPage()
    expect(await screen.findByText('Demo College')).toBeInTheDocument()
    expect(screen.getByText('demo-college')).toBeInTheDocument()
    expect(screen.getByText('#1677FF')).toBeInTheDocument()
  })

  it('hides the Edit button for a non-platform-admin role', async () => {
    hasRoleMock.mockReturnValue(false)
    renderPage()
    await screen.findByText('Demo College')
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
  })

  it('edits the institution name through the drawer form', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Demo College')

    await user.click(screen.getByRole('button', { name: /edit/i }))
    const drawer = await screen.findByRole('dialog')

    const nameInput = await screen.findByPlaceholderText('Demo College')
    await user.clear(nameInput)
    await user.type(nameInput, 'Renamed College')
    await user.click(within(drawer).getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('Renamed College')).toBeInTheDocument()
  })
})
