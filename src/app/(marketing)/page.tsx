import Link from "next/link";
import { Calendar, Check, PiggyBank, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS } from "@/lib/plans";

const FEATURES = [
  {
    icon: Calendar,
    title: "Termine & Zusagen",
    description:
      "Training, Punktspiel oder Event anlegen – Mitglieder sagen mit einem Klick zu, ab oder unsicher, inkl. Fahrgemeinschaften-Counter.",
  },
  {
    icon: PiggyBank,
    title: "Kassenbuch & SEPA",
    description:
      "Strafenkatalog, Mitgliedsbeiträge und Zahlungen per Karte oder SEPA-Lastschrift direkt an euer Vereinskonto.",
  },
  {
    icon: Users,
    title: "Sparten & Rollen",
    description:
      "Beliebig viele Teams anlegen, Mitglieder per QR-Code oder Link einladen und Rollen wie Kapitän oder Admin vergeben.",
  },
];

export default function Home() {
  return (
    <>
      <section className="flex flex-col items-center justify-center gap-6 px-6 py-24 text-center">
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
      </section>

      <section id="features" className="border-t px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight">Alles, was euer Verein braucht</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="size-6 text-muted-foreground" />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="preise" className="border-t px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight">Unsere Tarife</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <Card key={plan.key} className={plan.key === "pro" ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <CardDescription>{plan.price}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="size-3.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant={plan.key === "starter" ? "outline" : "default"}>
                    <Link href="/signup">{plan.key === "starter" ? "Gratis starten" : `${plan.name} wählen`}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Bereit für weniger Chaos?</h2>
        <p className="mt-2 text-muted-foreground">In 2 Minuten eingerichtet, keine Kreditkarte nötig.</p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/signup">Jetzt Verein kostenlos anlegen</Link>
        </Button>
      </section>
    </>
  );
}
