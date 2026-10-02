import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react'
import { requireUser } from '@/lib/auth/session'
import { getAuditLog } from '@/lib/audit/get-audit-log'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const actor = await requireUser()
  if (actor.role !== 'admin') {
    redirect('/patients')
  }

  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const { entries, total, pageSize } = await getAuditLog(page)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Audit log</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every account-provisioning, deletion, void, and signature-replacement action, with who did it and when.
      </p>

      <Card className="mt-6">
        {entries.length === 0 ? (
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ScrollText className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">No audit activity recorded yet.</p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.actor ? (
                      <>
                        {entry.actor.full_name}{' '}
                        <span className="text-muted-foreground capitalize">({entry.actor.role})</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{entry.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.entity_type ? (
                      <span>
                        {entry.entity_type}
                        {entry.entity_id && (
                          <span className="ml-1 font-mono text-xs">{entry.entity_id.slice(0, 8)}</span>
                        )}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground" title={entry.metadata ? JSON.stringify(entry.metadata) : undefined}>
                    {entry.metadata ? JSON.stringify(entry.metadata) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {total > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {from}–{to} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={page <= 1}
              nativeButton={false}
              render={<Link href={`/admin/audit-log?page=${page - 1}`} />}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={page >= totalPages}
              nativeButton={false}
              render={<Link href={`/admin/audit-log?page=${page + 1}`} />}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
