'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { FileText, Plus, Printer, Download, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

type Prescription = {
  id: string
  status: 'final' | 'voided'
  prescription_details: string
  created_at: string
  voided_at: string | null
  void_reason: string | null
}

function VoidButton({ id, onVoided }: { id: string; onVoided: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleVoid() {
    if (!reason.trim()) {
      toast.error('A reason is required to void this prescription')
      return
    }
    setIsSubmitting(true)
    const response = await fetch(`/api/prescriptions/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voidReason: reason }),
    })
    setIsSubmitting(false)

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      toast.error(body?.error ?? 'Failed to void prescription')
      return
    }

    toast.success('Prescription voided')
    setIsOpen(false)
    onVoided()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Void prescription">
            <Ban className="size-4" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Void this prescription?</DialogTitle>
          <DialogDescription>
            It stays on record but is marked voided everywhere it appears. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="voidReason">Reason</Label>
          <Input id="voidReason" value={reason} onChange={(e) => setReason(e.target.value)} className="h-10 rounded-lg" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-full">
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleVoid} disabled={isSubmitting} className="rounded-full">
            {isSubmitting ? 'Voiding…' : 'Void prescription'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function Prescriptions({
  patientId,
  initialPrescriptions,
  canIssue,
}: {
  patientId: string
  initialPrescriptions: Prescription[]
  canIssue: boolean
}) {
  const [prescriptions, setPrescriptions] = useState(initialPrescriptions)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function refresh() {
    const response = await fetch(`/api/patients/${patientId}/prescriptions`)
    if (!response.ok) return
    const body = await response.json()
    setPrescriptions(body.prescriptions)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!details.trim()) {
      toast.error('Prescription details are required')
      return
    }

    setIsSubmitting(true)
    const response = await fetch(`/api/patients/${patientId}/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prescriptionDetails: details }),
    })
    setIsSubmitting(false)

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      toast.error(body?.error ?? 'Failed to issue prescription')
      return
    }

    toast.success('Prescription issued')
    setDetails('')
    setIsFormOpen(false)
    await refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Prescriptions</h3>
        {canIssue && (
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setIsFormOpen((v) => !v)}>
            <Plus className="size-4" />
            New prescription
          </Button>
        )}
      </div>

      {isFormOpen && (
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="prescriptionDetails">Prescription details</Label>
                <Textarea
                  id="prescriptionDetails"
                  rows={5}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>
              <Button type="submit" size="sm" className="rounded-full" disabled={isSubmitting}>
                {isSubmitting ? 'Issuing…' : 'Sign & issue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {prescriptions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
          <FileText className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No prescriptions issued.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {prescriptions.map((rx) => (
            <li key={rx.id} className="rounded-xl border border-border px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{new Date(rx.created_at).toLocaleString()}</p>
                    {rx.status === 'voided' && (
                      <Badge variant="destructive" className="text-[10px]">
                        Voided
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-foreground">{rx.prescription_details}</p>
                  {rx.void_reason && <p className="mt-1 text-xs text-muted-foreground">Reason: {rx.void_reason}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Print"
                    render={<a href={`/patients/${patientId}/prescriptions/${rx.id}/print`} target="_blank" rel="noreferrer" />}
                    nativeButton={false}
                  >
                    <Printer className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Download PDF"
                    render={<a href={`/api/prescriptions/${rx.id}/pdf`} target="_blank" rel="noreferrer" />}
                    nativeButton={false}
                  >
                    <Download className="size-4" />
                  </Button>
                  {canIssue && rx.status === 'final' && (
                    <VoidButton
                      id={rx.id}
                      onVoided={() =>
                        setPrescriptions((prev) =>
                          prev.map((p) => (p.id === rx.id ? { ...p, status: 'voided' } : p))
                        )
                      }
                    />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
