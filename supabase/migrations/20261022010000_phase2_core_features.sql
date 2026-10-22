-- Phase 2: Core Features (Termine & Kader-Logik)
-- Adds Sparten/Teams, team membership, Termine (events), RSVPs with a
-- carpool counter, and an invite-link system for fast onboarding into a
-- team (VA-01, VA-02, VA-03).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.team_role as enum ('captain', 'member');
create type public.event_type as enum ('training', 'game', 'event');
create type public.rsvp_status as enum ('yes', 'no', 'maybe');

-- ---------------------------------------------------------------------------
-- Teams (= Sparten, e.g. "1. Herren Dart", "Jugend A")
-- ---------------------------------------------------------------------------

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  created_by uuid not null references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.teams is 'A Sparte/team inside a Verein, e.g. "1. Herren Dart".';

create index teams_tenant_id_idx on public.teams (tenant_id);

create trigger teams_set_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Team members (user <-> team, with a team-scoped role)
-- ---------------------------------------------------------------------------

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.team_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

comment on table public.team_members is 'Maps a user to a team; role=captain grants event management for that team only.';

create index team_members_team_id_idx on public.team_members (team_id);
create index team_members_user_id_idx on public.team_members (user_id);

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they can be used from inside RLS
-- policies on the very tables they inspect, without recursive RLS).
-- ---------------------------------------------------------------------------

create function public.team_tenant_id(target_team_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select tenant_id from public.teams where id = target_team_id;
$$;

create function public.is_team_member(target_team_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = target_team_id
      and tm.user_id = auth.uid()
  );
$$;

-- Can the current user manage (create/edit) events and the roster for this
-- team? True for tenant owners/admins, or the team's own captain(s).
create function public.can_manage_team(target_team_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    public.has_tenant_role(public.team_tenant_id(target_team_id), array['owner', 'admin']::public.app_role[])
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = target_team_id
        and tm.user_id = auth.uid()
        and tm.role = 'captain'
    );
$$;

-- Can the current user see this team at all (member of it, or a tenant
-- owner/admin who can see every Sparte)?
create function public.can_view_team(target_team_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    public.is_team_member(target_team_id)
    or public.has_tenant_role(public.team_tenant_id(target_team_id), array['owner', 'admin']::public.app_role[]);
$$;

revoke all on function public.team_tenant_id(uuid) from public;
revoke all on function public.is_team_member(uuid) from public;
revoke all on function public.can_manage_team(uuid) from public;
revoke all on function public.can_view_team(uuid) from public;
grant execute on function public.team_tenant_id(uuid) to authenticated;
grant execute on function public.is_team_member(uuid) to authenticated;
grant execute on function public.can_manage_team(uuid) to authenticated;
grant execute on function public.can_view_team(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Events (= Termine: Training, Punktspiel, Event)
-- ---------------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  type public.event_type not null default 'training',
  title text not null check (char_length(trim(title)) > 0),
  location text,
  starts_at timestamptz not null,
  rsvp_deadline timestamptz,
  notes text,
  created_by uuid not null references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.events is 'A Termin (training, game or event) belonging to one team.';

create index events_team_id_idx on public.events (team_id);
create index events_starts_at_idx on public.events (starts_at);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create function public.can_view_event(target_event_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.can_view_team(e.team_id)
  from public.events e
  where e.id = target_event_id;
$$;

revoke all on function public.can_view_event(uuid) from public;
grant execute on function public.can_view_event(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Event RSVPs (Zusage / Absage / Unsicher + Fahrgemeinschaften-Counter)
-- ---------------------------------------------------------------------------

create table public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status public.rsvp_status not null,
  decline_reason text,
  carpool_seats integer check (carpool_seats is null or carpool_seats >= 0),
  responded_at timestamptz not null default now(),
  unique (event_id, user_id)
);

comment on table public.event_rsvps is 'One members response to one event, including free carpool seats offered.';

create index event_rsvps_event_id_idx on public.event_rsvps (event_id);
create index event_rsvps_user_id_idx on public.event_rsvps (user_id);

-- ---------------------------------------------------------------------------
-- Invites (QR codes / share links for fast onboarding into a team)
-- ---------------------------------------------------------------------------

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  team_id uuid references public.teams (id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  role public.app_role not null default 'member',
  max_uses integer not null default 1 check (max_uses > 0),
  use_count integer not null default 0 check (use_count >= 0),
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_by uuid not null references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.invites is 'A single/multi-use invite token that grants tenant (and optionally team) membership when redeemed.';

create index invites_tenant_id_idx on public.invites (tenant_id);
create index invites_team_id_idx on public.invites (team_id);

create function public.check_invite_team_matches_tenant()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.team_id is not null
    and not exists (
      select 1 from public.teams t
      where t.id = new.team_id and t.tenant_id = new.tenant_id
    )
  then
    raise exception 'invite team_id does not belong to tenant_id';
  end if;
  return new;
end;
$$;

create trigger invites_check_team_matches_tenant
  before insert or update on public.invites
  for each row execute function public.check_invite_team_matches_tenant();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.invites enable row level security;

-- teams: any tenant member can see the Sparten list; only owner/admin create
-- or manage them (team setup is a Vorstand/Spartenleiter responsibility).
create policy "teams_select_tenant_members" on public.teams
  for select
  to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "teams_insert_admins" on public.teams
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[])
  );

create policy "teams_update_admins" on public.teams
  for update
  to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]));

