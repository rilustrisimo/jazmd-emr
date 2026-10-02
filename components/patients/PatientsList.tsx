'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, UserPlus } from 'lucide-react'
import { computeAge } from '@/lib/patients/age'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Spinner, PageSpinner } from '@/components/ui/spinner'

type PatientRow = {
  id: string
  patient_type: 'adult' | 'pedia'
  first_name: string
  middle_name: string | null
  last_name: string
  sex: 'male' | 'female' | null
  birth_date: string | null
  age_override: number | null
  contact_number: string | null
}

export function PatientsList() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [patients, setPatients] = useState<PatientRow[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  // Navigation via router.push() is wrapped in a React transition by Next's
  // router — React deliberately keeps the current page visible with no
  // Suspense fallback while a transition is pending (it only shows
  // loading.tsx's fallback for a genuinely fresh mount), so a slow
  // navigation here would otherwise show no feedback at all. useTransition
  // gives an explicit isPending flag to drive our own spinner instead of
  // relying on that fallback.
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)

  function goToPatient(id: string) {
    setPendingId(id)
    startTransition(() => {
      router.push(`/patients/${id}`)
    })
  }

  function goToNewPatient() {
    setPendingId('new')
    startTransition(() => {
      router.push('/patients/new')
    })
  }

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      const params = new URLSearchParams()
      if (search.trim()) params.set('q', search.trim())

      try {
        const response = await fetch(`/api/patients?${params.toString()}`, { signal: controller.signal })
        if (!response.ok) return
        const body = await response.json()
        setPatients(body.patients)
        setIsSearching(false)
      } catch {
        // aborted, ignore — the next effect run will resolve isSearching
      }
    }, 250)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [search])

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          {isSearching ? (
            <Spinner className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          ) : (
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setIsSearching(true)
            }}
            placeholder="Search patients…"
            className="h-11 rounded-xl pl-10 text-base"
          />
        </div>
        <Button
          className="ml-auto h-11 rounded-full px-5"
          onClick={goToNewPatient}
          disabled={isPending}
        >
          {isPending && pendingId === 'new' ? <Spinner /> : <UserPlus className="size-4" />}
          New patient
        </Button>
      </div>

      <Card className="mt-4">
        {patients === null ? (
          <PageSpinner />
        ) : patients.length === 0 ? (
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="size-6" />
            </div>
            <div>
              <p className="font-medium text-foreground">No patient records yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search ? 'No patients match your search.' : 'Add your first patient to get started.'}
              </p>
            </div>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Sex</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => {
                const isRowPending = isPending && pendingId === patient.id
                return (
                  <TableRow
                    key={patient.id}
                    className="cursor-pointer aria-disabled:pointer-events-none aria-disabled:opacity-50"
                    aria-disabled={isPending && !isRowPending}
                    onClick={() => goToPatient(patient.id)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {patient.last_name}, {patient.first_name} {patient.middle_name ?? ''}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {patient.patient_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{patient.sex ?? '—'}</TableCell>
                    <TableCell>{computeAge(patient.birth_date, patient.age_override) ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-between gap-2">
                        {patient.contact_number ?? '—'}
                        {isRowPending && <Spinner className="text-primary" />}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
