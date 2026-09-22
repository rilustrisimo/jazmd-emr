import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/db/client'
import { requireUser, AuthError } from '@/lib/auth/session'

type RouteParams = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const actor = await requireUser()
    const { id } = await params

    const service = getSupabaseClient('service')
    const { error } = await service.from('diagnoses').delete().eq('id', id)
    if (error) throw error

    await service.from('audit_log').insert({
      actor_id: actor.id,
      action: 'diagnosis.delete',
      entity_type: 'diagnoses',
      entity_id: id,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/diagnoses/[id]] Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete diagnosis' }, { status: 500 })
  }
}
