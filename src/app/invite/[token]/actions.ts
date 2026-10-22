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
    redirect(`/invite/${token}?error=${encodeURIComponent("Einladung konnte nicht eingelöst werden.")}`);
  }

  redirect("/dashboard");
}
