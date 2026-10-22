"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const redirectTo = String(formData.get("redirect") ?? "/onboarding");

  if (!email || !password || password.length < 8) {
    redirect(
      `/signup?error=${encodeURIComponent(
        "Bitte E-Mail angeben und ein Passwort mit mindestens 8 Zeichen wählen."
      )}`
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || null },
      emailRedirectTo: `${getSiteUrl()}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // If email confirmation is disabled (or this address was already confirmed),
  // signUp() logs the user in immediately - go straight to the intended
  // destination (e.g. an invite link) instead of the "check your email" page,
  // which would otherwise strand the invite redirect.
  if (data.session) {
    redirect(redirectTo);
  }

  redirect("/signup/check-email");
}
