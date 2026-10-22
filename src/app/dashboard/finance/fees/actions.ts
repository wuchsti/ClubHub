"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext, isTenantManager } from "@/lib/membership";
import { requireFinanceAccess } from "@/lib/plan-gate";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site-url";
import { euroToCents } from "@/lib/money";

function fail(message: string): never {
  redirect(`/dashboard/finance/fees?error=${encodeURIComponent(message)}`);
}

export async function createFeePlan(formData: FormData) {
  const membership = await getMembershipContext();
  await requireFinanceAccess(membership.tenantId);

  const teamId = String(formData.get("teamId") ?? "").trim() || null;
  const label = String(formData.get("label") ?? "").trim();
  const amountCents = euroToCents(String(formData.get("amount") ?? ""));
  const interval = String(formData.get("interval") ?? "month");

  if (!label || amountCents === null || amountCents <= 0) {
    fail("Bitte Bezeichnung und einen gültigen Betrag angeben.");
  }

  if (interval !== "month" && interval !== "year") {
    fail("Ungültiges Intervall.");
  }

  if (teamId === null && !isTenantManager(membership.role)) {
    fail("Nur Vorstand/Admin kann vereinsweite Beitragspläne anlegen.");
  }

  if (!isStripeConfigured()) {
    fail("Online-Zahlungen sind auf dieser Installation noch nicht eingerichtet.");
  }

  const stripe = getStripe();
  const price = await stripe.prices.create({
    currency: "eur",
    unit_amount: amountCents,
    recurring: { interval },
    product_data: { name: label },
  });

  const supabase = await createClient();
  const { error } = await supabase.from("membership_fee_plans").insert({
    tenant_id: membership.tenantId,
    team_id: teamId,
    label,
    amount_cents: amountCents,
    interval,
    stripe_price_id: price.id,
    created_by: membership.userId,
  });

  if (error) {
    await stripe.prices.update(price.id, { active: false }).catch(() => {});
    fail("Beitragsplan konnte nicht angelegt werden. Hast du Rechte für diese Sparte?");
  }

  revalidatePath("/dashboard/finance/fees");
  redirect("/dashboard/finance/fees");
}

export async function deactivateFeePlan(formData: FormData) {
  const planId = String(formData.get("planId") ?? "");

  if (!planId) {
    fail("Ungültige Anfrage.");
  }

  const supabase = await createClient();
  const { data: plan } = await supabase
    .from("membership_fee_plans")
    .select("stripe_price_id")
    .eq("id", planId)
    .single();

  const { error } = await supabase.from("membership_fee_plans").update({ is_active: false }).eq("id", planId);

  if (error) {
    fail("Beitragsplan konnte nicht deaktiviert werden.");
  }

  if (plan?.stripe_price_id && isStripeConfigured()) {
    await getStripe()
      .prices.update(plan.stripe_price_id, { active: false })
      .catch(() => {});
  }

  revalidatePath("/dashboard/finance/fees");
  redirect("/dashboard/finance/fees");
}

export async function subscribeToFeePlan(formData: FormData) {
  const membership = await getMembershipContext();
  const planId = String(formData.get("planId") ?? "");

  if (!planId) {
    fail("Ungültige Anfrage.");
  }

  const supabase = await createClient();
  const { data: plan } = await supabase
    .from("membership_fee_plans")
    .select("id, stripe_price_id, is_active")
    .eq("id", planId)
    .single();

  if (!plan?.is_active || !plan.stripe_price_id) {
    fail("Dieser Beitragsplan ist nicht verfügbar.");
  }

  if (!isStripeConfigured()) {
    fail("Online-Zahlungen sind auf dieser Installation noch nicht eingerichtet.");
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("stripe_connect_account_id, stripe_connect_charges_enabled")
    .eq("id", membership.tenantId)
    .single();

  if (!tenant?.stripe_connect_account_id || !tenant.stripe_connect_charges_enabled) {
    fail("Der Verein hat Online-Zahlungen noch nicht aktiviert.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const stripe = getStripe();
  const siteUrl = getSiteUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user?.email,
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    subscription_data: {
      transfer_data: { destination: tenant.stripe_connect_account_id },
      metadata: { tenant_id: membership.tenantId, plan_id: plan.id, member_id: membership.userId },
    },
    metadata: { tenant_id: membership.tenantId, plan_id: plan.id, member_id: membership.userId },
    success_url: `${siteUrl}/dashboard/finance/fees?success=1`,
    cancel_url: `${siteUrl}/dashboard/finance/fees?canceled=1`,
  });

  if (!session.url) {
    fail("Checkout konnte nicht gestartet werden.");
  }

  redirect(session.url);
}

export async function manageFeeSubscription(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");

  if (!customerId || !isStripeConfigured()) {
    fail("Online-Zahlungen sind auf dieser Installation noch nicht eingerichtet.");
  }

  const stripe = getStripe();
  const siteUrl = getSiteUrl();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${siteUrl}/dashboard/finance/fees`,
  });

  redirect(session.url);
}
