import { getSupabaseClient } from '@/lib/db/client'

/**
 * All storage buckets in this app are private. Every image the UI shows
 * (patient photos, lab results, signatures) goes through a short-lived
 * signed URL minted server-side — never a public bucket URL.
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const service = getSupabaseClient('service')
  const { data, error } = await service.storage.from(bucket).createSignedUrl(path, expiresInSeconds)
  if (error || !data) return null
  return data.signedUrl
}
