-- CampusFlow — schema, RLS, and demo seed
-- Run in the Supabase SQL editor (or via supabase db push).
-- After this script, create Auth users for:
--   student@campusflow.edu, faculty@campusflow.edu, admin@campusflow.edu
-- then run 002_seed.sql.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('student', 'faculty', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attendance_status as enum ('present', 'absent', 'late');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.assignment_kind as enum ('assignment', 'exam');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notice_category as enum ('academic', 'exam', 'urgent', 'event');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'student',
  email text unique,
  roll_no text,
  department text,
  semester int,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  faculty_id uuid references public.profiles (id) on delete set null,
  min_attendance_pct numeric(5,2) not null default 75,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  unique (student_id, subject_id)
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  session_date date not null default current_date,
  status public.attendance_status not null,
  marked_by uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  unique (student_id, subject_id, session_date)
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references public.subjects (id) on delete set null,
  title text not null,
  description text,
  kind public.assignment_kind not null default 'assignment',
  due_at timestamptz not null,
  urgency smallint not null default 3 check (urgency between 1 and 5),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category public.notice_category not null default 'academic',
  event_at timestamptz,
  is_pinned boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.correction_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  attendance_record_id uuid not null references public.attendance_records (id) on delete cascade,
  reason text not null,
  status public.request_status not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  faculty_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'academic',
  issuer text,
  verified boolean not null default false,
  verified_by uuid references public.profiles (id) on delete set null,
  evidence_url text,
  awarded_on date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Updated-at trigger
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_corrections_updated on public.correction_requests;
create trigger trg_corrections_updated
  before update on public.correction_requests
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Auth: create profile on signup (role from raw_user_meta_data.role)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'student'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Role helpers (used by RLS)
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() in ('faculty', 'admin');
$$;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_attendance_student on public.attendance_records (student_id, session_date desc);
create index if not exists idx_attendance_subject on public.attendance_records (subject_id, session_date desc);
create index if not exists idx_assignments_due on public.assignments (due_at);
create index if not exists idx_notices_created on public.notices (created_at desc);
create index if not exists idx_corrections_status on public.correction_requests (status, created_at desc);
create index if not exists idx_achievements_student on public.achievements (student_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.enrollments enable row level security;
alter table public.attendance_records enable row level security;
alter table public.assignments enable row level security;
alter table public.notices enable row level security;
alter table public.correction_requests enable row level security;
alter table public.achievements enable row level security;

-- Drop existing policies so this script is re-runnable
do $$
declare r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles','subjects','enrollments','attendance_records',
        'assignments','notices','correction_requests','achievements'
      )
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- profiles
create policy "profiles_select_self_or_staff"
  on public.profiles for select
  using (id = auth.uid() or public.is_staff());

create policy "profiles_update_self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_role());

create policy "profiles_admin_write"
  on public.profiles for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- subjects / enrollments
create policy "subjects_read_authenticated"
  on public.subjects for select
  to authenticated
  using (true);

create policy "subjects_write_staff"
  on public.subjects for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "enrollments_student_own"
  on public.enrollments for select
  using (student_id = auth.uid() or public.is_staff());

create policy "enrollments_write_staff"
  on public.enrollments for all
  using (public.is_staff())
  with check (public.is_staff());

-- attendance: students read own; faculty/admin write
create policy "attendance_student_own"
  on public.attendance_records for select
  using (student_id = auth.uid() or public.is_staff());

create policy "attendance_staff_insert"
  on public.attendance_records for insert
  with check (public.is_staff());

create policy "attendance_staff_update"
  on public.attendance_records for update
  using (public.is_staff())
  with check (public.is_staff());

create policy "attendance_admin_delete"
  on public.attendance_records for delete
  using (public.current_role() = 'admin');

-- assignments: everyone reads; faculty write
create policy "assignments_read_authenticated"
  on public.assignments for select
  to authenticated
  using (true);

create policy "assignments_staff_write"
  on public.assignments for insert
  with check (public.is_staff());

create policy "assignments_staff_update"
  on public.assignments for update
  using (public.is_staff())
  with check (public.is_staff());

create policy "assignments_staff_delete"
  on public.assignments for delete
  using (public.is_staff());

-- notices
create policy "notices_read_authenticated"
  on public.notices for select
  to authenticated
  using (true);

create policy "notices_staff_write"
  on public.notices for all
  using (public.is_staff())
  with check (public.is_staff());

-- correction requests: student creates/reads own; faculty reviews
create policy "corrections_student_select"
  on public.correction_requests for select
  using (student_id = auth.uid() or public.is_staff());

create policy "corrections_student_insert"
  on public.correction_requests for insert
  with check (student_id = auth.uid());

create policy "corrections_staff_update"
  on public.correction_requests for update
  using (public.is_staff())
  with check (public.is_staff());

-- achievements: students own; faculty can verify
create policy "achievements_student_own"
  on public.achievements for select
  using (student_id = auth.uid() or public.is_staff());

create policy "achievements_student_insert"
  on public.achievements for insert
  with check (student_id = auth.uid());

create policy "achievements_student_update_own_unverified"
  on public.achievements for update
  using (student_id = auth.uid() and verified = false)
  with check (student_id = auth.uid());

create policy "achievements_staff_verify"
  on public.achievements for update
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter table public.correction_requests replica identity full;
alter table public.notices replica identity full;
alter table public.attendance_records replica identity full;

do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.correction_requests';
  exception when duplicate_object then null;
  end;
  begin
    execute 'alter publication supabase_realtime add table public.notices';
  exception when duplicate_object then null;
  end;
  begin
    execute 'alter publication supabase_realtime add table public.attendance_records';
  exception when duplicate_object then null;
  end;
end $$;
