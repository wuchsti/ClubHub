import type { TenantPlan } from "@/types/database";

export const PLANS: {
  key: TenantPlan;
  name: string;
  price: string;
  features: string[];
}[] = [
  {
    key: "starter",
    name: "Starter",
    price: "0 € / Monat",
    features: ["Bis 15 Mitglieder", "Basis-Termine", "Mit Werbung"],
  },
  {
    key: "pro",
    name: "Pro Team",
    price: "9,90 € / Monat",
    features: ["Unbegrenzt Mitglieder", "Kassenbuch/SEPA", "Werbefrei"],
  },
  {
    key: "allin",
    name: "Club All-In",
    price: "29,90 € / Monat",
    features: ["Alle Teams", "Custom Domain", "100% Sponsoren-Erlöse"],
  },
];
