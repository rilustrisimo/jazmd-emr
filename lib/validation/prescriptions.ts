import { z } from 'zod'

export const prescriptionSchema = z.object({
  prescriptionDetails: z.string().min(1, 'Prescription details are required'),
})

export type PrescriptionInput = z.infer<typeof prescriptionSchema>

export const voidSchema = z.object({
  voidReason: z.string().min(1, 'A reason is required to void a document'),
})

export type VoidInput = z.infer<typeof voidSchema>
