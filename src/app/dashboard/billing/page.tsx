import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext, isTenantManager } from "@/lib/membership";
import { createCheckoutSession, createPortalSession } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLANS } from "@/lib/plans";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; canceled?: string }>;
}) {
  const { error, success, canceled } = await searchParams;
  const membership = await getMembershipContext();

  if (!isTenantManager(membership.role)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan, status, stripe_customer_id")
    .eq("id", membership.tenantId)
    .single();

  const currentPlan = tenant?.plan ?? "starter";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Abo & Tarif</h1>
        <p className="text-muted-foreground">
          Aktueller Tarif: <strong>{PLANS.find((plan) => plan.key === currentPlan)?.name}</strong>
          {tenant?.status === "past_due" ? (
            <Badge variant="destructive" className="ml-2">
              Zahlung ausstehend
            </Badge>
          ) : null}
        </p>
      </div>

      {success ? (
        <p className="text-sm text-emerald-600">
          Zahlung erfolgreich! Dein Tarif wird in Kürze aktualisiert.
        </p>
      ) : null}
      {canceled ? <p className="text-sm text-muted-foreground">Vorgang abgebrochen.</p> : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.key} className={plan.key === currentPlan ? "border-primary" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                {plan.name}
                {plan.key === currentPlan ? <Badge>Aktiv</Badge> : null}
              </CardTitle>
              <CardDescription>{plan.price}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="size-3.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.key !== "starter" && plan.key !== currentPlan ? (
                <form action={createCheckoutSession}>
                  <input type="hidden" name="plan" value={plan.key} />
                  <Button type="submit" className="w-full">
                    {plan.name} wählen
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {tenant?.stripe_customer_id && currentPlan !== "starter" ? (
        <form action={createPortalSession}>
          <Button type="submit" variant="outline">
            Abo verwalten / kündigen
          </Button>
        </form>
      ) : null}
    </div>
  );
}
