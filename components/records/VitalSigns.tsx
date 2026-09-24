'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Activity, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import type { VitalSignsRecord } from '@/lib/patients/get-vitals'

const emptyForm = {
  temperatureCelsius: '',
  systolicMmhg: '',
  diastolicMmhg: '',
  pulseRateBpm: '',
  respiratoryRateBpm: '',
  weightKg: '',
  heightCm: '',
}

export function VitalSigns({ patientId, initialVitals }: { patientId: string; initialVitals: VitalSignsRecord[] }) {
  const [vitals, setVitals] = useState(initialVitals)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function refresh() {
    const response = await fetch(`/api/patients/${patientId}/vitals`)
    if (!response.ok) return
    const body = await response.json()
    setVitals(body.vitals)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)

    const response = await fetch(`/api/patients/${patientId}/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setIsSubmitting(false)

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      toast.error(body?.error ?? 'Failed to record vital signs')
      return
    }

    toast.success('Vital signs recorded')
    setForm(emptyForm)
    setIsFormOpen(false)
    await refresh()
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/vitals/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      toast.error('Failed to delete vital signs')
      return
    }
    setVitals((prev) => prev.filter((v) => v.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Vital signs</h3>
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => setIsFormOpen((v) => !v)}>
          <Plus className="size-4" />
          Record vitals
        </Button>
      </div>

      {isFormOpen && (
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor="temperatureCelsius">Temp (°C)</Label>
                  <Input
                    id="temperatureCelsius"
                    type="number"
                    step="0.1"
                    className="h-10 rounded-lg"
                    value={form.temperatureCelsius}
                    onChange={(e) => setForm((f) => ({ ...f, temperatureCelsius: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="systolicMmhg">Systolic</Label>
                  <Input
                    id="systolicMmhg"
                    type="number"
                    className="h-10 rounded-lg"
                    value={form.systolicMmhg}
                    onChange={(e) => setForm((f) => ({ ...f, systolicMmhg: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="diastolicMmhg">Diastolic</Label>
                  <Input
                    id="diastolicMmhg"
                    type="number"
                    className="h-10 rounded-lg"
                    value={form.diastolicMmhg}
                    onChange={(e) => setForm((f) => ({ ...f, diastolicMmhg: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pulseRateBpm">Pulse (bpm)</Label>
                  <Input
                    id="pulseRateBpm"
                    type="number"
                    className="h-10 rounded-lg"
                    value={form.pulseRateBpm}
                    onChange={(e) => setForm((f) => ({ ...f, pulseRateBpm: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="respiratoryRateBpm">Resp. rate</Label>
                  <Input
                    id="respiratoryRateBpm"
                    type="number"
                    className="h-10 rounded-lg"
                    value={form.respiratoryRateBpm}
                    onChange={(e) => setForm((f) => ({ ...f, respiratoryRateBpm: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="weightKg">Weight (kg)</Label>
                  <Input
                    id="weightKg"
                    type="number"
                    step="0.1"
                    className="h-10 rounded-lg"
                    value={form.weightKg}
                    onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="heightCm">Height (cm)</Label>
                  <Input
                    id="heightCm"
                    type="number"
                    step="0.1"
                    className="h-10 rounded-lg"
                    value={form.heightCm}
                    onChange={(e) => setForm((f) => ({ ...f, heightCm: e.target.value }))}
                  />
                </div>
              </div>
              <Button type="submit" size="sm" className="rounded-full" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save vitals'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {vitals.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
          <Activity className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No vital signs recorded.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {vitals.map((v) => (
            <li key={v.id} className="rounded-xl border border-border px-4 py-3">
              <div className="flex items-start justify-between">
                <p className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</p>
                <button
                  type="button"
                  onClick={() => handleDelete(v.id)}
                  className="cursor-pointer text-muted-foreground hover:text-destructive"
                  aria-label="Delete vital signs"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                {v.temperature_celsius != null && (
                  <span className="text-foreground">{v.temperature_celsius}°C</span>
                )}
                {(v.systolic_mmhg != null || v.diastolic_mmhg != null) && (
                  <span className="text-foreground">
                    {v.systolic_mmhg ?? '—'}/{v.diastolic_mmhg ?? '—'} mmHg
                  </span>
                )}
                {v.pulse_rate_bpm != null && <span className="text-foreground">{v.pulse_rate_bpm} bpm</span>}
                {v.respiratory_rate_bpm != null && (
                  <span className="text-foreground">{v.respiratory_rate_bpm} rr</span>
                )}
                {v.weight_kg != null && <span className="text-foreground">{v.weight_kg} kg</span>}
                {v.height_cm != null && <span className="text-foreground">{v.height_cm} cm</span>}
                {v.bmi != null && <span className="text-foreground">BMI {v.bmi}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
