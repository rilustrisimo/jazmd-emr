import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireUser, AuthError } from '@/lib/auth/session'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let profile
  try {
    profile = await requireUser()
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/login')
    }
    throw error
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b">
        <nav className="flex items-center gap-6 px-6 py-4">
          <span className="font-semibold">Gorne MD EMR</span>
          <Link href="/patients" className="text-sm">
            Patients
          </Link>
          {profile.role === 'doctor' && (
            <Link href="/settings/signature" className="text-sm">
              Signature
            </Link>
          )}
          {profile.role === 'admin' && (
            <Link href="/admin/users" className="text-sm">
              Users
            </Link>
          )}
          <span className="ml-auto text-sm text-muted-foreground">
            {profile.fullName} · {profile.role}
          </span>
        </nav>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
