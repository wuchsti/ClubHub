-- `created_by` columns were declared `not null` but also `on delete set
-- null`, a contradiction: deleting a user who created any row in these
-- tables fails with an opaque not-null-violation, because Postgres can't
-- null the column out as the FK action requires. Drop the not-null
-- constraint so deleting a user actually works; the row itself is kept
-- (just with an unknown creator), matching the existing "set null" intent.

alter table public.tenants alter column created_by drop not null;
alter table public.teams alter column created_by drop not null;
alter table public.events alter column created_by drop not null;
alter table public.invites alter column created_by drop not null;
alter table public.penalty_catalog alter column created_by drop not null;
alter table public.ledger_entries alter column created_by drop not null;
alter table public.sponsors alter column created_by drop not null;
alter table public.platform_sponsors alter column created_by drop not null;
