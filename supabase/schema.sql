-- SEVENPRO MONITORIA — schema inicial Supabase/Postgres
-- Revise este script em ambiente de teste antes de aplicá-lo em produção.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  role text not null check (role in ('director','manager','supervisor')),
  manager_id uuid references public.profiles(id) on delete restrict,
  supervisor_id uuid references public.profiles(id) on delete restrict,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_hierarchy_check check (
    (role = 'director' and manager_id is null and supervisor_id is null) or
    (role = 'manager' and manager_id is null and supervisor_id is null) or
    (role = 'supervisor' and manager_id is not null and supervisor_id is null)
  )
);

create table if not exists public.call_records (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'argus' check (source in ('argus')),
  argus_call_id text not null,
  argus_campaign_id integer not null,
  argus_lead_id text,
  operator_name text,
  operator_login text,
  manager_id uuid references public.profiles(id) on delete set null,
  supervisor_id uuid references public.profiles(id) on delete set null,
  team_name text,
  call_started_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  call_result text,
  audio_storage_path text,
  audio_format text check (audio_format is null or audio_format in ('MP3','WAV')),
  transcript text,
  ai_score numeric(5,2) check (ai_score is null or ai_score between 0 and 100),
  vocal_indicators jsonb not null default '{}'::jsonb,
  score_breakdown jsonb not null default '{}'::jsonb,
  compliance_status text not null default 'pending' check (compliance_status in ('pending','approved','review','confirmed_issue')),
  ai_summary text,
  human_review_status text not null default 'not_reviewed' check (human_review_status in ('not_reviewed','in_review','approved','rejected','coaching_required')),
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(argus_campaign_id, argus_call_id)
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_user_id uuid references public.profiles(id) on delete set null,
  call_record_id uuid references public.call_records(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists profiles_manager_idx on public.profiles(manager_id);
create index if not exists profiles_supervisor_idx on public.profiles(supervisor_id);
create index if not exists calls_started_idx on public.call_records(call_started_at desc);
create index if not exists calls_manager_date_idx on public.call_records(manager_id, call_started_at desc);
create index if not exists calls_supervisor_date_idx on public.call_records(supervisor_id, call_started_at desc);
create index if not exists calls_operator_idx on public.call_records(operator_login);
create index if not exists audit_created_idx on public.audit_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists call_records_set_updated_at on public.call_records;
create trigger call_records_set_updated_at before update on public.call_records for each row execute function public.set_updated_at();

create or replace function public.current_profile_role()
returns text language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() and active = true limit 1; $$;

alter table public.profiles enable row level security;
alter table public.call_records enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: user sees self; directors see all; managers see their reporting supervisors;
-- supervisors see only their own profile and linked subordinate/operator profiles if configured.
drop policy if exists profiles_select_scoped on public.profiles;
create policy profiles_select_scoped on public.profiles for select to authenticated using (
  id = auth.uid()
  or public.current_profile_role() = 'director'
  or (public.current_profile_role() = 'manager' and manager_id = auth.uid())
  or (public.current_profile_role() = 'supervisor' and supervisor_id = auth.uid())
);
-- No direct insert/delete/update policies on profiles. Account and role changes must use trusted server-side functions.

-- Calls: role-scoped visibility enforced in the database, not only in the frontend.
drop policy if exists call_records_select_scoped on public.call_records;
create policy call_records_select_scoped on public.call_records for select to authenticated using (
  public.current_profile_role() = 'director'
  or (public.current_profile_role() = 'manager' and manager_id = auth.uid())
  or (public.current_profile_role() = 'supervisor' and supervisor_id = auth.uid())
);
-- No direct call-record inserts/updates from browser clients. Use server-side ingestion/review functions with validation.

drop policy if exists audit_logs_director_select on public.audit_logs;
create policy audit_logs_director_select on public.audit_logs for select to authenticated using (public.current_profile_role() = 'director');
-- No browser-side writes to audit logs. Use trusted server-side functions.

-- Initial bootstrap (run manually only once after creating the first auth user in Supabase Auth):
-- Replace the UUID and name. The first account is the sole initial director.
-- insert into public.profiles (id, display_name, role, active)
-- values ('UUID-DO-USUARIO-AUTH', 'Diretoria ME7', 'director', true);
