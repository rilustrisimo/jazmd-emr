import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/db/client'
import { requireUser, requireRole, AuthError } from '@/lib/auth/session'
import { createUserSchema } from '@/lib/validation/admin'

/**
 * The only way an account is ever created in this system — there is no
 * public sign-up. Mirrors the old app's "gated behind a login wall" intent,
 * implemented as an explicit, auditable provisioning step instead.
 */
export async function POST(request: Request) {
  try {
    const actor = await requireUser()
    requireRole(actor, ['admin'])

    const body = await request.json()
    const input = createUserSchema.parse(body)

    const service = getSupabaseClient('service')

    const { data: created, error: createError } = await service.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    })

    if (createError || !created.user) {
      throw createError ?? new Error('User creation failed')
    }

    const { error: profileError } = await service.from('profiles').insert({
      id: created.user.id,
      full_name: input.fullName,
      role: input.role,
      doctor_patient_scope: input.role === 'doctor' ? input.doctorPatientScope ?? null : null,
    })

    if (profileError) {
      // Roll back the auth user so we don't end up with an account that has
      // no profile row and can never resolve a role.
      await service.auth.admin.deleteUser(created.user.id)
      throw profileError
    }

    await service.from('audit_log').insert({
      actor_id: actor.id,
      action: 'user.provision',
      entity_type: 'profiles',
      entity_id: created.user.id,
      metadata: { role: input.role },
    })

    return NextResponse.json({ id: created.user.id }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[API /api/admin/users] Create error:', error)
    return NextResponse.json({ error: 'Failed to provision account' }, { status: 500 })
  }
}
