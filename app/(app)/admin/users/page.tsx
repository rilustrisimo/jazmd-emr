import { redirect } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { requireUser } from '@/lib/auth/session'
import { CreateUserForm } from '@/components/admin/CreateUserForm'
import { Card, CardContent } from '@/components/ui/card'

export default async function AdminUsersPage() {
  const profile = await requireUser()

  if (profile.role !== 'admin') {
    redirect('/patients')
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Create account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Provision a new admin or doctor account.
      </p>

      <Card className="mt-6 max-w-md">
        <CardContent className="pt-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserPlus className="size-5" />
          </div>
          <div className="mt-6">
            <CreateUserForm />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
