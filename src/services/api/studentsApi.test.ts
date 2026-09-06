import { describe, expect, it } from 'vitest'
import { createStudent, listStudents, updateStudent } from '@/services/api/studentsApi'

const baseInput = {
  firstName: 'Test',
  lastName: 'Student',
  phone: '+91 9000000000',
  departmentId: 'dept-cse',
  gender: 'other' as const,
  dateOfBirth: '2003-01-01T00:00:00.000Z',
  admissionDate: '2023-06-01T00:00:00.000Z',
  status: 'active' as const,
}

describe('studentsApi', () => {
  it('lists seeded students and supports department filtering', async () => {
    const result = await listStudents({ departmentId: 'dept-cse', pageSize: 100 })
    expect(result.data.every((s) => s.departmentId === 'dept-cse')).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
  })

  it('rejects creating a student in a nonexistent department', async () => {
    await expect(
      createStudent({ ...baseInput, email: `x-${Date.now()}@aurora.edu`, rollNumber: `X-${Date.now()}`, departmentId: 'nope' }),
    ).rejects.toMatchObject({ code: 'INVALID_DEPARTMENT' })
  })

  it('rejects creating a student in an inactive department', async () => {
    await expect(
      createStudent({
        ...baseInput,
        email: `y-${Date.now()}@aurora.edu`,
        rollNumber: `Y-${Date.now()}`,
        departmentId: 'dept-physics',
      }),
    ).rejects.toMatchObject({ code: 'DEPARTMENT_INACTIVE' })
  })

  it('rejects a duplicate email', async () => {
    const email = `dup-${Date.now()}@aurora.edu`
    await createStudent({ ...baseInput, email, rollNumber: `A-${Date.now()}` })
    await expect(
      createStudent({ ...baseInput, email, rollNumber: `B-${Date.now()}` }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_EMAIL' })
  })

  it('rejects a duplicate roll number', async () => {
    const rollNumber = `ROLL-${Date.now()}`
    await createStudent({ ...baseInput, email: `c-${Date.now()}@aurora.edu`, rollNumber })
    await expect(
      createStudent({ ...baseInput, email: `d-${Date.now()}@aurora.edu`, rollNumber }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_ROLL_NUMBER' })
  })

  it('creates then updates a student', async () => {
    const created = await createStudent({
      ...baseInput,
      email: `e-${Date.now()}@aurora.edu`,
      rollNumber: `E-${Date.now()}`,
    })
    const updated = await updateStudent(created.id, { ...created, firstName: 'Updated' })
    expect(updated.firstName).toBe('Updated')
  })
})
