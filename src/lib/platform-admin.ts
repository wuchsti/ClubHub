import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PlatformAdminContext = {
  userId: string;
};

/**
 * Gates the /admin area. There is no self-service way to become a platform
 * admin - it is granted by directly flipping profiles.is_platform_admin in
 * the database (see README), which keeps this "break glass" role out of
 * reach of any application bug.
 */
export const requirePlatformAdmin = cache(async (): Promise<PlatformAdminContext> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_platform_admin) {
    redirect("/");
  }

  return { userId: user.id };
});
