import { getSupabaseClient } from '@/lib/db/client'

export type IssuingContext = {
  doctorProfileId: string
  signatureId: string
}

/**
 * Resolves the doctor_profile_id and active signature_id a document gets
 * pinned to at issue time. Returns null if either is missing — the UI
 * should never let a doctor reach the issuing form in that state (it's
 * gated behind completing the doctor profile and capturing a signature
 * first), but this is the write-time backstop.
 */
export async function getIssuingContext(doctorId: string): Promise<IssuingContext | null> {
  const service = getSupabaseClient('service')

  const { data: doctorProfile } = await service
    .from('doctor_profiles')
    .select('id')
    .eq('profile_id', doctorId)
    .maybeSingle()

  if (!doctorProfile) return null

  const { data: signature } = await service
    .from('doctor_signatures')
    .select('id')
    .eq('doctor_profile_id', doctorProfile.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!signature) return null

  return { doctorProfileId: doctorProfile.id, signatureId: signature.id }
}
