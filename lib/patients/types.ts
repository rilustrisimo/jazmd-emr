import type { PatientFormValues } from '@/lib/validation/patients'

export type PatientRecord = {
  id: string
  patient_type: 'adult' | 'pedia'
  first_name: string
  middle_name: string | null
  last_name: string
  civil_status: string | null
  address: string | null
  birth_place: string | null
  birth_date: string | null
  age_override: number | null
  sex: 'male' | 'female' | null
  contact_number: string | null
  occupation: string | null
  smoking_history: string | null
  drinking_history: string | null
  history: string | null
  vaccinations: string | null
  photo_storage_path: string | null
  assigned_doctor_id: string | null
  created_at: string
  updated_at: string
}

export function patientRecordToFormInput(patient: PatientRecord): PatientFormValues {
  return {
    patientType: patient.patient_type,
    firstName: patient.first_name,
    middleName: patient.middle_name,
    lastName: patient.last_name,
    civilStatus: patient.civil_status as PatientFormValues['civilStatus'],
    address: patient.address,
    birthPlace: patient.birth_place,
    birthDate: patient.birth_date,
    ageOverride: patient.age_override,
    sex: patient.sex,
    contactNumber: patient.contact_number,
    occupation: patient.occupation,
    smokingHistory: patient.smoking_history,
    drinkingHistory: patient.drinking_history,
    history: patient.history,
    vaccinations: patient.vaccinations,
  }
}
