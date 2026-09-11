-- CampusFlow — Security Patches Migration
-- Run AFTER 001_init.sql

-- ---------------------------------------------------------------------------
-- 1. Fix privilege escalation: hardcode 'student' role, ignore client metadata
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
    'student',  -- SECURITY: always default to student, never trust client metadata
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Admin-only function to promote user roles (replaces client metadata trust)
create or replace function public.admin_set_role(target_user_id uuid, new_role public.user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_role() != 'admin' then
    raise exception 'Only admins can change user roles';
  end if;
  update public.profiles set role = new_role where id = target_user_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Fix BOLA/IDOR: faculty can only write attendance for their own subjects
-- ---------------------------------------------------------------------------
drop policy if exists "attendance_staff_insert" on public.attendance_records;
create policy "attendance_staff_insert"
  on public.attendance_records for insert
  with check (
    public.current_role() = 'admin'
    or (
      public.current_role() = 'faculty'
      and exists (
        select 1 from public.subjects s
        where s.id = subject_id and s.faculty_id = auth.uid()
      )
    )
  );

drop policy if exists "attendance_staff_update" on public.attendance_records;
create policy "attendance_staff_update"
  on public.attendance_records for update
  using (
    public.current_role() = 'admin'
    or (
      public.current_role() = 'faculty'
      and exists (
        select 1 from public.subjects s
        where s.id = subject_id and s.faculty_id = auth.uid()
      )
    )
  )
  with check (
    public.current_role() = 'admin'
    or (
      public.current_role() = 'faculty'
      and exists (
        select 1 from public.subjects s
        where s.id = subject_id and s.faculty_id = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Prevent correction request spam: unique pending per student+record
-- ---------------------------------------------------------------------------
create unique index if not exists idx_corrections_unique_pending
  on public.correction_requests (student_id, attendance_record_id)
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- 4. URL validation: evidence_url and avatar_url must start with https://
-- ---------------------------------------------------------------------------
alter table public.achievements drop constraint if exists chk_evidence_url;
alter table public.achievements
  add constraint chk_evidence_url
  check (evidence_url is null or evidence_url like 'https://%');

alter table public.profiles drop constraint if exists chk_avatar_url;
alter table public.profiles
  add constraint chk_avatar_url
  check (avatar_url is null or avatar_url like 'https://%');

-- ---------------------------------------------------------------------------
-- 5. New tables for Phase 3 features
-- ---------------------------------------------------------------------------

-- Timetable slots
create table if not exists public.timetable_slots (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7),
  start_time time not null,
  end_time time not null,
  room text,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

alter table public.timetable_slots enable row level security;

create policy "timetable_read_authenticated"
  on public.timetable_slots for select
  to authenticated
  using (true);

create policy "timetable_staff_write"
  on public.timetable_slots for all
  using (public.is_staff())
  with check (public.is_staff());

-- OD/Medical requests
do $$ begin
  create type public.od_type as enum ('od', 'medical');
exception when duplicate_object then null; end $$;

create table if not exists public.od_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  type public.od_type not null,
  reason text not null,
  evidence_url text check (evidence_url is null or evidence_url like 'https://%'),
  from_date date not null,
  to_date date not null,
  approval_chain jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  check (to_date >= from_date)
);

alter table public.od_requests enable row level security;

create policy "od_student_own"
  on public.od_requests for select
  using (student_id = auth.uid() or public.is_staff());

create policy "od_student_insert"
  on public.od_requests for insert
  with check (student_id = auth.uid());

create policy "od_staff_update"
  on public.od_requests for update
  using (public.is_staff())
  with check (public.is_staff());

-- Submissions
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  file_url text check (file_url is null or file_url like 'https://%'),
  submitted_at timestamptz not null default now(),
  grade numeric(5,2),
  max_grade numeric(5,2) not null default 50,
  feedback text,
  unique (assignment_id, student_id)
);

alter table public.submissions enable row level security;

create policy "submissions_student_own"
  on public.submissions for select
  using (student_id = auth.uid() or public.is_staff());

create policy "submissions_student_insert"
  on public.submissions for insert
  with check (student_id = auth.uid());

create policy "submissions_staff_grade"
  on public.submissions for update
  using (public.is_staff())
  with check (public.is_staff());

-- Indexes for new tables
create index if not exists idx_timetable_subject on public.timetable_slots (subject_id);
create index if not exists idx_od_student on public.od_requests (student_id, created_at desc);
create index if not exists idx_submissions_assignment on public.submissions (assignment_id);
create index if not exists idx_submissions_student on public.submissions (student_id);
