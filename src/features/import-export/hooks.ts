import { useMutation, useQuery } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  commitStudentImport,
  exportStudentsCsv,
  previewStudentImport,
  type ExportStudentsParams,
} from '@/services/api/importExportApi'
import { listDepartments } from '@/services/api/departmentsApi'

/** Department picker for the export filters — small, unpaginated-in-practice lookup. */
export function useAllDepartmentsForImportExport() {
  return useQuery({ queryKey: ['departments', 'all'], queryFn: () => listDepartments({ page: 1, pageSize: 100 }) })
}

/** One-shot: surfaces its result via `data`, no list to invalidate. */
export function usePreviewStudentImport() {
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (csv: string) => previewStudentImport(csv),
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to preview import'))
    },
  })
}

/** One-shot: surfaces its result via `data`, no list to invalidate. */
export function useCommitStudentImport() {
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (csv: string) => commitStudentImport(csv),
    onSuccess: (result) => {
      message.success(`Imported ${result.createdCount} student${result.createdCount === 1 ? '' : 's'}`)
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to commit import'))
    },
  })
}

export function useExportStudentsCsv() {
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (params: ExportStudentsParams) => exportStudentsCsv(params),
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to export students'))
    },
  })
}
