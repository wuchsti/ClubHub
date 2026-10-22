import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { setTenantPlan, setTenantSuspended, updateMemberLimit } from "./actions";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminTenantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePlatformAdmin();
  const { tenantId } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select(
      "id, name, slug, plan, status, member_limit, plan_valid_until, is_suspended, stripe_customer_id, stripe_subscription_id, stripe_connect_account_id, stripe_connect_charges_enabled, created_at"
    )
    .eq("id", tenantId)
    .single();

  if (!tenant) {
    notFound();
  }

  const { data: memberRows } = await supabase.from("memberships").select("user_id").eq("tenant_id", tenantId);
  const memberCount = memberRows?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/admin">
            <ArrowLeft />
            Zurück zur Übersicht
          </Link>
        </Button>
        <div className="mt-2 flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{tenant.name}</h1>
          {tenant.is_suspended ? <Badge variant="destructive">Gesperrt</Badge> : null}
        </div>
        <p className="text-muted-foreground">/{tenant.slug}</p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
            <CardDescription>
              Tarif: {tenant.plan} · Abo-Status: {tenant.status} · {memberCount}/{tenant.member_limit}{" "}
              Mitglieder
              {tenant.plan_valid_until ? (
                <>
                  {" "}
                  · befristet bis {new Date(tenant.plan_valid_until).toLocaleDateString("de-DE")}
                </>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form action={setTenantSuspended}>
              <input type="hidden" name="tenantId" value={tenant.id} />
              <input type="hidden" name="suspended" value={(!tenant.is_suspended).toString()} />
              <Button type="submit" variant={tenant.is_suspended ? "default" : "destructive"}>
                {tenant.is_suspended ? "Verein entsperren" : "Verein sperren"}
              </Button>
            </form>
            <form action={updateMemberLimit} className="flex flex-col gap-2">
              <input type="hidden" name="tenantId" value={tenant.id} />
              <Label htmlFor="memberLimit">Mitglieder-Limit</Label>
              <div className="flex gap-2">
                <Input
                  id="memberLimit"
                  name="memberLimit"
                  type="number"
                  min={1}
                  defaultValue={tenant.member_limit}
                  className="max-w-32"
                />
                <Button type="submit" variant="outline">
                  Speichern
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tarif manuell setzen</CardTitle>
            <CardDescription>
              Für Partner-Vereine, Presse-Demos o. Ä. – unabhängig von Stripe. Mit Laufzeit fällt der
              Verein automatisch auf Starter zurück, sobald jemand aus dem Verein die App nach
              Ablauf das nächste Mal öffnet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={setTenantPlan} className="flex flex-col gap-3">
              <input type="hidden" name="tenantId" value={tenant.id} />
              <div className="flex flex-col gap-2">
                <Label htmlFor="plan">Tarif</Label>
                <select
                  id="plan"
                  name="plan"
                  defaultValue={tenant.plan}
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
                >
                  {PLANS.map((plan) => (
                    <option key={plan.key} value={plan.key}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="validUntil">
                  Laufzeit bis <span className="text-muted-foreground">(leer = unbegrenzt)</span>
                </Label>
                <Input
                  id="validUntil"
                  name="validUntil"
                  type="date"
                  defaultValue={tenant.plan_valid_until?.slice(0, 10) ?? ""}
                />
              </div>
              <Button type="submit" className="self-start">
                Tarif setzen
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stripe</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
            <span>Kunde: {tenant.stripe_customer_id ?? "–"}</span>
            <span>Abo: {tenant.stripe_subscription_id ?? "–"}</span>
            <span>Connect-Konto: {tenant.stripe_connect_account_id ?? "–"}</span>
            <span>Zahlungen aktiv: {tenant.stripe_connect_charges_enabled ? "Ja" : "Nein"}</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
