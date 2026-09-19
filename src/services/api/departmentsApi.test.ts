import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  createDepartment,
  deleteDepartment,
  getDepartment,
  listDepartments,
  updateDepartment,
} from '@/services/api/departmentsApi'
import { calls, installMockFetch, mockFetch, resetMockFetch } from '@/test/mockFetch'

const WIRE_DEPARTMENT = {
  id: 'dept-1',
  tenantId: 'tenant-1',
  name: 'Computer Science & Engineering',
  code: 'CSE',
  headOfDepartment: 'Dr. Asha Rao',
  status: 'ACTIVE',
  studentCount: 3,
  facultyCount: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

beforeEach(() => installMockFetch())
afterEach(() => resetMockFetch())

describe('departmentsApi', () => {
  it('lists departments, forwarding pagination/search/status params with wire casing', async () => {
    mockFetch.get('/departments', {
      body: { data: [WIRE_DEPARTMENT], meta: { page: 1, pageSize: 5, total: 1, totalPages: 1 } },
    })

    const result = await listDepartments({ page: 1, pageSize: 5, search: 'CSE', status: 'active' })

    expect(result.data[0].status).toBe('active')
    expect(result.meta).toEqual({ page: 1, pageSize: 5, total: 1, totalPages: 1 })

    const call = calls.at(-1)!
    expect(call.method).toBe('GET')
    expect(call.path).toBe('/departments')
    expect(call.query.get('page')).toBe('1')
    expect(call.query.get('pageSize')).toBe('5')
    expect(call.query.get('search')).toBe('CSE')
    expect(call.query.get('status')).toBe('ACTIVE')
  })

  it('omits the status filter when none is given', async () => {
    mockFetch.get('/departments', { body: { data: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 } } })

    await listDepartments({})

    expect(calls.at(-1)!.query.has('status')).toBe(false)
  })

  it('gets a single department and lowercases its status', async () => {
    mockFetch.get('/departments/:id', { body: WIRE_DEPARTMENT })

    const dept = await getDepartment('dept-1')

    expect(dept.status).toBe('active')
    expect(calls.at(-1)!.path).toBe('/departments/dept-1')
  })

  it('creates a department, translating status to wire casing in the request body', async () => {
    mockFetch.post('/departments', { status: 201, body: { ...WIRE_DEPARTMENT, id: 'dept-2', code: 'ROBO' } })

    const created = await createDepartment({ name: 'Robotics', code: 'ROBO', status: 'active' })

    expect(created.id).toBe('dept-2')
    expect(created.status).toBe('active')
    expect(calls.at(-1)!.body).toEqual({ name: 'Robotics', code: 'ROBO', status: 'ACTIVE' })
  })

  it('updates a department', async () => {
    mockFetch.put('/departments/:id', { body: { ...WIRE_DEPARTMENT, description: 'Updated' } })

    const updated = await updateDepartment('dept-1', {
      name: 'Computer Science & Engineering',
      code: 'CSE',
      status: 'active',
      description: 'Updated',
    })

    expect(updated.description).toBe('Updated')
    const call = calls.at(-1)!
    expect(call.method).toBe('PUT')
    expect(call.path).toBe('/departments/dept-1')
  })

  it('deletes a department', async () => {
    mockFetch.delete('/departments/:id', { status: 204 })

    await expect(deleteDepartment('dept-1')).resolves.toBeUndefined()
    expect(calls.at(-1)).toMatchObject({ method: 'DELETE', path: '/departments/dept-1' })
  })

  it('surfaces a 409 duplicate-code response as an ApiError', async () => {
    mockFetch.post('/departments', {
      status: 409,
      body: { message: 'Department code already in use.', code: 'DUPLICATE_CODE' },
    })

    await expect(createDepartment({ name: 'Duplicate CSE', code: 'CSE', status: 'active' })).rejects.toMatchObject({
      status: 409,
      code: 'DUPLICATE_CODE',
    })
  })

  it('surfaces a 409 department-in-use response on delete as an ApiError', async () => {
    mockFetch.delete('/departments/:id', {
      status: 409,
      body: { message: 'Cannot delete a department with students assigned to it.', code: 'DEPARTMENT_IN_USE' },
    })

    await expect(deleteDepartment('dept-1')).rejects.toMatchObject({ status: 409, code: 'DEPARTMENT_IN_USE' })
  })
})
