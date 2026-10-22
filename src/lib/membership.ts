import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    .select("name, slug")
    .eq("id", membership.tenant_id)
    .single();

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
