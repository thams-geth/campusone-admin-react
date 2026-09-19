import { useEffect, useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, Popconfirm, Select, Space } from 'antd'
import { timetableEntrySchema, WEEKDAY_OPTIONS, type TimetableEntryFormValues } from '@/features/timetable/timetableSchema'
import type { PeriodSlot, TimetableEntry, Weekday } from '@/services/api/timetableApi'
import {
  useAllFacultyForTimetable,
  useAllRoomsForTimetable,
  useAllSectionsForTimetable,
  useAllSubjectsForTimetable,
  useCreateTimetableEntry,
  useDeleteTimetableEntry,
  usePeriodSlotsQuery,
  useUpdateTimetableEntry,
} from '@/features/timetable/hooks'

/**
 * The TEACHING period a given "HH:mm" time value corresponds to — prefers an
 * exact boundary match (the normal case, guaranteed once a period is picked
 * through this UI), falling back to whichever period's range contains the
 * value, for legacy entries whose stored times don't align to a period
 * boundary. `edge` selects whether the value is being matched as a range's
 * start or end (an end time of "10:50" belongs to the period ending then,
 * not the one starting then).
 */
function findPeriodForTime(periods: PeriodSlot[], time: string, edge: 'start' | 'end'): PeriodSlot | undefined {
  if (!time) return undefined
  if (edge === 'start') {
    return (
      periods.find((p) => p.startTime === time) ?? periods.find((p) => p.startTime <= time && time < p.endTime)
    )
  }
  return periods.find((p) => p.endTime === time) ?? periods.find((p) => p.startTime < time && time <= p.endTime)
}

/**
 * Every period between `startId` and `endId` (inclusive), in the full
 * tenant-wide period list, must itself be TEACHING — a BREAK/LUNCH period
 * in between means the chosen range crosses a break, which can't be merged
 * into a single entry.
 */
function findRangeError(allPeriods: PeriodSlot[], startId: string, endId: string): string | null {
  const startIndex = allPeriods.findIndex((p) => p.id === startId)
  const endIndex = allPeriods.findIndex((p) => p.id === endId)
  if (startIndex === -1 || endIndex === -1) return null

  const [lo, hi] = startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex]
  for (let i = lo; i <= hi; i++) {
    if (allPeriods[i].type !== 'TEACHING') {
      return "Can't schedule across a break — choose periods that don't span one."
    }
  }
  return null
}

/** Prefill values for create mode (e.g. clicking an empty cell in the weekly grid). Ignored when `entry` is set. */
export interface TimetableEntryPrefill {
  sectionId?: string
  dayOfWeek?: Weekday
  startPeriodId?: string
  endPeriodId?: string
}

interface TimetableEntryFormDrawerProps {
  open: boolean
  onClose: () => void
  /** Present when editing an existing entry — switches the drawer to edit mode, with a delete action. */
  entry?: TimetableEntry
  prefill?: TimetableEntryPrefill
}

const emptyValues: TimetableEntryFormValues = {
  sectionId: '',
  subjectId: '',
  facultyId: '',
  roomId: '',
  dayOfWeek: 'MONDAY',
  startTime: '',
  endTime: '',
}

