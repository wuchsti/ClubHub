"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

const POSTGRES_UNIQUE_VIOLATION = "23505";

export async function createTenant(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/onboarding");
  }

  const name = String(formData.get("name") ?? "").trim();
  const requestedSlug = String(formData.get("slug") ?? "").trim();
  const baseSlug = slugify(requestedSlug || name);

  if (!name || !baseSlug) {
    redirect(
      `/onboarding?error=${encodeURIComponent(
        "Bitte einen gültigen Vereinsnamen angeben."
      )}`
    );
  }

  let slug = baseSlug;
  let tenantId: string | null = null;

  for (let attempt = 0; attempt < 5 && !tenantId; attempt += 1) {
    slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

    const { data, error } = await supabase
      .from("tenants")
      .insert({ name, slug, created_by: user.id })
      .select("id")
      .single();

    if (!error) {
      tenantId = data.id;
      break;
    }

    if (error.code !== POSTGRES_UNIQUE_VIOLATION) {
      redirect(
        `/onboarding?error=${encodeURIComponent(
          "Verein konnte nicht angelegt werden. Bitte später erneut versuchen."
        )}`
      );
    }
  }

  if (!tenantId) {
    redirect(
      `/onboarding?error=${encodeURIComponent(
        "Dieser Vereinsname ist aktuell vergeben. Bitte eine eigene URL wählen."
      )}`
    );
  }

  const { error: membershipError } = await supabase
    .from("memberships")
    .insert({ tenant_id: tenantId, user_id: user.id, role: "owner" });

  if (membershipError) {
    await supabase.from("tenants").delete().eq("id", tenantId);
    redirect(
      `/onboarding?error=${encodeURIComponent(
        "Verein konnte nicht angelegt werden. Bitte später erneut versuchen."
      )}`
    );
  }

  redirect("/dashboard");
}
