"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMembershipContext, isTenantManager } from "@/lib/membership";

function fail(message: string): never {
  redirect(`/dashboard/sponsors?error=${encodeURIComponent(message)}`);
}

export async function createSponsor(formData: FormData) {
  const membership = await getMembershipContext();

  if (!isTenantManager(membership.role)) {
    fail("Nur Vorstand/Admin kann Sponsoren pflegen.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  const logo = formData.get("logo");

  if (!name || !(logo instanceof File) || logo.size === 0) {
    fail("Bitte Name und ein Logo angeben.");
  }

  if (!logo.type.startsWith("image/")) {
    fail("Das Logo muss eine Bilddatei sein.");
  }

  const supabase = await createClient();
  const extension = logo.name.split(".").pop() || "png";
  const path = `${membership.tenantId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from("sponsor-logos").upload(path, logo, {
    contentType: logo.type,
  });

  if (uploadError) {
    fail("Logo konnte nicht hochgeladen werden.");
  }

  const { error: insertError } = await supabase.from("sponsors").insert({
    tenant_id: membership.tenantId,
    name,
    logo_path: path,
    link_url: linkUrl || null,
    created_by: membership.userId,
  });

  if (insertError) {
    await supabase.storage.from("sponsor-logos").remove([path]);
    fail("Sponsor konnte nicht angelegt werden.");
  }

  revalidatePath("/dashboard/sponsors");
  revalidatePath("/dashboard");
  redirect("/dashboard/sponsors");
}

export async function toggleSponsorActive(formData: FormData) {
  const sponsorId = String(formData.get("sponsorId") ?? "");
  const nextActive = String(formData.get("nextActive") ?? "") === "true";

  if (!sponsorId) {
    fail("Ungültige Anfrage.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sponsors")
    .update({ is_active: nextActive })
    .eq("id", sponsorId);

  if (error) {
    fail("Status konnte nicht geändert werden.");
  }

  revalidatePath("/dashboard/sponsors");
  revalidatePath("/dashboard");
  redirect("/dashboard/sponsors");
}

export async function deleteSponsor(formData: FormData) {
  const sponsorId = String(formData.get("sponsorId") ?? "");
  const logoPath = String(formData.get("logoPath") ?? "");

  if (!sponsorId) {
    fail("Ungültige Anfrage.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("sponsors").delete().eq("id", sponsorId);

  if (error) {
    fail("Sponsor konnte nicht gelöscht werden.");
  }

  if (logoPath) {
    await supabase.storage.from("sponsor-logos").remove([logoPath]);
  }

  revalidatePath("/dashboard/sponsors");
  revalidatePath("/dashboard");
  redirect("/dashboard/sponsors");
}
