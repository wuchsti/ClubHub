-- Phase 4: Rechtliches, statische Seiten & Admin-Overlord
-- Adds manual tenant suspension/limits, a global sponsor banner for the
-- free Starter tier, and the SECURITY DEFINER helper that lets a platform
-- admin (profiles.is_platform_admin) see/manage every tenant.

-- ---------------------------------------------------------------------------
-- Tenant suspension (SA-02)
-- ---------------------------------------------------------------------------

alter table public.tenants
  add column is_suspended boolean not null default false,
  add column suspended_at timestamptz;

comment on column public.tenants.is_suspended is 'Manually locked by a platform admin (SA-02); blocks non-admin dashboard access.';

-- ---------------------------------------------------------------------------
-- Platform admin helper
-- ---------------------------------------------------------------------------

create function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select p.is_platform_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;

-- Platform admins can see and manage every tenant, regardless of their own
-- membership (they may not belong to any club at all).
create policy "tenants_select_platform_admin" on public.tenants
  for select
  to authenticated
  using (public.is_platform_admin());

create policy "tenants_update_platform_admin" on public.tenants
  for update
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Needed so the Mandanten-Uebersicht can compute a member count per tenant
-- without the platform admin being a member of each one.
create policy "memberships_select_platform_admin" on public.memberships
  for select
  to authenticated
  using (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Platform sponsors (SA-03: global ad banners shown on the free tier)
-- ---------------------------------------------------------------------------

create table public.platform_sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  logo_path text not null,
  link_url text,
  is_active boolean not null default true,
  created_by uuid not null references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.platform_sponsors is 'Global sponsor banners shown to Starter-tier tenants (SA-03).';

alter table public.platform_sponsors enable row level security;

-- Every authenticated user needs to be able to read these (they render on
-- any Starter-tier tenant's dashboard); only platform admins write.
create policy "platform_sponsors_select_authenticated" on public.platform_sponsors
  for select
  to authenticated
  using (true);

create policy "platform_sponsors_write_admin" on public.platform_sponsors
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

insert into storage.buckets (id, name, public)
values ('platform-sponsor-logos', 'platform-sponsor-logos', true)
on conflict (id) do nothing;

create policy "platform_sponsor_logos_public_read" on storage.objects
  for select
  to public
  using (bucket_id = 'platform-sponsor-logos');

create policy "platform_sponsor_logos_admin_write" on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'platform-sponsor-logos' and public.is_platform_admin());

create policy "platform_sponsor_logos_admin_update" on storage.objects
  for update
  to authenticated
  using (bucket_id = 'platform-sponsor-logos' and public.is_platform_admin());

create policy "platform_sponsor_logos_admin_delete" on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'platform-sponsor-logos' and public.is_platform_admin());
