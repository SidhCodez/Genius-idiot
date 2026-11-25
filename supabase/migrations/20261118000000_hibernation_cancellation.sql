-- Track which rest-day rows belong to a hibernation so users can cancel it
-- without removing rest days they marked manually.
alter table public.rest_days
  add column if not exists hibernation_id uuid;

create index if not exists rest_days_hibernation_id_idx
  on public.rest_days (hibernation_id)
  where hibernation_id is not null;

notify pgrst, 'reload schema';
