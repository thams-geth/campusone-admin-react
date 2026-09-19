/** Standard shape every list endpoint returns, mock or real. */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortOrder?: 'ascend' | 'descend'
}

/** Shape of errors thrown by the service layer, mirroring the API's ApiError/Zod error responses. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  /** Zod's `{ field: [messages] }` map, present on 422 VALIDATION_ERROR responses. */
  readonly details?: Record<string, string[] | undefined>

  constructor(message: string, status = 400, code = 'BAD_REQUEST', details?: Record<string, string[] | undefined>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export type EntityStatus = 'active' | 'inactive'
