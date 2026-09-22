import { getSupabaseClient } from '@/lib/db/client'

export async function getPrescriptions(patientId: string) {
  const service = getSupabaseClient('service')
  const { data, error } = await service
    .from('prescriptions')
    .select('id, status, prescription_details, created_at, voided_at, void_reason')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data
}
