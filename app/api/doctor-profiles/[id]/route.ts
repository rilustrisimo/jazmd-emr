import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/db/client'
import { requireUser, requireRole, AuthError } from '@/lib/auth/session'
import { doctorProfileSchema } from '@/lib/validation/doctor-profile'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const { id } = await params

    const service = getSupabaseClient('service')
    const { data, error } = await service.from('doctor_profiles').select('*').eq('id', id).single()

    if (error || !data) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    return NextResponse.json({ doctorProfile: data })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/doctor-profiles/[id]] Get error:', error)
    return NextResponse.json({ error: 'Failed to load doctor profile' }, { status: 500 })
  }
}

/**
 * Own-profile-only, enforced here rather than relying on the service-role
 * client's bypass of RLS: a doctor may only update the doctor_profile row
 * that belongs to them.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const actor = await requireUser()
    requireRole(actor, ['doctor'])
    const { id } = await params

    const body = await request.json()
    const input = doctorProfileSchema.parse(body)

    const service = getSupabaseClient('service')
    const { data, error } = await service
      .from('doctor_profiles')
      .update({
        printed_name: input.printedName,
        credentials: input.credentials,
        license_number: input.licenseNumber,
        ptr_number: input.ptrNumber,
        clinic_locations: input.clinicLocations,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('profile_id', actor.id)
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    return NextResponse.json({ id: data.id })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/doctor-profiles/[id]] Update error:', error)
    return NextResponse.json({ error: 'Failed to update doctor profile' }, { status: 500 })
  }
}
