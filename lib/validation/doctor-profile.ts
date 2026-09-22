import { z } from 'zod'

const optionalText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v == null || v.trim() === '' ? null : v))

export const clinicLocationSchema = z.object({
  name: z.string().min(1, 'Clinic name is required'),
  address: z.string().min(1, 'Address is required'),
  contactNumber: optionalText,
  scheduleText: optionalText,
})

export const doctorProfileSchema = z.object({
  printedName: z.string().min(1, 'Printed name is required'),
  credentials: optionalText,
  licenseNumber: z.string().min(1, 'License number is required'),
  ptrNumber: optionalText,
  clinicLocations: z.array(clinicLocationSchema),
})

export type ClinicLocation = z.output<typeof clinicLocationSchema>
export type DoctorProfileFormValues = z.input<typeof doctorProfileSchema>
export type DoctorProfileInput = z.output<typeof doctorProfileSchema>
