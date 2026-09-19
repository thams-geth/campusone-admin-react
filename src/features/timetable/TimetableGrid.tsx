import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Empty, Select, Skeleton, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { PeriodSlot, TimetableEntry, Weekday } from '@/services/api/timetableApi'
import { WEEKDAY_OPTIONS } from '@/features/timetable/timetableSchema'
import { useAuth } from '@/features/auth/useAuth'
import { ADMIN_ROLES } from '@/app/router/navConfig'
import {
  useAllFacultyForTimetable,
  useAllRoomsForTimetable,
  useAllSectionsForTimetable,
  useAllSubjectsForTimetable,
  usePeriodSlotsQuery,
  useTimetableEntriesQuery,
} from '@/features/timetable/hooks'
import { TimetableEntryFormDrawer, type TimetableEntryPrefill } from '@/features/timetable/TimetableEntryFormDrawer'

/** A real college grid is Mon–Sat — WEEKDAY_OPTIONS carries all 7 for the flat list/filter UI. */
const GRID_DAYS = WEEKDAY_OPTIONS.filter((d) => d.value !== 'SUNDAY')

/** Fixed palette from src/app/theme.ts's accent colors — deterministic per subject, not random per render. */
const SUBJECT_PALETTE = ['#4F46E5', '#2563EB', '#0D9488', '#7C3AED', '#B45309', '#DC2626', '#16A34A', '#0EA5E9']

function subjectColor(subjectId: string): string {
  let hash = 0
  for (let i = 0; i < subjectId.length; i++) hash = (hash * 31 + subjectId.charCodeAt(i)) >>> 0
  return SUBJECT_PALETTE[hash % SUBJECT_PALETTE.length]
}

/**
 * Does this period's [startTime, endTime) range overlap the entry's? The
 * exact same overlap math the backend's conflict detection uses on "HH:mm"
 * strings (they sort lexicographically the same as chronologically).
 */
function periodOverlapsEntry(period: PeriodSlot, entry: TimetableEntry): boolean {
  return entry.startTime < period.endTime && period.startTime < entry.endTime
}

/**
 * How many consecutive rows (starting at `periods[startIndex]`) `entry`
 * visually spans — walks forward while the next row is still a TEACHING
 * period the entry overlaps. Stops at a BREAK/LUNCH row or a period the
 * entry doesn't cover, so a (disallowed) range spanning a break can never
 * render a rowSpan across it.
 */
function computeRowSpan(periods: PeriodSlot[], startIndex: number, entry: TimetableEntry): number {
  let span = 1
  while (
    startIndex + span < periods.length &&
    periods[startIndex + span].type === 'TEACHING' &&
    periodOverlapsEntry(periods[startIndex + span], entry)
  ) {
    span++
  }
  return span
}

interface DrawerState {
  entry?: TimetableEntry
  prefill?: TimetableEntryPrefill
}

