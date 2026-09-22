-- Fix: the void-guard triggers on prescriptions/medcerts call
-- current_profile_role(), which resolves via auth.uid() — but every write
-- from this app's API routes goes through the service-role client (the
-- established pattern: RLS/triggers are read-time/session-time boundaries,
-- the API route's own requireUser()/requireRole() check is the actual
-- write-time enforcement, since service-role bypasses RLS). For a
-- service-role-authenticated request there is no session, so auth.uid()
-- and therefore current_profile_role() resolve to NULL.
--
-- The original trigger logic treated NULL as "not admin, not the owning
-- doctor" and raised an exception — meaning every void attempt from the
-- app was unconditionally rejected with "Not permitted to void this
-- prescription/medical certificate". Confirmed against the live database
-- before writing this fix (a service-role void attempt returned exactly
-- that error).
--
-- Fix: only enforce the admin-or-owning-doctor check when
-- current_profile_role() actually resolved to something (i.e. the write
-- came from a real user session, not service-role) — mirroring how
-- enforce_patient_soft_delete_admin_only already behaves for the same
-- reason (its negative condition happens to no-op safely on NULL, this
-- one's positive/else structure does not, hence this fix).

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

  if new.status = 'voided'
     and public.current_profile_role() is not null
     and public.current_profile_role() <> 'admin'
     and not (
       public.current_profile_role() = 'doctor'
       and exists (select 1 from doctor_profiles dp where dp.id = new.doctor_profile_id and dp.profile_id = auth.uid())
     )
  then
    raise exception 'Not permitted to void this prescription';
  end if;

  return new;
end;
$$;

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

  if new.status = 'voided'
     and public.current_profile_role() is not null
     and public.current_profile_role() <> 'admin'
     and not (
       public.current_profile_role() = 'doctor'
       and exists (select 1 from doctor_profiles dp where dp.id = new.doctor_profile_id and dp.profile_id = auth.uid())
     )
  then
    raise exception 'Not permitted to void this medical certificate';
  end if;

  return new;
end;
$$;
