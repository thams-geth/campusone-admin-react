import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { DepartmentsPage } from '@/features/departments/DepartmentsPage'
import { createDepartment } from '@/services/api/departmentsApi'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AntApp>
        <DepartmentsPage />
      </AntApp>
    </QueryClientProvider>,
  )
}

describe('DepartmentsPage', () => {
  it('lists the seeded departments', async () => {
    renderPage()
    expect(await screen.findByText('Computer Science & Engineering')).toBeInTheDocument()
    expect(screen.getByText('CSE')).toBeInTheDocument()
  })

  it('filters by search text', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Computer Science & Engineering')

    await user.type(screen.getByPlaceholderText('Search by name, code, or HOD'), 'Civil')

    await waitFor(() => {
      expect(screen.getByText('Civil Engineering')).toBeInTheDocument()
      expect(screen.queryByText('Computer Science & Engineering')).not.toBeInTheDocument()
    })
  })

  it('creates a new department through the drawer form', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Computer Science & Engineering')

    await user.click(screen.getByRole('button', { name: /add department/i }))
    const drawer = await screen.findByRole('dialog')

    await user.type(within(drawer).getByPlaceholderText('Computer Science & Engineering'), 'Robotics Engineering')
    await user.type(within(drawer).getByPlaceholderText('CSE'), `RB${Date.now() % 100000}`)
    await user.click(within(drawer).getByRole('button', { name: /create department/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('Robotics Engineering')).toBeInTheDocument()
  })

  it('shows a validation error for a duplicate department code', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Computer Science & Engineering')

    await user.click(screen.getByRole('button', { name: /add department/i }))
    const drawer = await screen.findByRole('dialog')

    await user.type(within(drawer).getByPlaceholderText('Computer Science & Engineering'), 'Duplicate Dept')
    await user.type(within(drawer).getByPlaceholderText('CSE'), 'CSE')
    await user.click(within(drawer).getByRole('button', { name: /create department/i }))

    expect(await screen.findByText(/already in use/i)).toBeInTheDocument()
  })

  it(
    'blocks deleting a department that still has students',
    async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByText('Computer Science & Engineering')

      const row = screen.getByText('Computer Science & Engineering').closest('tr')!
      await user.click(within(row).getByRole('button', { name: /delete/i }))
      const confirmButtons = await screen.findAllByRole('button', { name: /^delete$/i })
      await user.click(confirmButtons[confirmButtons.length - 1])

      expect(await screen.findByText(/students assigned to it/i)).toBeInTheDocument()
    },
    15_000,
  )

  it(
    'deletes a department with no students',
    async () => {
      const created = await createDepartment({ name: 'Temp Dept For Delete', code: `TMP-${Date.now()}`, status: 'active' })
      const user = userEvent.setup()
      renderPage()

      await screen.findByText(created.name)
      const row = screen.getByText(created.name).closest('tr')!
      await user.click(within(row).getByRole('button', { name: /delete/i }))
      const confirmButtons = await screen.findAllByRole('button', { name: /^delete$/i })
      await user.click(confirmButtons[confirmButtons.length - 1])

      await waitFor(() => expect(screen.queryByText(created.name)).not.toBeInTheDocument())
    },
    15_000,
  )
})
