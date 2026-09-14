-- Gorne MD EMR — initial schema
-- Two roles only: admin (non-clinical superuser, account/data management)
-- and doctor (clinical role, owns a signature, issues prescriptions/medcerts).

create extension if not exists pgcrypto;

create type user_role as enum ('admin', 'doctor');
create type patient_type as enum ('adult', 'pedia');
create type document_status as enum ('final', 'voided');

-- ---------------------------------------------------------------------------
-- profiles — 1:1 with auth.users
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'doctor',
  doctor_patient_scope patient_type,      -- meaningful only when role = 'doctor'
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- ---------------------------------------------------------------------------
-- Helper: resolves the caller's role without recursing through profiles' own
-- RLS. SECURITY DEFINER runs as the function owner, bypassing RLS on the
-- single `select` inside — this is the standard Supabase pattern for
-- referencing a role table from other tables' policies. Defined after
-- `profiles` deliberately: Postgres validates a SQL-language function body's
-- referenced relations at CREATE FUNCTION time, so this must come after the
-- table exists.
-- ---------------------------------------------------------------------------
create or replace function public.current_profile_role()
returns user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create policy "profiles: read own row or admin reads all"
  on profiles for select
  using (id = auth.uid() or public.current_profile_role() = 'admin');

-- No client-side insert/update/delete policy on purpose: account
-- provisioning and role changes go through /api/admin/users using the
-- service-role client (after requireRole(['admin'])), never directly from
-- an authenticated client session.

-- ---------------------------------------------------------------------------
-- doctor_profiles — letterhead / clinic config, one row per doctor
-- ---------------------------------------------------------------------------
create table doctor_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  printed_name text not null,
  credentials text,
  license_number text not null,
  ptr_number text,
  clinic_locations jsonb not null default '[]',  -- [{name, address, contact_number, schedule_text}, ...]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table doctor_profiles enable row level security;

create policy "doctor_profiles: read by any internal account"
  on doctor_profiles for select
  using (public.current_profile_role() in ('admin', 'doctor'));

create policy "doctor_profiles: owning doctor or admin can write"
  on doctor_profiles for insert
  with check (profile_id = auth.uid() or public.current_profile_role() = 'admin');

create policy "doctor_profiles: owning doctor or admin can update"
  on doctor_profiles for update
  using (profile_id = auth.uid() or public.current_profile_role() = 'admin');

