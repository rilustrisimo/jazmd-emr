import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/db/client'

export const runtime = 'nodejs'

/**
 * Supabase pauses a free-tier project after ~7 days with no API activity.
 * Vercel Cron hits this daily (see vercel.json) — a trivial read is enough
 * to count as activity and keep the project from ever pausing.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const service = getSupabaseClient('service')
    const { error } = await service.from('profiles').select('id').limit(1)
    if (error) throw error

    return NextResponse.json({ ok: true, pingedAt: new Date().toISOString() })
  } catch (error) {
    console.error('[API /api/cron/keep-alive] Ping error:', error)
    return NextResponse.json({ error: 'Failed to ping Supabase' }, { status: 500 })
  }
}
