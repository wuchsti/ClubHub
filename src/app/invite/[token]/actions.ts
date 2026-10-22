"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function acceptInvite(formData: FormData) {
  const token = String(formData.get("token") ?? "");

  if (!token) {
    redirect("/");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("redeem_invite", { p_token: token });

  if (error) {
    const message =
      error.code === "CH011"
        ? "Der Verein hat das Mitglieder-Limit seines Tarifs erreicht. Bitte den Vorstand, auf Pro Team upzugraden."
        : "Einladung konnte nicht eingelöst werden.";
    redirect(`/invite/${token}?error=${encodeURIComponent(message)}`);
  }

  redirect("/dashboard");
}
