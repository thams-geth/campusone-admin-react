import { ApiError, type PaginatedResponse, type PaginationParams } from '@/types/common'

/**
 * A tiny in-memory "table" that stands in for a real backend table/API
 * resource. It clones data in and out so callers can never mutate the
 * store by holding a reference — the same isolation a real HTTP
 * round-trip would give you for free.
 */
export class MockTable<T extends { id: string }> {
  private rows: T[]

  constructor(seed: T[]) {
    this.rows = seed.map(clone)
  }

  list(
    params: PaginationParams,
    options: { searchFields?: (keyof T)[]; filter?: (row: T) => boolean } = {},
  ): PaginatedResponse<T> {
    const { page = 1, pageSize = 10, search, sortBy, sortOrder } = params
    const { searchFields = [], filter } = options

    let result = this.rows.slice()

    if (filter) {
      result = result.filter(filter)
    }

    if (search && searchFields.length > 0) {
      const needle = search.trim().toLowerCase()
      if (needle) {
        result = result.filter((row) =>
          searchFields.some((field) => String(row[field] ?? '').toLowerCase().includes(needle)),
        )
      }
    }

    if (sortBy) {
      const direction = sortOrder === 'descend' ? -1 : 1
      result = result.sort((a, b) => {
        const aVal = a[sortBy as keyof T]
        const bVal = b[sortBy as keyof T]
        if (aVal === bVal) return 0
        return aVal > bVal ? direction : -direction
      })
    }

    const total = result.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const start = (page - 1) * pageSize
    const pageRows = result.slice(start, start + pageSize)

    return {
      data: pageRows.map(clone),
      meta: { page, pageSize, total, totalPages },
    }
  }

  getById(id: string): T | undefined {
    const row = this.rows.find((r) => r.id === id)
    return row ? clone(row) : undefined
  }

  getByIdOrThrow(id: string, entityName = 'Resource'): T {
    const row = this.getById(id)
    if (!row) throw new ApiError(`${entityName} not found`, 404, 'NOT_FOUND')
    return row
  }

  insert(row: T): T {
    this.rows.push(clone(row))
    return clone(row)
  }

  update(id: string, patch: Partial<T>): T {
    const index = this.rows.findIndex((r) => r.id === id)
    if (index === -1) throw new ApiError('Resource not found', 404, 'NOT_FOUND')
    this.rows[index] = { ...this.rows[index], ...patch }
    return clone(this.rows[index])
  }

  remove(id: string): void {
    const index = this.rows.findIndex((r) => r.id === id)
    if (index === -1) throw new ApiError('Resource not found', 404, 'NOT_FOUND')
    this.rows.splice(index, 1)
  }

  some(predicate: (row: T) => boolean): boolean {
    return this.rows.some(predicate)
  }
}

function clone<T>(value: T): T {
  return structuredClone(value)
}
