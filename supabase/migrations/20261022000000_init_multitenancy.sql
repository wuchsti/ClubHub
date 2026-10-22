-- Phase 1: Fundament, Auth & Multi-Tenancy Setup
-- Tables: tenants, profiles (extends auth.users), memberships, roles.
-- RLS enforces that a user can only ever see/modify rows of tenants they
-- belong to via memberships.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('owner', 'admin', 'captain', 'member');
create type public.tenant_status as enum ('trialing', 'active', 'past_due', 'canceled');
create type public.tenant_plan as enum ('starter', 'pro', 'allin');

-- ---------------------------------------------------------------------------
-- Tenants (= Vereine)
-- ---------------------------------------------------------------------------

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  plan public.tenant_plan not null default 'starter',
  status public.tenant_status not null default 'trialing',
  member_limit integer not null default 15,
  created_by uuid not null references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tenants is 'A registered Verein / Sparte / team (one SaaS tenant).';

-- ---------------------------------------------------------------------------
-- Profiles (1:1 extension of auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public profile data for an auth.users row.';

-- Auto-create a profile row whenever a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Memberships (user <-> tenant, with a role)
-- ---------------------------------------------------------------------------

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

comment on table public.memberships is 'Maps a user to a tenant with a role; the unit RLS isolation is built on.';

create index memberships_user_id_idx on public.memberships (user_id);
create index memberships_tenant_id_idx on public.memberships (tenant_id);

-- Helper: does the current user belong to the given tenant, and with which
-- role? SECURITY DEFINER so it can be used inside RLS policies on
-- `memberships` itself without recursive-RLS evaluation.

create function public.is_tenant_member(target_tenant_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.tenant_id = target_tenant_id
      and m.user_id = auth.uid()
  );
$$;

create function public.has_tenant_role(target_tenant_id uuid, allowed_roles public.app_role[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.tenant_id = target_tenant_id
      and m.user_id = auth.uid()
      and m.role = any (allowed_roles)
  );
$$;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_set_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;

-- tenants: members can read their own tenant(s); any authenticated user may
-- create a brand new tenant (onboarding); only owner/admin can update it.
create policy "tenants_select_members" on public.tenants
  for select
  to authenticated
  using (public.is_tenant_member(id));

create policy "tenants_insert_authenticated" on public.tenants
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "tenants_update_admins" on public.tenants
  for update
  to authenticated
  using (public.has_tenant_role(id, array['owner', 'admin']::public.app_role[]))
  with check (public.has_tenant_role(id, array['owner', 'admin']::public.app_role[]));

-- profiles: everyone can read a minimal profile (needed to show names of
-- team mates); a user may only edit their own profile.
create policy "profiles_select_authenticated" on public.profiles
  for select
  to authenticated
  using (true);

create policy "profiles_update_own" on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- memberships: a member can see the membership rows of tenants they belong
-- to (so they can see their team mates and roles).
create policy "memberships_select_fellow_members" on public.memberships
  for select
  to authenticated
  using (public.is_tenant_member(tenant_id));

-- Bootstrap case: the very first membership of a tenant may be created by
-- the authenticated user for themselves (onboarding owner), as long as the
-- tenant does not already have a member.
create policy "memberships_insert_bootstrap_owner" on public.memberships
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and role = 'owner'
    and not exists (
      select 1 from public.memberships existing where existing.tenant_id = memberships.tenant_id
    )

  );

-- Invite case: an existing owner/admin of the tenant may add further
-- members (used by the Phase 2 invite flow).
create policy "memberships_insert_admin_invite" on public.memberships
  for insert
  to authenticated
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]));

create policy "memberships_update_admins" on public.memberships
  for update
  to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]));

create policy "memberships_delete_admins_or_self" on public.memberships
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    or public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[])
  );
