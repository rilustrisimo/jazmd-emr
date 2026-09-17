import { redirect } from 'next/navigation'
import { requireUser, AuthError } from '@/lib/auth/session'

export default async function Home() {
  try {
    await requireUser()
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/login')
    }
    throw error
  }

  redirect('/patients')
}
