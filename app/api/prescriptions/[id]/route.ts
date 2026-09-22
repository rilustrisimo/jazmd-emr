import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/db/client'
import { requireUser, AuthError } from '@/lib/auth/session'
import { voidSchema } from '@/lib/validation/prescriptions'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const { id } = await params

    const service = getSupabaseClient('service')
    const { data, error } = await service.from('prescriptions').select('*').eq('id', id).single()

    if (error || !data) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    return NextResponse.json({ prescription: data })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/prescriptions/[id]] Get error:', error)
    return NextResponse.json({ error: 'Failed to load prescription' }, { status: 500 })
  }
}

/**
 * Voids a prescription — the only mutation ever allowed on this table once
 * issued (medico-legal retention: no hard delete, no editing content).
 * Enforced here (own-doctor-or-admin) rather than relying solely on the DB
 * trigger, since service-role writes bypass RLS and the trigger can't see
 * a real session to check against — see
 * supabase/migrations/0002_fix_void_trigger_service_role_writes.sql.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const actor = await requireUser()
    const { id } = await params

    const body = await request.json()
    const input = voidSchema.parse(body)

    const service = getSupabaseClient('service')
    const { data: existing, error: fetchError } = await service
      .from('prescriptions')
      .select('id, status, doctor_profile_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }
    if (existing.status === 'voided') {
      return NextResponse.json({ error: 'This prescription is already voided' }, { status: 409 })
    }

    if (actor.role !== 'admin') {
      const { data: doctorProfile } = await service
        .from('doctor_profiles')
        .select('id')
        .eq('profile_id', actor.id)
        .maybeSingle()

      if (!doctorProfile || doctorProfile.id !== existing.doctor_profile_id) {
        return NextResponse.json({ error: 'Not permitted to void this prescription' }, { status: 403 })
      }
    }

    const { error } = await service
      .from('prescriptions')
      .update({
        status: 'voided',
        voided_at: new Date().toISOString(),
        voided_by: actor.id,
        void_reason: input.voidReason,
      })
      .eq('id', id)

    if (error) throw error

    await service.from('audit_log').insert({
      actor_id: actor.id,
      action: 'prescription.void',
      entity_type: 'prescriptions',
      entity_id: id,
      metadata: { void_reason: input.voidReason },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/prescriptions/[id]] Void error:', error)
    return NextResponse.json({ error: 'Failed to void prescription' }, { status: 500 })
  }
}
