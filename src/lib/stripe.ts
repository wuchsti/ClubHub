import "server-only";
import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/**
 * Lazily constructed so the app can still build/boot without a Stripe key
 * configured; only routes that actually touch billing/payments need it.
 */
export function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

export const STRIPE_PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_PRO,
  allin: process.env.STRIPE_PRICE_ALLIN,
} as const;
