-- Let an invite either expire after a chosen period or never expire, give it
-- an optional human-readable label (so a board member can tell two active
-- links apart), and record which invite a member actually joined through.

alter table public.invites
  alter column expires_at drop not null;

alter table public.invites
  add column label text;

alter table public.memberships
  add column redeemed_by_invite_id uuid references public.invites (id) on delete set null;

alter table public.team_members
  add column redeemed_by_invite_id uuid references public.invites (id) on delete set null;

-- ---------------------------------------------------------------------------
-- redeem_invite: treat a null expires_at as "never expires", and stamp the
-- invite used onto the resulting membership/team_members rows.
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

  if v_invite.expires_at is not null and v_invite.expires_at < now() then
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

  insert into public.memberships (tenant_id, user_id, role, redeemed_by_invite_id)
  values (v_invite.tenant_id, v_uid, v_invite.role, v_invite.id)
  on conflict (tenant_id, user_id) do nothing;

  if v_invite.team_id is not null then
    insert into public.team_members (team_id, user_id, redeemed_by_invite_id)
    values (v_invite.team_id, v_uid, v_invite.id)
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
-- invite_preview: a null expires_at means the invite never expires.
-- ---------------------------------------------------------------------------

create or replace function public.invite_preview(p_token text)
returns table (valid boolean, tenant_name text, team_name text)
language sql
security definer
stable
set search_path = public
as $$
  select
    (i.id is not null and (i.expires_at is null or i.expires_at > now()) and i.use_count < i.max_uses) as valid,
    t.name as tenant_name,
    tm.name as team_name
  from public.invites i
  join public.tenants t on t.id = i.tenant_id
  left join public.teams tm on tm.id = i.team_id
  where i.token = p_token;
$$;

revoke all on function public.invite_preview(text) from public;
grant execute on function public.invite_preview(text) to anon, authenticated;
