"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext } from "@/lib/membership";

const VALIDITY_DAYS: Record<string, number | null> = {
  "7": 7,
  "30": 30,
  "90": 90,
  forever: null,
};

export async function createInvite(formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const validity = String(formData.get("validity") ?? "30");

  if (!teamId) {
    redirect("/dashboard/teams");
  }

  const days = Object.hasOwn(VALIDITY_DAYS, validity) ? VALIDITY_DAYS[validity] : 30;
  const expiresAt = days === null ? null : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const membership = await getMembershipContext();
  const supabase = await createClient();

  const { error } = await supabase.from("invites").insert({
    tenant_id: membership.tenantId,
    team_id: teamId,
    created_by: membership.userId,
    role: "member",
    max_uses: 50,
    label: label || null,
    expires_at: expiresAt,
  });

  if (error) {
    redirect(
      `/dashboard/teams/${teamId}/invite?error=${encodeURIComponent(
        "Einladungslink konnte nicht erstellt werden."
      )}`
    );
  }

  revalidatePath(`/dashboard/teams/${teamId}/invite`);
  redirect(`/dashboard/teams/${teamId}/invite`);
}

export async function revokeInvite(formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "");
  const inviteId = String(formData.get("inviteId") ?? "");

  if (!teamId || !inviteId) {
    redirect("/dashboard/teams");
  }

  const supabase = await createClient();
  await supabase.from("invites").delete().eq("id", inviteId);

  revalidatePath(`/dashboard/teams/${teamId}/invite`);
  redirect(`/dashboard/teams/${teamId}/invite`);
}
