import { getSupabaseClient } from '@/lib/db/client'
import type { PatientRecord } from '@/lib/patients/types'

export async function getPatient(id: string): Promise<PatientRecord | null> {
  const service = getSupabaseClient('service')
  const { data, error } = await service
    .from('patients')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !data) return null
  return data as PatientRecord
}
