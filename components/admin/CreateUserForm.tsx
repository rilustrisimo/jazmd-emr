'use client'

import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createUserSchema, type CreateUserInput } from '@/lib/validation/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function CreateUserForm() {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'doctor', doctorPatientScope: null },
  })

  const role = useWatch({ control, name: 'role' })

  const roleLabels: Record<CreateUserInput['role'], string> = { doctor: 'Doctor', admin: 'Admin' }
  const scopeLabels: Record<'adult' | 'pedia', string> = { adult: 'Adult', pedia: 'Pediatric' }

  async function onSubmit(values: CreateUserInput) {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      toast.error(body?.error ?? 'Failed to provision account')
      return
    }

    toast.success('Account created')
    reset({ fullName: '', email: '', password: '', role: 'doctor', doctorPatientScope: null })
  }

  const fieldClassName = 'h-11 rounded-xl px-3.5 text-base'
  const triggerClassName = 'h-11 w-full rounded-xl px-3.5 text-base'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" className={fieldClassName} {...register('fullName')} />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" className={fieldClassName} {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Temporary password</Label>
        <Input id="password" type="password" className={fieldClassName} {...register('password')} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Role</Label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className={triggerClassName}>
                <SelectValue placeholder="Select a role">
                  {(value: CreateUserInput['role'] | null) => (value ? roleLabels[value] : 'Select a role')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {role === 'doctor' && (
        <div className="space-y-1.5">
          <Label>Patient scope</Label>
          <Controller
            name="doctorPatientScope"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                <SelectTrigger className={triggerClassName}>
                  <SelectValue placeholder="Select a scope">
                    {(value: 'adult' | 'pedia' | null) => (value ? scopeLabels[value] : 'Select a scope')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adult">Adult</SelectItem>
                  <SelectItem value="pedia">Pediatric</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-full text-base">
        {isSubmitting ? 'Creating…' : 'Create account'}
      </Button>
    </form>
  )
}
