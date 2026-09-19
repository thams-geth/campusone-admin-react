import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Spin, Typography } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { GlobalSearchResult, GlobalSearchResultItem } from '@/services/api/searchApi'
import { GLOBAL_SEARCH_MIN_QUERY_LENGTH } from '@/services/api/searchApi'
import { useGlobalSearch } from '@/features/search/useGlobalSearch'
import { errorMessage } from '@/utils/errorMessage'

const MAX_RESULTS_PER_CATEGORY = 8

/**
 * Category -> (heading, destination route) mapping. Departments/Programs/
 * Batches/Sections/Subjects have no per-id detail route, so results there
 * navigate to the plain list page instead.
 */
const CATEGORY_CONFIG: Array<{
  key: keyof GlobalSearchResult
  heading: string
  toPath: (item: GlobalSearchResultItem) => string
}> = [
  { key: 'students', heading: 'Students', toPath: (item) => `/students/${item.id}` },
  { key: 'faculty', heading: 'Faculty', toPath: (item) => `/faculty/${item.id}` },
  { key: 'departments', heading: 'Departments', toPath: () => '/departments' },
  { key: 'programs', heading: 'Programs', toPath: () => '/programs' },
  { key: 'batches', heading: 'Batches', toPath: () => '/batches' },
  { key: 'sections', heading: 'Sections', toPath: () => '/sections' },
  { key: 'subjects', heading: 'Subjects', toPath: () => '/subjects' },
]

export function GlobalSearch() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)

  const { data, isLoading, isBelowMinLength, error } = useGlobalSearch(value)

  const groups = useMemo(
    () =>
      CATEGORY_CONFIG.map((config) => ({
        ...config,
        items: data[config.key].slice(0, MAX_RESULTS_PER_CATEGORY),
      })).filter((group) => group.items.length > 0),
    [data],
  )

  const trimmed = value.trim()
  const hasQuery = trimmed.length > 0
  const showDropdown = open && hasQuery

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(item: GlobalSearchResultItem, toPath: (item: GlobalSearchResultItem) => string) {
    navigate(toPath(item))
    setValue('')
    setOpen(false)
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
      <Input
        allowClear
        prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />}
        placeholder="Search students, faculty, departments…"
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          setOpen(event.target.value.trim().length > 0)
        }}
        onFocus={() => {
          if (trimmed.length > 0) setOpen(true)
        }}
        onKeyDown={handleKeyDown}
        aria-label="Global search"
      />

      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
            maxHeight: 420,
            overflowY: 'auto',
            zIndex: 1050,
            padding: '4px 0',
          }}
        >
          {isBelowMinLength && (
            <div style={{ padding: '8px 16px' }}>
              <Typography.Text type="secondary">
                Keep typing — enter at least {GLOBAL_SEARCH_MIN_QUERY_LENGTH} characters to search.
              </Typography.Text>
            </div>
          )}

          {!isBelowMinLength && isLoading && (
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <Spin size="small" />
            </div>
          )}

          {!isBelowMinLength && !isLoading && error && (
            <div style={{ padding: '8px 16px' }}>
              <Typography.Text type="danger">{errorMessage(error, 'Search failed. Please try again.')}</Typography.Text>
            </div>
          )}

          {!isBelowMinLength && !isLoading && !error && groups.length === 0 && (
            <div style={{ padding: '8px 16px' }}>
              <Typography.Text type="secondary">No results for '{trimmed}'</Typography.Text>
            </div>
          )}

          {!isBelowMinLength &&
            !isLoading &&
            !error &&
            groups.map((group) => (
              <div key={group.key} style={{ padding: '4px 0' }}>
                <div style={{ padding: '4px 16px' }}>
                  <Typography.Text strong style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                    {group.heading.toUpperCase()}
                  </Typography.Text>
                </div>
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelect(item, group.toPath)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') handleSelect(item, group.toPath)
                    }}
                    style={{
                      padding: '6px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseEnter={(event) => (event.currentTarget.style.background = '#f5f5f5')}
                    onMouseLeave={(event) => (event.currentTarget.style.background = 'transparent')}
                  >
                    <Typography.Text>{item.label}</Typography.Text>
                    {item.subtitle && (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {item.subtitle}
                      </Typography.Text>
                    )}
                  </div>
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
