import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/db/client'
import { requireUser, requireRole, AuthError } from '@/lib/auth/session'
import { doctorProfileSchema } from '@/lib/validation/doctor-profile'

export async function POST(request: Request) {
  try {
    const actor = await requireUser()
    requireRole(actor, ['doctor'])

    const body = await request.json()
    const input = doctorProfileSchema.parse(body)

    const service = getSupabaseClient('service')
    const { data, error } = await service
      .from('doctor_profiles')
      .insert({
        profile_id: actor.id,
        printed_name: input.printedName,
        credentials: input.credentials,
        license_number: input.licenseNumber,
        ptr_number: input.ptrNumber,
        clinic_locations: input.clinicLocations,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A doctor profile already exists for this account' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/doctor-profiles] Create error:', error)
    return NextResponse.json({ error: 'Failed to create doctor profile' }, { status: 500 })
  }
}
