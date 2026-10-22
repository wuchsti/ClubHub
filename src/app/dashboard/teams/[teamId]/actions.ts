"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext } from "@/lib/membership";

function fail(teamId: string, message: string): never {
  redirect(`/dashboard/teams/${teamId}?error=${encodeURIComponent(message)}`);
}

export async function addTeamMember(formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "");
  const userId = String(formData.get("userId") ?? "");

  if (!teamId || !userId) {
    fail(teamId, "Bitte ein Mitglied auswählen.");
  }

  await getMembershipContext();
  const supabase = await createClient();
  const { error } = await supabase.from("team_members").insert({ team_id: teamId, user_id: userId });

  if (error) {
    fail(teamId, "Mitglied konnte nicht hinzugefügt werden.");
  }

  revalidatePath(`/dashboard/teams/${teamId}`);
  redirect(`/dashboard/teams/${teamId}`);
}

export async function removeTeamMember(formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "");
  const userId = String(formData.get("userId") ?? "");

  if (!teamId || !userId) {
    fail(teamId, "Ungültige Anfrage.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) {
    fail(teamId, "Mitglied konnte nicht entfernt werden.");
  }

  revalidatePath(`/dashboard/teams/${teamId}`);
  redirect(`/dashboard/teams/${teamId}`);
}

export async function setTeamMemberRole(formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "member");

  if (!teamId || !userId || (role !== "captain" && role !== "member")) {
    fail(teamId, "Ungültige Anfrage.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("team_members")
    .update({ role })
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) {
    fail(teamId, "Rolle konnte nicht geändert werden.");
  }

  revalidatePath(`/dashboard/teams/${teamId}`);
  redirect(`/dashboard/teams/${teamId}`);
}
