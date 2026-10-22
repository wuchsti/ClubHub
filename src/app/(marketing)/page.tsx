import Link from "next/link";
import { Calendar, Check, PiggyBank, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LAUNCHED_PLANS } from "@/lib/plans";

const FEATURES = [
  {
    icon: Calendar,
    title: "Termine & Zusagen",
    description:
      "Training, Punktspiel oder Event anlegen – Mitglieder sagen mit einem Klick zu, ab oder unsicher, inkl. Fahrgemeinschaften-Counter.",
    color: "blue" as const,
  },
  {
    icon: PiggyBank,
    title: "Kassenbuch & SEPA",
    description:
      "Strafenkatalog, Mitgliedsbeiträge und Zahlungen per Karte oder SEPA-Lastschrift direkt an euer Vereinskonto.",
    color: "emerald" as const,
  },
  {
    icon: Users,
    title: "Sparten & Rollen",
    description:
      "Beliebig viele Teams anlegen, Mitglieder per QR-Code oder Link einladen und Rollen wie Kapitän oder Admin vergeben.",
    color: "violet" as const,
  },
];

const ICON_BADGE_STYLES = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
};

export default function Home() {
  return (
    <>
      <section className="bg-gradient-to-b from-indigo-50 via-white to-white dark:from-indigo-950/30 dark:via-background dark:to-background">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-6 px-6 py-24 text-center">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Schluss mit dem Chaos im Vereins- und Teamalltag.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Termine, Kasse & Sponsoren für jeden Verein und jede Mannschaft – in einer App.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">Jetzt Verein kostenlos anlegen</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/demo">Demo ansehen</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="border-t px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight">Alles, was euer Verein braucht</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div
                    className={cn(
                      "flex size-11 items-center justify-center rounded-lg",
                      ICON_BADGE_STYLES[feature.color]
                    )}
                  >
                    <feature.icon className="size-5" />
                  </div>
                  <CardTitle className="mt-2 text-base">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/features"
              className="text-sm font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
            >
              Alle Features ansehen →
            </Link>
          </div>
        </div>
      </section>

      <section id="preise" className="border-t bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight">Unsere Tarife</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {LAUNCHED_PLANS.map((plan) => (
              <Link key={plan.key} href="/signup" className="block h-full">
                <Card
                  className={cn(
                    "h-full transition-shadow hover:shadow-lg",
                    plan.key === "pro" && "border-emerald-500 shadow-sm shadow-emerald-500/10"
                  )}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {plan.name}
                      {plan.key === "pro" ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          Beliebt
                        </span>
                      ) : null}
                    </CardTitle>
                    <CardDescription>{plan.price}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="size-3.5 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <span
                      className={cn(
                        buttonVariants({ variant: plan.key === "starter" ? "outline" : "default" }),
                        "w-full"
                      )}
                    >
                      {plan.key === "starter" ? "Gratis starten" : `${plan.name} wählen`}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-16 text-center text-white">
        <h2 className="text-2xl font-semibold tracking-tight">Bereit für weniger Chaos?</h2>
        <p className="mt-2 text-indigo-100">In 2 Minuten eingerichtet, keine Kreditkarte nötig.</p>
        <Button asChild size="lg" variant="secondary" className="mt-6">
          <Link href="/signup">Jetzt Verein kostenlos anlegen</Link>
        </Button>
      </section>
    </>
  );
}
