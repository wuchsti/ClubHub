-- Phase 3: Finanzen, Kassenbuch & Sponsoring
-- Adds a penalty catalog + Kassenbuch (ledger) for fees/Strafen, Stripe
-- columns on tenants (Billing subscription + Connect payouts to the
-- club's own account), and a sponsor manager.

-- ---------------------------------------------------------------------------
-- Stripe columns on tenants
-- ---------------------------------------------------------------------------

alter table public.tenants
  add column stripe_customer_id text unique,
  add column stripe_subscription_id text unique,
  add column stripe_connect_account_id text unique,
  add column stripe_connect_charges_enabled boolean not null default false;

comment on column public.tenants.stripe_customer_id is 'Platform-side Stripe customer for the SaaS subscription (Starter/Pro/All-In).';
comment on column public.tenants.stripe_connect_account_id is 'Connected Express account that receives member fee/penalty payments (Kassenwart payout).';

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.ledger_status as enum ('open', 'paid', 'void');

-- ---------------------------------------------------------------------------
-- Penalty catalog (Strafenkatalog)
-- ---------------------------------------------------------------------------

create table public.penalty_catalog (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  label text not null check (char_length(trim(label)) > 0),
  default_amount_cents integer not null check (default_amount_cents >= 0),
  created_by uuid not null references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.penalty_catalog is 'Reusable Strafenkatalog entries, e.g. "Unpuenktlich (15 Min)" -> 2.00 EUR.';

create index penalty_catalog_tenant_id_idx on public.penalty_catalog (tenant_id);

-- ---------------------------------------------------------------------------
-- Ledger entries (Kassenbuch: Strafen, Mitgliedsbeitraege, manuelle Posten)
-- ---------------------------------------------------------------------------

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  team_id uuid references public.teams (id) on delete set null,
  member_id uuid not null references auth.users (id) on delete cascade,
  catalog_id uuid references public.penalty_catalog (id) on delete set null,
  label text not null check (char_length(trim(label)) > 0),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'eur',
  status public.ledger_status not null default 'open',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_by uuid not null references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.ledger_entries is 'One Kassenbuch line item owed by one member (Strafe, Beitrag, etc.).';

create index ledger_entries_tenant_id_idx on public.ledger_entries (tenant_id);
create index ledger_entries_member_id_idx on public.ledger_entries (member_id);
create index ledger_entries_team_id_idx on public.ledger_entries (team_id);
create index ledger_entries_status_idx on public.ledger_entries (status);

-- ---------------------------------------------------------------------------
-- Sponsors
-- ---------------------------------------------------------------------------

create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  logo_path text not null,
  link_url text,
  is_active boolean not null default true,
  created_by uuid not null references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.sponsors is 'Local Sponsoring (VA-05): logo + link shown inside the app.';

create index sponsors_tenant_id_idx on public.sponsors (tenant_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.penalty_catalog enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.sponsors enable row level security;

-- penalty_catalog: any tenant member can see it (so they know the tariff),
-- only owner/admin maintain it.
create policy "penalty_catalog_select_tenant_members" on public.penalty_catalog
  for select
  to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "penalty_catalog_write_admins" on public.penalty_catalog
  for all
  to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]));

-- ledger_entries: a member sees their own entries; tenant admins see every
-- entry; a team captain sees entries scoped to their own team. Writes are
-- restricted the same way, except the member_id column is immutable in
-- practice (no update policy touches it) and payment fields are only ever
-- written by the service-role webhook, which bypasses RLS entirely.
create policy "ledger_entries_select_own_or_managers" on public.ledger_entries
  for select
  to authenticated
  using (
    member_id = auth.uid()
    or public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[])
    or (team_id is not null and public.can_manage_team(team_id))
  );

create policy "ledger_entries_insert_managers" on public.ledger_entries
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[])
      or (team_id is not null and public.can_manage_team(team_id))
    )
  );

create policy "ledger_entries_update_managers" on public.ledger_entries
  for update
  to authenticated
  using (
    public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[])
    or (team_id is not null and public.can_manage_team(team_id))
  )
  with check (
    public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[])
    or (team_id is not null and public.can_manage_team(team_id))
  );

create policy "ledger_entries_delete_managers" on public.ledger_entries
  for delete
  to authenticated
  using (
    public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[])
    or (team_id is not null and public.can_manage_team(team_id))
  );

-- sponsors: visible to tenant members, maintained by owner/admin.
create policy "sponsors_select_tenant_members" on public.sponsors
  for select
  to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "sponsors_write_admins" on public.sponsors
  for all
  to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]));

-- ---------------------------------------------------------------------------
-- Storage: sponsor logos
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('sponsor-logos', 'sponsor-logos', true)
on conflict (id) do nothing;

-- Objects are stored as "{tenant_id}/{filename}"; only owner/admin of that
-- tenant may write, everyone (including anon, since the bucket is public
-- and logos are marketing material, not personal data) may read.
create policy "sponsor_logos_public_read" on storage.objects
  for select
  to public
  using (bucket_id = 'sponsor-logos');

create policy "sponsor_logos_admin_write" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'sponsor-logos'
    and public.has_tenant_role(((storage.foldername(name))[1])::uuid, array['owner', 'admin']::public.app_role[])
  );

create policy "sponsor_logos_admin_update" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'sponsor-logos'
    and public.has_tenant_role(((storage.foldername(name))[1])::uuid, array['owner', 'admin']::public.app_role[])
  );

create policy "sponsor_logos_admin_delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'sponsor-logos'
    and public.has_tenant_role(((storage.foldername(name))[1])::uuid, array['owner', 'admin']::public.app_role[])
  );
