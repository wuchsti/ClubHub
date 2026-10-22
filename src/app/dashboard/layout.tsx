import Link from "next/link";
import { CalendarDays, LayoutDashboard, LogOut, ShieldCheck, Users } from "lucide-react";
import { getMembershipContext } from "@/lib/membership";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<string, string> = {
  owner: "Vorstand",
  admin: "Admin",
  captain: "Kapitän",
  member: "Mitglied",
};

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/teams", label: "Sparten", icon: Users },
  { href: "/dashboard/events", label: "Termine", icon: CalendarDays },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const membership = await getMembershipContext();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold leading-none">{membership.tenantName}</p>
            <p className="text-xs text-muted-foreground">clubhub.app/{membership.tenantSlug}</p>
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
      <div className="flex flex-1">
        <nav className="hidden w-56 flex-col gap-1 border-r p-4 sm:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 bg-muted/30 p-6">{children}</main>
      </div>
      <nav className="flex items-center justify-around border-t py-2 sm:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 px-3 py-1 text-xs text-muted-foreground"
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
