'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PatientForm } from '@/components/patients/PatientForm'
import { Card, CardContent } from '@/components/ui/card'
import type { PatientInput } from '@/lib/validation/patients'

export default function NewPatientPage() {
  const router = useRouter()

  async function handleSubmit(values: PatientInput) {
    const response = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      toast.error(body?.error ?? 'Failed to create patient')
      return
    }

    const body = await response.json()
    toast.success('Patient created')
    router.push(`/patients/${body.id}`)
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">New patient</h1>
      <p className="mt-1 text-sm text-muted-foreground">Add a new patient to the chart.</p>

      <Card className="mt-6 max-w-2xl">
        <CardContent>
          <PatientForm onSubmit={handleSubmit} submitLabel="Create patient" />
        </CardContent>
      </Card>
    </div>
  )
}
