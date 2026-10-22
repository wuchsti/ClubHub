"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext } from "@/lib/membership";
import type { EventType } from "@/types/database";

const VALID_TYPES: EventType[] = ["training", "game", "event"];

export async function createEvent(formData: FormData) {
  const membership = await getMembershipContext();

  const teamId = String(formData.get("teamId") ?? "");
  const type = String(formData.get("type") ?? "training") as EventType;
  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const startsAt = String(formData.get("startsAt") ?? "");
  const rsvpDeadline = String(formData.get("rsvpDeadline") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!teamId || !title || !startsAt || !VALID_TYPES.includes(type)) {
    redirect(
      `/dashboard/events/new?error=${encodeURIComponent(
        "Bitte Sparte, Titel und Datum angeben."
      )}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    team_id: teamId,
    type,
    title,
    location: location || null,
    starts_at: new Date(startsAt).toISOString(),
    rsvp_deadline: rsvpDeadline ? new Date(rsvpDeadline).toISOString() : null,
    notes: notes || null,
    created_by: membership.userId,
  });

  if (error) {
    redirect(
      `/dashboard/events/new?error=${encodeURIComponent(
        "Termin konnte nicht angelegt werden. Hast du Rechte für diese Sparte?"
      )}`
    );
  }

  redirect("/dashboard/events");
}
