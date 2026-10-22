import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext, isTenantManager } from "@/lib/membership";
import { createTeam } from "./actions";
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

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const membership = await getMembershipContext();
  const supabase = await createClient();
  const canManage = isTenantManager(membership.role);

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, created_at")
    .eq("tenant_id", membership.tenantId)
    .order("created_at", { ascending: true });

  const teamIds = (teams ?? []).map((team) => team.id);
  const memberCounts = new Map<string, number>();

  if (teamIds.length > 0) {
    const { data: memberRows } = await supabase
      .from("team_members")
      .select("team_id")
      .in("team_id", teamIds);

    for (const row of memberRows ?? []) {
      memberCounts.set(row.team_id, (memberCounts.get(row.team_id) ?? 0) + 1);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sparten</h1>
        <p className="text-muted-foreground">
          Teams innerhalb eures Vereins, z. B. &quot;1. Herren Dart&quot; oder &quot;Jugend A&quot;.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(teams ?? []).map((team) => (
          <Link key={team.id} href={`/dashboard/teams/${team.id}`}>
            <Card className="h-full transition-colors hover:border-foreground/30">
              <CardHeader>
                <Users className="size-5 text-muted-foreground" />
                <CardTitle className="text-base">{team.name}</CardTitle>
                <CardDescription>
                  {memberCounts.get(team.id) ?? 0} Mitglieder
                </CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
        {!teams?.length ? (
          <p className="text-sm text-muted-foreground">Noch keine Sparten angelegt.</p>
        ) : null}
      </div>

      {canManage ? (
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle className="text-base">Neue Sparte anlegen</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createTeam} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="z. B. 1. Herren Dart" required />
              </div>
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit">Sparte anlegen</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
