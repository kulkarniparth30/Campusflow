-- CampusFlow complete setup (schema + RLS + seed helpers)
-- 1) Run this entire file in the Supabase SQL editor.
-- 2) Create Auth users:
--      student@campusflow.edu / CampusFlow!23   user_metadata: {"role":"student","full_name":"Aarav Mehta"}
--      faculty@campusflow.edu / CampusFlow!23   user_metadata: {"role":"faculty","full_name":"Dr. Kavya Iyer"}
--      admin@campusflow.edu   / CampusFlow!23   user_metadata: {"role":"admin","full_name":"Dean Sharma"}
-- 3) Re-run the seed block at the bottom (or supabase/migrations/002_seed.sql).

\i is not available in the dashboard — use the split files in supabase/migrations/.
This file is a convenience concatenation for reviewers.

-- See:
--   supabase/migrations/001_init.sql
--   supabase/migrations/002_seed.sql
