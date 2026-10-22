import { NextResponse } from "next/server";
import { getMembershipContext } from "@/lib/membership";
import { syncConnectChargesEnabled } from "@/lib/stripe-connect";
import { getSiteUrl } from "@/lib/site-url";

// Stripe sends the browser here after the treasurer finishes (or exits)
// the hosted onboarding flow. The authoritative state change still comes
// from the `account.updated` webhook, but we opportunistically refresh
// here too so the UI doesn't look stale while that event is in flight.
export async function GET() {
  const membership = await getMembershipContext();
  await syncConnectChargesEnabled(membership.tenantId);
  return NextResponse.redirect(`${getSiteUrl()}/dashboard/finance`);
}
