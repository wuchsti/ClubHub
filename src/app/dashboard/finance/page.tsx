import Link from "next/link";
import { AlertTriangle, Lock, PiggyBank } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext, isTenantManager } from "@/lib/membership";
import {
  createLedgerEntry,
  createPenaltyCatalogEntry,
  payLedgerEntry,
  voidLedgerEntry,
} from "./actions";
import { startConnectOnboarding } from "./connect/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatEuro } from "@/lib/money";
import { isStripeConfigured } from "@/lib/stripe";

function PlanGate({
  locked,
  isManager,
  children,
}: {
  locked: boolean;
  isManager: boolean;
  children: React.ReactNode;
}) {
  if (!locked) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-40 blur-[1px]">{children}</div>
      <div className="absolute inset-0 flex items-start justify-center pt-10">
        <Card className="max-w-sm border-primary/50 shadow-lg">
          <CardHeader>
            <Lock className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Kassenbuch ist ein Pro-Feature</CardTitle>
            <CardDescription>
              {isManager
                ? "Upgrade auf Pro Team, um Strafenkatalog, Kassenbuch-Posten und Online-Zahlungen zu nutzen."
                : "Euer Verein nutzt aktuell den kostenlosen Starter-Tarif. Bittet euren Vorstand, auf Pro Team upzugraden."}
            </CardDescription>
          </CardHeader>
          {isManager ? (
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/dashboard/billing">Jetzt upgraden</Link>
              </Button>
            </CardContent>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; canceled?: string }>;
}) {
  const { error, success, canceled } = await searchParams;
  const membership = await getMembershipContext();
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan, stripe_connect_charges_enabled")
    .eq("id", membership.tenantId)
    .single();

  const locked = tenant?.plan === "starter";

  const { data: captainRows } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", membership.userId)
    .eq("role", "captain");

  const captainTeamIds = (captainRows ?? []).map((row) => row.team_id);
  const isManager = isTenantManager(membership.role) || captainTeamIds.length > 0;

  const notices = (
    <>
      {success ? <p className="text-sm text-emerald-600">Zahlung erfolgreich, danke!</p> : null}
      {canceled ? <p className="text-sm text-muted-foreground">Zahlung abgebrochen.</p> : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );

  if (!isManager) {
    const { data: myEntries } = await supabase
      .from("ledger_entries")
      .select("id, label, amount_cents, status, created_at")
      .eq("member_id", membership.userId)
      .order("created_at", { ascending: false });

    const open = (myEntries ?? []).filter((entry) => entry.status === "open");
    const settled = (myEntries ?? []).filter((entry) => entry.status !== "open");

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meine Beträge</h1>
          <p className="text-muted-foreground">Offene und beglichene Strafen & Beiträge.</p>
        </div>
        {notices}
        <PlanGate locked={locked} isManager={isManager}>
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Offen ({open.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {open.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm">{entry.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{formatEuro(entry.amount_cents)}</span>
                      <form action={payLedgerEntry}>
                        <input type="hidden" name="entryId" value={entry.id} />
                        <Button type="submit" size="sm">
                          Jetzt bezahlen
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
                {!open.length ? <p className="text-sm text-muted-foreground">Keine offenen Posten.</p> : null}
              </CardContent>
            </Card>
            {settled.length ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Erledigt</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {settled.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{entry.label}</span>
                      <span>
                        {formatEuro(entry.amount_cents)} · {entry.status === "paid" ? "bezahlt" : "storniert"}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </PlanGate>
      </div>
    );
  }

  const { data: allTeams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("tenant_id", membership.tenantId);

  const manageableTeams = isTenantManager(membership.role)
    ? allTeams ?? []
    : (allTeams ?? []).filter((team) => captainTeamIds.includes(team.id));

  const { data: tenantMemberships } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("tenant_id", membership.tenantId);

  const memberIds = (tenantMemberships ?? []).map((row) => row.user_id);
  const { data: profiles } = memberIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", memberIds)
    : { data: [] };
  const nameById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name || profile.email]));

  const { data: catalog } = await supabase
    .from("penalty_catalog")
    .select("id, label, default_amount_cents")
    .eq("tenant_id", membership.tenantId)
    .order("created_at", { ascending: true });

  const { data: entries } = await supabase
    .from("ledger_entries")
    .select("id, member_id, label, amount_cents, status, created_at")
    .eq("tenant_id", membership.tenantId)
    .order("created_at", { ascending: false })
    .limit(100);

  const openTotal = (entries ?? [])
    .filter((entry) => entry.status === "open")
    .reduce((sum, entry) => sum + entry.amount_cents, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kassenbuch & Strafen</h1>
        <p className="text-muted-foreground">Offene Forderungen gesamt: {formatEuro(openTotal)}</p>
      </div>
      {notices}

      <PlanGate locked={locked} isManager={isManager}>
        <div className="flex flex-col gap-6">
          {!tenant?.stripe_connect_charges_enabled ? (
            <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <CardHeader>
                <AlertTriangle className="size-5 text-amber-600" />
                <CardTitle className="text-base">Online-Zahlungen aktivieren</CardTitle>
                <CardDescription>
                  Verbinde ein Stripe-Konto, damit Mitglieder Strafen & Beiträge per Karte oder
                  SEPA-Lastschrift direkt an den Verein bezahlen können.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isStripeConfigured() ? (
                  <form action={startConnectOnboarding}>
                    <Button type="submit">Stripe verbinden</Button>
                  </form>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Online-Zahlungen sind auf dieser Installation noch nicht eingerichtet
                    (fehlende Stripe-Konfiguration).
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Neuen Posten eintragen</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={createLedgerEntry} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="memberId">Mitglied</Label>
                    <select
                      id="memberId"
                      name="memberId"
                      required
                      className="h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
                    >
                      {memberIds.map((id) => (
                        <option key={id} value={id}>
                          {nameById.get(id) ?? id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="teamId">Sparte</Label>
                    <select
                      id="teamId"
                      name="teamId"
                      className="h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
                    >
                      {isTenantManager(membership.role) ? (
                        <option value="">Vereinsweit (z. B. Mitgliedsbeitrag)</option>
                      ) : null}
                      {manageableTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="label">Bezeichnung</Label>
                    <Input id="label" name="label" placeholder="z. B. Unpünktlich (15 Min)" required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="amount">Betrag (€)</Label>
                    <Input id="amount" name="amount" placeholder="2,00" required />
                  </div>
                  <Button type="submit" className="mt-1">
                    Posten anlegen
                  </Button>
                </form>
              </CardContent>
            </Card>

            {isTenantManager(membership.role) ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Strafenkatalog</CardTitle>
                  <CardDescription>Feste Tarife für wiederkehrende Strafen.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {(catalog ?? []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span>{item.label}</span>
                      <span className="font-medium">{formatEuro(item.default_amount_cents)}</span>
                    </div>
                  ))}
                  {!catalog?.length ? (
                    <p className="text-sm text-muted-foreground">Noch kein Katalog hinterlegt.</p>
                  ) : null}
                  <form action={createPenaltyCatalogEntry} className="mt-2 flex flex-col gap-3 border-t pt-3">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="catalogLabel">Bezeichnung</Label>
                      <Input id="catalogLabel" name="label" placeholder="z. B. Falsches Trikot" required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="catalogAmount">Standardbetrag (€)</Label>
                      <Input id="catalogAmount" name="amount" placeholder="5,00" required />
                    </div>
                    <Button type="submit" variant="outline" size="sm">
                      Zum Katalog hinzufügen
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <Card>
            <CardHeader>
              <PiggyBank className="size-5 text-muted-foreground" />
              <CardTitle className="text-base">Alle Posten</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {(entries ?? []).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">{nameById.get(entry.member_id) ?? entry.member_id}</span>
                    <span className="text-muted-foreground"> · {entry.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{formatEuro(entry.amount_cents)}</span>
                    <Badge variant={entry.status === "open" ? "secondary" : "outline"}>
                      {entry.status === "open" ? "Offen" : entry.status === "paid" ? "Bezahlt" : "Storniert"}
                    </Badge>
                    {entry.status === "open" ? (
                      <form action={voidLedgerEntry}>
                        <input type="hidden" name="entryId" value={entry.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Stornieren
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}
              {!entries?.length ? <p className="text-sm text-muted-foreground">Noch keine Einträge.</p> : null}
            </CardContent>
          </Card>
        </div>
      </PlanGate>
    </div>
  );
}
