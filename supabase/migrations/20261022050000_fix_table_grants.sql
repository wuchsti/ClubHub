-- Fix: "permission denied for table X" (SQLSTATE 42501) observed on a live
-- project even though RLS policies were correctly in place. Row Level
-- Security only governs *which rows* a role can touch; the role first
-- needs the underlying GRANT on the table itself, which some Supabase
-- project setups do not apply automatically for tables created via custom
-- migrations/SQL editor. These grants restore that baseline - RLS (already
-- enabled on every one of these tables) remains the real security boundary.

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.tenants,
  public.profiles,
  public.memberships,
  public.teams,
  public.team_members,
  public.events,
  public.event_rsvps,
  public.invites,
  public.penalty_catalog,
  public.ledger_entries,
  public.sponsors,
  public.platform_sponsors,
  public.push_subscriptions
to authenticated;
