import { http } from '@/services/api/httpClient'

/** The minimum query length the backend accepts — anything shorter 422s. */
export const GLOBAL_SEARCH_MIN_QUERY_LENGTH = 2

export type GlobalSearchResultType =
  | 'student'
  | 'faculty'
  | 'department'
  | 'program'
  | 'batch'
  | 'section'
  | 'subject'

export interface GlobalSearchResultItem {
  id: string
  type: GlobalSearchResultType
  label: string
  subtitle: string
}

export interface GlobalSearchResult {
  students: GlobalSearchResultItem[]
  faculty: GlobalSearchResultItem[]
  departments: GlobalSearchResultItem[]
  programs: GlobalSearchResultItem[]
  batches: GlobalSearchResultItem[]
  sections: GlobalSearchResultItem[]
  subjects: GlobalSearchResultItem[]
}

/** Returned client-side for a below-minimum query, instead of firing a request the backend would 422. */
export const EMPTY_GLOBAL_SEARCH_RESULT: GlobalSearchResult = {
  students: [],
  faculty: [],
  departments: [],
  programs: [],
  batches: [],
  sections: [],
  subjects: [],
}

/**
 * Cross-entity search (`GET /search?q=`). Categories the caller's role can't
 * read come back as an empty array rather than an omitted key, so callers
 * never need to special-case a missing category.
 */
export async function globalSearch(q: string): Promise<GlobalSearchResult> {
  if (q.trim().length < GLOBAL_SEARCH_MIN_QUERY_LENGTH) return EMPTY_GLOBAL_SEARCH_RESULT
  return http.get<GlobalSearchResult>('/search', { q })
}
