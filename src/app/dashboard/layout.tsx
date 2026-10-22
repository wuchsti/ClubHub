import { redirect } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<string, string> = {
  owner: "Vorstand",
  admin: "Admin",
  captain: "Kapitän",
  member: "Mitglied",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("role, tenant_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, slug, plan")
    .eq("id", membership.tenant_id)
    .single();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold leading-none">{tenant?.name ?? "Mein Verein"}</p>
            <p className="text-xs text-muted-foreground">clubhub.app/{tenant?.slug}</p>
          </div>
          <Badge variant="secondary">{ROLE_LABELS[membership.role] ?? membership.role}</Badge>
        </div>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="ghost" size="sm">
            <LogOut />
            Abmelden
          </Button>
        </form>
      </header>
      <main className="flex-1 bg-muted/30 p-6">{children}</main>
    </div>
  );
}
