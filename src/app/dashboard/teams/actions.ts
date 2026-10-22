"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext, isTenantManager } from "@/lib/membership";

export async function createTeam(formData: FormData) {
  const membership = await getMembershipContext();

  if (!isTenantManager(membership.role)) {
    redirect("/dashboard/teams?error=" + encodeURIComponent("Nur Vorstand/Admin kann Sparten anlegen."));
  }

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    redirect("/dashboard/teams?error=" + encodeURIComponent("Bitte einen Namen angeben."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("teams").insert({
    tenant_id: membership.tenantId,
    name,
    created_by: membership.userId,
  });

  if (error) {
    const message =
      error.code === "CH010"
        ? "Sparten-Limit erreicht. Upgrade auf Pro Team für mehr Sparten."
        : "Sparte konnte nicht angelegt werden.";
    redirect("/dashboard/teams?error=" + encodeURIComponent(message));
  }

  revalidatePath("/dashboard/teams");
  redirect("/dashboard/teams");
}
