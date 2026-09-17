'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PatientForm } from '@/components/patients/PatientForm'
import type { PatientFormValues, PatientInput } from '@/lib/validation/patients'

export function PatientEditForm({
  patientId,
  defaultValues,
}: {
  patientId: string
  defaultValues: PatientFormValues
}) {
  const router = useRouter()

  async function handleSubmit(values: PatientInput) {
    const response = await fetch(`/api/patients/${patientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      toast.error(body?.error ?? 'Failed to update patient')
      return
    }

    toast.success('Patient updated')
    router.push(`/patients/${patientId}`)
  }

  return <PatientForm defaultValues={defaultValues} onSubmit={handleSubmit} submitLabel="Save changes" />
}
