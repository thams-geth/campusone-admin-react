import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createStudent, deleteStudent, getStudent, listStudents, updateStudent } from '@/services/api/studentsApi'
import { calls, installMockFetch, mockFetch, resetMockFetch } from '@/test/mockFetch'

const WIRE_STUDENT = {
  id: 'student-1',
  tenantId: 'tenant-1',
  firstName: 'Asha',
  lastName: 'Verma',
  email: 'asha.verma@demo-college.test',
  phone: '+91 9000000001',
  rollNumber: 'CSE-001',
  departmentId: 'dept-1',
  gender: 'FEMALE',
  dateOfBirth: '2003-01-01T00:00:00.000Z',
  admissionDate: '2023-06-01T00:00:00.000Z',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const baseInput = {
  firstName: 'Test',
  lastName: 'Student',
  email: 'test.student@demo-college.test',
  phone: '+91 9000000000',
  rollNumber: 'CSE-099',
  departmentId: 'dept-1',
  gender: 'other' as const,
  dateOfBirth: '2003-01-01T00:00:00.000Z',
  admissionDate: '2023-06-01T00:00:00.000Z',
  status: 'active' as const,
}

beforeEach(() => installMockFetch())
afterEach(() => resetMockFetch())

describe('studentsApi', () => {
  it('lists students, forwarding department/status filters with wire casing', async () => {
    mockFetch.get('/students', {
      body: { data: [WIRE_STUDENT], meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 } },
    })

    const result = await listStudents({ departmentId: 'dept-1', status: 'active', pageSize: 10 })

    expect(result.data[0].gender).toBe('female')
    expect(result.data[0].status).toBe('active')

    const call = calls.at(-1)!
    expect(call.path).toBe('/students')
    expect(call.query.get('departmentId')).toBe('dept-1')
    expect(call.query.get('status')).toBe('ACTIVE')
    expect(call.query.get('pageSize')).toBe('10')
  })

  it('gets a single student and lowercases gender/status', async () => {
    mockFetch.get('/students/:id', { body: WIRE_STUDENT })

    const student = await getStudent('student-1')

    expect(student.gender).toBe('female')
    expect(student.status).toBe('active')
    expect(calls.at(-1)!.path).toBe('/students/student-1')
  })

  it('creates a student, translating gender/status to wire casing in the request body', async () => {
    mockFetch.post('/students', { status: 201, body: { ...WIRE_STUDENT, id: 'student-2', gender: 'OTHER' } })

    const created = await createStudent(baseInput)

    expect(created.id).toBe('student-2')
    expect(created.gender).toBe('other')
    expect(calls.at(-1)!.body).toMatchObject({ gender: 'OTHER', status: 'ACTIVE' })
  })

  it('updates a student', async () => {
    mockFetch.put('/students/:id', { body: { ...WIRE_STUDENT, firstName: 'Updated' } })

    const updated = await updateStudent('student-1', { ...baseInput, firstName: 'Updated' })

    expect(updated.firstName).toBe('Updated')
    expect(calls.at(-1)).toMatchObject({ method: 'PUT', path: '/students/student-1' })
  })

  it('deletes a student', async () => {
    mockFetch.delete('/students/:id', { status: 204 })

    await expect(deleteStudent('student-1')).resolves.toBeUndefined()
    expect(calls.at(-1)).toMatchObject({ method: 'DELETE', path: '/students/student-1' })
  })

  it('surfaces a 409 duplicate-email response as an ApiError', async () => {
    mockFetch.post('/students', {
      status: 409,
      body: { message: 'A student with this email already exists.', code: 'DUPLICATE_EMAIL' },
    })

    await expect(createStudent(baseInput)).rejects.toMatchObject({ status: 409, code: 'DUPLICATE_EMAIL' })
  })

  it('surfaces a 422 validation error as an ApiError with field details', async () => {
    mockFetch.post('/students', {
      status: 422,
      body: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: { email: ['Enter a valid email address'] },
      },
    })

    await expect(createStudent(baseInput)).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      details: { email: ['Enter a valid email address'] },
    })
  })
})
