import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/db/client'
import { requireUser, AuthError } from '@/lib/auth/session'
import { vitalSignsSchema } from '@/lib/validation/vitals'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireUser()
    const { id } = await params

    const service = getSupabaseClient('service')
    const { data, error } = await service
      .from('vital_signs')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ vitals: data })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/patients/[id]/vitals] List error:', error)
    return NextResponse.json({ error: 'Failed to load vital signs' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const actor = await requireUser()
    const { id } = await params

    const body = await request.json()
    const input = vitalSignsSchema.parse(body)

    const service = getSupabaseClient('service')
    const { data, error } = await service
      .from('vital_signs')
      .insert({
        patient_id: id,
        temperature_celsius: input.temperatureCelsius,
        systolic_mmhg: input.systolicMmhg,
        diastolic_mmhg: input.diastolicMmhg,
        pulse_rate_bpm: input.pulseRateBpm,
        respiratory_rate_bpm: input.respiratoryRateBpm,
        weight_kg: input.weightKg,
        height_cm: input.heightCm,
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
    console.error('[API /api/patients/[id]/vitals] Create error:', error)
    return NextResponse.json({ error: 'Failed to record vital signs' }, { status: 500 })
  }
}