export function TimetableEntryFormDrawer({ open, onClose, entry, prefill }: TimetableEntryFormDrawerProps) {
  const isEditing = !!entry
  const createEntry = useCreateTimetableEntry()
  const updateEntry = useUpdateTimetableEntry()
  const deleteEntry = useDeleteTimetableEntry()
  const submitting = createEntry.isPending || updateEntry.isPending

  const sectionsQuery = useAllSectionsForTimetable()
  const subjectsQuery = useAllSubjectsForTimetable()
  const facultyQuery = useAllFacultyForTimetable()
  const roomsQuery = useAllRoomsForTimetable()
  const periodsQuery = usePeriodSlotsQuery()

  const allPeriods = useMemo(() => periodsQuery.data ?? [], [periodsQuery.data])
  const teachingPeriods = useMemo(() => allPeriods.filter((p) => p.type === 'TEACHING'), [allPeriods])

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TimetableEntryFormValues>({
    resolver: zodResolver(timetableEntrySchema),
    defaultValues: emptyValues,
  })

  // startTime/endTime are the schema-validated source of truth (unchanged
  // from before this UI existed) — start/end period selection is derived
  // from them, not tracked as separate state, so there's nothing to keep in
  // sync by hand.
  const startTimeValue = useWatch({ control, name: 'startTime' })
  const endTimeValue = useWatch({ control, name: 'endTime' })
  const startPeriodId = findPeriodForTime(teachingPeriods, startTimeValue, 'start')?.id ?? ''
  const endPeriodId = findPeriodForTime(teachingPeriods, endTimeValue, 'end')?.id ?? ''

  const rangeError = useMemo(
    () => (startPeriodId && endPeriodId ? findRangeError(allPeriods, startPeriodId, endPeriodId) : null),
    [allPeriods, startPeriodId, endPeriodId],
  )

  useEffect(() => {
    if (!open) return

    if (entry) {
      reset({
        sectionId: entry.sectionId,
        subjectId: entry.subjectId,
        facultyId: entry.facultyId,
        roomId: entry.roomId,
        dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
      })
      return
    }

    const initialStartId = prefill?.startPeriodId ?? ''
    const initialEndId = prefill?.endPeriodId ?? initialStartId
    const startPeriod = teachingPeriods.find((p) => p.id === initialStartId)
    const endPeriod = teachingPeriods.find((p) => p.id === initialEndId)
    reset({
      ...emptyValues,
      sectionId: prefill?.sectionId ?? '',
      dayOfWeek: prefill?.dayOfWeek ?? 'MONDAY',
      startTime: startPeriod?.startTime ?? '',
      endTime: endPeriod?.endTime ?? '',
    })
    // teachingPeriods deliberately omitted from deps — it's re-derived from a
    // query that shouldn't reset the form's in-progress state on every
    // background refetch, only when the drawer is (re)opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entry, prefill, reset])

  function handleStartPeriodChange(id: string) {
    const startIndex = teachingPeriods.findIndex((p) => p.id === id)
    const endIndex = teachingPeriods.findIndex((p) => p.id === endPeriodId)
    // End period auto-follows start unless the user already deliberately
    // chose a valid (at-or-after) end period for a multi-period range.
    const nextEndId = endIndex === -1 || endIndex < startIndex ? id : endPeriodId
    const startPeriod = teachingPeriods.find((p) => p.id === id)
    const endPeriod = teachingPeriods.find((p) => p.id === nextEndId)
    setValue('startTime', startPeriod?.startTime ?? '', { shouldValidate: true })
    setValue('endTime', endPeriod?.endTime ?? '', { shouldValidate: true })
  }

  function handleEndPeriodChange(id: string) {
    const endPeriod = teachingPeriods.find((p) => p.id === id)
    setValue('endTime', endPeriod?.endTime ?? '', { shouldValidate: true })
  }

  async function onSubmit(values: TimetableEntryFormValues) {
    if (rangeError) return
    // Errors surface via the mutations' onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled
    // (a 409 from the backend's conflict detection surfaces the same way).
    if (entry) {
      await updateEntry.mutateAsync({ id: entry.id, input: values }, { onSuccess: onClose }).catch(() => undefined)
    } else {
      await createEntry.mutateAsync(values, { onSuccess: onClose }).catch(() => undefined)
    }
  }

  async function handleDelete() {
    if (!entry) return
    await deleteEntry.mutateAsync(entry.id, { onSuccess: onClose }).catch(() => undefined)
  }

  const periodOptions = teachingPeriods.map((p) => ({ value: p.id, label: `${p.label} (${p.startTime}–${p.endTime})` }))

  return (
    <Drawer
      title={isEditing ? 'Edit timetable entry' : 'Add timetable entry'}
      open={open}
      onClose={onClose}
      size={440}
      destroyOnHidden
      extra={
        <Space>
          {isEditing && (
            <Popconfirm
              title="Remove timetable entry"
              description="Remove this scheduled entry? This cannot be undone."
              onConfirm={handleDelete}
              okText="Remove"
              okButtonProps={{ danger: true }}
            >
              <Button danger loading={deleteEntry.isPending}>
                Remove
              </Button>
            </Popconfirm>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} disabled={!!rangeError} onClick={handleSubmit(onSubmit)}>
            {isEditing ? 'Save changes' : 'Add entry'}
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Section" validateStatus={errors.sectionId ? 'error' : ''} help={errors.sectionId?.message}>
          <Controller
            name="sectionId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                loading={sectionsQuery.isPending}
                optionFilterProp="label"
                placeholder="Select section"
                options={(sectionsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Subject" validateStatus={errors.subjectId ? 'error' : ''} help={errors.subjectId?.message}>
          <Controller
            name="subjectId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                loading={subjectsQuery.isPending}
                optionFilterProp="label"
                placeholder="Select subject"
                options={(subjectsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: `${s.code} — ${s.name}` }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Faculty" validateStatus={errors.facultyId ? 'error' : ''} help={errors.facultyId?.message}>
          <Controller
            name="facultyId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                loading={facultyQuery.isPending}
                optionFilterProp="label"
                placeholder="Select faculty"
                options={(facultyQuery.data?.data ?? []).map((f) => ({ value: f.id, label: f.name }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Room" validateStatus={errors.roomId ? 'error' : ''} help={errors.roomId?.message}>
          <Controller
            name="roomId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                loading={roomsQuery.isPending}
                optionFilterProp="label"
                placeholder="Select room"
                options={(roomsQuery.data?.data ?? []).map((r) => ({ value: r.id, label: `${r.name} (${r.code})` }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Day of week" validateStatus={errors.dayOfWeek ? 'error' : ''} help={errors.dayOfWeek?.message}>
          <Controller
            name="dayOfWeek"
            control={control}
            render={({ field }) => <Select {...field} options={[...WEEKDAY_OPTIONS]} />}
          />
        </Form.Item>

        <Form.Item
          label="Start period"
          validateStatus={errors.startTime ? 'error' : ''}
          help={errors.startTime ? 'Start period is required' : undefined}
        >
          <Select
            value={startPeriodId || undefined}
            loading={periodsQuery.isPending}
            placeholder="Select start period"
            onChange={handleStartPeriodChange}
            options={periodOptions}
          />
        </Form.Item>

        <Form.Item label="End period" validateStatus={rangeError || errors.endTime ? 'error' : ''} help={rangeError ?? errors.endTime?.message}>
          <Select
            value={endPeriodId || undefined}
            loading={periodsQuery.isPending}
            placeholder="Select end period"
            onChange={handleEndPeriodChange}
            options={periodOptions}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
