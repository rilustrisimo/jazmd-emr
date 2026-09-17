import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/db/client'
import { requireUser, requireRole, AuthError } from '@/lib/auth/session'
import { patientSchema } from '@/lib/validation/patients'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const { id } = await params

    const service = getSupabaseClient('service')
    const { data, error } = await service
      .from('patients')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json({ patient: data })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/patients/[id]] Get error:', error)
    return NextResponse.json({ error: 'Failed to load patient' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const actor = await requireUser()
    const { id } = await params

    const body = await request.json()
    const input = patientSchema.parse(body)

    const service = getSupabaseClient('service')
    const { data, error } = await service
      .from('patients')
      .update({
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
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    await service.from('audit_log').insert({
      actor_id: actor.id,
      action: 'patient.update',
      entity_type: 'patients',
      entity_id: id,
    })

    return NextResponse.json({ id: data.id })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/patients/[id]] Update error:', error)
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 })
  }
}

/**
 * Soft-delete only, admin-only — mirrors the DB trigger
 * (enforce_patient_soft_delete_admin_only) so the UI gets a clean 403
 * instead of relying solely on the trigger's exception.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const actor = await requireUser()
    requireRole(actor, ['admin'])
    const { id } = await params

    const service = getSupabaseClient('service')
    const { error } = await service
      .from('patients')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) throw error

    await service.from('audit_log').insert({
      actor_id: actor.id,
      action: 'patient.soft_delete',
      entity_type: 'patients',
      entity_id: id,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/patients/[id]] Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 })
  }
}
