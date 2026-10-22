import Link from "next/link";
import {
  Banknote,
  Car,
  Check,
  Crown,
  HelpCircle,
  MapPin,
  Megaphone,
  QrCode,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Features – ClubHub" };

const TRUST_POINTS = [
  { icon: ShieldCheck, title: "DSGVO-konform", description: "Hosting in der EU, Datentrennung pro Verein durch Datenbank-Policies." },
  { icon: Users, title: "Rollenbasiert", description: "Vorstand, Admin, Kapitän, Mitglied – jeder sieht nur, was ihn betrifft." },
  { icon: Megaphone, title: "Transparent finanziert", description: "Starter ist dauerhaft kostenlos, finanziert über Werbung statt versteckter Kosten." },
];

function SectionEyebrow({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-block rounded-full px-3 py-1 text-xs font-semibold", color)}>
      {children}
    </span>
  );
}

export default function FeaturesPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-indigo-50 via-white to-white px-6 py-16 text-center dark:from-indigo-950/30 dark:via-background dark:to-background">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Alle Funktionen im Überblick</h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
          Von der ersten Termin-Zusage bis zur SEPA-Zahlung – so sieht ClubHub im Alltag aus.
        </p>
        <p className="mx-auto mt-2 max-w-xl text-xs text-muted-foreground">
          Hinweis: Die folgenden Ansichten sind vereinfachte Vorschau-Illustrationen der echten
          Oberfläche, keine Fotos aus einem laufenden Verein.
        </p>
      </section>

      {/* Termine & Rückmeldungen */}
      <section className="border-t px-6 py-16">
        <div className="mx-auto grid max-w-5xl items-center gap-10 sm:grid-cols-2">
          <div>
            <SectionEyebrow color="bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              Termine
            </SectionEyebrow>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Termine & Rückmeldungen</h2>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-blue-600" /> Training, Punktspiel oder Event in Sekunden anlegen</li>
              <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-blue-600" /> 1-Klick Zusage, Absage (mit Grund) oder Unsicher</li>
              <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-blue-600" /> Fahrgemeinschaften-Counter direkt bei der Zusage</li>
              <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-blue-600" /> Push-Benachrichtigung bei neuen Terminen</li>
            </ul>
          </div>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-base">Punktspiel vs. TSV Nordlicht</CardTitle>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5" /> Fr, 19:30 Uhr · Mühlenweg 8, Hamburg-Altona
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1 rounded-md bg-foreground py-3 text-xs font-medium text-background">
                  <Check className="size-4" /> Dabei
                </div>
                <div className="flex flex-col items-center gap-1 rounded-md border py-3 text-xs font-medium text-muted-foreground">
                  <X className="size-4" /> Absage
                </div>
                <div className="flex flex-col items-center gap-1 rounded-md border py-3 text-xs font-medium text-muted-foreground">
                  <HelpCircle className="size-4" /> Unsicher
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Car className="size-4" /> Freie Plätze im Auto
                </span>
                <span className="font-semibold">2</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Kassenbuch */}
      <section className="border-t bg-muted/30 px-6 py-16">
        <div className="mx-auto grid max-w-5xl items-center gap-10 sm:grid-cols-2">
          <Card className="order-2 shadow-lg sm:order-1">
            <CardHeader>
              <CardTitle className="text-base">Kassenbuch – 1. Mannschaft</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>Max M. · Unpünktlich</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">2,00 €</span>
                  <Badge variant="secondary">Offen</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>Jan M. · Falsches Trikot</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">5,00 €</span>
                  <Badge variant="outline">Bezahlt</Badge>
                </div>
              </div>
              <Button size="sm" className="mt-2 w-full">
                <Banknote className="size-4" /> Jetzt bezahlen
              </Button>
            </CardContent>
          </Card>
          <div className="order-1 sm:order-2">
            <SectionEyebrow color="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              Kassenbuch
            </SectionEyebrow>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Kassenbuch & SEPA-Zahlungen</h2>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-emerald-600" /> Strafenkatalog mit festen Tarifen pflegen</li>
              <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-emerald-600" /> Mitgliedsbeiträge & Strafen als Kassenbuch-Posten</li>
              <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-emerald-600" /> Bezahlung per Karte oder SEPA-Lastschrift</li>
              <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-emerald-600" /> Auszahlung direkt an das Konto des Kassenwarts</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Sparten & Einladungen */}
      <section className="border-t px-6 py-16">
        <div className="mx-auto grid max-w-5xl items-center gap-10 sm:grid-cols-2">
          <div>
            <SectionEyebrow color="bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
              Sparten & Rollen
            </SectionEyebrow>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Sparten, Rollen & Einladungen</h2>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-violet-600" /> Beliebig viele Sparten/Teams anlegen</li>
              <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-violet-600" /> Rollen: Vorstand, Admin, Kapitän, Mitglied</li>
              <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-violet-600" /> Neue Mitglieder per QR-Code oder Link einladen</li>
            </ul>
          </div>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-base">1. Herren Dart – Kader</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  Lena K. <Badge variant="secondary"><Crown className="size-3" /> Kapitän</Badge>
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>Tom R.</span>
              </div>
              <div className="flex items-center gap-3 rounded-md border px-3 py-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded bg-muted">
                  <QrCode className="size-6 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">
                  QR-Code scannen oder Link teilen → neue Mitglieder treten direkt dieser Sparte bei.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sponsoring */}
      <section className="border-t bg-muted/30 px-6 py-16">
        <div className="mx-auto grid max-w-5xl items-center gap-10 sm:grid-cols-2">
          <Card className="order-2 shadow-lg sm:order-1">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Sponsor des Tages</CardTitle>
            </CardHeader>
            <CardContent className="flex h-20 items-center justify-center rounded-md bg-white text-sm font-medium text-muted-foreground">
              [ Logo: Bäckerei Mustermann ]
            </CardContent>
          </Card>
          <div className="order-1 sm:order-2">
            <SectionEyebrow color="bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              Sponsoring
            </SectionEyebrow>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Lokales & plattformweites Sponsoring</h2>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-amber-600" /> Eigene Sponsoren-Logos mit Verlinkung hochladen</li>
              <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-amber-600" /> Werbefrei in den bezahlten Tarifen</li>
              <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-amber-600" /> Starter-Tarif bleibt dadurch dauerhaft kostenlos</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight">Darauf könnt ihr euch verlassen</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {TRUST_POINTS.map((point) => (
              <Card key={point.title}>
                <CardHeader>
                  <point.icon className="size-6 text-muted-foreground" />
                  <CardTitle className="mt-2 text-base">{point.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{point.description}</p>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-16 text-center text-white">
        <h2 className="text-2xl font-semibold tracking-tight">Überzeugt?</h2>
        <p className="mt-2 text-indigo-100">Starter ist kostenlos – in 2 Minuten startklar.</p>
        <Button asChild size="lg" variant="secondary" className="mt-6">
          <Link href="/signup">Jetzt Verein kostenlos anlegen</Link>
        </Button>
      </section>
    </>
  );
}
