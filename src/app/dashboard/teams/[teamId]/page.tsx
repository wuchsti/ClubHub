import Link from "next/link";
import { notFound } from "next/navigation";
import { Crown, Trash2, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext, isTenantManager } from "@/lib/membership";
import { addTeamMember, removeTeamMember, setTeamMemberRole } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TeamRosterPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { teamId } = await params;
  const { error } = await searchParams;
  const membership = await getMembershipContext();
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .single();

  if (!team) {
    notFound();
  }

  const { data: members } = await supabase
    .from("team_members")
    .select("user_id, role, created_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });

  const memberIds = (members ?? []).map((member) => member.user_id);

  const { data: profiles } = memberIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", memberIds)
    : { data: [] };

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const isCaptainHere = (members ?? []).some(
    (member) => member.user_id === membership.userId && member.role === "captain"
  );
  const canManage = isTenantManager(membership.role) || isCaptainHere;

  let availableMembers: { user_id: string; label: string }[] = [];

  if (canManage) {
    const { data: tenantMemberships } = await supabase
      .from("memberships")
      .select("user_id")
      .eq("tenant_id", membership.tenantId);

    const existingIds = new Set(memberIds);
    const candidateIds = (tenantMemberships ?? [])
      .map((row) => row.user_id)
      .filter((id) => !existingIds.has(id));

    const { data: candidateProfiles } = candidateIds.length
      ? await supabase.from("profiles").select("id, full_name, email").in("id", candidateIds)
      : { data: [] };

    availableMembers = (candidateProfiles ?? []).map((profile) => ({
      user_id: profile.id,
      label: profile.full_name || profile.email,
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{team.name}</h1>
          <p className="text-muted-foreground">Kader & Rollen dieser Sparte.</p>
        </div>
        {canManage ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/teams/${teamId}/invite`}>
              <UserPlus />
              Einladen
            </Link>
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mitglieder</CardTitle>
          <CardDescription>{members?.length ?? 0} im Kader</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(members ?? []).map((member) => {
            const profile = profileById.get(member.user_id);
            return (
              <div
                key={member.user_id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {profile?.full_name || profile?.email || member.user_id}
                  </span>
                  {member.role === "captain" ? (
                    <Badge variant="secondary">
                      <Crown />
                      Kapitän
                    </Badge>
                  ) : null}
                </div>
                {canManage ? (
                  <div className="flex items-center gap-2">
                    <form action={setTeamMemberRole}>
                      <input type="hidden" name="teamId" value={teamId} />
                      <input type="hidden" name="userId" value={member.user_id} />
                      <input
                        type="hidden"
                        name="role"
                        value={member.role === "captain" ? "member" : "captain"}
                      />
                      <Button type="submit" variant="ghost" size="sm">
                        {member.role === "captain" ? "Kapitän entziehen" : "Zum Kapitän machen"}
                      </Button>
                    </form>
                    <form action={removeTeamMember}>
                      <input type="hidden" name="teamId" value={teamId} />
                      <input type="hidden" name="userId" value={member.user_id} />
                      <Button type="submit" variant="ghost" size="icon">
                        <Trash2 className="text-destructive" />
                      </Button>
                    </form>
                  </div>
                ) : null}
              </div>
            );
          })}
          {!members?.length ? (
            <p className="text-sm text-muted-foreground">Noch keine Mitglieder in dieser Sparte.</p>
          ) : null}
        </CardContent>
      </Card>

      {canManage && availableMembers.length > 0 ? (
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle className="text-base">Vorhandenes Vereinsmitglied hinzufügen</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addTeamMember} className="flex flex-col gap-3">
              <input type="hidden" name="teamId" value={teamId} />
              <select
                name="userId"
                required
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
              >
                <option value="">Mitglied wählen…</option>
                {availableMembers.map((candidate) => (
                  <option key={candidate.user_id} value={candidate.user_id}>
                    {candidate.label}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm">
                Hinzufügen
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
