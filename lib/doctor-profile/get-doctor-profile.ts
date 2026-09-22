import { getSupabaseClient } from '@/lib/db/client'
import type { ClinicLocation } from '@/lib/validation/doctor-profile'

export type DoctorProfileRecord = {
  id: string
  profile_id: string
  printed_name: string
  credentials: string | null
  license_number: string
  ptr_number: string | null
  clinic_locations: ClinicLocation[]
  created_at: string
  updated_at: string
}

export async function getDoctorProfileByProfileId(profileId: string): Promise<DoctorProfileRecord | null> {
  const service = getSupabaseClient('service')
  const { data, error } = await service.from('doctor_profiles').select('*').eq('profile_id', profileId).maybeSingle()

  if (error || !data) return null
  return data as DoctorProfileRecord
}
