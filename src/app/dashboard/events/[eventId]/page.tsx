import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Car, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext } from "@/lib/membership";
import { upsertRsvp } from "./actions";
import { RsvpWidget } from "@/components/rsvp-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const TYPE_LABELS: Record<string, string> = {
  training: "Training",
  game: "Punktspiel",
  event: "Event",
};

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { eventId } = await params;
  const { error } = await searchParams;
  const membership = await getMembershipContext();
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, team_id, type, title, location, starts_at, rsvp_deadline, notes")
    .eq("id", eventId)
    .single();

  if (!event) {
    notFound();
  }

  const { data: team } = await supabase.from("teams").select("name").eq("id", event.team_id).single();

  const { data: rsvps } = await supabase
    .from("event_rsvps")
    .select("user_id, status, decline_reason, carpool_seats")
    .eq("event_id", eventId);

  const userIds = (rsvps ?? []).map((rsvp) => rsvp.user_id);
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] };
  const nameById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.full_name || profile.email])
  );

  const own = (rsvps ?? []).find((rsvp) => rsvp.user_id === membership.userId) ?? null;
  const going = (rsvps ?? []).filter((rsvp) => rsvp.status === "yes");
  const declined = (rsvps ?? []).filter((rsvp) => rsvp.status === "no");
  const maybe = (rsvps ?? []).filter((rsvp) => rsvp.status === "maybe");
  const totalCarpoolSeats = going.reduce((sum, rsvp) => sum + (rsvp.carpool_seats ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard/events">
            <ArrowLeft />
            Zurück zu Terminen
          </Link>
        </Button>
        <div className="mt-2 flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
          <Badge variant="outline">{TYPE_LABELS[event.type] ?? event.type}</Badge>
        </div>
        <p className="text-muted-foreground">
          {team?.name ? `${team.name} · ` : ""}
          {new Date(event.starts_at).toLocaleString("de-DE", {
            dateStyle: "full",
            timeStyle: "short",
          })}
        </p>
        {event.location ? (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {event.location}
          </p>
        ) : null}
        {event.notes ? <p className="mt-2 text-sm">{event.notes}</p> : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Deine Rückmeldung</CardTitle>
          <CardDescription>
            {event.rsvp_deadline
              ? `Bitte bis ${new Date(event.rsvp_deadline).toLocaleString("de-DE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })} zurückmelden.`
              : "Sag Bescheid, ob du dabei bist."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RsvpWidget
            eventId={eventId}
            action={upsertRsvp}
            initialStatus={own?.status ?? null}
            initialCarpoolSeats={own?.carpool_seats ?? null}
            initialDeclineReason={own?.decline_reason ?? null}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dabei ({going.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            {going.map((rsvp) => (
              <span key={rsvp.user_id}>{nameById.get(rsvp.user_id) ?? rsvp.user_id}</span>
            ))}
            {totalCarpoolSeats > 0 ? (
              <span className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Car className="size-3.5" />
                {totalCarpoolSeats} freie Plätze im Auto
              </span>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Absagen ({declined.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            {declined.map((rsvp) => (
              <span key={rsvp.user_id}>
                {nameById.get(rsvp.user_id) ?? rsvp.user_id}
                {rsvp.decline_reason ? ` – ${rsvp.decline_reason}` : ""}
              </span>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Unsicher ({maybe.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            {maybe.map((rsvp) => (
              <span key={rsvp.user_id}>{nameById.get(rsvp.user_id) ?? rsvp.user_id}</span>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
