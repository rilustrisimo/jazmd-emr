import { getSupabaseClient } from '@/lib/db/client'
import { getSignedUrl } from '@/lib/storage/signed-url'

export type ActiveSignature = {
  id: string
  storage_path: string
  width_px: number
  height_px: number
  created_at: string
  signed_url: string | null
}

export async function getActiveSignature(doctorProfileId: string): Promise<ActiveSignature | null> {
  const service = getSupabaseClient('service')
  const { data, error } = await service
    .from('doctor_signatures')
    .select('id, storage_path, width_px, height_px, created_at')
    .eq('doctor_profile_id', doctorProfileId)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) return null

  const signedUrl = await getSignedUrl('signatures', data.storage_path)
  return { ...data, signed_url: signedUrl }
}
