"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Banknote,
  Calendar,
  Car,
  Check,
  Crown,
  HelpCircle,
  MapPin,
  Megaphone,
  Minus,
  PiggyBank,
  Plus,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RsvpStatus = "yes" | "no" | "maybe";

const STATUS_OPTIONS: { value: RsvpStatus; label: string; icon: typeof Check }[] = [
  { value: "yes", label: "Dabei", icon: Check },
  { value: "no", label: "Absage", icon: X },
  { value: "maybe", label: "Unsicher", icon: HelpCircle },
];

const NAV_ITEMS = [
  { label: "Dashboard", icon: ShieldCheck },
  { label: "Sparten", icon: Users },
  { label: "Termine", icon: Calendar },
  { label: "Kasse", icon: PiggyBank },
];

export function DemoDashboard() {
  const [status, setStatus] = useState<RsvpStatus>("yes");
  const [seats, setSeats] = useState(2);
  const [paid, setPaid] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-col items-center justify-between gap-2 bg-indigo-600 px-6 py-3 text-sm text-white sm:flex-row">
        <span>
          🎬 Das ist eine Demo mit Beispieldaten – nichts wird gespeichert oder verschickt.
        </span>
        <div className="flex items-center gap-4">
          <Link href="/" className="underline-offset-4 hover:underline">
            Zur Startseite
          </Link>
          <Button asChild size="sm" variant="secondary">
            <Link href="/signup">Jetzt eigenen Verein anlegen</Link>
          </Button>
        </div>
      </div>

      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold leading-none">SV Rosental</p>
            <p className="text-xs text-muted-foreground">clubhub.app/sv-rosental</p>
          </div>
          <Badge variant="secondary">Mitglied</Badge>
        </div>
        <Button variant="ghost" size="sm" disabled>
          Abmelden
        </Button>
      </header>

      <div className="flex flex-1">
        <nav className="hidden w-56 flex-col gap-1 border-r p-4 sm:flex">
          {NAV_ITEMS.map((item) => (
            <span
              key={item.label}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                item.label === "Dashboard"
                  ? "bg-accent text-accent-foreground"
                  : "cursor-not-allowed text-muted-foreground/50"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </span>
          ))}
        </nav>

        <main className="flex-1 bg-muted/30 p-6">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Willkommen zurück bei SV Rosental.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="sm:col-span-2">
                <CardHeader>
                  <Calendar className="size-5 text-muted-foreground" />
                  <CardTitle className="text-base">Nächster Termin</CardTitle>
                  <CardDescription>
                    Punktspiel · Punktspiel vs. TSV Nordlicht
                    <br />
                    Fr, 19:30 Uhr
                    <span className="inline-flex items-center gap-1">
                      {" "}
                      · <MapPin className="size-3.5" /> Mühlenweg 8, Hamburg-Altona
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-2">
                    {STATUS_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={status === option.value ? "default" : "outline"}
                        onClick={() => setStatus(option.value)}
                        className="h-auto flex-col gap-1 py-3"
                      >
                        <option.icon />
                        {option.label}
                      </Button>
                    ))}
                  </div>

                  {status === "yes" ? (
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium">Freie Plätze im Auto</span>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setSeats((value) => Math.max(0, value - 1))}
                        >
                          <Minus />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">
                          <Car className="mr-1 inline size-3.5 text-muted-foreground" />
                          {seats}
                        </span>
                        <Button type="button" variant="outline" size="icon" onClick={() => setSeats((v) => v + 1)}>
                          <Plus />
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <p className="text-xs text-muted-foreground">
                    ✓ Rückmeldung übernommen (nur in dieser Demo, es wird nichts gespeichert).
                  </p>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-4">
                <Card>
                  <CardHeader>
                    <PiggyBank className="size-5 text-muted-foreground" />
                    <CardTitle className="text-base">Offene Beträge</CardTitle>
                    <CardDescription>{paid ? "Keine offenen Posten." : "2,00 €"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!paid ? (
                      <Button size="sm" onClick={() => setPaid(true)}>
                        <Banknote className="size-4" />
                        Jetzt bezahlen
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        ✓ Bezahlt (nur in dieser Demo simuliert).
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Sponsor des Tages</CardTitle>
                  </CardHeader>
                  <CardContent className="flex h-16 items-center justify-center rounded-md bg-white text-sm font-medium text-muted-foreground">
                    <Megaphone className="mr-2 size-4" /> Bäckerei Mustermann
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardHeader>
                <Users className="size-5 text-muted-foreground" />
                <CardTitle className="text-base">1. Herren Dart – Kader</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    Lena K.
                    <Badge variant="secondary">
                      <Crown className="size-3" /> Kapitän
                    </Badge>
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>Tom R.</span>
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>Du</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
