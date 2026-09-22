import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth/session'
import { getDoctorProfileByProfileId } from '@/lib/doctor-profile/get-doctor-profile'
import { getActiveSignature } from '@/lib/signatures/get-signature'
import { SignatureCapture } from '@/components/signature/SignatureCapture'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function SignaturePage() {
  const actor = await requireUser()

  if (actor.role !== 'doctor') {
    redirect('/patients')
  }

  const doctorProfile = await getDoctorProfileByProfileId(actor.id)

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Signature</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Captured once, reused on every prescription and medical certificate you issue.
      </p>

      <Card className="mt-6 max-w-md">
        <CardContent>
          {doctorProfile ? (
            <SignatureCapture activeSignature={await getActiveSignature(doctorProfile.id)} />
          ) : (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                Complete your doctor profile before capturing a signature.
              </p>
              <Button
                size="sm"
                className="rounded-full"
                nativeButton={false}
                render={<Link href="/settings/doctor-profile" />}
              >
                Complete doctor profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
