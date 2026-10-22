import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext, isTenantManager } from "@/lib/membership";
import { getSiteUrl } from "@/lib/site-url";
import { currentTimestamp } from "@/lib/time";
import { createInvite, revokeInvite } from "./actions";
import { InviteQr } from "@/components/invite-qr";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TeamInvitePage({
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

  const { data: team } = await supabase.from("teams").select("id, name").eq("id", teamId).single();

  if (!team) {
    notFound();
  }

  const { data: ownMembership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", membership.userId)
    .maybeSingle();

  const canManage = isTenantManager(membership.role) || ownMembership?.role === "captain";

  if (!canManage) {
    notFound();
  }

  const { data: invites } = await supabase
    .from("invites")
    .select("id, token, label, max_uses, use_count, expires_at, created_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  const now = currentTimestamp();
  const isActive = (invite: { use_count: number; max_uses: number; expires_at: string | null }) =>
    invite.use_count < invite.max_uses && (!invite.expires_at || new Date(invite.expires_at).getTime() > now);

  const activeInvites = (invites ?? []).filter(isActive);
  const pastInvites = (invites ?? []).filter((invite) => !isActive(invite));

  const inviteIds = (invites ?? []).map((invite) => invite.id);
  const { data: joinedRows } = inviteIds.length
    ? await supabase
        .from("team_members")
        .select("user_id, redeemed_by_invite_id")
        .eq("team_id", teamId)
        .in("redeemed_by_invite_id", inviteIds)
    : { data: [] };

  const joinerIds = [...new Set((joinedRows ?? []).map((row) => row.user_id))];
  const { data: joinerProfiles } = joinerIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", joinerIds)
    : { data: [] };
  const joinerNameById = new Map(
    (joinerProfiles ?? []).map((profile) => [profile.id, profile.full_name || profile.email])
  );

  const joinersByInvite = new Map<string, string[]>();
  for (const row of joinedRows ?? []) {
    if (!row.redeemed_by_invite_id) continue;
    const name = joinerNameById.get(row.user_id) ?? row.user_id;
    const list = joinersByInvite.get(row.redeemed_by_invite_id) ?? [];
    list.push(name);
    joinersByInvite.set(row.redeemed_by_invite_id, list);
  }

  const siteUrl = getSiteUrl();

  function InviteCard({
    invite,
    active,
  }: {
    invite: {
      id: string;
      token: string;
      label: string | null;
      max_uses: number;
      use_count: number;
      expires_at: string | null;
    };
    active: boolean;
  }) {
    const url = `${siteUrl}/invite/${invite.token}`;
    const joiners = joinersByInvite.get(invite.id) ?? [];

    return (
      <Card className={active ? undefined : "opacity-70"}>
        <CardHeader>
          <CardTitle className="text-sm">{invite.label || "Ohne Bezeichnung"}</CardTitle>
          <CardDescription>
            {invite.use_count}/{invite.max_uses} verwendet ·{" "}
            {invite.expires_at ? `gültig bis ${new Date(invite.expires_at).toLocaleDateString("de-DE")}` : "unbegrenzt gültig"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          {active ? <InviteQr value={url} /> : null}
          <code className="w-full truncate rounded bg-muted px-2 py-1 text-xs">{url}</code>
          {joiners.length ? (
            <p className="w-full text-left text-xs text-muted-foreground">
              Beigetreten: {joiners.join(", ")}
            </p>
          ) : (
            <p className="w-full text-left text-xs text-muted-foreground">Noch niemand beigetreten.</p>
          )}
          {active ? (
            <form action={revokeInvite} className="w-full">
              <input type="hidden" name="teamId" value={teamId} />
              <input type="hidden" name="inviteId" value={invite.id} />
              <Button type="submit" variant="ghost" size="sm" className="w-full">
                <Trash2 className="text-destructive" />
                Widerrufen
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/dashboard/teams/${teamId}`}>
            <ArrowLeft />
            Zurück zum Kader
          </Link>
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Einladen zu {team.name}</h1>
        <p className="text-muted-foreground">
          Teile den Link oder QR-Code – neue Mitglieder treten direkt dieser Sparte bei.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle className="text-base">Neuen Einladungslink erstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInvite} className="flex flex-col gap-4">
            <input type="hidden" name="teamId" value={teamId} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="label">
                Bezeichnung <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="label" name="label" placeholder="z. B. Flyer Herbstfest" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="validity">Gültigkeit</Label>
              <select
                id="validity"
                name="validity"
                defaultValue="30"
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
              >
                <option value="7">7 Tage</option>
                <option value="30">30 Tage</option>
                <option value="90">90 Tage</option>
                <option value="forever">Unbegrenzt</option>
              </select>
            </div>
            <Button type="submit">Link erstellen</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activeInvites.map((invite) => (
          <InviteCard key={invite.id} invite={invite} active />
        ))}
        {!activeInvites.length ? (
          <p className="text-sm text-muted-foreground">Noch kein aktiver Einladungslink.</p>
        ) : null}
      </div>

      {pastInvites.length ? (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Frühere Links</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pastInvites.map((invite) => (
              <InviteCard key={invite.id} invite={invite} active={false} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
