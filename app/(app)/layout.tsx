import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Stethoscope } from 'lucide-react'
import { requireUser, AuthError } from '@/lib/auth/session'
import { AppNav } from '@/components/layout/AppNav'
import { UserMenu } from '@/components/layout/UserMenu'

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
    <div className="flex min-h-full flex-1 flex-col bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="flex items-center gap-6 px-6 py-3">
          <Link href="/patients" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Stethoscope className="size-4" />
            </span>
            <span className="font-semibold text-foreground">Gorne MD EMR</span>
          </Link>

          <AppNav role={profile.role} />

          <div className="ml-auto">
            <UserMenu fullName={profile.fullName} role={profile.role} />
          </div>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
