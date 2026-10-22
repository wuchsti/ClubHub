"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import type { TenantPlan } from "@/types/database";

function fail(tenantId: string, message: string): never {
  redirect(`/admin/tenants/${tenantId}?error=${encodeURIComponent(message)}`);
}

const VALID_PLANS: TenantPlan[] = ["starter", "pro", "allin"];

export async function setTenantPlan(formData: FormData) {
  await requirePlatformAdmin();
  const tenantId = String(formData.get("tenantId") ?? "");
  const plan = String(formData.get("plan") ?? "") as TenantPlan;
  const validUntilRaw = String(formData.get("validUntil") ?? "").trim();

  if (!tenantId) {
    redirect("/admin");
  }

  if (!VALID_PLANS.includes(plan)) {
    fail(tenantId, "Bitte einen gültigen Tarif wählen.");
  }

  let planValidUntil: string | null = null;
  if (validUntilRaw) {
    const parsed = new Date(`${validUntilRaw}T23:59:59`);
    if (Number.isNaN(parsed.getTime())) {
      fail(tenantId, "Ungültiges Datum.");
    }
    planValidUntil = parsed.toISOString();
  }

  const limits = PLAN_LIMITS[plan];
  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      plan,
      member_limit: limits.members,
      team_limit: limits.teams,
      plan_valid_until: planValidUntil,
    })
    .eq("id", tenantId);

  if (error) {
    fail(tenantId, "Tarif konnte nicht gesetzt werden.");
  }

  revalidatePath(`/admin/tenants/${tenantId}`);
  revalidatePath("/admin");
  redirect(`/admin/tenants/${tenantId}`);
}

export async function updateMemberLimit(formData: FormData) {
  await requirePlatformAdmin();
  const tenantId = String(formData.get("tenantId") ?? "");
  const memberLimit = Number.parseInt(String(formData.get("memberLimit") ?? ""), 10);

  if (!tenantId || !Number.isFinite(memberLimit) || memberLimit < 1) {
    fail(tenantId, "Bitte ein gültiges Limit angeben.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tenants").update({ member_limit: memberLimit }).eq("id", tenantId);

  if (error) {
    fail(tenantId, "Limit konnte nicht gespeichert werden.");
  }

  revalidatePath(`/admin/tenants/${tenantId}`);
  redirect(`/admin/tenants/${tenantId}`);
}

export async function setTenantSuspended(formData: FormData) {
  await requirePlatformAdmin();
  const tenantId = String(formData.get("tenantId") ?? "");
  const suspended = String(formData.get("suspended") ?? "") === "true";

  if (!tenantId) {
    redirect("/admin");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({ is_suspended: suspended, suspended_at: suspended ? new Date().toISOString() : null })
    .eq("id", tenantId);

  if (error) {
    fail(tenantId, "Status konnte nicht geändert werden.");
  }

  revalidatePath(`/admin/tenants/${tenantId}`);
  revalidatePath("/admin");
  redirect(`/admin/tenants/${tenantId}`);
}
