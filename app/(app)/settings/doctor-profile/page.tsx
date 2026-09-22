import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth/session'
import { getDoctorProfileByProfileId } from '@/lib/doctor-profile/get-doctor-profile'
import { DoctorProfileForm } from '@/components/doctor-profile/DoctorProfileForm'
import { Card, CardContent } from '@/components/ui/card'

export default async function DoctorProfilePage() {
  const actor = await requireUser()

  if (actor.role !== 'doctor') {
    redirect('/patients')
  }

  const doctorProfile = await getDoctorProfileByProfileId(actor.id)

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Doctor profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        This information appears on the letterhead of every prescription and medical certificate you issue.
      </p>

      <Card className="mt-6 max-w-2xl">
        <CardContent>
          <DoctorProfileForm
            doctorProfileId={doctorProfile?.id}
            defaultValues={
              doctorProfile
                ? {
                    printedName: doctorProfile.printed_name,
                    credentials: doctorProfile.credentials,
                    licenseNumber: doctorProfile.license_number,
                    ptrNumber: doctorProfile.ptr_number,
                    clinicLocations: doctorProfile.clinic_locations,
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
