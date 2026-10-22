import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext, isTenantManager } from "@/lib/membership";
import { currentTimestamp } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const membership = await getMembershipContext();
  const supabase = await createClient();

  const { data: allTeams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("tenant_id", membership.tenantId);

  const teamNameById = new Map((allTeams ?? []).map((team) => [team.id, team.name]));

  let visibleTeamIds: string[];

  if (isTenantManager(membership.role)) {
    visibleTeamIds = (allTeams ?? []).map((team) => team.id);
  } else {
    const { data: myTeams } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", membership.userId);
    visibleTeamIds = (myTeams ?? []).map((row) => row.team_id);
  }

  const { data: events } = visibleTeamIds.length
    ? await supabase
        .from("events")
        .select("id, team_id, type, title, location, starts_at")
        .in("team_id", visibleTeamIds)
        .order("starts_at", { ascending: true })
    : { data: [] };

  const now = currentTimestamp();
  const upcoming = (events ?? []).filter((event) => new Date(event.starts_at).getTime() >= now);
  const past = (events ?? [])
    .filter((event) => new Date(event.starts_at).getTime() < now)
    .reverse();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Termine</h1>
          <p className="text-muted-foreground">Trainings, Punktspiele & Events deiner Sparten.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/events/new">
            <Plus />
            Neuer Termin
          </Link>
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Kommende Termine</h2>
        {upcoming.map((event) => (
          <EventRow key={event.id} event={event} teamName={teamNameById.get(event.team_id)} />
        ))}
        {!upcoming.length ? (
          <p className="text-sm text-muted-foreground">Keine kommenden Termine.</p>
        ) : null}
      </div>

      {past.length ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Vergangene Termine</h2>
          {past.slice(0, 10).map((event) => (
            <EventRow key={event.id} event={event} teamName={teamNameById.get(event.team_id)} muted />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function EventRow({
  event,
  teamName,
  muted,
}: {
  event: { id: string; type: string; title: string; location: string | null; starts_at: string };
  teamName?: string;
  muted?: boolean;
}) {
  return (
    <Link href={`/dashboard/events/${event.id}`}>
      <Card className={muted ? "opacity-70 transition-colors hover:opacity-100" : "hover:border-foreground/30"}>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <CalendarDays className="size-5 text-muted-foreground" />
          <div className="flex-1">
            <CardTitle className="text-base">{event.title}</CardTitle>
            <CardDescription>
              {teamName ? `${teamName} · ` : ""}
              {new Date(event.starts_at).toLocaleString("de-DE", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {event.location ? ` · ${event.location}` : ""}
            </CardDescription>
          </div>
          <Badge variant="outline">{TYPE_LABELS[event.type] ?? event.type}</Badge>
        </CardHeader>
        <CardContent />
      </Card>
    </Link>
  );
}
