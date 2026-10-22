import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Ensures the tenant has a Stripe Express connected account (created lazily
 * on first onboarding attempt) and returns a fresh onboarding Account Link
 * URL. Shared by the "start onboarding" action and the refresh/return route
 * handlers Stripe redirects the browser to.
 */
export async function createConnectOnboardingLink(tenantId: string): Promise<string> {
  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("stripe_connect_account_id, name")
    .eq("id", tenantId)
    .single();

  const stripe = getStripe();
  let accountId = tenant?.stripe_connect_account_id ?? null;

  if (!accountId) {
    const { data: { user } } = await supabase.auth.getUser();
    const account = await stripe.accounts.create({
      type: "express",
      country: "DE",
      email: user?.email,
      business_type: "non_profit",
      business_profile: { name: tenant?.name ?? undefined },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    await supabase.from("tenants").update({ stripe_connect_account_id: accountId }).eq("id", tenantId);
  }

  const siteUrl = getSiteUrl();
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${siteUrl}/dashboard/finance/connect/refresh`,
    return_url: `${siteUrl}/dashboard/finance/connect/return`,
  });

  return accountLink.url;
}

export async function syncConnectChargesEnabled(tenantId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("stripe_connect_account_id")
    .eq("id", tenantId)
    .single();

  if (!tenant?.stripe_connect_account_id) {
    return false;
  }

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(tenant.stripe_connect_account_id);

  await supabase
    .from("tenants")
    .update({ stripe_connect_charges_enabled: account.charges_enabled })
    .eq("id", tenantId);

  return account.charges_enabled;
}
