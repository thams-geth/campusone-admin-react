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

/** Shape of errors thrown by the service layer, mock or real. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status = 400, code = 'BAD_REQUEST') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export type EntityStatus = 'active' | 'inactive'
