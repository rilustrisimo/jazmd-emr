'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { FlaskConical, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

type LabResult = {
  id: string
  laboratory_name: string
  result_image_storage_path: string | null
  remarks: string | null
  created_at: string
  signed_url: string | null
}

export function LabResults({
  patientId,
  initialResults,
  canDelete,
}: {
  patientId: string
  initialResults: LabResult[]
  canDelete: boolean
}) {
  const [results, setResults] = useState(initialResults)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [laboratoryName, setLaboratoryName] = useState('')
  const [remarks, setRemarks] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function refresh() {
    const response = await fetch(`/api/patients/${patientId}/lab-results`)
    if (!response.ok) return
    const body = await response.json()
    setResults(body.labResults)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!laboratoryName.trim()) {
      toast.error('Laboratory name is required')
      return
    }

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append('laboratoryName', laboratoryName)
    formData.append('remarks', remarks)
    if (file) formData.append('file', file)

    const response = await fetch(`/api/patients/${patientId}/lab-results`, { method: 'POST', body: formData })
    setIsSubmitting(false)

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      toast.error(body?.error ?? 'Failed to add lab result')
      return
    }

    toast.success('Lab result added')
    setLaboratoryName('')
    setRemarks('')
    setFile(null)
    setIsFormOpen(false)
    await refresh()
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/lab-results/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      toast.error('Failed to delete lab result')
      return
    }
    setResults((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Lab results</h3>
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => setIsFormOpen((v) => !v)}>
          <Plus className="size-4" />
          Add result
        </Button>
      </div>

      {isFormOpen && (
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="laboratoryName">Laboratory name</Label>
                <Input
                  id="laboratoryName"
                  className="h-10 rounded-lg"
                  value={laboratoryName}
                  onChange={(e) => setLaboratoryName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="remarks">Remarks</Label>
                <Input id="remarks" className="h-10 rounded-lg" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="file">Result file (image or PDF)</Label>
                <input
                  id="file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
                />
              </div>
              <Button type="submit" size="sm" className="rounded-full" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save result'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
          <FlaskConical className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No lab results recorded.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {results.map((result) => (
            <li key={result.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{result.laboratory_name}</p>
                {result.remarks && <p className="text-sm text-muted-foreground">{result.remarks}</p>}
                <p className="text-xs text-muted-foreground">
                  {new Date(result.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {result.signed_url && (
                  <a
                    href={result.signed_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View
                  </a>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(result.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete lab result"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
