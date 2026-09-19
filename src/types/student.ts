import type { EntityStatus } from '@/types/common'

export type Gender = 'male' | 'female' | 'other'

export type StudentStatus = EntityStatus | 'alumni'

export interface Student {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  rollNumber: string
  departmentId: string
  // Nullable on the API: the Program/Batch/Section hierarchy postdates
  // most existing students, who stay department-only until assigned.
  sectionId?: string
  currentSemester?: number
  gender: Gender
  dateOfBirth: string
  admissionDate: string
  status: StudentStatus
  guardianName?: string
  guardianPhone?: string
  address?: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export interface StudentInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  rollNumber: string
  departmentId: string
  sectionId?: string
  currentSemester?: number
  gender: Gender
  dateOfBirth: string
  admissionDate: string
  status: StudentStatus
  guardianName?: string
  guardianPhone?: string
  address?: string
}

/**
 * `GET /students/:id/360` — a read-only cross-module aggregation (attendance,
 * fees, hostel/transport, library, documents, certificates, activities,
 * leave). Wire shapes as returned by the API, not translated through
 * fromWireStudent — this is a summary view, not something ever sent back.
 */
export interface StudentSummary360 {
  student: {
    id: string
    tenantId: string
    firstName: string
    lastName: string
    email: string
    phone: string
    rollNumber: string
    departmentId: string
    sectionId: string | null
    currentSemester: number | null
    userId: string | null
    admissionApplicationId: string | null
    gender: string
    dateOfBirth: string
    admissionDate: string
    status: string
    guardianName: string | null
    guardianPhone: string | null
    address: string | null
    createdAt: string
    updatedAt: string
    departmentName: string
    sectionName: string | null
  }
  attendance: {
    totalRecords: number
    presentCount: number
    absentCount: number
    lateCount: number
    excusedCount: number
    onLeaveCount: number
    attendancePercentage: number
  }
  academics: { cgpa: number | null }
  fees: { invoiceCount: number; totalInvoiced: number; totalOutstanding: number; overdueCount: number }
  hostelAllocation: { hostelName: string; roomNumber: string; bedNumber: number; status: string } | null
  transportAllocation: { routeName: string; stopName: string; status: string } | null
  library: { activeIssueCount: number; overdueIssueCount: number }
  documents: Array<{ id: string; type: string; status: string; createdAt: string }>
  certificateRequests: Array<{ id: string; certificateTypeId: string; status: string; createdAt: string }>
  activities: Array<{ id: string; type: string; title: string; date: string }>
  leave: {
    pendingCount: number
    approvedCount: number
    rejectedCount: number
    recent: Array<{ id: string; leaveTypeId: string; startDate: string; endDate: string; status: string; createdAt: string }>
  }
}
