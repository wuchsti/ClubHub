"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext, isTenantManager } from "@/lib/membership";
import { getStripe } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site-url";

function euroToCents(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  const euros = Number.parseFloat(normalized);
  if (!Number.isFinite(euros) || euros <= 0) {
    return null;
  }
  return Math.round(euros * 100);
}

function fail(message: string): never {
  redirect(`/dashboard/finance?error=${encodeURIComponent(message)}`);
}

export async function createPenaltyCatalogEntry(formData: FormData) {
  const membership = await getMembershipContext();

  if (!isTenantManager(membership.role)) {
    fail("Nur Vorstand/Admin kann den Strafenkatalog pflegen.");
  }

  const label = String(formData.get("label") ?? "").trim();
  const amountCents = euroToCents(String(formData.get("amount") ?? ""));

  if (!label || amountCents === null) {
    fail("Bitte Bezeichnung und einen gültigen Betrag angeben.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("penalty_catalog").insert({
    tenant_id: membership.tenantId,
    label,
    default_amount_cents: amountCents,
    created_by: membership.userId,
  });

  if (error) {
    fail("Katalogeintrag konnte nicht angelegt werden.");
  }

  revalidatePath("/dashboard/finance");
  redirect("/dashboard/finance");
}

export async function createLedgerEntry(formData: FormData) {
  const membership = await getMembershipContext();

  const memberId = String(formData.get("memberId") ?? "");
  const teamId = String(formData.get("teamId") ?? "") || null;
  const label = String(formData.get("label") ?? "").trim();
  const amountCents = euroToCents(String(formData.get("amount") ?? ""));

  if (!memberId || !label || amountCents === null) {
    fail("Bitte Mitglied, Bezeichnung und einen gültigen Betrag angeben.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ledger_entries").insert({
    tenant_id: membership.tenantId,
    team_id: teamId,
    member_id: memberId,
    label,
    amount_cents: amountCents,
    created_by: membership.userId,
  });

  if (error) {
    fail("Posten konnte nicht angelegt werden. Hast du Rechte für diese Sparte?");
  }

  revalidatePath("/dashboard/finance");
  redirect("/dashboard/finance");
}

export async function voidLedgerEntry(formData: FormData) {
  const entryId = String(formData.get("entryId") ?? "");

  if (!entryId) {
    fail("Ungültige Anfrage.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("ledger_entries")
    .update({ status: "void" })
    .eq("id", entryId);

  if (error) {
    fail("Posten konnte nicht storniert werden.");
  }

  revalidatePath("/dashboard/finance");
  redirect("/dashboard/finance");
}

export async function payLedgerEntry(formData: FormData) {
  const entryId = String(formData.get("entryId") ?? "");
  const membership = await getMembershipContext();
  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("ledger_entries")
    .select("id, member_id, label, amount_cents, currency, status, tenant_id")
    .eq("id", entryId)
    .single();

  if (!entry || entry.member_id !== membership.userId) {
    fail("Dieser Posten gehört nicht dir.");
  }

  if (entry.status !== "open") {
    fail("Dieser Posten ist bereits erledigt.");
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("stripe_connect_account_id, stripe_connect_charges_enabled")
    .eq("id", membership.tenantId)
    .single();

  if (!tenant?.stripe_connect_account_id || !tenant.stripe_connect_charges_enabled) {
    fail("Der Verein hat Online-Zahlungen noch nicht aktiviert.");
  }

  const stripe = getStripe();
  const siteUrl = getSiteUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    allowed_payment_method_types: ["card", "sepa_debit"],
    line_items: [
      {
        price_data: {
          currency: entry.currency,
          unit_amount: entry.amount_cents,
          product_data: { name: entry.label },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      transfer_data: { destination: tenant.stripe_connect_account_id },
    },
    metadata: { ledger_entry_id: entry.id },
    success_url: `${siteUrl}/dashboard/finance?success=1`,
    cancel_url: `${siteUrl}/dashboard/finance?canceled=1`,
  });

  if (!session.url) {
    fail("Zahlung konnte nicht gestartet werden.");
  }

  await supabase
    .from("ledger_entries")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", entry.id);

  redirect(session.url);
}
