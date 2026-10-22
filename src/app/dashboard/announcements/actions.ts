"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext, isTenantManager } from "@/lib/membership";

function fail(message: string): never {
  redirect(`/dashboard?error=${encodeURIComponent(message)}`);
}

export async function createAnnouncement(formData: FormData) {
  const membership = await getMembershipContext();
  const teamId = String(formData.get("teamId") ?? "").trim() || null;
  const body = String(formData.get("body") ?? "").trim();

  if (!body) {
    fail("Bitte einen Text für die Ankündigung angeben.");
  }

  if (teamId === null && !isTenantManager(membership.role)) {
    fail("Nur Vorstand/Admin kann vereinsweite Ankündigungen posten.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert({
    tenant_id: membership.tenantId,
    team_id: teamId,
    body,
    created_by: membership.userId,
  });

  if (error) {
    fail("Ankündigung konnte nicht gepostet werden.");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteAnnouncement(formData: FormData) {
  const announcementId = String(formData.get("announcementId") ?? "");

  if (!announcementId) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  await supabase.from("announcements").delete().eq("id", announcementId);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
