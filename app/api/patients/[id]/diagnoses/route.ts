import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/db/client'
import { requireUser, AuthError } from '@/lib/auth/session'
import { diagnosisSchema } from '@/lib/validation/diagnoses'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const { id } = await params

    const service = getSupabaseClient('service')
    const { data, error } = await service
      .from('diagnoses')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ diagnoses: data })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/patients/[id]/diagnoses] List error:', error)
    return NextResponse.json({ error: 'Failed to load diagnoses' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const actor = await requireUser()
    const { id } = await params

    const body = await request.json()
    const input = diagnosisSchema.parse(body)

    const service = getSupabaseClient('service')
    const { data, error } = await service
      .from('diagnoses')
      .insert({
        patient_id: id,
        symptoms_diagnosis: input.symptomsDiagnosis,
        treatment: input.treatment,
        remarks: input.remarks,
        recorded_by: actor.id,
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/patients/[id]/diagnoses] Create error:', error)
    return NextResponse.json({ error: 'Failed to record diagnosis' }, { status: 500 })
  }
}
