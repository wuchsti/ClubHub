import type { TenantPlan } from "@/types/database";

/** Keep in sync with the Starter/Pro/All-In defaults set in the DB migrations. */
export const PLAN_LIMITS: Record<TenantPlan, { members: number; teams: number }> = {
  starter: { members: 10, teams: 1 },
  pro: { members: 100_000, teams: 100_000 },
  allin: { members: 100_000, teams: 100_000 },
};
