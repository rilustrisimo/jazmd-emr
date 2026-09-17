import { notFound } from 'next/navigation'
import { getPatient } from '@/lib/patients/get-patient'
import { patientRecordToFormInput } from '@/lib/patients/types'
import { PatientEditForm } from '@/components/patients/PatientEditForm'
import { Card, CardContent } from '@/components/ui/card'

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const { patientId } = await params
  const patient = await getPatient(patientId)

  if (!patient) notFound()

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">
        Edit {patient.first_name} {patient.last_name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Update patient information.</p>

      <Card className="mt-6 max-w-2xl">
        <CardContent>
          <PatientEditForm patientId={patientId} defaultValues={patientRecordToFormInput(patient)} />
        </CardContent>
      </Card>
    </div>
  )
}
