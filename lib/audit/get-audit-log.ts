import { getSupabaseClient } from '@/lib/db/client'

export type AuditLogEntry = {
  id: number
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  actor: { id: string; full_name: string; role: string } | null
}

const PAGE_SIZE = 25

export async function getAuditLog(page: number): Promise<{ entries: AuditLogEntry[]; total: number; pageSize: number }> {
  const service = getSupabaseClient('service')
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await service
    .from('audit_log')
    .select('id, action, entity_type, entity_id, metadata, created_at, actor:profiles(id, full_name, role)', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error || !data) return { entries: [], total: 0, pageSize: PAGE_SIZE }

  return {
    entries: data as unknown as AuditLogEntry[],
    total: count ?? 0,
    pageSize: PAGE_SIZE,
  }
}
