"use server";

import { redirect } from "next/navigation";
import { getMembershipContext, isTenantManager } from "@/lib/membership";
import { createConnectOnboardingLink } from "@/lib/stripe-connect";

export async function startConnectOnboarding() {
  const membership = await getMembershipContext();

  if (!isTenantManager(membership.role)) {
    redirect("/dashboard/finance?error=" + encodeURIComponent("Nur Vorstand/Admin kann Stripe verbinden."));
  }

  const url = await createConnectOnboardingLink(membership.tenantId);
  redirect(url);
}
