import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseClient } from '@/lib/db/client'

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export type Role = 'admin' | 'doctor'

export type SessionProfile = {
  id: string
  fullName: string
  role: Role
  doctorPatientScope: 'adult' | 'pedia' | null
  isActive: boolean
}

async function createServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Called from a Server Component render — middleware.ts is what
            // actually refreshes the session cookie on the way in.
          }
        },
      },
    }
  )
}

/**
 * Resolves the caller's Supabase session AND their `profiles` row in one
 * call. Every API route and every server component that touches clinic
 * data should call this first — it is the one place "who is this and are
 * they allowed to be here at all" gets answered.
 *
 * Reads the profile via the service-role client deliberately: role/scope
 * lookup must never be blocked by a misconfigured RLS policy on `profiles`.
 */
export async function requireUser(): Promise<SessionProfile> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    throw new AuthError('Not authenticated', 401)
  }

  const service = getSupabaseClient('service')
  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('id, full_name, role, doctor_patient_scope, is_active')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile || !profile.is_active) {
    throw new AuthError('No active profile for this account', 403)
  }

  return {
    id: profile.id,
    fullName: profile.full_name,
    role: profile.role,
    doctorPatientScope: profile.doctor_patient_scope,
    isActive: profile.is_active,
  }
}

/**
 * Throws a 403 AuthError unless the profile's role is in `roles`. Call this
 * explicitly in every mutating API route BEFORE using the service-role
 * client — RLS is the read-time boundary, but service-role writes bypass
 * RLS entirely, so this check is the actual write-time enforcement.
 */
export function requireRole(profile: SessionProfile, roles: Role[]): void {
  if (!roles.includes(profile.role)) {
    throw new AuthError(`Requires role: ${roles.join(' or ')}`, 403)
  }
}
