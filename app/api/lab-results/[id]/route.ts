import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/db/client'
import { requireUser, requireRole, AuthError } from '@/lib/auth/session'

type RouteParams = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const actor = await requireUser()
    requireRole(actor, ['admin'])
    const { id } = await params

    const service = getSupabaseClient('service')
    const { error } = await service.from('patient_lab_results').delete().eq('id', id)
    if (error) throw error

    await service.from('audit_log').insert({
      actor_id: actor.id,
      action: 'lab_result.delete',
      entity_type: 'patient_lab_results',
      entity_id: id,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/lab-results/[id]] Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete lab result' }, { status: 500 })
  }
}