create policy "teams_delete_admins" on public.teams
  for delete
  to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]));

-- team_members: visible to whoever can view the team; managed by whoever can
-- manage the team (tenant admins, or that team's own captain).
create policy "team_members_select_viewable" on public.team_members
  for select
  to authenticated
  using (public.can_view_team(team_id));

create policy "team_members_insert_managers" on public.team_members
  for insert
  to authenticated
  with check (public.can_manage_team(team_id));

create policy "team_members_update_managers" on public.team_members
  for update
  to authenticated
  using (public.can_manage_team(team_id))
  with check (public.can_manage_team(team_id));

create policy "team_members_delete_managers_or_self" on public.team_members
  for delete
  to authenticated
  using (user_id = auth.uid() or public.can_manage_team(team_id));

-- events: visible to whoever can view the team; managed by whoever can
-- manage the team.
create policy "events_select_viewable" on public.events
  for select
  to authenticated
  using (public.can_view_team(team_id));

create policy "events_insert_managers" on public.events
  for insert
  to authenticated
  with check (created_by = auth.uid() and public.can_manage_team(team_id));

create policy "events_update_managers" on public.events
  for update
  to authenticated
  using (public.can_manage_team(team_id))
  with check (public.can_manage_team(team_id));

create policy "events_delete_managers" on public.events
  for delete
  to authenticated
  using (public.can_manage_team(team_id));

-- event_rsvps: visible to anyone who can view the underlying event; a
-- member may only write their own RSVP, and only for an event whose team
-- they belong to (not just "viewable", since tenant admins shouldn't RSVP
-- on behalf of a team they are not playing in).
create policy "event_rsvps_select_viewable" on public.event_rsvps
  for select
  to authenticated
  using (public.can_view_event(event_id));

create policy "event_rsvps_insert_own" on public.event_rsvps
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.events e
      where e.id = event_rsvps.event_id
        and public.is_team_member(e.team_id)
    )
  );

create policy "event_rsvps_update_own" on public.event_rsvps
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "event_rsvps_delete_own" on public.event_rsvps
  for delete
  to authenticated
  using (user_id = auth.uid());

-- invites: visible/manageable by tenant admins, or the captain of the team
-- the invite targets. Redemption happens exclusively through the
-- SECURITY DEFINER `redeem_invite` function below, never via direct table
-- access, so there is intentionally no policy allowing a non-admin to read
-- or use someone else's invite row.
create policy "invites_select_managers" on public.invites
  for select
  to authenticated
  using (
    public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[])
    or (team_id is not null and public.can_manage_team(team_id))
  );

create policy "invites_insert_managers" on public.invites
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[])
      or (team_id is not null and public.can_manage_team(team_id))
    )
  );

create policy "invites_delete_managers" on public.invites
  for delete
  to authenticated
  using (
    public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[])
    or (team_id is not null and public.can_manage_team(team_id))
  );

-- ---------------------------------------------------------------------------
-- Invite redemption RPC
-- ---------------------------------------------------------------------------

create function public.redeem_invite(p_token text)
returns table (tenant_id uuid, team_id uuid, tenant_slug text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites;
  v_uid uuid := auth.uid();
  v_tenant_slug text;
begin
  if v_uid is null then
    raise exception 'authentication required';
  end if;

  select * into v_invite
  from public.invites i
  where i.token = p_token
  for update;

  if v_invite is null then
    raise exception 'invite not found';
  end if;

  if v_invite.expires_at < now() then
    raise exception 'invite expired';
  end if;

  if v_invite.use_count >= v_invite.max_uses then
    raise exception 'invite already used';
  end if;

  insert into public.memberships (tenant_id, user_id, role)
  values (v_invite.tenant_id, v_uid, v_invite.role)
  on conflict (tenant_id, user_id) do nothing;

  if v_invite.team_id is not null then
    insert into public.team_members (team_id, user_id)
    values (v_invite.team_id, v_uid)
    on conflict (team_id, user_id) do nothing;
  end if;

  update public.invites
  set use_count = use_count + 1
  where id = v_invite.id;

  select t.slug into v_tenant_slug from public.tenants t where t.id = v_invite.tenant_id;

  return query select v_invite.tenant_id, v_invite.team_id, v_tenant_slug;
end;
$$;

revoke all on function public.redeem_invite(text) from public;
grant execute on function public.redeem_invite(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Invite preview (safe to call before the visitor has an account: no table
-- grant on `invites` is given, this returns only the minimum needed to
-- render "You've been invited to join X" before redemption.)
-- ---------------------------------------------------------------------------

create function public.invite_preview(p_token text)
returns table (valid boolean, tenant_name text, team_name text)
language sql
security definer
stable
set search_path = public
as $$
  select
    (i.id is not null and i.expires_at > now() and i.use_count < i.max_uses) as valid,
    t.name as tenant_name,
    tm.name as team_name
  from public.invites i
  join public.tenants t on t.id = i.tenant_id
  left join public.teams tm on tm.id = i.team_id
  where i.token = p_token;
$$;

revoke all on function public.invite_preview(text) from public;
grant execute on function public.invite_preview(text) to anon, authenticated;
