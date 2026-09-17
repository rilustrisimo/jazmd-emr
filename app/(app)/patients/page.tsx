import { Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function PatientsPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Patients</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage patient charts, vitals, diagnoses, and issued documents.
      </p>

      <Card className="mt-6">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="size-6" />
          </div>
          <div>
            <p className="font-medium text-foreground">No patient records yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The patient list is coming in Phase 1.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
