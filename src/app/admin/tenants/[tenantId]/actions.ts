"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/platform-admin";

function fail(tenantId: string, message: string): never {
  redirect(`/admin/tenants/${tenantId}?error=${encodeURIComponent(message)}`);
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
