import Link from "next/link";
import { CalendarDays, MapPin, Megaphone, PiggyBank } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext } from "@/lib/membership";
import { upsertRsvp } from "./events/[eventId]/actions";
import { RsvpWidget } from "@/components/rsvp-widget";
import { SponsorCard } from "@/components/sponsor-card";
import { formatEuro } from "@/lib/money";
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

export default async function DashboardPage() {
  const membership = await getMembershipContext();
  const supabase = await createClient();

  const { data: myTeams } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", membership.userId);

  const teamIds = (myTeams ?? []).map((row) => row.team_id);

  const { data: nextEvent } = teamIds.length
    ? await supabase
        .from("events")
        .select("id, type, title, location, starts_at")
        .in("team_id", teamIds)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const { data: ownRsvp } = nextEvent
    ? await supabase
        .from("event_rsvps")
        .select("status, carpool_seats, decline_reason")
        .eq("event_id", nextEvent.id)
        .eq("user_id", membership.userId)
        .maybeSingle()
    : { data: null };

  const { data: openEntries } = await supabase
    .from("ledger_entries")
    .select("amount_cents")
    .eq("member_id", membership.userId)
    .eq("status", "open");

  const openTotalCents = (openEntries ?? []).reduce((sum, entry) => sum + entry.amount_cents, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Willkommen zurück bei {membership.tenantName}.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="sm:col-span-2">
          <CardHeader>
            <CalendarDays className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Nächster Termin</CardTitle>
            {nextEvent ? (
              <CardDescription>
                {TYPE_LABELS[nextEvent.type] ?? nextEvent.type} · {nextEvent.title}
                <br />
                {new Date(nextEvent.starts_at).toLocaleString("de-DE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {nextEvent.location ? (
                  <>
                    {" "}
                    ·{" "}
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {nextEvent.location}
                    </span>
                  </>
                ) : null}
              </CardDescription>
            ) : (
              <CardDescription>Noch keine Termine angelegt.</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {nextEvent ? (
              <>
                <RsvpWidget
                  eventId={nextEvent.id}
                  action={upsertRsvp}
                  initialStatus={ownRsvp?.status ?? null}
                  initialCarpoolSeats={ownRsvp?.carpool_seats ?? null}
                  initialDeclineReason={ownRsvp?.decline_reason ?? null}
                />
                <Link
                  href={`/dashboard/events/${nextEvent.id}`}
                  className="mt-3 inline-block text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  Alle Rückmeldungen ansehen
                </Link>
              </>
            ) : null}
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <PiggyBank className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Offene Beträge</CardTitle>
              <CardDescription>
                {openTotalCents > 0 ? formatEuro(openTotalCents) : "Keine offenen Posten."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {openTotalCents > 0 ? (
                <Link
                  href="/dashboard/finance"
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  Jetzt bezahlen
                </Link>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Megaphone className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Team-Pinnwand</CardTitle>
              <CardDescription>Noch keine Ankündigungen.</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
          <SponsorCard tenantId={membership.tenantId} />
        </div>
      </div>
    </div>
  );
}
