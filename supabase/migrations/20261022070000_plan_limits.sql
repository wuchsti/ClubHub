-- Starter (free) plan: 1 Sparte + 10 Mitglieder included. Pro: effectively
-- unlimited. Limits are stored per-tenant (so platform admins can still
-- override individual tenants) and enforced at the database layer so they
-- can't be bypassed by calling the API/table directly.

alter table public.tenants
  add column team_limit integer not null default 1;

alter table public.tenants
  alter column member_limit set default 10;

-- Existing tenants were bootstrapped before plan limits existed; align them
-- with the new Starter/Pro defaults based on their current plan.
update public.tenants
set member_limit = 10, team_limit = 1
where plan = 'starter';

update public.tenants
set member_limit = 100000, team_limit = 100000
where plan in ('pro', 'allin');

-- ---------------------------------------------------------------------------
-- Sparten (teams) quota: enforced via trigger since teams are created
-- through a normal table insert (RLS-gated), not a SECURITY DEFINER RPC.
-- ---------------------------------------------------------------------------

create function public.check_team_quota()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_team_limit integer;
  v_team_count integer;
begin
  select team_limit into v_team_limit from public.tenants where id = new.tenant_id;
  select count(*) into v_team_count from public.teams where tenant_id = new.tenant_id;

  if v_team_count >= v_team_limit then
    raise exception 'team limit reached' using errcode = 'CH010';
  end if;

  return new;
end;
$$;

create trigger teams_check_quota
  before insert on public.teams
  for each row execute function public.check_team_quota();

-- ---------------------------------------------------------------------------
-- Mitglieder quota: enforced inside redeem_invite, the sole path through
-- which new memberships are created. Re-redeeming an invite you're already
-- a member of (e.g. a stale link) must stay a no-op, never a hard error.
-- ---------------------------------------------------------------------------

create or replace function public.redeem_invite(p_token text)
returns table (tenant_id uuid, team_id uuid, tenant_slug text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites;
  v_uid uuid := auth.uid();
  v_tenant_slug text;
  v_already_member boolean;
  v_member_limit integer;
  v_member_count integer;
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

  select exists (
    select 1 from public.memberships
    where tenant_id = v_invite.tenant_id and user_id = v_uid
  ) into v_already_member;

  if not v_already_member then
    select member_limit into v_member_limit from public.tenants where id = v_invite.tenant_id;
    select count(*) into v_member_count from public.memberships where tenant_id = v_invite.tenant_id;

    if v_member_count >= v_member_limit then
      raise exception 'member limit reached' using errcode = 'CH011';
    end if;
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
