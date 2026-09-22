import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/db/client'
import { requireUser, requireRole, AuthError } from '@/lib/auth/session'
import { medcertSchema } from '@/lib/validation/medcerts'
import { getIssuingContext } from '@/lib/documents/issuing-context'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const { id } = await params

    const service = getSupabaseClient('service')
    const { data, error } = await service
      .from('medcerts')
      .select('id, status, certification_description, created_at, voided_at, void_reason')
      .eq('patient_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ medcerts: data })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/patients/[id]/medcerts] List error:', error)
    return NextResponse.json({ error: 'Failed to load medical certificates' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const actor = await requireUser()
    requireRole(actor, ['doctor'])
    const { id } = await params

    const body = await request.json()
    const input = medcertSchema.parse(body)

    const context = await getIssuingContext(actor.id)
    if (!context) {
      return NextResponse.json(
        { error: 'Complete your doctor profile and capture a signature before issuing documents' },
        { status: 409 }
      )
    }

    const service = getSupabaseClient('service')
    const { data, error } = await service
      .from('medcerts')
      .insert({
        patient_id: id,
        doctor_profile_id: context.doctorProfileId,
        signature_id: context.signatureId,
        certification_description: input.certificationDescription,
        diagnosis_details: input.diagnosisDetails,
        inclusive_start_date: input.inclusiveStartDate,
        inclusive_end_date: input.inclusiveEndDate,
        inclusive_dates_note: input.inclusiveDatesNote,
        fit_to_work: input.fitToWork ?? null,
        fit_to_work_note: input.fitToWorkNote,
        remarks: input.remarks,
        created_by: actor.id,
      })
      .select('id')
      .single()

    if (error) throw error

    await service.from('audit_log').insert({
      actor_id: actor.id,
      action: 'medcert.issue',
      entity_type: 'medcerts',
      entity_id: data.id,
    })

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/patients/[id]/medcerts] Create error:', error)
    return NextResponse.json({ error: 'Failed to issue medical certificate' }, { status: 500 })
  }
}
