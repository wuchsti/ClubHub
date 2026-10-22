import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side enforcement of the Kassenbuch paywall (Pro+ only), mirroring
 * the visual gate on /dashboard/finance. Prevents submitting the forms
 * directly even though the UI already disables them for Starter tenants.
 */
export async function requireFinanceAccess(tenantId: string): Promise<void> {
  const supabase = await createClient();
  const { data: tenant } = await supabase.from("tenants").select("plan").eq("id", tenantId).single();

  if (tenant?.plan === "starter") {
    redirect(
      "/dashboard/finance?error=" +
        encodeURIComponent("Kassenbuch ist ein Pro-Feature. Bitte zuerst upgraden.")
    );
  }
}
