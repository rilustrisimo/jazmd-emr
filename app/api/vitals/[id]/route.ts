import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/db/client'
import { requireUser, AuthError } from '@/lib/auth/session'

type RouteParams = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const actor = await requireUser()
    const { id } = await params

    const service = getSupabaseClient('service')
    const { error } = await service.from('vital_signs').delete().eq('id', id)
    if (error) throw error

    await service.from('audit_log').insert({
      actor_id: actor.id,
      action: 'vital_signs.delete',
      entity_type: 'vital_signs',
      entity_id: id,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/vitals/[id]] Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete vital signs' }, { status: 500 })
  }
}
