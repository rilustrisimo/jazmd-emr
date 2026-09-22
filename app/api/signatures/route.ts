import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/db/client'
import { requireUser, requireRole, AuthError } from '@/lib/auth/session'
import { getActiveSignature } from '@/lib/signatures/get-signature'

const MAX_BYTES = 2 * 1024 * 1024

/** Returns the caller's own active signature, if any. */
export async function GET() {
  try {
    const actor = await requireUser()
    requireRole(actor, ['doctor'])

    const service = getSupabaseClient('service')
    const { data: doctorProfile } = await service
      .from('doctor_profiles')
      .select('id')
      .eq('profile_id', actor.id)
      .maybeSingle()

    if (!doctorProfile) {
      return NextResponse.json({ signature: null })
    }

    const signature = await getActiveSignature(doctorProfile.id)
    return NextResponse.json({ signature })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/signatures] Get error:', error)
    return NextResponse.json({ error: 'Failed to load signature' }, { status: 500 })
  }
}

/**
 * Captures a new signature, replacing whatever was previously active.
 * doctor_signatures has a partial unique index (one active row per
 * doctor_profile_id), so the previous active row must be deactivated
 * before the new one is inserted — these are two statements against a
 * service-role client, not one transaction, but the insert is the last
 * step so a failure between them just leaves the doctor with no active
 * signature rather than two, which the next capture attempt fixes.
 */
export async function POST(request: Request) {
  try {
    const actor = await requireUser()
    requireRole(actor, ['doctor'])

    const formData = await request.formData()
    const file = formData.get('file')
    const widthPx = Number(formData.get('widthPx'))
    const heightPx = Number(formData.get('heightPx'))

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No signature image provided' }, { status: 400 })
    }
    if (file.type !== 'image/png') {
      return NextResponse.json({ error: 'Signature must be a PNG image' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Signature image is too large' }, { status: 400 })
    }
    if (!Number.isFinite(widthPx) || !Number.isFinite(heightPx) || widthPx <= 0 || heightPx <= 0) {
      return NextResponse.json({ error: 'Invalid signature dimensions' }, { status: 400 })
    }

    const service = getSupabaseClient('service')
    const { data: doctorProfile, error: doctorProfileError } = await service
      .from('doctor_profiles')
      .select('id')
      .eq('profile_id', actor.id)
      .maybeSingle()

    if (doctorProfileError || !doctorProfile) {
      return NextResponse.json(
        { error: 'Complete your doctor profile before capturing a signature' },
        { status: 409 }
      )
    }

    await service
      .from('doctor_signatures')
      .update({ is_active: false })
      .eq('doctor_profile_id', doctorProfile.id)
      .eq('is_active', true)

    const signatureId = crypto.randomUUID()
    const storagePath = `${doctorProfile.id}/${signatureId}.png`

    const { error: uploadError } = await service.storage
      .from('signatures')
      .upload(storagePath, await file.arrayBuffer(), { contentType: 'image/png', upsert: true })

    if (uploadError) throw uploadError

    const { data, error } = await service
      .from('doctor_signatures')
      .insert({
        id: signatureId,
        doctor_profile_id: doctorProfile.id,
        storage_path: storagePath,
        width_px: Math.round(widthPx),
        height_px: Math.round(heightPx),
        is_active: true,
        created_by: actor.id,
      })
      .select('id')
      .single()

    if (error) throw error

    await service.from('audit_log').insert({
      actor_id: actor.id,
      action: 'signature.replace',
      entity_type: 'doctor_signatures',
      entity_id: data.id,
    })

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/signatures] Create error:', error)
    return NextResponse.json({ error: 'Failed to save signature' }, { status: 500 })
  }
}
