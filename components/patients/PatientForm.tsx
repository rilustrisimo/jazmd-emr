'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { patientSchema, type PatientFormValues, type PatientInput } from '@/lib/validation/patients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const fieldClassName = 'h-11 rounded-xl px-3.5 text-base'
const triggerClassName = 'h-11 w-full rounded-xl px-3.5 text-base'

const civilStatusLabels: Record<string, string> = {
  single: 'Single',
  married: 'Married',
  widowed: 'Widowed',
  separated: 'Separated',
  other: 'Other',
}

const sexLabels: Record<string, string> = { male: 'Male', female: 'Female' }
const patientTypeLabels: Record<string, string> = { adult: 'Adult', pedia: 'Pediatric' }

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

export function PatientForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: {
  defaultValues?: Partial<PatientFormValues>
  onSubmit: (values: PatientInput) => Promise<void>
  submitLabel: string
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues, unknown, PatientInput>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      patientType: 'adult',
      firstName: '',
      lastName: '',
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Basic information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="firstName" label="First name" error={errors.firstName?.message}>
            <Input id="firstName" className={fieldClassName} {...register('firstName')} />
          </Field>
          <Field id="lastName" label="Last name" error={errors.lastName?.message}>
            <Input id="lastName" className={fieldClassName} {...register('lastName')} />
          </Field>
          <Field id="middleName" label="Middle name">
            <Input id="middleName" className={fieldClassName} {...register('middleName')} />
          </Field>
          <Field id="patientType" label="Patient type">
            <Controller
              name="patientType"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={triggerClassName}>
                    <SelectValue placeholder="Select a type">
                      {(value: string | null) => (value ? patientTypeLabels[value] : 'Select a type')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adult">Adult</SelectItem>
                    <SelectItem value="pedia">Pediatric</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field id="sex" label="Sex">
            <Controller
              name="sex"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                  <SelectTrigger className={triggerClassName}>
                    <SelectValue placeholder="Select">
                      {(value: string | null) => (value ? sexLabels[value] : 'Select')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field id="civilStatus" label="Civil status">
            <Controller
              name="civilStatus"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                  <SelectTrigger className={triggerClassName}>
                    <SelectValue placeholder="Select">
                      {(value: string | null) => (value ? civilStatusLabels[value] : 'Select')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(civilStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field id="birthDate" label="Birth date">
            <Input id="birthDate" type="date" className={fieldClassName} {...register('birthDate')} />
          </Field>
          <Field
            id="ageOverride"
            label="Age (only if birth date is unknown)"
            error={errors.ageOverride?.message}
          >
            <Input id="ageOverride" type="number" min={0} max={150} className={fieldClassName} {...register('ageOverride')} />
          </Field>
          <Field id="birthPlace" label="Birth place">
            <Input id="birthPlace" className={fieldClassName} {...register('birthPlace')} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="contactNumber" label="Contact number">
            <Input id="contactNumber" className={fieldClassName} {...register('contactNumber')} />
          </Field>
          <Field id="occupation" label="Occupation">
            <Input id="occupation" className={fieldClassName} {...register('occupation')} />
          </Field>
          <div className="sm:col-span-2">
            <Field id="address" label="Address">
              <Textarea id="address" rows={2} {...register('address')} />
            </Field>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Background & history</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="smokingHistory" label="Smoking history">
            <Input id="smokingHistory" className={fieldClassName} {...register('smokingHistory')} />
          </Field>
          <Field id="drinkingHistory" label="Drinking history">
            <Input id="drinkingHistory" className={fieldClassName} {...register('drinkingHistory')} />
          </Field>
          <div className="sm:col-span-2">
            <Field id="history" label="Medical history">
              <Textarea id="history" rows={3} {...register('history')} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field id="vaccinations" label="Vaccinations">
              <Textarea id="vaccinations" rows={2} {...register('vaccinations')} />
            </Field>
          </div>
        </div>
      </section>

      <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-full text-base sm:w-auto sm:px-8">
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
