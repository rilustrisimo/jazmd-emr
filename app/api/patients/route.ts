import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/db/client'
import { requireUser, AuthError } from '@/lib/auth/session'
import { patientSchema } from '@/lib/validation/patients'

/**
 * List defaults to the logged-in doctor's own patient_type scope (per the
 * old app's doctor-email whitelist, now an explicit default instead of a
 * hardcoded split) — pass ?type=all to see everyone, or ?type=adult|pedia
 * to pick explicitly. Admin has no scope, so it sees everyone by default.
 */
export async function GET(request: Request) {
  try {
    const actor = await requireUser()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const typeParam = searchParams.get('type')

    const service = getSupabaseClient('service')
    let query = service
      .from('patients')
      .select('id, patient_type, first_name, middle_name, last_name, sex, birth_date, age_override, contact_number')
      .is('deleted_at', null)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })

    const effectiveType =
      typeParam === 'adult' || typeParam === 'pedia'
        ? typeParam
        : typeParam === 'all'
          ? null
          : actor.role === 'doctor'
            ? actor.doctorPatientScope
            : null

    if (effectiveType) {
      query = query.eq('patient_type', effectiveType)
    }

    if (q) {
      const term = q.replace(/[%,]/g, '')
      query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,middle_name.ilike.%${term}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ patients: data })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/patients] List error:', error)
    return NextResponse.json({ error: 'Failed to load patients' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireUser()

    const body = await request.json()
    const input = patientSchema.parse(body)

    const service = getSupabaseClient('service')
    const { data, error } = await service
      .from('patients')
      .insert({
        patient_type: input.patientType,
        first_name: input.firstName,
        middle_name: input.middleName,
        last_name: input.lastName,
        civil_status: input.civilStatus,
        address: input.address,
        birth_place: input.birthPlace,
        birth_date: input.birthDate,
        age_override: input.ageOverride,
        sex: input.sex,
        contact_number: input.contactNumber,
        occupation: input.occupation,
        smoking_history: input.smokingHistory,
        drinking_history: input.drinkingHistory,
        history: input.history,
        vaccinations: input.vaccinations,
        assigned_doctor_id: actor.role === 'doctor' ? actor.id : null,
        created_by: actor.id,
      })
      .select('id')
      .single()

    if (error) throw error

    await service.from('audit_log').insert({
      actor_id: actor.id,
      action: 'patient.create',
      entity_type: 'patients',
      entity_id: data.id,
      metadata: { patient_type: input.patientType },
    })

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/patients] Create error:', error)
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 })
  }
}
