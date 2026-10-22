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
    .select("id, token, max_uses, use_count, expires_at, created_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  const now = currentTimestamp();
  const activeInvites = (invites ?? []).filter(
    (invite) => invite.use_count < invite.max_uses && new Date(invite.expires_at).getTime() > now
  );

  const siteUrl = getSiteUrl();

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

      <form action={createInvite}>
        <input type="hidden" name="teamId" value={teamId} />
        <Button type="submit">Neuen Einladungslink erstellen</Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activeInvites.map((invite) => {
          const url = `${siteUrl}/invite/${invite.token}`;
          return (
            <Card key={invite.id}>
              <CardHeader>
                <CardTitle className="text-sm font-mono break-all">{invite.token}</CardTitle>
                <CardDescription>
                  {invite.use_count}/{invite.max_uses} verwendet · gültig bis{" "}
                  {new Date(invite.expires_at).toLocaleDateString("de-DE")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3">
                <InviteQr value={url} />
                <code className="w-full truncate rounded bg-muted px-2 py-1 text-xs">{url}</code>
                <form action={revokeInvite} className="w-full">
                  <input type="hidden" name="teamId" value={teamId} />
                  <input type="hidden" name="inviteId" value={invite.id} />
                  <Button type="submit" variant="ghost" size="sm" className="w-full">
                    <Trash2 className="text-destructive" />
                    Widerrufen
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
        {!activeInvites.length ? (
          <p className="text-sm text-muted-foreground">Noch kein aktiver Einladungslink.</p>
        ) : null}
      </div>
    </div>
  );
}
