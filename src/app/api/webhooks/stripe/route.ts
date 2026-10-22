import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import type { TenantPlan, TenantStatus } from "@/types/database";

function mapSubscriptionStatus(status: Stripe.Subscription.Status): TenantStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "canceled":
    case "paused":
      return "canceled";
    default:
      // incomplete, incomplete_expired, past_due, unpaid
      return "past_due";
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === "subscription") {
        const feePlanId = session.metadata?.plan_id;
        if (feePlanId) {
          // A member's recurring Vereins-/Spartenbeitrag, not the tenant's own
          // Starter/Pro/All-In subscription (distinguished by metadata shape).
          const tenantId = session.metadata?.tenant_id;
          const memberId = session.metadata?.member_id;
          if (
            tenantId &&
            memberId &&
            typeof session.subscription === "string" &&
            typeof session.customer === "string"
          ) {
            await supabase.from("membership_subscriptions").upsert(
              {
                tenant_id: tenantId,
                plan_id: feePlanId,
                member_id: memberId,
                stripe_subscription_id: session.subscription,
                stripe_customer_id: session.customer,
                status: "active",
              },
              { onConflict: "plan_id,member_id" }
            );
          }
        } else {
          const tenantId = session.metadata?.tenant_id ?? session.client_reference_id ?? undefined;
          const plan = session.metadata?.plan as TenantPlan | undefined;
          if (tenantId && plan) {
            await supabase
              .from("tenants")
              .update({
                plan,
                status: "active",
                member_limit: PLAN_LIMITS[plan].members,
                team_limit: PLAN_LIMITS[plan].teams,
                plan_valid_until: null,
                stripe_subscription_id:
                  typeof session.subscription === "string" ? session.subscription : null,
              })
              .eq("id", tenantId);
          }
        }
      } else if (session.mode === "payment") {
        const ledgerEntryId = session.metadata?.ledger_entry_id;
        if (ledgerEntryId) {
          await supabase
            .from("ledger_entries")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id:
                typeof session.payment_intent === "string" ? session.payment_intent : null,
            })
            .eq("id", ledgerEntryId)
            .eq("status", "open");
        }
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const feePlanId = subscription.metadata?.plan_id;

      if (feePlanId) {
        const isCanceled = event.type === "customer.subscription.deleted";
        const periodEndSeconds = subscription.items.data[0]?.current_period_end;
        await supabase
          .from("membership_subscriptions")
          .update({
            status: isCanceled ? "canceled" : subscription.status,
            current_period_end: periodEndSeconds ? new Date(periodEndSeconds * 1000).toISOString() : null,
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      const tenantId = subscription.metadata?.tenant_id;
      const plan = subscription.metadata?.plan as TenantPlan | undefined;

      if (tenantId) {
        const isCanceled = event.type === "customer.subscription.deleted";
        const effectivePlan: TenantPlan | undefined = isCanceled ? "starter" : plan;
        await supabase
          .from("tenants")
          .update({
            status: isCanceled ? "canceled" : mapSubscriptionStatus(subscription.status),
            plan: effectivePlan,
            ...(effectivePlan
              ? {
                  member_limit: PLAN_LIMITS[effectivePlan].members,
                  team_limit: PLAN_LIMITS[effectivePlan].teams,
                  plan_valid_until: null,
                }
              : {}),
            stripe_subscription_id: subscription.id,
          })
          .eq("id", tenantId);
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionRef = invoice.parent?.subscription_details?.subscription;
      const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;

      if (subscriptionId) {
        const { data: sub } = await supabase
          .from("membership_subscriptions")
          .select("tenant_id, plan_id, member_id")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle();

        if (sub) {
          const { data: plan } = await supabase
            .from("membership_fee_plans")
            .select("label, team_id")
            .eq("id", sub.plan_id)
            .maybeSingle();

          await supabase.from("ledger_entries").insert({
            tenant_id: sub.tenant_id,
            team_id: plan?.team_id ?? null,
            member_id: sub.member_id,
            label: plan?.label ?? "Mitgliedsbeitrag",
            amount_cents: invoice.amount_paid,
            status: "paid",
            paid_at: new Date().toISOString(),
          });
        }
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      await supabase
        .from("tenants")
        .update({ stripe_connect_charges_enabled: Boolean(account.charges_enabled) })
        .eq("stripe_connect_account_id", account.id);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
