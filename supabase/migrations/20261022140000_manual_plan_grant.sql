-- Lets a platform admin grant a tenant Pro/All-In manually (e.g. a
-- comped/partner club), optionally for a fixed term. When set, the term is
-- enforced lazily the next time anyone from that tenant loads the app (see
-- getMembershipContext): it's checked and, if lapsed, reverted back to
-- Starter right there - no cron job needed.

alter table public.tenants
  add column plan_valid_until timestamptz;
