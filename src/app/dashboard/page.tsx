import Link from "next/link";
import { CalendarDays, MapPin, Megaphone, PiggyBank, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext, isTenantManager } from "@/lib/membership";
import { upsertRsvp } from "./events/[eventId]/actions";
import { createAnnouncement, deleteAnnouncement } from "./announcements/actions";
import { RsvpWidget } from "@/components/rsvp-widget";
import { SponsorCard } from "@/components/sponsor-card";
import { formatEuro } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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

  const { data: captainRows } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", membership.userId)
    .eq("role", "captain");

  const captainTeamIds = (captainRows ?? []).map((row) => row.team_id);
  const isManager = isTenantManager(membership.role);
  const canPostAnnouncement = isManager || captainTeamIds.length > 0;

  const { data: postableTeams } = canPostAnnouncement
    ? isManager
      ? await supabase.from("teams").select("id, name").eq("tenant_id", membership.tenantId)
      : await supabase.from("teams").select("id, name").in("id", captainTeamIds)
    : { data: [] };

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, team_id, body, created_by, created_at")
    .eq("tenant_id", membership.tenantId)
    .order("created_at", { ascending: false })
    .limit(5);

  const announcementAuthorIds = [
    ...new Set((announcements ?? []).map((item) => item.created_by).filter((id): id is string => Boolean(id))),
  ];
  const { data: announcementAuthors } = announcementAuthorIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", announcementAuthorIds)
    : { data: [] };
  const authorNameById = new Map(
    (announcementAuthors ?? []).map((profile) => [profile.id, profile.full_name || profile.email])
  );

  const announcementTeamIds = [
    ...new Set((announcements ?? []).map((item) => item.team_id).filter((id): id is string => Boolean(id))),
  ];
  const { data: announcementTeams } = announcementTeamIds.length
    ? await supabase.from("teams").select("id, name").in("id", announcementTeamIds)
    : { data: [] };
  const teamNameById = new Map((announcementTeams ?? []).map((team) => [team.id, team.name]));

  const canDeleteAnnouncement = (teamId: string | null) =>
    teamId === null ? isManager : isManager || captainTeamIds.includes(teamId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Willkommen zurück bei {membership.tenantName}.</p>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
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
              <CardDescription>
                {announcements?.length ? "Neueste Ankündigungen." : "Noch keine Ankündigungen."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {(announcements ?? []).map((item) => (
                <div key={item.id} className="rounded-md border px-3 py-2 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="whitespace-pre-wrap">{item.body}</p>
                    {canDeleteAnnouncement(item.team_id) ? (
                      <form action={deleteAnnouncement}>
                        <input type="hidden" name="announcementId" value={item.id} />
                        <Button type="submit" variant="ghost" size="icon" className="-mt-1 -mr-1 size-6 shrink-0">
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </form>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.team_id ? (teamNameById.get(item.team_id) ?? "Sparte") : "Verein"} ·{" "}
                    {authorNameById.get(item.created_by ?? "") ?? "Unbekannt"} ·{" "}
                    {new Date(item.created_at).toLocaleDateString("de-DE")}
                  </p>
                </div>
              ))}
              {canPostAnnouncement ? (
                <form action={createAnnouncement} className="flex flex-col gap-2 border-t pt-3">
                  <select name="teamId" className="h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs">
                    {isManager ? <option value="">Vereinsweit</option> : null}
                    {(postableTeams ?? []).map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <Textarea name="body" placeholder="Neue Ankündigung…" maxLength={500} required rows={2} />
                  <Button type="submit" size="sm" variant="outline" className="self-start">
                    Posten
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
          <SponsorCard tenantId={membership.tenantId} />
        </div>
      </div>
    </div>
  );
}
