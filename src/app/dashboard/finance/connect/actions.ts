"use server";

import { redirect } from "next/navigation";
import { getMembershipContext, isTenantManager } from "@/lib/membership";
import { createConnectOnboardingLink } from "@/lib/stripe-connect";
import { isStripeConfigured } from "@/lib/stripe";
import { requireFinanceAccess } from "@/lib/plan-gate";

export async function startConnectOnboarding() {
  const membership = await getMembershipContext();
  await requireFinanceAccess(membership.tenantId);

  if (!isTenantManager(membership.role)) {
    redirect("/dashboard/finance?error=" + encodeURIComponent("Nur Vorstand/Admin kann Stripe verbinden."));
  }

  if (!isStripeConfigured()) {
    redirect(
      "/dashboard/finance?error=" +
        encodeURIComponent("Online-Zahlungen sind auf dieser Installation noch nicht eingerichtet.")
    );
  }

  let url: string;
  try {
    url = await createConnectOnboardingLink(membership.tenantId);
  } catch {
    redirect(
      "/dashboard/finance?error=" +
        encodeURIComponent("Stripe-Verbindung fehlgeschlagen. Bitte später erneut versuchen.")
    );
  }

  redirect(url);
}
