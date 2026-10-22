import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import { currentTimestamp } from "@/lib/time";
import type { AppRole } from "@/types/database";

export type MembershipContext = {
  userId: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: AppRole;
};

/**
 * Resolves the current user's tenant membership once per request (React
 * `cache`), so the dashboard layout and any nested page can call this
 * without re-querying Supabase for the same data.
 */
export const getMembershipContext = cache(async (): Promise<MembershipContext> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("role, tenant_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, slug, is_suspended, plan, plan_valid_until")
    .eq("id", membership.tenant_id)
    .single();

  // A manually-granted (non-Stripe) plan can carry a term. Once it lapses,
  // revert to Starter right here - the next page load by anyone in this
  // tenant is what enforces it, no cron job needed.
  if (
    tenant &&
    tenant.plan !== "starter" &&
    tenant.plan_valid_until &&
    new Date(tenant.plan_valid_until).getTime() < currentTimestamp()
  ) {
    const starterLimits = PLAN_LIMITS.starter;
    await supabase
      .from("tenants")
      .update({
        plan: "starter",
        member_limit: starterLimits.members,
        team_limit: starterLimits.teams,
        plan_valid_until: null,
      })
      .eq("id", membership.tenant_id);
  }

  if (tenant?.is_suspended) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_platform_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_platform_admin) {
      redirect("/suspended");
    }
  }

  return {
    userId: user.id,
    tenantId: membership.tenant_id,
    tenantName: tenant?.name ?? "Mein Verein",
    tenantSlug: tenant?.slug ?? "",
    role: membership.role,
  };
});

export function isTenantManager(role: AppRole): boolean {
  return role === "owner" || role === "admin";
}
