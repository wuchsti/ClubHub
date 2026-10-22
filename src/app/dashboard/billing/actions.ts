"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext, isTenantManager } from "@/lib/membership";
import { getStripe, isStripeConfigured, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site-url";

type PlanKey = keyof typeof STRIPE_PRICE_IDS;

async function requireStripeCustomer(tenantId: string): Promise<string> {
  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("stripe_customer_id, name")
    .eq("id", tenantId)
    .single();

  if (tenant?.stripe_customer_id) {
    return tenant.stripe_customer_id;
  }

  const { data: { user } } = await supabase.auth.getUser();
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    name: tenant?.name,
    email: user?.email,
    metadata: { tenant_id: tenantId },
  });

  await supabase.from("tenants").update({ stripe_customer_id: customer.id }).eq("id", tenantId);

  return customer.id;
}

export async function createCheckoutSession(formData: FormData) {
  const membership = await getMembershipContext();

  if (!isTenantManager(membership.role)) {
    redirect("/dashboard/billing?error=" + encodeURIComponent("Nur Vorstand/Admin kann das Abo ändern."));
  }

  if (!isStripeConfigured()) {
    redirect(
      "/dashboard/billing?error=" +
        encodeURIComponent("Online-Zahlungen sind auf dieser Installation noch nicht eingerichtet.")
    );
  }

  const plan = String(formData.get("plan") ?? "") as PlanKey;
  const priceId = STRIPE_PRICE_IDS[plan];

  if (!priceId) {
    redirect("/dashboard/billing?error=" + encodeURIComponent("Dieser Tarif ist aktuell nicht buchbar."));
  }

  const customerId = await requireStripeCustomer(membership.tenantId);
  const stripe = getStripe();
  const siteUrl = getSiteUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/dashboard/billing?success=1`,
    cancel_url: `${siteUrl}/dashboard/billing?canceled=1`,
    client_reference_id: membership.tenantId,
    metadata: { tenant_id: membership.tenantId, plan },
    subscription_data: { metadata: { tenant_id: membership.tenantId, plan } },
  });

  if (!session.url) {
    redirect("/dashboard/billing?error=" + encodeURIComponent("Checkout konnte nicht gestartet werden."));
  }

  redirect(session.url);
}

export async function createPortalSession() {
  const membership = await getMembershipContext();

  if (!isTenantManager(membership.role)) {
    redirect("/dashboard/billing?error=" + encodeURIComponent("Nur Vorstand/Admin kann das Abo verwalten."));
  }

  if (!isStripeConfigured()) {
    redirect(
      "/dashboard/billing?error=" +
        encodeURIComponent("Online-Zahlungen sind auf dieser Installation noch nicht eingerichtet.")
    );
  }

  const customerId = await requireStripeCustomer(membership.tenantId);
  const stripe = getStripe();
  const siteUrl = getSiteUrl();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${siteUrl}/dashboard/billing`,
  });

  redirect(session.url);
}
