import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/db/client'
import { requireUser, AuthError } from '@/lib/auth/session'
import { getSignedUrl } from '@/lib/storage/signed-url'

type RouteParams = { params: Promise<{ id: string }> }

const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const { id } = await params

    const service = getSupabaseClient('service')
    const { data, error } = await service
      .from('patient_lab_results')
      .select('id, laboratory_name, result_image_storage_path, remarks, created_at')
      .eq('patient_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const results = await Promise.all(
      (data ?? []).map(async (row) => ({
        ...row,
        signed_url: row.result_image_storage_path
          ? await getSignedUrl('lab-results', row.result_image_storage_path)
          : null,
      }))
    )

    return NextResponse.json({ labResults: results })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/patients/[id]/lab-results] List error:', error)
    return NextResponse.json({ error: 'Failed to load lab results' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const actor = await requireUser()
    const { id } = await params

    const formData = await request.formData()
    const laboratoryName = String(formData.get('laboratoryName') ?? '').trim()
    const remarks = String(formData.get('remarks') ?? '').trim() || null
    const file = formData.get('file')

    if (!laboratoryName) {
      return NextResponse.json({ error: 'Laboratory name is required' }, { status: 400 })
    }

    let storagePath: string | null = null
    if (file instanceof File && file.size > 0) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or PDF files are allowed' }, { status: 400 })
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: 'File must be 8MB or smaller' }, { status: 400 })
      }

      const service = getSupabaseClient('service')
      const extension = file.name.split('.').pop() || 'bin'
      storagePath = `${id}/${Date.now()}.${extension}`

      const { error: uploadError } = await service.storage
        .from('lab-results')
        .upload(storagePath, await file.arrayBuffer(), { contentType: file.type, upsert: true })

      if (uploadError) throw uploadError
    }

    const service = getSupabaseClient('service')
    const { data, error } = await service
      .from('patient_lab_results')
      .insert({
        patient_id: id,
        laboratory_name: laboratoryName,
        result_image_storage_path: storagePath,
        remarks,
        created_by: actor.id,
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/patients/[id]/lab-results] Create error:', error)
    return NextResponse.json({ error: 'Failed to add lab result' }, { status: 500 })
  }
}
