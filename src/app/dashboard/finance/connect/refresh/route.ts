import { NextResponse } from "next/server";
import { getMembershipContext } from "@/lib/membership";
import { createConnectOnboardingLink } from "@/lib/stripe-connect";

// Stripe sends the browser here when an Account Link has expired before
// the treasurer finished onboarding; we just mint a fresh one.
export async function GET() {
  const membership = await getMembershipContext();
  const url = await createConnectOnboardingLink(membership.tenantId);
  return NextResponse.redirect(url);
}
