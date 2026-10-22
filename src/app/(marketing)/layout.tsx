import Link from "next/link";
import { Button } from "@/components/ui/button";
import { currentYear } from "@/lib/time";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          ClubHub
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <Link href="/features" className="hover:text-foreground">
            Features
          </Link>
          <Link href="/#preise" className="hover:text-foreground">
            Preise
          </Link>
          <Link href="/impressum" className="hover:text-foreground">
            Impressum
          </Link>
        </nav>
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Login</Link>
        </Button>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="flex flex-col items-center justify-between gap-4 border-t px-6 py-6 text-sm text-muted-foreground sm:flex-row">
        <span>© {currentYear()} ClubHub</span>
        <div className="flex gap-4">
          <Link href="/impressum" className="hover:text-foreground">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-foreground">
            Datenschutz
          </Link>
        </div>
      </footer>
    </div>
  );
}
