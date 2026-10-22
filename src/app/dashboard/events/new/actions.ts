"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getMembershipContext } from "@/lib/membership";
import { sendPushToSubscriptions } from "@/lib/web-push";
import { getSiteUrl } from "@/lib/site-url";
import type { EventType } from "@/types/database";

const VALID_TYPES: EventType[] = ["training", "game", "event"];

const TYPE_LABELS: Record<EventType, string> = {
  training: "Training",
  game: "Punktspiel",
  event: "Event",
};

async function notifyTeamOfNewEvent(params: {
  eventId: string;
  teamId: string;
  teamName: string;
  type: EventType;
  title: string;
  createdBy: string;
}) {
  try {
    const service = createServiceClient();
    const { data: members } = await service
      .from("team_members")
      .select("user_id")
      .eq("team_id", params.teamId)
      .neq("user_id", params.createdBy);

    const memberIds = (members ?? []).map((m) => m.user_id);
    if (!memberIds.length) return;

    const { data: subscriptions } = await service
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth_key")
      .in("user_id", memberIds);

    if (!subscriptions?.length) return;

    const { expiredIds } = await sendPushToSubscriptions(subscriptions, {
      title: `Neuer Termin: ${params.teamName}`,
      body: `${TYPE_LABELS[params.type]} · ${params.title}`,
      url: `${getSiteUrl()}/dashboard/events/${params.eventId}`,
    });

    if (expiredIds.length) {
      await service.from("push_subscriptions").delete().in("id", expiredIds);
    }
  } catch {
    // Push notifications are best-effort; never block event creation on them.
  }
}

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
  const { data: event, error } = await supabase
    .from("events")
    .insert({
      team_id: teamId,
      type,
      title,
      location: location || null,
      starts_at: new Date(startsAt).toISOString(),
      rsvp_deadline: rsvpDeadline ? new Date(rsvpDeadline).toISOString() : null,
      notes: notes || null,
      created_by: membership.userId,
    })
    .select("id")
    .single();

  if (error || !event) {
    redirect(
      `/dashboard/events/new?error=${encodeURIComponent(
        "Termin konnte nicht angelegt werden. Hast du Rechte für diese Sparte?"
      )}`
    );
  }

  const { data: team } = await supabase.from("teams").select("name").eq("id", teamId).single();

  await notifyTeamOfNewEvent({
    eventId: event.id,
    teamId,
    teamName: team?.name ?? "ClubHub",
    type,
    title,
    createdBy: membership.userId,
  });

  redirect("/dashboard/events");
}
