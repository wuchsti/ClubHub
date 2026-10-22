import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext, isTenantManager } from "@/lib/membership";
import { createEvent } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "training", label: "Training" },
  { value: "game", label: "Punktspiel" },
  { value: "event", label: "Event" },
];

export default async function NewEventPage({
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
    .eq("tenant_id", membership.tenantId)
    .order("name", { ascending: true });

  let manageableTeams = allTeams ?? [];

  if (!isTenantManager(membership.role)) {
    const { data: captainRows } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", membership.userId)
      .eq("role", "captain");

    const captainTeamIds = new Set((captainRows ?? []).map((row) => row.team_id));
    manageableTeams = manageableTeams.filter((team) => captainTeamIds.has(team.id));
  }

  if (!manageableTeams.length) {
    redirect(
      `/dashboard/events?error=${encodeURIComponent(
        "Du bist für keine Sparte Admin oder Kapitän und kannst daher keine Termine anlegen."
      )}`
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Neuer Termin</h1>
        <p className="text-muted-foreground">Training, Punktspiel oder Event anlegen.</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Termindetails</CardTitle>
          <CardDescription>Mitglieder der Sparte können danach zu- oder absagen.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createEvent} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="teamId">Sparte</Label>
              <select
                id="teamId"
                name="teamId"
                required
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
              >
                {manageableTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Art</Label>
              <select
                id="type"
                name="type"
                defaultValue="training"
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Titel</Label>
              <Input id="title" name="title" placeholder="z. B. Punktspiel vs. TSV Nordlicht" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="location">Ort</Label>
              <Input id="location" name="location" placeholder="z. B. Mühlenweg 8, Hamburg-Altona" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="startsAt">Datum & Uhrzeit</Label>
              <Input id="startsAt" name="startsAt" type="datetime-local" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rsvpDeadline">
                Rückmelde-Deadline <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="rsvpDeadline" name="rsvpDeadline" type="datetime-local" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">
                Notizen <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="notes" name="notes" placeholder="z. B. Trikot mitbringen" />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="mt-2">
              Termin anlegen
            </Button>
          </form>
        </CardContent>
      </Card>

      <Link href="/dashboard/events" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        Zurück zu allen Terminen
      </Link>
    </div>
  );
}
