import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  createBook,
  deleteBook,
  issueBook,
  listBooks,
  listIssues,
  returnBook,
  updateBook,
  type BookInput,
  type IssueBookInput,
  type ListBooksParams,
  type ListIssuesParams,
} from '@/services/api/libraryApi'
import { listStudents } from '@/services/api/studentsApi'
import { listFaculty } from '@/services/api/facultyApi'

// ---- Books ----

export function useBooksQuery(params: ListBooksParams) {
  return useQuery({
    queryKey: ['library-books', 'list', params],
    queryFn: () => listBooks(params),
    placeholderData: (previous) => previous,
  })
}

/** Unpaginated-in-practice lookup used by the Issues tab and the issue form's book select. */
export function useAllBooksForLookup() {
  return useQuery({
    queryKey: ['library-books', 'all'],
    queryFn: () => listBooks({ page: 1, pageSize: 100 }),
  })
}

export function useCreateBook() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: BookInput) => createBook(input),
    onSuccess: () => {
      message.success('Book added')
      void queryClient.invalidateQueries({ queryKey: ['library-books'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to add book'))
    },
  })
}

export function useUpdateBook() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BookInput }) => updateBook(id, input),
    onSuccess: () => {
      message.success('Book updated')
      void queryClient.invalidateQueries({ queryKey: ['library-books'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update book'))
    },
  })
}

export function useDeleteBook() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteBook(id),
    onSuccess: () => {
      message.success('Book deleted')
      void queryClient.invalidateQueries({ queryKey: ['library-books'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete book'))
    },
  })
}

// ---- Issues ----

export function useIssuesQuery(params: ListIssuesParams) {
  return useQuery({
    queryKey: ['library-issues', 'list', params],
    queryFn: () => listIssues(params),
    placeholderData: (previous) => previous,
  })
}

/** Owner pickers for the issue form/filters — small, unpaginated-in-practice lookups. */
export function useAllStudentsForLibrary() {
  return useQuery({
    queryKey: ['students', 'all'],
    queryFn: () => listStudents({ page: 1, pageSize: 100 }),
  })
}

export function useAllFacultyForLibrary() {
  return useQuery({
    queryKey: ['faculty', 'all'],
    queryFn: () => listFaculty({ page: 1, pageSize: 100 }),
  })
}

export function useIssueBook() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: IssueBookInput) => issueBook(input),
    onSuccess: () => {
      message.success('Book issued')
      void queryClient.invalidateQueries({ queryKey: ['library-issues'] })
      void queryClient.invalidateQueries({ queryKey: ['library-books'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to issue book'))
    },
  })
}

export function useReturnBook() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => returnBook(id),
    onSuccess: (issue) => {
      message.success(
        issue.fineAmount ? `Book returned — fine of ₹${issue.fineAmount} applies for late return` : 'Book returned',
      )
      void queryClient.invalidateQueries({ queryKey: ['library-issues'] })
      void queryClient.invalidateQueries({ queryKey: ['library-books'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to return book'))
    },
  })
}
