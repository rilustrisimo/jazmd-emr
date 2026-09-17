import { PatientsList } from '@/components/patients/PatientsList'

export default function PatientsPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Patients</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage patient charts, vitals, diagnoses, and issued documents.
      </p>

      <div className="mt-6">
        <PatientsList />
      </div>
    </div>
  )
}
