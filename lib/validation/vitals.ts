import { z } from 'zod'

const optionalNumber = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((v) => (v === '' || v == null ? null : Number(v)))
  .pipe(z.number().nullable())

export const vitalSignsSchema = z.object({
  temperatureCelsius: optionalNumber,
  systolicMmhg: optionalNumber,
  diastolicMmhg: optionalNumber,
  pulseRateBpm: optionalNumber,
  respiratoryRateBpm: optionalNumber,
  weightKg: optionalNumber,
  heightCm: optionalNumber,
})

export type VitalSignsFormValues = z.input<typeof vitalSignsSchema>
export type VitalSignsInput = z.output<typeof vitalSignsSchema>
