import { z } from 'zod'

export const issueBookSchema = z.object({
  bookId: z.string().min(1, 'Book is required'),
  ownerType: z.enum(['STUDENT', 'FACULTY'], { message: 'Owner type is required' }),
  ownerId: z.string().min(1, 'Owner is required'),
  dueDate: z.string().min(1, 'Due date is required'),
})

export type IssueBookFormValues = z.infer<typeof issueBookSchema>
