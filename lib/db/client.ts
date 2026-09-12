import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type ClientMode = 'anon' | 'service'

let anonClient: SupabaseClient | null = null
let serviceClient: SupabaseClient | null = null

/**
 * Service-role clients bypass RLS entirely — every call site using
 * mode: 'service' must have already called requireUser/requireRole
 * (see lib/auth/session.ts) before touching the database.
 */
export function getSupabaseClient(mode: ClientMode = 'anon'): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('[db/client] Missing NEXT_PUBLIC_SUPABASE_URL')

  if (mode === 'service') {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE
    if (!serviceRoleKey) throw new Error('[db/client] Missing SUPABASE_SERVICE_ROLE')
    if (!serviceClient) {
      serviceClient = createClient(url, serviceRoleKey, { auth: { persistSession: false } })
    }
    return serviceClient
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey) throw new Error('[db/client] Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!anonClient) {
    anonClient = createClient(url, anonKey, { auth: { persistSession: false } })
  }
  return anonClient
}
