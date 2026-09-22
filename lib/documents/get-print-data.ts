import { getSupabaseClient } from '@/lib/db/client'
import { computeAge } from '@/lib/patients/age'
import type { ClinicLocation } from '@/lib/validation/doctor-profile'

export type PrintPatient = {
  fullName: string
  age: number | null
  sex: string | null
  address: string | null
}

export type PrintDoctor = {
  printedName: string
  credentials: string | null
  licenseNumber: string
  ptrNumber: string | null
  clinicLocations: ClinicLocation[]
}

async function getSignatureDataUri(storagePath: string): Promise<string | null> {
  const service = getSupabaseClient('service')
  const { data, error } = await service.storage.from('signatures').download(storagePath)
  if (error || !data) return null

  const buffer = Buffer.from(await data.arrayBuffer())
  return `data:image/png;base64,${buffer.toString('base64')}`
}

async function getPatientAndDoctor(patientId: string, doctorProfileId: string) {
  const service = getSupabaseClient('service')

  const [{ data: patientRow }, { data: doctorRow }] = await Promise.all([
    service
      .from('patients')
      .select('first_name, middle_name, last_name, sex, address, birth_date, age_override')
      .eq('id', patientId)
      .single(),
    service
      .from('doctor_profiles')
      .select('printed_name, credentials, license_number, ptr_number, clinic_locations')
      .eq('id', doctorProfileId)
      .single(),
  ])

  const patient: PrintPatient | null = patientRow
    ? {
        fullName: `${patientRow.first_name} ${patientRow.middle_name ? patientRow.middle_name + ' ' : ''}${patientRow.last_name}`,
        age: computeAge(patientRow.birth_date, patientRow.age_override),
        sex: patientRow.sex,
        address: patientRow.address,
      }
    : null

  const doctor: PrintDoctor | null = doctorRow
    ? {
        printedName: doctorRow.printed_name,
        credentials: doctorRow.credentials,
        licenseNumber: doctorRow.license_number,
        ptrNumber: doctorRow.ptr_number,
        clinicLocations: doctorRow.clinic_locations ?? [],
      }
    : null

  return { patient, doctor }
}

export type PrescriptionPrintData = {
  id: string
  status: 'final' | 'voided'
  prescriptionDetails: string
  createdAt: string
  patient: PrintPatient
  doctor: PrintDoctor
  signatureDataUri: string | null
}

export async function getPrescriptionPrintData(id: string): Promise<PrescriptionPrintData | null> {
  const service = getSupabaseClient('service')
  const { data: rx, error } = await service
    .from('prescriptions')
    .select('id, patient_id, doctor_profile_id, signature_id, status, prescription_details, created_at')
    .eq('id', id)
    .single()

  if (error || !rx) return null

  const [{ patient, doctor }, { data: signature }] = await Promise.all([
    getPatientAndDoctor(rx.patient_id, rx.doctor_profile_id),
    service.from('doctor_signatures').select('storage_path').eq('id', rx.signature_id).single(),
  ])

  if (!patient || !doctor) return null

  const signatureDataUri = signature ? await getSignatureDataUri(signature.storage_path) : null

  return {
    id: rx.id,
    status: rx.status,
    prescriptionDetails: rx.prescription_details,
    createdAt: rx.created_at,
    patient,
    doctor,
    signatureDataUri,
  }
}

export type MedcertPrintData = {
  id: string
  status: 'final' | 'voided'
  certificationDescription: string
  diagnosisDetails: string | null
  inclusiveStartDate: string | null
  inclusiveEndDate: string | null
  inclusiveDatesNote: string | null
  fitToWork: boolean | null
  fitToWorkNote: string | null
  remarks: string | null
  createdAt: string
  patient: PrintPatient
  doctor: PrintDoctor
  signatureDataUri: string | null
}

export async function getMedcertPrintData(id: string): Promise<MedcertPrintData | null> {
  const service = getSupabaseClient('service')
  const { data: mc, error } = await service
    .from('medcerts')
    .select(
      'id, patient_id, doctor_profile_id, signature_id, status, certification_description, diagnosis_details, inclusive_start_date, inclusive_end_date, inclusive_dates_note, fit_to_work, fit_to_work_note, remarks, created_at'
    )
    .eq('id', id)
    .single()

  if (error || !mc) return null

  const [{ patient, doctor }, { data: signature }] = await Promise.all([
    getPatientAndDoctor(mc.patient_id, mc.doctor_profile_id),
    service.from('doctor_signatures').select('storage_path').eq('id', mc.signature_id).single(),
  ])

  if (!patient || !doctor) return null

  const signatureDataUri = signature ? await getSignatureDataUri(signature.storage_path) : null

  return {
    id: mc.id,
    status: mc.status,
    certificationDescription: mc.certification_description,
    diagnosisDetails: mc.diagnosis_details,
    inclusiveStartDate: mc.inclusive_start_date,
    inclusiveEndDate: mc.inclusive_end_date,
    inclusiveDatesNote: mc.inclusive_dates_note,
    fitToWork: mc.fit_to_work,
    fitToWorkNote: mc.fit_to_work_note,
    remarks: mc.remarks,
    createdAt: mc.created_at,
    patient,
    doctor,
    signatureDataUri,
  }
}
