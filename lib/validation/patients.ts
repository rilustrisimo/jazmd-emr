import { z } from 'zod'

const optionalText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v == null || v.trim() === '' ? null : v))

const optionalAge = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((v) => (v === '' || v == null ? null : Number(v)))
  .pipe(z.number().int().min(0).max(150).nullable())

export const patientSchema = z.object({
  patientType: z.enum(['adult', 'pedia']),
  firstName: z.string().min(1, 'First name is required'),
  middleName: optionalText,
  lastName: z.string().min(1, 'Last name is required'),
  civilStatus: z.enum(['single', 'married', 'widowed', 'separated', 'other']).nullable().optional(),
  address: optionalText,
  birthPlace: optionalText,
  birthDate: optionalText,
  ageOverride: optionalAge,
  sex: z.enum(['male', 'female']).nullable().optional(),
  contactNumber: optionalText,
  occupation: optionalText,
  smokingHistory: optionalText,
  drinkingHistory: optionalText,
  history: optionalText,
  vaccinations: optionalText,
})

// The form holds the pre-transform shape (e.g. ageOverride as the raw
// string a number input produces); submission uses the post-transform
// shape (e.g. ageOverride coerced to number | null) — these diverge
// because of the empty-string-to-null transforms above.
export type PatientFormValues = z.input<typeof patientSchema>
export type PatientInput = z.output<typeof patientSchema>

export const labResultSchema = z.object({
  laboratoryName: z.string().min(1, 'Laboratory name is required'),
  remarks: optionalText,
})

export type LabResultInput = z.infer<typeof labResultSchema>