export function TimetableGrid() {
  const { hasRole } = useAuth()
  const canManage = hasRole(...ADMIN_ROLES)

  const [sectionId, setSectionId] = useState<string | undefined>(undefined)
  const [drawerState, setDrawerState] = useState<DrawerState | null>(null)

  const sectionsQuery = useAllSectionsForTimetable()
  const subjectsQuery = useAllSubjectsForTimetable()
  const facultyQuery = useAllFacultyForTimetable()
  const roomsQuery = useAllRoomsForTimetable()
  const periodsQuery = usePeriodSlotsQuery()
  // Always called (rules of hooks) — its result is only used once a section
  // is actually selected, see `entries` below.
  const entriesQuery = useTimetableEntriesQuery({ sectionId, pageSize: 200 })

  const subjectLabelById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of subjectsQuery.data?.data ?? []) map.set(s.id, `${s.code} — ${s.name}`)
    return map
  }, [subjectsQuery.data])

  const facultyNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const f of facultyQuery.data?.data ?? []) map.set(f.id, f.name)
    return map
  }, [facultyQuery.data])

  const roomLabelById = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of roomsQuery.data?.data ?? []) map.set(r.id, `${r.name} (${r.code})`)
    return map
  }, [roomsQuery.data])

  const periods = periodsQuery.data ?? []

  const entriesByDay = useMemo(() => {
    const map = new Map<Weekday, TimetableEntry[]>()
    const entries = sectionId ? (entriesQuery.data?.data ?? []) : []
    for (const entry of entries) {
      const list = map.get(entry.dayOfWeek)
      if (list) list.push(entry)
      else map.set(entry.dayOfWeek, [entry])
    }
    return map
  }, [sectionId, entriesQuery.data])

  function openCreate(day: Weekday, period: PeriodSlot) {
    if (!canManage || !sectionId) return
    setDrawerState({ prefill: { sectionId, dayOfWeek: day, startPeriodId: period.id, endPeriodId: period.id } })
  }

  function openEdit(entry: TimetableEntry) {
    if (!canManage) return
    setDrawerState({ entry })
  }

  const initialLoading = sectionsQuery.isPending
  const gridLoading = !!sectionId && (periodsQuery.isPending || entriesQuery.isPending)

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Typography.Text strong style={{ marginRight: 12 }}>
          Section
        </Typography.Text>
        <Select
          showSearch
          allowClear
          style={{ width: 260 }}
          placeholder="Select a section"
          loading={sectionsQuery.isPending}
          optionFilterProp="label"
          value={sectionId}
          onChange={setSectionId}
          options={(sectionsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
        />
      </Card>

      <Card>
        {initialLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : !periodsQuery.isPending && periods.length === 0 ? (
          <Empty description="No periods configured yet — set up the institution's daily bell schedule first.">
            <Link to="/timetable/periods">
              <Button type="primary">Configure periods</Button>
            </Link>
          </Empty>
        ) : !sectionId ? (
          <Empty description="Select a section to view its weekly timetable." />
        ) : gridLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={headerCellStyle}>Period</th>
                  {GRID_DAYS.map((day) => (
                    <th key={day.value} style={headerCellStyle}>
                      {day.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const occupiedUntil: Partial<Record<Weekday, number>> = {}
                  return periods.map((period, index) => {
                    if (period.type !== 'TEACHING') {
                      return (
                        <tr key={period.id}>
                          <td style={labelCellStyle}>
                            <PeriodLabel period={period} />
                          </td>
                          <td colSpan={GRID_DAYS.length} style={bandCellStyle}>
                            {period.label} — {period.startTime}–{period.endTime}
                          </td>
                        </tr>
                      )
                    }

                    const cells = GRID_DAYS.map((day) => {
                      const occupied = occupiedUntil[day.value]
                      if (occupied !== undefined && occupied >= index) {
                        return null
                      }

                      const dayEntries = entriesByDay.get(day.value) ?? []
                      const covering = dayEntries.find((e) => periodOverlapsEntry(period, e))

                      if (covering) {
                        const span = computeRowSpan(periods, index, covering)
                        occupiedUntil[day.value] = index + span - 1
                        const color = subjectColor(covering.subjectId)
                        return (
                          <td
                            key={day.value}
                            rowSpan={span}
                            style={{ ...cellStyle, cursor: canManage ? 'pointer' : 'default', padding: 6 }}
                            role={canManage ? 'button' : undefined}
                            tabIndex={canManage ? 0 : undefined}
                            aria-label={`Edit ${subjectLabelById.get(covering.subjectId) ?? covering.subjectId} on ${day.label}`}
                            onClick={() => openEdit(covering)}
                            onKeyDown={(e) => {
                              if (canManage && (e.key === 'Enter' || e.key === ' ')) openEdit(covering)
                            }}
                          >
                            <div
                              style={{
                                borderLeft: `3px solid ${color}`,
                                background: `color-mix(in srgb, ${color} 10%, white)`,
                                borderRadius: 8,
                                padding: '7px 9px',
                              }}
                            >
                              <div style={{ fontWeight: 600, fontSize: 12.5 }}>
                                {subjectLabelById.get(covering.subjectId) ?? covering.subjectId}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--tt-muted-text, #666)', marginTop: 2 }}>
                                {facultyNameById.get(covering.facultyId) ?? covering.facultyId}
                              </div>
                              <div style={{ fontSize: 10.5, color: 'var(--tt-muted-text, #888)' }}>
                                {roomLabelById.get(covering.roomId) ?? covering.roomId}
                              </div>
                              {span > 1 && (
                                <div
                                  style={{
                                    fontSize: 9.5,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.4,
                                    color,
                                    marginTop: 5,
                                  }}
                                >
                                  {span}-period lab
                                </div>
                              )}
                            </div>
                          </td>
                        )
                      }

                      return (
                        <td key={day.value} style={cellStyle}>
                          {canManage && (
                            <Button
                              type="dashed"
                              size="small"
                              block
                              icon={<PlusOutlined />}
                              aria-label={`Add entry — ${day.label} ${period.label}`}
                              onClick={() => openCreate(day.value, period)}
                            />
                          )}
                        </td>
                      )
                    })

                    return (
                      <tr key={period.id}>
                        <td style={labelCellStyle}>
                          <PeriodLabel period={period} />
                        </td>
                        {cells}
                      </tr>
                    )
                  })
                })()}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {canManage && (
        <TimetableEntryFormDrawer
          open={drawerState !== null}
          onClose={() => setDrawerState(null)}
          entry={drawerState?.entry}
          prefill={drawerState?.prefill}
        />
      )}
    </div>
  )
}

function PeriodLabel({ period }: { period: PeriodSlot }) {
  return (
    <>
      <div style={{ fontWeight: 600 }}>{period.label}</div>
      <div style={{ fontSize: 12, color: 'var(--tt-muted-text, #666)' }}>
        {period.startTime}–{period.endTime}
      </div>
    </>
  )
}

const headerCellStyle: CSSProperties = {
  border: '1px solid var(--tt-border, #E7E3F3)',
  padding: 10,
  textAlign: 'center',
  fontFamily: "'Inter', sans-serif",
  fontSize: 11.5,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  color: 'var(--tt-muted-text, #6C6784)',
  background: 'var(--tt-header-bg, #FAF9FD)',
}

const labelCellStyle: CSSProperties = {
  border: '1px solid var(--tt-border, #E7E3F3)',
  padding: 8,
  width: 140,
  whiteSpace: 'nowrap',
}

const cellStyle: CSSProperties = {
  border: '1px solid var(--tt-border, #E7E3F3)',
  padding: 8,
  minWidth: 140,
  verticalAlign: 'top',
}

const bandCellStyle: CSSProperties = {
  border: '1px solid var(--tt-border, #E7E3F3)',
  padding: 8,
  textAlign: 'center',
  fontWeight: 600,
  fontSize: 12.5,
  borderRadius: 8,
  backgroundImage:
    'repeating-linear-gradient(135deg, var(--tt-band-bg, #F6F5FC), var(--tt-band-bg, #F6F5FC) 8px, #fff 8px, #fff 16px)',
  color: 'var(--tt-muted-text, #6C6784)',
}
