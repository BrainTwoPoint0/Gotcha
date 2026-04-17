-- Create the private `gotcha-screenshots` bucket used to store bug-report
-- screenshots, plus RESTRICTIVE RLS policies that deny anon + authenticated
-- all access. The API route `POST /api/v1/responses` uploads via the
-- Supabase service-role key (which bypasses RLS); the dashboard never
-- reads objects directly — it calls `GET /api/responses/[id]/screenshot`
-- which (after auth + org scope) generates a short-lived signed URL via
-- the service-role client.
--
-- Policy shape matters: Postgres RLS is permissive-OR by default, so a
-- `for select to authenticated using (bucket_id <> 'gotcha-screenshots')`
-- policy would GRANT access on every other bucket, not deny access on
-- this one. `as restrictive` changes the combining rule to AND, so the
-- condition "bucket is not gotcha-screenshots" must hold for any access
-- to succeed — which is exactly the deny semantics we want.
--
-- Safe to re-run: `on conflict do update` on the bucket, drop-and-recreate
-- on the policies.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gotcha-screenshots',
  'gotcha-screenshots',
  false,
  2 * 1024 * 1024,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Drop any prior versions of these policies (names match the first
-- attempt) so re-runs land cleanly.
drop policy if exists "gotcha_screenshots_deny_anon_select" on storage.objects;
drop policy if exists "gotcha_screenshots_deny_anon_insert" on storage.objects;
drop policy if exists "gotcha_screenshots_deny_anon_update" on storage.objects;
drop policy if exists "gotcha_screenshots_deny_anon_delete" on storage.objects;
drop policy if exists "gotcha_screenshots_restrict_read" on storage.objects;
drop policy if exists "gotcha_screenshots_restrict_insert" on storage.objects;
drop policy if exists "gotcha_screenshots_restrict_update" on storage.objects;
drop policy if exists "gotcha_screenshots_restrict_delete" on storage.objects;

create policy "gotcha_screenshots_restrict_read"
  on storage.objects as restrictive
  for select to anon, authenticated
  using (bucket_id <> 'gotcha-screenshots');

create policy "gotcha_screenshots_restrict_insert"
  on storage.objects as restrictive
  for insert to anon, authenticated
  with check (bucket_id <> 'gotcha-screenshots');

create policy "gotcha_screenshots_restrict_update"
  on storage.objects as restrictive
  for update to anon, authenticated
  using (bucket_id <> 'gotcha-screenshots')
  with check (bucket_id <> 'gotcha-screenshots');

create policy "gotcha_screenshots_restrict_delete"
  on storage.objects as restrictive
  for delete to anon, authenticated
  using (bucket_id <> 'gotcha-screenshots');
