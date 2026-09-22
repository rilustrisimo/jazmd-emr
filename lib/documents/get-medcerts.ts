import { getSupabaseClient } from '@/lib/db/client'

export async function getMedcerts(patientId: string) {
  const service = getSupabaseClient('service')
  const { data, error } = await service
    .from('medcerts')
    .select('id, status, certification_description, created_at, voided_at, void_reason')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data
}
