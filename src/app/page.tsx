import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">ClubHub</span>
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Login</Link>
        </Button>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Das Chaos im Amateursport hat ein Ende.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Termine, Kasse & Sponsoren für dein Team in einer App.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/signup">Jetzt Verein kostenlos anlegen</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Demo ansehen</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
