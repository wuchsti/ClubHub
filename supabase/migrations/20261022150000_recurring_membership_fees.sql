-- Recurring Vereinsbeitrag/Spartenbeitrag: a plan (amount + monthly/yearly
-- interval), scoped tenant-wide or to one Sparte, that members subscribe to
-- once via Stripe Checkout (subscription mode, destination charge to the
-- tenant's Connect account - same pattern as the existing one-off
-- Kassenbuch payments, so no separate Connect webhook setup is needed).
-- membership_subscriptions is kept in sync from Stripe webhook events only;
-- there is deliberately no insert/update policy for authenticated users.

create table public.membership_fee_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  team_id uuid references public.teams (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  amount_cents integer not null check (amount_cents > 0),
  interval text not null check (interval in ('month', 'year')),
  stripe_price_id text,
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.membership_fee_plans is 'A recurring Vereinsbeitrag (team_id null) or Spartenbeitrag (team_id set) members can subscribe to.';

create index membership_fee_plans_tenant_id_idx on public.membership_fee_plans (tenant_id);
create index membership_fee_plans_team_id_idx on public.membership_fee_plans (team_id);

create table public.membership_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  plan_id uuid not null references public.membership_fee_plans (id) on delete cascade,
  member_id uuid not null references auth.users (id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  status text not null default 'incomplete',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, member_id)
);

comment on table public.membership_subscriptions is 'A member''s subscription to a membership_fee_plan; status/current_period_end are mirrored from Stripe webhook events, never written by the client directly.';

create index membership_subscriptions_tenant_id_idx on public.membership_subscriptions (tenant_id);
create index membership_subscriptions_member_id_idx on public.membership_subscriptions (member_id);
create index membership_subscriptions_plan_id_idx on public.membership_subscriptions (plan_id);

create trigger membership_subscriptions_set_updated_at
  before update on public.membership_subscriptions
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.membership_fee_plans to authenticated;
grant select on public.membership_subscriptions to authenticated;

alter table public.membership_fee_plans enable row level security;
alter table public.membership_subscriptions enable row level security;

-- fee plans: any tenant member sees vereinsweite plans; any member of the
-- Sparte sees that Sparte's plan. Managed by Vorstand/Admin (any scope) or
-- a team's own captain (their Sparte only).
create policy "membership_fee_plans_select_visible" on public.membership_fee_plans
  for select
  to authenticated
  using (
    (team_id is null and public.is_tenant_member(tenant_id))
    or (
      team_id is not null
      and exists (
        select 1 from public.team_members tm
        where tm.team_id = membership_fee_plans.team_id and tm.user_id = auth.uid()
      )
    )
  );

create policy "membership_fee_plans_insert_managers" on public.membership_fee_plans
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      (team_id is null and public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]))
      or (team_id is not null and public.can_manage_team(team_id))
    )
  );

create policy "membership_fee_plans_update_managers" on public.membership_fee_plans
  for update
  to authenticated
  using (
    (team_id is null and public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]))
    or (team_id is not null and public.can_manage_team(team_id))
  )
  with check (
    (team_id is null and public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]))
    or (team_id is not null and public.can_manage_team(team_id))
  );

create policy "membership_fee_plans_delete_managers" on public.membership_fee_plans
  for delete
  to authenticated
  using (
    (team_id is null and public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]))
    or (team_id is not null and public.can_manage_team(team_id))
  );

-- subscriptions: a member sees their own; Vorstand/Admin sees every
-- subscription in the tenant; a team captain sees subscriptions to their
-- own Sparte's plan.
create policy "membership_subscriptions_select_own_or_managers" on public.membership_subscriptions
  for select
  to authenticated
  using (
    member_id = auth.uid()
    or public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[])
    or exists (
      select 1 from public.membership_fee_plans p
      where p.id = membership_subscriptions.plan_id
        and p.team_id is not null
        and public.can_manage_team(p.team_id)
    )
  );
