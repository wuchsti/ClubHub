-- Team-Pinnwand: short announcements, either tenant-wide (team_id null,
-- posted by Vorstand/Admin) or scoped to one Sparte (posted by that team's
-- captain, or by Vorstand/Admin on behalf of any Sparte).

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  team_id uuid references public.teams (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.announcements is 'Team-Pinnwand entries: tenant-wide when team_id is null, otherwise scoped to one Sparte.';

create index announcements_tenant_id_idx on public.announcements (tenant_id);
create index announcements_team_id_idx on public.announcements (team_id);

grant select, insert, delete on public.announcements to authenticated;

alter table public.announcements enable row level security;

-- Visible to any tenant member (tenant-wide entries) or to members of the
-- specific Sparte the entry is scoped to.
create policy "announcements_select_visible" on public.announcements
  for select
  to authenticated
  using (
    (team_id is null and public.is_tenant_member(tenant_id))
    or (
      team_id is not null
      and exists (
        select 1 from public.team_members tm
        where tm.team_id = announcements.team_id and tm.user_id = auth.uid()
      )
    )
  );

-- Vorstand/Admin may post tenant-wide or to any Sparte; a team captain may
-- only post to their own Sparte.
create policy "announcements_insert_managers" on public.announcements
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      (team_id is null and public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]))
      or (team_id is not null and public.can_manage_team(team_id))
    )
  );

create policy "announcements_delete_managers" on public.announcements
  for delete
  to authenticated
  using (
    (team_id is null and public.has_tenant_role(tenant_id, array['owner', 'admin']::public.app_role[]))
    or (team_id is not null and public.can_manage_team(team_id))
  );
