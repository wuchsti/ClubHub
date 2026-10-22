import type { TenantPlan } from "@/types/database";

export const PLANS: {
  key: TenantPlan;
  name: string;
  price: string;
  features: string[];
  /** Whether this tier is currently offered publicly (pricing page, billing upgrade). */
  launched: boolean;
}[] = [
  {
    key: "starter",
    name: "Starter",
    price: "0 € / Monat",
    features: ["1 Sparte", "Bis 10 Mitglieder", "Basis-Termine", "Mit Werbung"],
    launched: true,
  },
  {
    key: "pro",
    name: "Pro Team",
    price: "9,90 € / Monat",
    features: ["Unbegrenzt Sparten & Mitglieder", "Kassenbuch/SEPA", "Werbefrei"],
    launched: true,
  },
  {
    key: "allin",
    name: "Club All-In",
    price: "29,90 € / Monat",
    features: ["Alle Sparten/Teams", "100% Sponsoren-Erlöse", "Priorisierter Support"],
    launched: false,
  },
];

/** Plans shown on the public pricing page and billing upgrade options. */
export const LAUNCHED_PLANS = PLANS.filter((plan) => plan.launched);
