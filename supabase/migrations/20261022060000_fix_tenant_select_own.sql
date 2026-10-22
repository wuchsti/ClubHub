-- Fix: `.insert(...).select()` on tenants (onboarding) evaluates the SELECT
-- policy on the just-inserted row as part of the RETURNING clause, before
-- the bootstrap membership row (created in a separate statement right
-- after) exists. Without this, Postgres reports the INSERT itself as
-- "violates row-level security policy" even though its own WITH CHECK
-- (created_by = auth.uid()) passes - the existing tenants_select_members
-- policy requires is_tenant_member(id), which is false at that instant.
--
-- A tenant's creator should always be able to see it regardless of their
-- current membership status, so this is a sensible permissive addition,
-- not a workaround.

create policy "tenants_select_own_creation" on public.tenants
  for select
  to authenticated
  using (created_by = auth.uid());
