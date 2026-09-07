import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { StudentsPage } from '@/features/students/StudentsPage'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={['/students']}>
          <Routes>
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/new" element={<div>Add student page</div>} />
            <Route path="/students/:id" element={<div>Student details page</div>} />
            <Route path="/students/:id/edit" element={<div>Edit student page</div>} />
          </Routes>
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

describe('StudentsPage', () => {
  it('lists seeded students with a resolved department name', async () => {
    renderPage()
    const rows = await screen.findAllByText('Computer Science & Engineering')
    expect(rows.length).toBeGreaterThan(0)
  })

  it('filters by search text', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Computer Science & Engineering')

    await user.type(screen.getByPlaceholderText('Search by name, email, or roll number'), 'zzzzunlikely')

    await waitFor(() => expect(screen.getAllByText('No data').length).toBeGreaterThan(0))
  })

  it('navigates to the add-student page', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Computer Science & Engineering')

    await user.click(screen.getByRole('button', { name: /add student/i }))
    expect(await screen.findByText('Add student page')).toBeInTheDocument()
  })

  it('navigates to the student details page', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Computer Science & Engineering')

    const row = screen.getAllByRole('row')[1]
    await user.click(within(row).getByRole('button', { name: /view/i }))
    expect(await screen.findByText('Student details page')).toBeInTheDocument()
  })
})
