"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/platform-admin";

function fail(message: string): never {
  redirect(`/admin/sponsors?error=${encodeURIComponent(message)}`);
}

export async function createPlatformSponsor(formData: FormData) {
  const { userId } = await requirePlatformAdmin();

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
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from("platform-sponsor-logos").upload(path, logo, {
    contentType: logo.type,
  });

  if (uploadError) {
    fail("Logo konnte nicht hochgeladen werden.");
  }

  const { error: insertError } = await supabase.from("platform_sponsors").insert({
    name,
    logo_path: path,
    link_url: linkUrl || null,
    created_by: userId,
  });

  if (insertError) {
    await supabase.storage.from("platform-sponsor-logos").remove([path]);
    fail("Sponsor konnte nicht angelegt werden.");
  }

  revalidatePath("/admin/sponsors");
  redirect("/admin/sponsors");
}

export async function togglePlatformSponsorActive(formData: FormData) {
  await requirePlatformAdmin();
  const sponsorId = String(formData.get("sponsorId") ?? "");
  const nextActive = String(formData.get("nextActive") ?? "") === "true";

  if (!sponsorId) {
    fail("Ungültige Anfrage.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_sponsors")
    .update({ is_active: nextActive })
    .eq("id", sponsorId);

  if (error) {
    fail("Status konnte nicht geändert werden.");
  }

  revalidatePath("/admin/sponsors");
  redirect("/admin/sponsors");
}

export async function deletePlatformSponsor(formData: FormData) {
  await requirePlatformAdmin();
  const sponsorId = String(formData.get("sponsorId") ?? "");
  const logoPath = String(formData.get("logoPath") ?? "");

  if (!sponsorId) {
    fail("Ungültige Anfrage.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("platform_sponsors").delete().eq("id", sponsorId);

  if (error) {
    fail("Sponsor konnte nicht gelöscht werden.");
  }

  if (logoPath) {
    await supabase.storage.from("platform-sponsor-logos").remove([logoPath]);
  }

  revalidatePath("/admin/sponsors");
  redirect("/admin/sponsors");
}
