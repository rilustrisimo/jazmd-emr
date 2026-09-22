import { getSupabaseClient } from '@/lib/db/client'

export type VitalSignsRecord = {
  id: string
  temperature_celsius: number | null
  systolic_mmhg: number | null
  diastolic_mmhg: number | null
  pulse_rate_bpm: number | null
  respiratory_rate_bpm: number | null
  weight_kg: number | null
  height_cm: number | null
  bmi: number | null
  created_at: string
}

export async function getVitals(patientId: string): Promise<VitalSignsRecord[]> {
  const service = getSupabaseClient('service')
  const { data, error } = await service
    .from('vital_signs')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as VitalSignsRecord[]
}
