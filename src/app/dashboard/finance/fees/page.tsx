import Link from "next/link";
import { ArrowLeft, Lock, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext, isTenantManager } from "@/lib/membership";
import { createFeePlan, deactivateFeePlan, manageFeeSubscription, subscribeToFeePlan } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatEuro } from "@/lib/money";

const INTERVAL_LABELS: Record<string, string> = {
  month: "monatlich",
  year: "jährlich",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Aktiv",
  trialing: "Testphase",
  past_due: "Zahlung überfällig",
  canceled: "Gekündigt",
  incomplete: "Unvollständig",
  incomplete_expired: "Abgelaufen",
  unpaid: "Unbezahlt",
};

export default async function MembershipFeesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; canceled?: string }>;
}) {
  const { error, success, canceled } = await searchParams;
  const membership = await getMembershipContext();
  const supabase = await createClient();

  const { data: tenant } = await supabase.from("tenants").select("plan").eq("id", membership.tenantId).single();
  const locked = tenant?.plan === "starter";

  const { data: captainRows } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", membership.userId)
    .eq("role", "captain");

  const captainTeamIds = (captainRows ?? []).map((row) => row.team_id);
  const isManager = isTenantManager(membership.role);
  const canCreatePlan = isManager || captainTeamIds.length > 0;

  const { data: allTeams } = await supabase.from("teams").select("id, name").eq("tenant_id", membership.tenantId);
  const manageableTeams = isManager ? allTeams ?? [] : (allTeams ?? []).filter((t) => captainTeamIds.includes(t.id));
  const teamNameById = new Map((allTeams ?? []).map((team) => [team.id, team.name]));

  const { data: plans } = await supabase
    .from("membership_fee_plans")
    .select("id, team_id, label, amount_cents, interval, is_active")
    .eq("tenant_id", membership.tenantId)
    .eq("is_active", true)
    .order("team_id", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });

  const { data: mySubs } = await supabase
    .from("membership_subscriptions")
    .select("plan_id, status, current_period_end, stripe_customer_id")
    .eq("member_id", membership.userId);

  const mySubByPlanId = new Map((mySubs ?? []).map((sub) => [sub.plan_id, sub]));

  const canManagePlan = (teamId: string | null) =>
    teamId === null ? isManager : isManager || captainTeamIds.includes(teamId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard/finance">
            <ArrowLeft />
            Zurück zum Kassenbuch
          </Link>
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Vereins- & Spartenbeiträge</h1>
        <p className="text-muted-foreground">
          Wiederkehrende Beiträge – einmal abschließen, Stripe zieht automatisch monatlich oder jährlich ab.
        </p>
      </div>

      {success ? <p className="text-sm text-emerald-600">Beitrag abgeschlossen, danke!</p> : null}
      {canceled ? <p className="text-sm text-muted-foreground">Abschluss abgebrochen.</p> : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {locked ? (
        <Card className="max-w-md border-primary/50 shadow-lg">
          <CardHeader>
            <Lock className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Beitragspläne sind ein Pro-Feature</CardTitle>
            <CardDescription>
              {isManager
                ? "Upgrade auf Pro Team, um wiederkehrende Vereins- und Spartenbeiträge einzurichten."
                : "Euer Verein nutzt aktuell den kostenlosen Starter-Tarif."}
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
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(plans ?? []).map((plan) => {
              const sub = mySubByPlanId.get(plan.id);
              return (
                <Card key={plan.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{plan.label}</CardTitle>
                    <CardDescription>
                      {plan.team_id ? teamNameById.get(plan.team_id) ?? "Sparte" : "Vereinsweit"} ·{" "}
                      {formatEuro(plan.amount_cents)} {INTERVAL_LABELS[plan.interval] ?? plan.interval}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {sub ? (
                      <>
                        <Badge variant={sub.status === "active" ? "default" : "secondary"} className="w-fit">
                          {STATUS_LABELS[sub.status] ?? sub.status}
                        </Badge>
                        {sub.current_period_end ? (
                          <p className="text-xs text-muted-foreground">
                            Nächste Abbuchung: {new Date(sub.current_period_end).toLocaleDateString("de-DE")}
                          </p>
                        ) : null}
                        <form action={manageFeeSubscription}>
                          <input type="hidden" name="customerId" value={sub.stripe_customer_id} />
                          <Button type="submit" variant="outline" size="sm" className="w-full">
                            Abo verwalten
                          </Button>
                        </form>
                      </>
                    ) : (
                      <form action={subscribeToFeePlan}>
                        <input type="hidden" name="planId" value={plan.id} />
                        <Button type="submit" size="sm" className="w-full">
                          <RefreshCw />
                          Jetzt abonnieren
                        </Button>
                      </form>
                    )}
                    {canManagePlan(plan.team_id) ? (
                      <form action={deactivateFeePlan}>
                        <input type="hidden" name="planId" value={plan.id} />
                        <Button type="submit" variant="ghost" size="sm" className="w-full text-muted-foreground">
                          Plan deaktivieren
                        </Button>
                      </form>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
            {!plans?.length ? (
              <p className="text-sm text-muted-foreground">Noch keine Beitragspläne angelegt.</p>
            ) : null}
          </div>

          {canCreatePlan ? (
            <Card className="max-w-sm">
              <CardHeader>
                <CardTitle className="text-base">Neuen Beitragsplan anlegen</CardTitle>
                <CardDescription>
                  Z. B. &quot;Erwachsene&quot;, &quot;Kinder&quot; oder &quot;Familie&quot; – pro Mitgliedstyp
                  ein eigener Plan mit eigenem Betrag.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={createFeePlan} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="teamId">Geltungsbereich</Label>
                    <select
                      id="teamId"
                      name="teamId"
                      className="h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
                    >
                      {isManager ? <option value="">Vereinsweit (Vereinsbeitrag)</option> : null}
                      {manageableTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name} (Spartenbeitrag)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="label">Bezeichnung</Label>
                    <Input id="label" name="label" placeholder="z. B. Erwachsene" required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="amount">Betrag (€)</Label>
                    <Input id="amount" name="amount" placeholder="10,00" required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="interval">Intervall</Label>
                    <select
                      id="interval"
                      name="interval"
                      defaultValue="month"
                      className="h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
                    >
                      <option value="month">Monatlich</option>
                      <option value="year">Jährlich</option>
                    </select>
                  </div>
                  <Button type="submit" className="mt-1">
                    Plan anlegen
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
