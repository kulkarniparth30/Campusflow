-- CampusFlow demo seed
-- Prerequisite: create these Auth users (Email/Password) in the dashboard,
-- with user_metadata.role matching the account:
--   student@campusflow.edu  / CampusFlow!23   metadata: {"role":"student","full_name":"Aarav Mehta"}
--   faculty@campusflow.edu  / CampusFlow!23   metadata: {"role":"faculty","full_name":"Dr. Kavya Iyer"}
--   admin@campusflow.edu    / CampusFlow!23   metadata: {"role":"admin","full_name":"Dean Sharma"}
--
-- Then run this script. It is idempotent on subject codes.

do $$
declare
  student_id uuid;
  faculty_id uuid;
  admin_id uuid;
  sub_dsa uuid;
  sub_dbms uuid;
  sub_os uuid;
  sub_cn uuid;
  rec_id uuid;
begin
  select id into student_id from auth.users where email = 'student@campusflow.edu';
  select id into faculty_id from auth.users where email = 'faculty@campusflow.edu';
  select id into admin_id from auth.users where email = 'admin@campusflow.edu';

  if student_id is null or faculty_id is null or admin_id is null then
    raise exception 'Create the three demo auth users first (see header comments).';
  end if;

  insert into public.profiles (id, full_name, role, email, roll_no, department, semester)
  values
    (student_id, 'Aarav Mehta', 'student', 'student@campusflow.edu', 'CS21B1042', 'Computer Science', 6),
    (faculty_id, 'Dr. Kavya Iyer', 'faculty', 'faculty@campusflow.edu', null, 'Computer Science', null),
    (admin_id, 'Dean Sharma', 'admin', 'admin@campusflow.edu', null, 'Administration', null)
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    email = excluded.email,
    roll_no = excluded.roll_no,
    department = excluded.department,
    semester = excluded.semester;

  insert into public.subjects (code, name, faculty_id, min_attendance_pct)
  values
    ('CS301', 'Data Structures & Algorithms', faculty_id, 75),
    ('CS302', 'Database Management Systems', faculty_id, 75),
    ('CS303', 'Operating Systems', faculty_id, 75),
    ('CS304', 'Computer Networks', faculty_id, 80)
  on conflict (code) do update set faculty_id = excluded.faculty_id;

  select id into sub_dsa from public.subjects where code = 'CS301';
  select id into sub_dbms from public.subjects where code = 'CS302';
  select id into sub_os from public.subjects where code = 'CS303';
  select id into sub_cn from public.subjects where code = 'CS304';

  insert into public.enrollments (student_id, subject_id)
  values (student_id, sub_dsa), (student_id, sub_dbms), (student_id, sub_os), (student_id, sub_cn)
  on conflict (student_id, subject_id) do nothing;

  -- Historical attendance (DSA slightly at risk)
  insert into public.attendance_records (student_id, subject_id, session_date, status, marked_by)
  select student_id, sub_dsa, current_date - (g || ' days')::interval, case when g % 4 = 0 then 'absent' else 'present' end, faculty_id
  from generate_series(1, 16) as g
  on conflict (student_id, subject_id, session_date) do nothing;

  insert into public.attendance_records (student_id, subject_id, session_date, status, marked_by)
  select student_id, sub_dbms, current_date - (g || ' days')::interval, case when g % 7 = 0 then 'absent' else 'present' end, faculty_id
  from generate_series(1, 14) as g
  on conflict (student_id, subject_id, session_date) do nothing;

  insert into public.attendance_records (student_id, subject_id, session_date, status, marked_by)
  select student_id, sub_os, current_date - (g || ' days')::interval, case when g % 9 = 0 then 'absent' else 'present' end, faculty_id
  from generate_series(1, 12) as g
  on conflict (student_id, subject_id, session_date) do nothing;

  insert into public.attendance_records (student_id, subject_id, session_date, status, marked_by)
  select student_id, sub_cn, current_date - (g || ' days')::interval, 'present', faculty_id
  from generate_series(1, 10) as g
  on conflict (student_id, subject_id, session_date) do nothing;

  delete from public.assignments where created_by = faculty_id;
  insert into public.assignments (subject_id, title, description, kind, due_at, urgency, created_by)
  values
    (sub_dsa, 'Graph Algorithms Lab', 'Implement Dijkstra and A* with visual traces.', 'assignment', now() + interval '2 days', 5, faculty_id),
    (sub_dbms, 'Normalization Mini-Project', 'Bring a schema to 3NF and justify BCNF tradeoffs.', 'assignment', now() + interval '5 days', 3, faculty_id),
    (sub_os, 'Mid-Term Examination', 'Process scheduling, deadlocks, virtual memory.', 'exam', now() + interval '8 days', 5, faculty_id),
    (sub_cn, 'Wireshark Capture Report', 'Capture a TCP handshake and annotate flags.', 'assignment', now() + interval '12 days', 2, faculty_id),
    (sub_dsa, 'End-Semester Practical', 'Live coding on trees, heaps, and graphs.', 'exam', now() + interval '21 days', 4, faculty_id);

  delete from public.notices where created_by in (faculty_id, admin_id);
  insert into public.notices (title, body, category, event_at, is_pinned, created_by)
  values
    ('Mid-term seating plan released', 'Seating for CS303 mid-term is posted on the department board. Reach hall 30 minutes early.', 'exam', now() + interval '8 days', true, faculty_id),
    ('Hackathon briefings this Friday', 'Campus Hackathon office hours in Innovation Lab, 4–6 PM. Bring your problem-statement notes.', 'event', now() + interval '3 days', false, admin_id),
    ('Library hours extended', 'Central library stays open until 11 PM through internals week.', 'academic', null, false, admin_id),
    ('Urgent: ID card re-issue desk', 'Lost ID cards must be reissued before Friday or campus access will be restricted.', 'urgent', now() + interval '2 days', true, admin_id);

  select id into rec_id
  from public.attendance_records
  where student_id = student_id and status = 'absent'
  order by session_date desc
  limit 1;

  delete from public.correction_requests where student_id = student_id;
  if rec_id is not null then
    insert into public.correction_requests (student_id, attendance_record_id, reason, status)
    values (student_id, rec_id, 'I was present — medical slip submitted at the desk after the lecture.', 'pending');
  end if;

  delete from public.achievements where student_id = student_id;
  insert into public.achievements (student_id, title, description, category, issuer, verified, verified_by, awarded_on)
  values
    (student_id, 'Smart India Hackathon Finalist', 'National finals, software edition — campus logistics track.', 'hackathon', 'MoE', true, faculty_id, current_date - 40),
    (student_id, 'Google DSC Lead', 'Led 12 community workshops on web and cloud.', 'leadership', 'GDSC', true, faculty_id, current_date - 120),
    (student_id, 'Open Source Sprint', 'Merged 4 PRs into the college LMS documentation.', 'opensource', 'GitHub', false, null, current_date - 10);
end $$;
