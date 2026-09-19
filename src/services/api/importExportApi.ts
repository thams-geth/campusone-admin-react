import { http } from '@/services/api/httpClient'

/**
 * Import/Export (Milestone 2) — student CSV import/export only.
 *
 * Import (preview + commit) is plain JSON: the route takes `{ csv: string }`
 * in the body (the whole CSV file content as one string field), not
 * multipart/form-data — so both go through the normal `http` JSON client.
 * The caller is responsible for reading a File into a string (e.g. via
 * `file.text()`) before calling these.
 *
 * Export is the one genuinely non-JSON endpoint: it responds with a raw
 * `text/csv` body, not JSON — `http.getText` handles that (same
 * auth/refresh-retry behavior as `http.get`, `res.text()` instead of
 * `res.json()`).
 */

export interface StudentImportRowResult {
  row: number
  valid: boolean
  /** Zod's flattened field-error map — present only when valid is false. */
  errors?: Record<string, string[] | undefined>
}

export interface StudentImportPreviewResult {
  totalRows: number
  validCount: number
  invalidCount: number
  results: StudentImportRowResult[]
}

export interface StudentImportFailure {
  row: number
  errors: unknown
}

export interface StudentImportCommitResult {
  createdCount: number
  failedCount: number
  failed: StudentImportFailure[]
}

/**
 * Backend StudentStatus wire values (ACTIVE/INACTIVE/ALUMNI) — kept local
 * and uppercase per this file's convention, not the lowercase
 * `StudentStatus` in `@/types/student` (studentsApi.ts's pre-existing UI
 * convention, which this module intentionally doesn't follow).
 */
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'ALUMNI'

export interface ExportStudentsParams {
  departmentId?: string
  status?: StudentStatus
}

/** Validates every row against the live student schema without creating anything. */
export async function previewStudentImport(csv: string): Promise<StudentImportPreviewResult> {
  return http.post<StudentImportPreviewResult>('/import-export/students/preview', { csv })
}

/** Re-validates and creates only valid rows — an invalid row is reported, never partially inserted. */
export async function commitStudentImport(csv: string): Promise<StudentImportCommitResult> {
  return http.post<StudentImportCommitResult>('/import-export/students/commit', { csv })
}

/** Returns the raw CSV text body — write it to a file / feed it to a Blob download in the caller, this function only fetches it. */
export async function exportStudentsCsv(params: ExportStudentsParams = {}): Promise<string> {
  return http.getText('/import-export/students/export', { departmentId: params.departmentId, status: params.status })
}
