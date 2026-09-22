import { z } from 'zod'

const optionalText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v == null || v.trim() === '' ? null : v))

export const diagnosisSchema = z.object({
  symptomsDiagnosis: z.string().min(1, 'Symptoms / diagnosis is required'),
  treatment: optionalText,
  remarks: optionalText,
})

export type DiagnosisFormValues = z.input<typeof diagnosisSchema>
export type DiagnosisInput = z.output<typeof diagnosisSchema>
