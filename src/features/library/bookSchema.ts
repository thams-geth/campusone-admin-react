import { z } from 'zod'

export const bookSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  author: z.string().trim().min(1, 'Author is required').max(150),
  publisher: z.string().trim().max(150).optional(),
  category: z.string().trim().max(100).optional(),
  isbn: z.string().trim().max(30).optional(),
  totalCopies: z.number().int().min(1, 'Must be at least 1'),
})

export type BookFormValues = z.infer<typeof bookSchema>
