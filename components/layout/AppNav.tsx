'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from 'cn'
import type { Role } from '@/lib/auth/session'

type NavLink = {
  href: string
  label: string
}

export function AppNav({ role }: { role: Role }) {
  const pathname = usePathname()

  const links: NavLink[] = [
    { href: '/patients', label: 'Patients' },
    ...(role === 'doctor'
      ? [
          { href: '/settings/doctor-profile', label: 'Doctor profile' },
          { href: '/settings/signature', label: 'Signature' },
        ]
      : []),
    ...(role === 'admin' ? [{ href: '/admin/users', label: 'Users' }] : []),
  ]

  return (
    <nav className="flex items-center gap-1">
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
