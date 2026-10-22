"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext } from "@/lib/membership";
import type { RsvpStatus } from "@/types/database";

const VALID_STATUSES: RsvpStatus[] = ["yes", "no", "maybe"];

export async function upsertRsvp(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const status = String(formData.get("status") ?? "") as RsvpStatus;
  const declineReason = String(formData.get("declineReason") ?? "").trim();
  const carpoolSeatsRaw = String(formData.get("carpoolSeats") ?? "");

  if (!eventId || !VALID_STATUSES.includes(status)) {
    redirect(`/dashboard/events/${eventId}?error=${encodeURIComponent("Ungültige Rückmeldung.")}`);
  }

  const membership = await getMembershipContext();
  const supabase = await createClient();

  const parsedSeats = Number.parseInt(carpoolSeatsRaw, 10);
  const carpoolSeats =
    status === "yes" && Number.isFinite(parsedSeats) ? Math.max(0, parsedSeats) : null;

  const { error } = await supabase.from("event_rsvps").upsert(
    {
      event_id: eventId,
      user_id: membership.userId,
      status,
      decline_reason: status === "no" && declineReason ? declineReason : null,
      carpool_seats: carpoolSeats,
      responded_at: new Date().toISOString(),
    },
    { onConflict: "event_id,user_id" }
  );

  if (error) {
    redirect(
      `/dashboard/events/${eventId}?error=${encodeURIComponent("Rückmeldung konnte nicht gespeichert werden.")}`
    );
  }

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath("/dashboard");
  redirect(`/dashboard/events/${eventId}`);
}
