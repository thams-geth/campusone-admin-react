import { useMutation, useQuery } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import { assignRole, listPermissions, listRoles, type AssignRoleInput } from '@/services/api/rbacApi'
import { listFaculty } from '@/services/api/facultyApi'

export function useRolesQuery() {
  return useQuery({
    queryKey: ['roles', 'list'],
    queryFn: () => listRoles(),
  })
}

export function usePermissionsQuery() {
  return useQuery({
    queryKey: ['permissions', 'list'],
    queryFn: () => listPermissions(),
  })
}

/** Faculty picker for the "Assign role" form — small, unpaginated-in-practice lookup (same pattern as useAllStudentsForLeave). */
export function useAllFacultyForRoles() {
  return useQuery({
    queryKey: ['faculty', 'all'],
    queryFn: () => listFaculty({ page: 1, pageSize: 100 }),
  })
}

/** No query invalidation on success — roles/permissions/faculty lists don't change as a result of assigning a role. */
export function useAssignRole() {
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: AssignRoleInput }) => assignRole(userId, input),
    onSuccess: (result) => {
      message.success(`Assigned role "${result.role}" to user ${result.userId}`)
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to assign role'))
    },
  })
}
