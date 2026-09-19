import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { EMPTY_GLOBAL_SEARCH_RESULT, GLOBAL_SEARCH_MIN_QUERY_LENGTH, globalSearch } from '@/services/api/searchApi'

const DEBOUNCE_MS = 300

/**
 * Debounces the raw input value by DEBOUNCE_MS before it drives the query,
 * so fast typing doesn't fire a request per keystroke. `enabled` stays
 * false below the backend's minimum query length, matching `globalSearch`'s
 * own client-side short-circuit.
 */
export function useGlobalSearch(q: string) {
  const [debouncedQ, setDebouncedQ] = useState(q)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQ(q), DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [q])

  const trimmed = debouncedQ.trim()
  const isBelowMinLength = trimmed.length > 0 && trimmed.length < GLOBAL_SEARCH_MIN_QUERY_LENGTH

  const query = useQuery({
    queryKey: ['search', 'global', trimmed],
    queryFn: () => globalSearch(trimmed),
    enabled: trimmed.length >= GLOBAL_SEARCH_MIN_QUERY_LENGTH,
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  })

  return {
    /** True while the debounce timer is pending or the query itself is in flight. */
    isLoading: (debouncedQ !== q || query.isFetching) && trimmed.length >= GLOBAL_SEARCH_MIN_QUERY_LENGTH,
    isBelowMinLength,
    data: trimmed.length >= GLOBAL_SEARCH_MIN_QUERY_LENGTH ? (query.data ?? EMPTY_GLOBAL_SEARCH_RESULT) : EMPTY_GLOBAL_SEARCH_RESULT,
    error: query.error,
  }
}