-- ---------------------------------------------------------------------------
-- doctor_signatures — versioned; documents pin a specific row, never
-- "whatever is currently active", so a re-signed doctor never rewrites
-- history on old, already-issued documents.
-- ---------------------------------------------------------------------------
create table doctor_signatures (
  id uuid primary key default gen_random_uuid(),
  doctor_profile_id uuid not null references doctor_profiles(id) on delete cascade,
  storage_path text not null,             -- path WITHIN the `signatures` bucket: {doctor_profile_id}/{id}.png
  width_px int not null,
  height_px int not null,
  is_active boolean not null default true,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create unique index one_active_signature_per_doctor
  on doctor_signatures (doctor_profile_id) where is_active;

alter table doctor_signatures enable row level security;

create policy "doctor_signatures: owning doctor or admin can read"
  on doctor_signatures for select
  using (
    public.current_profile_role() = 'admin'
    or doctor_profile_id in (select id from doctor_profiles where profile_id = auth.uid())
  );

create policy "doctor_signatures: owning doctor can insert their own"
  on doctor_signatures for insert
  with check (
    public.current_profile_role() = 'doctor'
    and doctor_profile_id in (select id from doctor_profiles where profile_id = auth.uid())
  );

create policy "doctor_signatures: owning doctor can deactivate their own"
  on doctor_signatures for update
  using (doctor_profile_id in (select id from doctor_profiles where profile_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- patients
-- ---------------------------------------------------------------------------
create table patients (
  id uuid primary key default gen_random_uuid(),
  patient_type patient_type not null,
  first_name text not null,
  middle_name text,
  last_name text not null,
  civil_status text check (civil_status in ('single', 'married', 'widowed', 'separated', 'other')),
  address text,
  birth_place text,
  birth_date date,
  age_override int,                       -- escape hatch only when birth_date is unknown (legacy data)
  sex text check (sex in ('male', 'female')),
  contact_number text,
  occupation text,
  smoking_history text,
  drinking_history text,
  history text,
  vaccinations text,
  photo_storage_path text,                -- path within `patient-photos` bucket
  assigned_doctor_id uuid references profiles(id),
  created_by uuid not null references profiles(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table patients enable row level security;

create policy "patients: read by any internal account"
  on patients for select
  using (public.current_profile_role() in ('admin', 'doctor'));

create policy "patients: insert by any internal account"
  on patients for insert
  with check (public.current_profile_role() in ('admin', 'doctor'));

create policy "patients: update by any internal account"
  on patients for update
  using (public.current_profile_role() in ('admin', 'doctor'));

-- No delete policy at all: patients are never hard-deleted, only soft
-- (deleted_at), and even that is gated to admin by the trigger below rather
-- than by RLS, since RLS can't distinguish "changing deleted_at" from
-- "changing any other column" on the same UPDATE policy.
create or replace function public.enforce_patient_soft_delete_admin_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.deleted_at is not null and old.deleted_at is null
     and public.current_profile_role() <> 'admin' then
    raise exception 'Only admin can delete a patient record';
  end if;
  return new;
end;
$$;

create trigger patients_soft_delete_guard
  before update on patients
  for each row execute function public.enforce_patient_soft_delete_admin_only();

-- ---------------------------------------------------------------------------
-- patient_lab_results — replaces the old ACF repeater with real child rows
-- ---------------------------------------------------------------------------
create table patient_lab_results (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  laboratory_name text not null,
  result_image_storage_path text,         -- path within `lab-results` bucket
  remarks text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table patient_lab_results enable row level security;

create policy "patient_lab_results: read by any internal account"
  on patient_lab_results for select
  using (public.current_profile_role() in ('admin', 'doctor'));

create policy "patient_lab_results: insert by any internal account"
  on patient_lab_results for insert
  with check (public.current_profile_role() in ('admin', 'doctor'));

create policy "patient_lab_results: delete admin only"
  on patient_lab_results for delete
  using (public.current_profile_role() = 'admin');

-- ---------------------------------------------------------------------------
-- vital_signs — bmi is computed, never hand-typed (old app let it silently
-- disagree with weight/height)
-- ---------------------------------------------------------------------------
create table vital_signs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  temperature_celsius numeric(4, 1),
  systolic_mmhg int,
  diastolic_mmhg int,
  pulse_rate_bpm int,
  respiratory_rate_bpm int,
  weight_kg numeric(5, 2),
  height_cm numeric(5, 2),
  bmi numeric(4, 1) generated always as (
    case when height_cm > 0 then round((weight_kg / ((height_cm / 100.0) ^ 2))::numeric, 1) else null end
  ) stored,
  recorded_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table vital_signs enable row level security;

create policy "vital_signs: read by any internal account"
  on vital_signs for select
  using (public.current_profile_role() in ('admin', 'doctor'));

create policy "vital_signs: insert by any internal account"
  on vital_signs for insert
  with check (public.current_profile_role() in ('admin', 'doctor'));

create policy "vital_signs: delete by any internal account"
  on vital_signs for delete
  using (public.current_profile_role() in ('admin', 'doctor'));

-- ---------------------------------------------------------------------------
-- diagnoses — doctor/admin only, end to end (the old app hid this from
-- other roles client-side only; here it's a real RLS boundary)
-- ---------------------------------------------------------------------------
create table diagnoses (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  symptoms_diagnosis text not null,
  treatment text,
  remarks text,
  recorded_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table diagnoses enable row level security;

create policy "diagnoses: read by any internal account"
  on diagnoses for select
  using (public.current_profile_role() in ('admin', 'doctor'));

create policy "diagnoses: insert by any internal account"
  on diagnoses for insert
  with check (public.current_profile_role() in ('admin', 'doctor'));

create policy "diagnoses: delete by any internal account"
  on diagnoses for delete
  using (public.current_profile_role() in ('admin', 'doctor'));

-- ---------------------------------------------------------------------------
-- prescriptions — issued only by the doctor they belong to; immutable once
-- final except for the void transition (medico-legal retention: no hard
-- delete, ever)
-- ---------------------------------------------------------------------------
create table prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_profile_id uuid not null references doctor_profiles(id),
  signature_id uuid not null references doctor_signatures(id),
  prescription_details text not null,     -- sanitized HTML from the rich-text editor
  status document_status not null default 'final',
  voided_at timestamptz,
  voided_by uuid references profiles(id),
  void_reason text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table prescriptions enable row level security;

create policy "prescriptions: read by any internal account"
  on prescriptions for select
  using (public.current_profile_role() in ('admin', 'doctor'));

create policy "prescriptions: only the owning doctor can issue"
  on prescriptions for insert
  with check (
    public.current_profile_role() = 'doctor'
    and doctor_profile_id in (select id from doctor_profiles where profile_id = auth.uid())
  );

create or replace function public.enforce_prescription_void_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.prescription_details is distinct from old.prescription_details
     or new.patient_id is distinct from old.patient_id
     or new.doctor_profile_id is distinct from old.doctor_profile_id
     or new.signature_id is distinct from old.signature_id then
    raise exception 'Prescriptions are immutable once issued — void and reissue instead';
  end if;

  if old.status = 'voided' then
    raise exception 'This prescription is already voided';
  end if;

  if new.status = 'voided' then
    if public.current_profile_role() = 'admin' then
      return new;
    elsif public.current_profile_role() = 'doctor'
      and exists (select 1 from doctor_profiles dp where dp.id = new.doctor_profile_id and dp.profile_id = auth.uid())
    then
      return new;
    else
      raise exception 'Not permitted to void this prescription';
    end if;
  end if;

  return new;
end;
$$;

create trigger prescriptions_void_guard
  before update on prescriptions
  for each row execute function public.enforce_prescription_void_only();

-- ---------------------------------------------------------------------------
-- medcerts — same immutable/void-only shape as prescriptions
-- ---------------------------------------------------------------------------
create table medcerts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_profile_id uuid not null references doctor_profiles(id),
  signature_id uuid not null references doctor_signatures(id),
  certification_description text not null,
  diagnosis_details text,
  inclusive_start_date date,
  inclusive_end_date date,
  inclusive_dates_note text,
  fit_to_work boolean,
  fit_to_work_note text,
  remarks text,
  status document_status not null default 'final',
  voided_at timestamptz,
  voided_by uuid references profiles(id),
  void_reason text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table medcerts enable row level security;

create policy "medcerts: read by any internal account"
  on medcerts for select
  using (public.current_profile_role() in ('admin', 'doctor'));

create policy "medcerts: only the owning doctor can issue"
  on medcerts for insert
  with check (
    public.current_profile_role() = 'doctor'
    and doctor_profile_id in (select id from doctor_profiles where profile_id = auth.uid())
  );

create or replace function public.enforce_medcert_void_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.certification_description is distinct from old.certification_description
     or new.diagnosis_details is distinct from old.diagnosis_details
     or new.patient_id is distinct from old.patient_id
     or new.doctor_profile_id is distinct from old.doctor_profile_id
     or new.signature_id is distinct from old.signature_id then
    raise exception 'Medical certificates are immutable once issued — void and reissue instead';
  end if;

  if old.status = 'voided' then
    raise exception 'This medical certificate is already voided';
  end if;

  if new.status = 'voided' then
    if public.current_profile_role() = 'admin' then
      return new;
    elsif public.current_profile_role() = 'doctor'
      and exists (select 1 from doctor_profiles dp where dp.id = new.doctor_profile_id and dp.profile_id = auth.uid())
    then
      return new;
    else
      raise exception 'Not permitted to void this medical certificate';
    end if;
  end if;

  return new;
end;
$$;

create trigger medcerts_void_guard
  before update on medcerts
  for each row execute function public.enforce_medcert_void_only();

-- ---------------------------------------------------------------------------
-- audit_log — service-role insert only, admin-only read
-- ---------------------------------------------------------------------------
create table audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references profiles(id),
  action text not null,                   -- e.g. 'patient.soft_delete', 'signature.replace', 'prescription.void'
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table audit_log enable row level security;

create policy "audit_log: admin can read"
  on audit_log for select
  using (public.current_profile_role() = 'admin');

-- No insert/update/delete policy: audit rows are written exclusively by API
-- routes using the service-role client, never directly from a client session.

-- ---------------------------------------------------------------------------
-- Storage buckets — all private; every read goes through a service-role
-- signed URL or the policies below, never a public bucket URL.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('signatures', 'signatures', false),
  ('patient-photos', 'patient-photos', false),
  ('lab-results', 'lab-results', false)
on conflict (id) do nothing;

create policy "storage: read patient photos and lab results (internal accounts)"
  on storage.objects for select
  using (
    bucket_id in ('patient-photos', 'lab-results')
    and public.current_profile_role() in ('admin', 'doctor')
  );

create policy "storage: write patient photos and lab results (internal accounts)"
  on storage.objects for insert
  with check (
    bucket_id in ('patient-photos', 'lab-results')
    and public.current_profile_role() in ('admin', 'doctor')
  );

create policy "storage: read own signature or admin"
  on storage.objects for select
  using (
    bucket_id = 'signatures'
    and (
      public.current_profile_role() = 'admin'
      or (storage.foldername(name))[1] in (
        select dp.id::text from doctor_profiles dp where dp.profile_id = auth.uid()
      )
    )
  );

create policy "storage: write own signature"
  on storage.objects for insert
  with check (
    bucket_id = 'signatures'
    and (storage.foldername(name))[1] in (
      select dp.id::text from doctor_profiles dp where dp.profile_id = auth.uid()
    )
  );
