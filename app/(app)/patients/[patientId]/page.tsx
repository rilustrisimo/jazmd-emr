import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Pencil, Stethoscope } from 'lucide-react'
import { requireUser } from '@/lib/auth/session'
import { getPatient } from '@/lib/patients/get-patient'
import { getLabResults } from '@/lib/patients/get-lab-results'
import { computeAge } from '@/lib/patients/age'
import { getSignedUrl } from '@/lib/storage/signed-url'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PatientPhotoUpload } from '@/components/patients/PatientPhotoUpload'
import { LabResults } from '@/components/patients/LabResults'
import { PatientDeleteButton } from '@/components/patients/PatientDeleteButton'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value ?? '—'}</dd>
    </div>
  )
}

function ComingSoon({ phase }: { phase: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Stethoscope className="size-6" />
      </div>
      <p className="text-sm text-muted-foreground">Coming in {phase}.</p>
    </div>
  )
}

export default async function PatientChartPage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const actor = await requireUser()
  const { patientId } = await params
  const patient = await getPatient(patientId)

  if (!patient) notFound()

  const [labResults, photoUrl] = await Promise.all([
    getLabResults(patientId),
    patient.photo_storage_path ? getSignedUrl('patient-photos', patient.photo_storage_path) : null,
  ])

  const fullName = `${patient.first_name} ${patient.middle_name ? patient.middle_name + ' ' : ''}${patient.last_name}`
  const age = computeAge(patient.birth_date, patient.age_override)

  return (
    <div>
      <div className="flex flex-wrap items-start gap-6">
        <PatientPhotoUpload patientId={patientId} signedUrl={photoUrl} />

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{fullName}</h1>
            <Badge variant="secondary" className="capitalize">
              {patient.patient_type}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {patient.sex ? <span className="capitalize">{patient.sex}</span> : null}
            {age != null ? ` · ${age} years old` : ''}
            {patient.contact_number ? ` · ${patient.contact_number}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            nativeButton={false}
            render={<Link href={`/patients/${patientId}/edit`} />}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
          {actor.role === 'admin' && <PatientDeleteButton patientId={patientId} patientName={fullName} />}
        </div>
      </div>

      <Tabs defaultValue="info" className="mt-6">
        <TabsList variant="line">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="lab-results">Lab results</TabsTrigger>
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
          <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="medcerts">Med certs</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <Card>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-3">
                <InfoRow label="Civil status" value={patient.civil_status && <span className="capitalize">{patient.civil_status}</span>} />
                <InfoRow label="Birth date" value={patient.birth_date} />
                <InfoRow label="Birth place" value={patient.birth_place} />
                <InfoRow label="Occupation" value={patient.occupation} />
                <InfoRow label="Address" value={patient.address} />
                <InfoRow label="Smoking history" value={patient.smoking_history} />
                <InfoRow label="Drinking history" value={patient.drinking_history} />
                <InfoRow label="Medical history" value={patient.history} />
                <InfoRow label="Vaccinations" value={patient.vaccinations} />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lab-results" className="mt-4">
          <Card>
            <CardContent>
              <LabResults patientId={patientId} initialResults={labResults} canDelete={actor.role === 'admin'} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals" className="mt-4">
          <Card>
            <ComingSoon phase="Phase 2" />
          </Card>
        </TabsContent>
        <TabsContent value="diagnosis" className="mt-4">
          <Card>
            <ComingSoon phase="Phase 2" />
          </Card>
        </TabsContent>
        <TabsContent value="prescriptions" className="mt-4">
          <Card>
            <ComingSoon phase="Phase 3" />
          </Card>
        </TabsContent>
        <TabsContent value="medcerts" className="mt-4">
          <Card>
            <ComingSoon phase="Phase 3" />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
