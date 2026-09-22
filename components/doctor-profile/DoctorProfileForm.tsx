'use client'

import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import {
  doctorProfileSchema,
  type DoctorProfileFormValues,
  type DoctorProfileInput,
} from '@/lib/validation/doctor-profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

const fieldClassName = 'h-11 rounded-xl px-3.5 text-base'

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

export function DoctorProfileForm({
  doctorProfileId,
  defaultValues,
}: {
  doctorProfileId?: string
  defaultValues?: Partial<DoctorProfileFormValues>
}) {
  const router = useRouter()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DoctorProfileFormValues, unknown, DoctorProfileInput>({
    resolver: zodResolver(doctorProfileSchema),
    defaultValues: {
      printedName: '',
      licenseNumber: '',
      clinicLocations: [],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'clinicLocations' })

  async function onSubmit(values: DoctorProfileInput) {
    const response = await fetch(
      doctorProfileId ? `/api/doctor-profiles/${doctorProfileId}` : '/api/doctor-profiles',
      {
        method: doctorProfileId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }
    )

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      toast.error(body?.error ?? 'Failed to save doctor profile')
      return
    }

    toast.success('Doctor profile saved')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Letterhead</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="printedName" label="Printed name" error={errors.printedName?.message}>
            <Input id="printedName" placeholder="Jasmin P. Gorne, M.D." className={fieldClassName} {...register('printedName')} />
          </Field>
          <Field id="credentials" label="Credentials">
            <Input id="credentials" placeholder="General Surgery" className={fieldClassName} {...register('credentials')} />
          </Field>
          <Field id="licenseNumber" label="License number" error={errors.licenseNumber?.message}>
            <Input id="licenseNumber" className={fieldClassName} {...register('licenseNumber')} />
          </Field>
          <Field id="ptrNumber" label="PTR number">
            <Input id="ptrNumber" className={fieldClassName} {...register('ptrNumber')} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Clinic locations</h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => append({ name: '', address: '', contactNumber: '', scheduleText: '' })}
          >
            <Plus className="size-4" />
            Add location
          </Button>
        </div>

        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground">No clinic locations added yet.</p>
        )}

        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <Field
                    id={`clinicLocations.${index}.name`}
                    label="Clinic name"
                    error={errors.clinicLocations?.[index]?.name?.message}
                  >
                    <Input
                      id={`clinicLocations.${index}.name`}
                      className="h-10 rounded-lg"
                      {...register(`clinicLocations.${index}.name`)}
                    />
                  </Field>
                  <Field
                    id={`clinicLocations.${index}.contactNumber`}
                    label="Contact number"
                  >
                    <Input
                      id={`clinicLocations.${index}.contactNumber`}
                      className="h-10 rounded-lg"
                      {...register(`clinicLocations.${index}.contactNumber`)}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field
                      id={`clinicLocations.${index}.address`}
                      label="Address"
                      error={errors.clinicLocations?.[index]?.address?.message}
                    >
                      <Input
                        id={`clinicLocations.${index}.address`}
                        className="h-10 rounded-lg"
                        {...register(`clinicLocations.${index}.address`)}
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field id={`clinicLocations.${index}.scheduleText`} label="Schedule">
                      <Input
                        id={`clinicLocations.${index}.scheduleText`}
                        placeholder="Mon–Fri, 1pm–5pm"
                        className="h-10 rounded-lg"
                        {...register(`clinicLocations.${index}.scheduleText`)}
                      />
                    </Field>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="mt-6 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Remove clinic location"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-full text-base sm:w-auto sm:px-8">
        {isSubmitting ? 'Saving…' : 'Save doctor profile'}
      </Button>
    </form>
  )
}
