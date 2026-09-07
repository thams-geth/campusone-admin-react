import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { StudentFormPage } from '@/features/students/StudentFormPage'
import { createStudent } from '@/services/api/studentsApi'

function renderPage(initialEntries: string[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/students/new" element={<StudentFormPage />} />
            <Route path="/students/:id/edit" element={<StudentFormPage />} />
            <Route path="/students/:id" element={<div>Student details page</div>} />
          </Routes>
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

describe('StudentFormPage', () => {
  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup()
    renderPage(['/students/new'])

    await user.click(screen.getByRole('button', { name: /add student/i }))

    expect(await screen.findByText('First name is required')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid phone number')).toBeInTheDocument()
  })

  it('creates a student and redirects to the details page', async () => {
    const user = userEvent.setup()
    renderPage(['/students/new'])

    await user.type(screen.getByLabelText('First name'), 'Test')
    await user.type(screen.getByLabelText('Last name'), 'Learner')
    await user.type(screen.getByLabelText('Email'), `test.learner.${Date.now()}@aurora.edu`)
    await user.type(screen.getByLabelText('Phone'), '+91 9123456780')
    await user.type(screen.getByLabelText('Roll number'), `T-${Date.now()}`)

    await user.click(screen.getByLabelText('Department'))
    await user.click(await screen.findByTitle(/Computer Science & Engineering/))

    await user.type(screen.getByLabelText('Date of birth'), '2003-01-01')
    await user.keyboard('{Enter}')
    await user.type(screen.getByLabelText('Admission date'), '2023-06-01')
    // Pressing Enter in the last field submits the form natively — no
    // separate button click needed (and the page navigates away already).
    await user.keyboard('{Enter}')

    expect(await screen.findByText('Student details page')).toBeInTheDocument()
  })

  it('pre-fills the form when editing an existing student', async () => {
    const created = await createStudent({
      firstName: 'Existing',
      lastName: 'Student',
      email: `existing.${Date.now()}@aurora.edu`,
      phone: '+91 9123456781',
      rollNumber: `E-${Date.now()}`,
      departmentId: 'dept-cse',
      gender: 'other',
      dateOfBirth: '2003-01-01T00:00:00.000Z',
      admissionDate: '2023-06-01T00:00:00.000Z',
      status: 'active',
    })

    renderPage([`/students/${created.id}/edit`])

    await waitFor(() => expect(screen.getByLabelText('First name')).toHaveValue('Existing'))
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })
})
