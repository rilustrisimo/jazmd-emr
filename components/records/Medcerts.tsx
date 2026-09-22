'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ClipboardCheck, Plus, Printer, Download, Ban } from 'lucide-react'
import { medcertSchema, type MedcertFormValues, type MedcertInput } from '@/lib/validation/medcerts'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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

type Medcert = {
  id: string
  status: 'final' | 'voided'
  certification_description: string
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
      toast.error('A reason is required to void this medical certificate')
      return
    }
    setIsSubmitting(true)
    const response = await fetch(`/api/medcerts/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voidReason: reason }),
    })
    setIsSubmitting(false)

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      toast.error(body?.error ?? 'Failed to void medical certificate')
      return
    }

    toast.success('Medical certificate voided')
    setIsOpen(false)
    onVoided()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Void medical certificate">
            <Ban className="size-4" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Void this medical certificate?</DialogTitle>
          <DialogDescription>
            It stays on record but is marked voided everywhere it appears. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="voidReasonMc">Reason</Label>
          <Input id="voidReasonMc" value={reason} onChange={(e) => setReason(e.target.value)} className="h-10 rounded-lg" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-full">
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleVoid} disabled={isSubmitting} className="rounded-full">
            {isSubmitting ? 'Voiding…' : 'Void certificate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function Medcerts({
  patientId,
  initialMedcerts,
  canIssue,
}: {
  patientId: string
  initialMedcerts: Medcert[]
  canIssue: boolean
}) {
  const [medcerts, setMedcerts] = useState(initialMedcerts)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<MedcertFormValues, unknown, MedcertInput>({
    resolver: zodResolver(medcertSchema),
    defaultValues: { certificationDescription: '', fitToWork: undefined },
  })

  async function refresh() {
    const response = await fetch(`/api/patients/${patientId}/medcerts`)
    if (!response.ok) return
    const body = await response.json()
    setMedcerts(body.medcerts)
  }

  async function onSubmit(values: MedcertInput) {
    const response = await fetch(`/api/patients/${patientId}/medcerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      toast.error(body?.error ?? 'Failed to issue medical certificate')
      return
    }

    toast.success('Medical certificate issued')
    reset({ certificationDescription: '', fitToWork: undefined })
    setIsFormOpen(false)
    await refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Medical certificates</h3>
        {canIssue && (
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setIsFormOpen((v) => !v)}>
            <Plus className="size-4" />
            New certificate
          </Button>
        )}
      </div>

      {isFormOpen && (
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="certificationDescription">Certification</Label>
                <Textarea id="certificationDescription" rows={3} {...register('certificationDescription')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="diagnosisDetails">Diagnosis</Label>
                <Input id="diagnosisDetails" className="h-10 rounded-lg" {...register('diagnosisDetails')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="inclusiveStartDate">Inclusive start</Label>
                  <Input id="inclusiveStartDate" type="date" className="h-10 rounded-lg" {...register('inclusiveStartDate')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inclusiveEndDate">Inclusive end</Label>
                  <Input id="inclusiveEndDate" type="date" className="h-10 rounded-lg" {...register('inclusiveEndDate')} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inclusiveDatesNote">Inclusive dates note</Label>
                <Input id="inclusiveDatesNote" className="h-10 rounded-lg" {...register('inclusiveDatesNote')} />
              </div>
              <Controller
                name="fitToWork"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} />
                    Fit to work
                  </label>
                )}
              />
              <div className="space-y-1.5">
                <Label htmlFor="fitToWorkNote">Fit to work note</Label>
                <Input id="fitToWorkNote" className="h-10 rounded-lg" {...register('fitToWorkNote')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mcRemarks">Remarks</Label>
                <Textarea id="mcRemarks" rows={2} {...register('remarks')} />
              </div>
              <Button type="submit" size="sm" className="rounded-full" disabled={isSubmitting}>
                {isSubmitting ? 'Issuing…' : 'Sign & issue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {medcerts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
          <ClipboardCheck className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No medical certificates issued.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {medcerts.map((mc) => (
            <li key={mc.id} className="rounded-xl border border-border px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{new Date(mc.created_at).toLocaleString()}</p>
                    {mc.status === 'voided' && (
                      <Badge variant="destructive" className="text-[10px]">
                        Voided
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-foreground">{mc.certification_description}</p>
                  {mc.void_reason && <p className="mt-1 text-xs text-muted-foreground">Reason: {mc.void_reason}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Print"
                    render={<a href={`/patients/${patientId}/medcerts/${mc.id}/print`} target="_blank" rel="noreferrer" />}
                    nativeButton={false}
                  >
                    <Printer className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Download PDF"
                    render={<a href={`/api/medcerts/${mc.id}/pdf`} target="_blank" rel="noreferrer" />}
                    nativeButton={false}
                  >
                    <Download className="size-4" />
                  </Button>
                  {canIssue && mc.status === 'final' && (
                    <VoidButton
                      id={mc.id}
                      onVoided={() =>
                        setMedcerts((prev) => prev.map((m) => (m.id === mc.id ? { ...m, status: 'voided' } : m)))
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
