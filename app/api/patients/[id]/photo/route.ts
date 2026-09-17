import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/db/client'
import { requireUser, AuthError } from '@/lib/auth/session'

type RouteParams = { params: Promise<{ id: string }> }

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const actor = await requireUser()
    const { id } = await params

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, or WebP images are allowed' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image must be 5MB or smaller' }, { status: 400 })
    }

    const service = getSupabaseClient('service')
    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${id}/${Date.now()}.${extension}`

    const { error: uploadError } = await service.storage
      .from('patient-photos')
      .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: true })

    if (uploadError) throw uploadError

    const { data, error } = await service
      .from('patients')
      .update({ photo_storage_path: path })
      .eq('id', id)
      .is('deleted_at', null)
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    await service.from('audit_log').insert({
      actor_id: actor.id,
      action: 'patient.photo_upload',
      entity_type: 'patients',
      entity_id: id,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/patients/[id]/photo] Upload error:', error)
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 })
  }
}
