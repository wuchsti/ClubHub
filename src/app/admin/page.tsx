import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_LABELS: Record<string, string> = {
  trialing: "Trial",
  active: "Aktiv",
  past_due: "Zahlung überfällig",
  canceled: "Gekündigt",
};

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  allin: "All-In",
};

export default async function AdminTenantsPage() {
  const supabase = await createClient();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, slug, plan, status, member_limit, is_suspended, created_at")
    .order("created_at", { ascending: false });

  const { data: memberships } = await supabase.from("memberships").select("tenant_id");

  const memberCounts = new Map<string, number>();
  for (const row of memberships ?? []) {
    memberCounts.set(row.tenant_id, (memberCounts.get(row.tenant_id) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mandanten-Übersicht</h1>
        <p className="text-muted-foreground">{tenants?.length ?? 0} registrierte Vereine.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alle Vereine</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(tenants ?? []).map((tenant) => (
            <Link
              key={tenant.id}
              href={`/admin/tenants/${tenant.id}`}
              className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-accent"
            >
              <div>
                <p className="text-sm font-medium">{tenant.name}</p>
                <p className="text-xs text-muted-foreground">
                  /{tenant.slug} · {memberCounts.get(tenant.id) ?? 0}/{tenant.member_limit} Mitglieder
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{PLAN_LABELS[tenant.plan] ?? tenant.plan}</Badge>
                <Badge variant={tenant.status === "active" ? "default" : "secondary"}>
                  {STATUS_LABELS[tenant.status] ?? tenant.status}
                </Badge>
                {tenant.is_suspended ? <Badge variant="destructive">Gesperrt</Badge> : null}
              </div>
            </Link>
          ))}
          {!tenants?.length ? (
            <p className="text-sm text-muted-foreground">Noch keine Vereine registriert.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
