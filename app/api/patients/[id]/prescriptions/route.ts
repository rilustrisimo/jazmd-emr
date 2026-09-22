import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/db/client'
import { requireUser, requireRole, AuthError } from '@/lib/auth/session'
import { prescriptionSchema } from '@/lib/validation/prescriptions'
import { getIssuingContext } from '@/lib/documents/issuing-context'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const { id } = await params

    const service = getSupabaseClient('service')
    const { data, error } = await service
      .from('prescriptions')
      .select('id, status, prescription_details, created_at, voided_at, void_reason')
      .eq('patient_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ prescriptions: data })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/patients/[id]/prescriptions] List error:', error)
    return NextResponse.json({ error: 'Failed to load prescriptions' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const actor = await requireUser()
    requireRole(actor, ['doctor'])
    const { id } = await params

    const body = await request.json()
    const input = prescriptionSchema.parse(body)

    const context = await getIssuingContext(actor.id)
    if (!context) {
      return NextResponse.json(
        { error: 'Complete your doctor profile and capture a signature before issuing documents' },
        { status: 409 }
      )
    }

    const service = getSupabaseClient('service')
    const { data, error } = await service
      .from('prescriptions')
      .insert({
        patient_id: id,
        doctor_profile_id: context.doctorProfileId,
        signature_id: context.signatureId,
        prescription_details: input.prescriptionDetails,
        created_by: actor.id,
      })
      .select('id')
      .single()

    if (error) throw error

    await service.from('audit_log').insert({
      actor_id: actor.id,
      action: 'prescription.issue',
      entity_type: 'prescriptions',
      entity_id: data.id,
    })

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/patients/[id]/prescriptions] Create error:', error)
    return NextResponse.json({ error: 'Failed to issue prescription' }, { status: 500 })
  }
}
