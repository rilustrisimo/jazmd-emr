import { getSupabaseClient } from '@/lib/db/client'
import { getSignedUrl } from '@/lib/storage/signed-url'

export async function getLabResults(patientId: string) {
  const service = getSupabaseClient('service')
  const { data, error } = await service
    .from('patient_lab_results')
    .select('id, laboratory_name, result_image_storage_path, remarks, created_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return Promise.all(
    data.map(async (row) => ({
      ...row,
      signed_url: row.result_image_storage_path
        ? await getSignedUrl('lab-results', row.result_image_storage_path)
        : null,
    }))
  )
}
