import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GlobalSearch } from '@/features/search/GlobalSearch'
import { calls, installMockFetch, mockFetch, resetMockFetch } from '@/test/mockFetch'

/**
 * Mirrors how GlobalSearch actually lives in AdminLayout: it sits in the
 * persistent header alongside the routed page content, rather than being
 * swapped out itself on navigation — so a click-to-navigate assertion can
 * check both the destination content and that the input cleared.
 */
function renderWithProviders() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={['/']}>
          <GlobalSearch />
          <Routes>
            <Route path="/" element={<div>Home page</div>} />
            <Route path="/students/:id" element={<div>Student details page</div>} />
            <Route path="/faculty/:id" element={<div>Faculty details page</div>} />
            <Route path="/departments" element={<div>Departments list page</div>} />
          </Routes>
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

const SEARCH_RESPONSE = {
  students: [{ id: 'stu-1', type: 'student', label: 'Smoke Applicant', subtitle: 'SMKADM1 · Smoke Dept' }],
  faculty: [],
  departments: [{ id: 'dept-1', type: 'department', label: 'Smoke Dept', subtitle: 'SMK' }],
  programs: [],
  batches: [],
  sections: [],
  subjects: [],
}

const EMPTY_RESPONSE = {
  students: [],
  faculty: [],
  departments: [],
  programs: [],
  batches: [],
  sections: [],
  subjects: [],
}

function getSearchInput() {
  return screen.getByRole('textbox', { name: /global search/i })
}

beforeEach(() => installMockFetch())
afterEach(() => resetMockFetch())

describe('GlobalSearch', () => {
  it('fires no request and shows a hint for a query below the minimum length', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    await user.type(getSearchInput(), 'a')

    expect(await screen.findByText(/keep typing/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(calls.some((call) => call.path === '/search')).toBe(false)
    })
  })

  it('shows grouped results for a real search term and omits empty categories', async () => {
    mockFetch.get('/search', { body: SEARCH_RESPONSE })
    const user = userEvent.setup()
    renderWithProviders()

    await user.type(getSearchInput(), 'Smoke')

    expect(await screen.findByText('Smoke Applicant')).toBeInTheDocument()
    expect(screen.getByText('SMKADM1 · Smoke Dept')).toBeInTheDocument()
    expect(screen.getByText('Smoke Dept')).toBeInTheDocument()
    expect(screen.getByText('STUDENTS')).toBeInTheDocument()
    expect(screen.getByText('DEPARTMENTS')).toBeInTheDocument()
    // faculty/programs/batches/sections/subjects all came back empty — no header for any of them.
    expect(screen.queryByText('FACULTY')).not.toBeInTheDocument()
    expect(screen.queryByText('PROGRAMS')).not.toBeInTheDocument()
  })

  it('navigates to the right destination on click and clears the input', async () => {
    mockFetch.get('/search', { body: SEARCH_RESPONSE })
    const user = userEvent.setup()
    renderWithProviders()

    const input = getSearchInput()
    await user.type(input, 'Smoke')

    const result = await screen.findByText('Smoke Applicant')
    await user.click(result)

    expect(await screen.findByText('Student details page')).toBeInTheDocument()
    expect(input).toHaveValue('')
    expect(screen.queryByText('Smoke Applicant')).not.toBeInTheDocument()
  })

  it('shows a no-results message when the search returns nothing', async () => {
    mockFetch.get('/search', { body: EMPTY_RESPONSE })
    const user = userEvent.setup()
    renderWithProviders()

    await user.type(getSearchInput(), 'zzz')

    expect(await screen.findByText("No results for 'zzz'")).toBeInTheDocument()
  })
})
