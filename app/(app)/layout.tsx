import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Stethoscope } from 'lucide-react'
import { requireUser, AuthError } from '@/lib/auth/session'
import { AppNav } from '@/components/layout/AppNav'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

function initials(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

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

          <div className="ml-auto flex items-center gap-2.5">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-foreground">{profile.fullName}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials(profile.fullName)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
