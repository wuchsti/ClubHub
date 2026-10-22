import Link from "next/link";
import { LogOut, Megaphone, ShieldAlert, Users } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/admin", label: "Mandanten", icon: Users },
  { href: "/admin/sponsors", label: "Globale Sponsoren", icon: Megaphone },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-foreground px-6 py-4 text-background">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-5" />
          <span className="text-sm font-semibold">ClubHub · Platform Admin</span>
        </div>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="ghost" size="sm" className="text-background hover:text-background">
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
    </div>
  );
}
