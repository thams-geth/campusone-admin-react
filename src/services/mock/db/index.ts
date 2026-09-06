import { MockTable } from '@/services/mock/table'
import type { Department } from '@/types/department'
import type { Student } from '@/types/student'
import { mockDepartments } from '@/services/mock/db/departments'
import { mockStudents } from '@/services/mock/db/students'

/**
 * Session-lived "server state". Each table is a singleton so mutations
 * from one API call (e.g. creating a student) are visible to the next
 * (e.g. listing students) for the lifetime of the browser tab — the
 * same contract a real backend would give you.
 */
export const departmentsTable = new MockTable<Department>(mockDepartments)
export const studentsTable = new MockTable<Student>(mockStudents)
