import { z } from 'zod'

const optionalText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v == null || v.trim() === '' ? null : v))

const optionalDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v == null || v.trim() === '' ? null : v))

export const medcertSchema = z.object({
  certificationDescription: z.string().min(1, 'Certification description is required'),
  diagnosisDetails: optionalText,
  inclusiveStartDate: optionalDate,
  inclusiveEndDate: optionalDate,
  inclusiveDatesNote: optionalText,
  fitToWork: z.boolean().optional(),
  fitToWorkNote: optionalText,
  remarks: optionalText,
})

export type MedcertFormValues = z.input<typeof medcertSchema>
export type MedcertInput = z.output<typeof medcertSchema>
