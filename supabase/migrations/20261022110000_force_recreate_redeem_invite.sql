-- The function body has been verified correct (no remaining ambiguous
-- column references) directly against the live database, yet calls kept
-- failing with the exact same pre-fix error - almost certainly a stale
-- prepared statement held by a pooled connection (a known class of issue
-- with PgBouncer/Supavisor transaction-mode pooling + PostgREST's
-- prepared-statement cache, which plain CREATE OR REPLACE doesn't always
-- invalidate). Drop and recreate the function so it gets a brand new OID,
-- forcing any stale cached plan to become invalid.

drop function if exists public.redeem_invite(text);

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
    select 1 from public.memberships m
    where m.tenant_id = v_invite.tenant_id and m.user_id = v_uid
  ) into v_already_member;

  if not v_already_member then
    select t.member_limit into v_member_limit from public.tenants t where t.id = v_invite.tenant_id;
    select count(*) into v_member_count from public.memberships m where m.tenant_id = v_invite.tenant_id;

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

notify pgrst, 'reload schema';
