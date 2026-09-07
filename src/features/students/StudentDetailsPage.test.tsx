import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { StudentDetailsPage } from '@/features/students/StudentDetailsPage'
import { createStudent } from '@/services/api/studentsApi'

function renderPage(id: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={[`/students/${id}`]}>
          <Routes>
            <Route path="/students/:id" element={<StudentDetailsPage />} />
            <Route path="/students/:id/edit" element={<div>Edit student page</div>} />
            <Route path="/students" element={<div>Students list page</div>} />
          </Routes>
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

describe('StudentDetailsPage', () => {
  it('shows the student profile with a resolved department name', async () => {
    const created = await createStudent({
      firstName: 'Detail',
      lastName: 'View',
      email: `detail.${Date.now()}@aurora.edu`,
      phone: '+91 9123456782',
      rollNumber: `D-${Date.now()}`,
      departmentId: 'dept-cse',
      gender: 'other',
      dateOfBirth: '2003-01-01T00:00:00.000Z',
      admissionDate: '2023-06-01T00:00:00.000Z',
      status: 'active',
    })

    renderPage(created.id)

    expect(await screen.findByText('Detail View')).toBeInTheDocument()
    expect(screen.getByText(/Computer Science & Engineering/)).toBeInTheDocument()
    expect(screen.getByText(created.email)).toBeInTheDocument()
  })

  it('navigates to the edit page', async () => {
    const created = await createStudent({
      firstName: 'EditNav',
      lastName: 'Test',
      email: `editnav.${Date.now()}@aurora.edu`,
      phone: '+91 9123456783',
      rollNumber: `EN-${Date.now()}`,
      departmentId: 'dept-cse',
      gender: 'other',
      dateOfBirth: '2003-01-01T00:00:00.000Z',
      admissionDate: '2023-06-01T00:00:00.000Z',
      status: 'active',
    })

    const user = userEvent.setup()
    renderPage(created.id)
    await screen.findByText('EditNav Test')

    await user.click(screen.getByRole('button', { name: /edit/i }))
    expect(await screen.findByText('Edit student page')).toBeInTheDocument()
  })

  it(
    'deletes the student and redirects to the list',
    async () => {
      const created = await createStudent({
        firstName: 'DeleteMe',
        lastName: 'Test',
        email: `deleteme.${Date.now()}@aurora.edu`,
        phone: '+91 9123456784',
        rollNumber: `DM-${Date.now()}`,
        departmentId: 'dept-cse',
        gender: 'other',
        dateOfBirth: '2003-01-01T00:00:00.000Z',
        admissionDate: '2023-06-01T00:00:00.000Z',
        status: 'active',
      })

      const user = userEvent.setup()
      renderPage(created.id)
      await screen.findByText('DeleteMe Test')

      await user.click(screen.getByRole('button', { name: /^delete$/i }))
      const confirmButtons = await screen.findAllByRole('button', { name: /^delete$/i })
      await user.click(confirmButtons[confirmButtons.length - 1])

      await waitFor(() => expect(screen.getByText('Students list page')).toBeInTheDocument(), { timeout: 10_000 })
    },
    15_000,
  )
})
