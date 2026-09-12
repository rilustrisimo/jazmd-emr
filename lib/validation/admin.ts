import { z } from 'zod'

export const createUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'doctor']),
  doctorPatientScope: z.enum(['adult', 'pedia']).nullable().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
