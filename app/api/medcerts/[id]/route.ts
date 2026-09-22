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
    const { data, error } = await service.from('medcerts').select('*').eq('id', id).single()

    if (error || !data) {
      return NextResponse.json({ error: 'Medical certificate not found' }, { status: 404 })
    }

    return NextResponse.json({ medcert: data })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/medcerts/[id]] Get error:', error)
    return NextResponse.json({ error: 'Failed to load medical certificate' }, { status: 500 })
  }
}

/** Voids a medical certificate — see app/api/prescriptions/[id]/route.ts for why this enforces ownership itself. */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const actor = await requireUser()
    const { id } = await params

    const body = await request.json()
    const input = voidSchema.parse(body)

    const service = getSupabaseClient('service')
    const { data: existing, error: fetchError } = await service
      .from('medcerts')
      .select('id, status, doctor_profile_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Medical certificate not found' }, { status: 404 })
    }
    if (existing.status === 'voided') {
      return NextResponse.json({ error: 'This medical certificate is already voided' }, { status: 409 })
    }

    if (actor.role !== 'admin') {
      const { data: doctorProfile } = await service
        .from('doctor_profiles')
        .select('id')
        .eq('profile_id', actor.id)
        .maybeSingle()

      if (!doctorProfile || doctorProfile.id !== existing.doctor_profile_id) {
        return NextResponse.json({ error: 'Not permitted to void this medical certificate' }, { status: 403 })
      }
    }

    const { error } = await service
      .from('medcerts')
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
      action: 'medcert.void',
      entity_type: 'medcerts',
      entity_id: id,
      metadata: { void_reason: input.voidReason },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/medcerts/[id]] Void error:', error)
    return NextResponse.json({ error: 'Failed to void medical certificate' }, { status: 500 })
  }
}
