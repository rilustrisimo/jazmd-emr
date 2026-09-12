import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth/session'
import { CreateUserForm } from '@/components/admin/CreateUserForm'

export default async function AdminUsersPage() {
  const profile = await requireUser()

  if (profile.role !== 'admin') {
    redirect('/patients')
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">Create account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Provision a new admin or doctor account.
      </p>
      <div className="mt-6">
        <CreateUserForm />
      </div>
    </div>
  )
}
