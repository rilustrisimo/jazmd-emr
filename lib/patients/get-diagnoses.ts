import { getSupabaseClient } from '@/lib/db/client'

export type DiagnosisRecord = {
  id: string
  symptoms_diagnosis: string
  treatment: string | null
  remarks: string | null
  created_at: string
}

export async function getDiagnoses(patientId: string): Promise<DiagnosisRecord[]> {
  const service = getSupabaseClient('service')
  const { data, error } = await service
    .from('diagnoses')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as DiagnosisRecord[]
}
