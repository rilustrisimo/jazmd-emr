'use client'

import { useState } from 'react'
import Link from 'next/link'
import { KeyRound } from 'lucide-react'
import { createClient } from '@/lib/db/browser-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)

    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    // Always show the same success state, whether or not the email is
    // registered — confirming/denying an account exists here would let
    // someone enumerate clinic staff emails.
    setIsSubmitting(false)
    setIsSent(true)
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-secondary/40 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center pt-2 pb-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="size-6" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-foreground">Reset your password</h1>

          {isSent ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                If an account exists for <span className="font-medium text-foreground">{email}</span>, a reset link
                has been sent. Check your inbox.
              </p>
              <Link href="/login" className="mt-6 text-sm font-medium text-primary hover:underline">
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a link to reset it.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 w-full space-y-4 text-left">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl px-3.5 text-base"
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-full text-base">
                  {isSubmitting ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>

              <Link href="/login" className="mt-4 text-sm text-muted-foreground hover:underline">
                Back to sign in
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
