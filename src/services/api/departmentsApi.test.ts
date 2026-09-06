import { describe, expect, it } from 'vitest'
import { createDepartment, deleteDepartment, listDepartments, updateDepartment } from '@/services/api/departmentsApi'

describe('departmentsApi', () => {
  it('lists seeded departments with pagination metadata', async () => {
    const result = await listDepartments({ page: 1, pageSize: 5 })
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.meta.total).toBeGreaterThanOrEqual(result.data.length)
  })

  it('filters by search across name, code, and head of department', async () => {
    const result = await listDepartments({ search: 'CSE' })
    expect(result.data.every((d) => d.code === 'CSE' || d.name.includes('Computer'))).toBe(true)
  })

  it('rejects creating a department with a duplicate code', async () => {
    await expect(
      createDepartment({ name: 'Duplicate CSE', code: 'CSE', status: 'active' }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_CODE' })
  })

  it('creates a department with a unique code', async () => {
    const created = await createDepartment({ name: 'Robotics', code: `ROBO-${Date.now()}`, status: 'active' })
    expect(created.id).toEqual(expect.any(String))
    expect(created.studentCount).toBe(0)
  })

  it('allows updating a department without tripping its own uniqueness check', async () => {
    const created = await createDepartment({
      name: 'Data Science',
      code: `DS-${Date.now()}`,
      status: 'active',
    })
    const updated = await updateDepartment(created.id, { ...created, description: 'Updated' })
    expect(updated.description).toBe('Updated')
  })

  it('refuses to delete a department that still has students', async () => {
    await expect(deleteDepartment('dept-cse')).rejects.toMatchObject({ code: 'DEPARTMENT_IN_USE' })
  })

  it('deletes a department with no students', async () => {
    const created = await createDepartment({
      name: 'Temp Dept',
      code: `TEMP-${Date.now()}`,
      status: 'active',
    })
    await expect(deleteDepartment(created.id)).resolves.toBeUndefined()
  })
})
