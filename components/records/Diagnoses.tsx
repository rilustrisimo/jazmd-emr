'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import type { DiagnosisRecord } from '@/lib/patients/get-diagnoses'

export function Diagnoses({ patientId, initialDiagnoses }: { patientId: string; initialDiagnoses: DiagnosisRecord[] }) {
  const [diagnoses, setDiagnoses] = useState(initialDiagnoses)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [symptomsDiagnosis, setSymptomsDiagnosis] = useState('')
  const [treatment, setTreatment] = useState('')
  const [remarks, setRemarks] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function refresh() {
    const response = await fetch(`/api/patients/${patientId}/diagnoses`)
    if (!response.ok) return
    const body = await response.json()
    setDiagnoses(body.diagnoses)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!symptomsDiagnosis.trim()) {
      toast.error('Symptoms / diagnosis is required')
      return
    }

    setIsSubmitting(true)
    const response = await fetch(`/api/patients/${patientId}/diagnoses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptomsDiagnosis, treatment, remarks }),
    })
    setIsSubmitting(false)

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      toast.error(body?.error ?? 'Failed to record diagnosis')
      return
    }

    toast.success('Diagnosis recorded')
    setSymptomsDiagnosis('')
    setTreatment('')
    setRemarks('')
    setIsFormOpen(false)
    await refresh()
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/diagnoses/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      toast.error('Failed to delete diagnosis')
      return
    }
    setDiagnoses((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Diagnosis</h3>
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => setIsFormOpen((v) => !v)}>
          <Plus className="size-4" />
          Add diagnosis
        </Button>
      </div>

      {isFormOpen && (
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="symptomsDiagnosis">Symptoms / diagnosis</Label>
                <Textarea
                  id="symptomsDiagnosis"
                  rows={2}
                  value={symptomsDiagnosis}
                  onChange={(e) => setSymptomsDiagnosis(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="treatment">Treatment</Label>
                <Textarea id="treatment" rows={2} value={treatment} onChange={(e) => setTreatment(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea id="remarks" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </div>
              <Button type="submit" size="sm" className="rounded-full" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save diagnosis'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {diagnoses.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
          <ClipboardList className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No diagnoses recorded.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {diagnoses.map((d) => (
            <li key={d.id} className="rounded-xl border border-border px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{d.symptoms_diagnosis}</p>
                  {d.treatment && <p className="mt-1 text-sm text-muted-foreground">Treatment: {d.treatment}</p>}
                  {d.remarks && <p className="mt-1 text-sm text-muted-foreground">{d.remarks}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(d.id)}
                  className="shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
                  aria-label="Delete diagnosis"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
