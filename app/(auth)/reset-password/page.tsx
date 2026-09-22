'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/db/browser-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // This project's recovery emails use the implicit flow — the link
    // lands here with #access_token=...&refresh_token=...&type=recovery
    // in the URL fragment. @supabase/ssr's browser client hardcodes
    // flowType: 'pkce', which doesn't auto-detect an implicit-flow
    // fragment the way a plain supabase-js client would — confirmed by
    // testing a real recovery link end to end and finding no session ever
    // got established automatically. Parsing the fragment and calling
    // setSession() directly sidesteps that mismatch regardless of which
    // flow type the project is actually configured for.
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
        setHasRecoverySession(!error)
      })
      return
    }

    // Fallback: a PKCE-style link (?code=...), or a session that was
    // already established some other way.
    supabase.auth.getSession().then(({ data }) => {
      setHasRecoverySession(!!data.session)
    })
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setIsSubmitting(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    toast.success('Password updated')
    router.push('/patients')
    router.refresh()
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-secondary/40 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center pt-2 pb-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="size-6" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-foreground">Set a new password</h1>

          {hasRecoverySession === false ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                This reset link is invalid or has expired. Request a new one.
              </p>
              <Link
                href="/forgot-password"
                className="mt-6 text-sm font-medium text-primary hover:underline"
              >
                Request a new link
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 w-full space-y-4 text-left">
              <div className="space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl px-3.5 text-base"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 rounded-xl px-3.5 text-base"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                disabled={isSubmitting || hasRecoverySession === null}
                className="h-11 w-full rounded-full text-base"
              >
                {isSubmitting ? 'Saving…' : 'Update password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
