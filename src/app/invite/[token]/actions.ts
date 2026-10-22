"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * redeem_invite() raises plain `raise exception '<message>'` for its known
 * rejection reasons (only the member-limit case carries a custom errcode).
 * Map each known message to a friendly one; anything unrecognized falls
 * back to the raw Postgres message so a real bug stays diagnosable instead
 * of hiding behind one generic "something went wrong" string.
 */
function mapRedeemInviteError(error: { code: string; message: string; details?: string; hint?: string }): string {
  if (error.code === "CH011") {
    return "Der Verein hat das Mitglieder-Limit seines Tarifs erreicht. Bitte den Vorstand, auf Pro Team upzugraden.";
  }

  switch (error.message) {
    case "invite not found":
      return "Dieser Einladungslink ist ungültig.";
    case "invite expired":
      return "Dieser Einladungslink ist abgelaufen. Bitte einen neuen anfordern.";
    case "invite already used":
      return "Dieser Einladungslink wurde bereits zu oft verwendet.";
    case "authentication required":
      return "Bitte melde dich an, um die Einladung anzunehmen.";
    default: {
      const extra = [error.code, error.details, error.hint].filter(Boolean).join(" | ");
      return `Einladung konnte nicht eingelöst werden (${error.message}${extra ? " — " + extra : ""}).`;
    }
  }
}

export async function acceptInvite(formData: FormData) {
  const token = String(formData.get("token") ?? "");

  if (!token) {
    redirect("/");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("redeem_invite", { p_token: token });

  if (error) {
    const message = mapRedeemInviteError(error);
    redirect(`/invite/${token}?error=${encodeURIComponent(message)}`);
  }

  redirect("/dashboard");
}
