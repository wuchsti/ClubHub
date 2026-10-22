# ClubHub

Digitales Management für Vereins-Sparten & Amateur-Teams – ein Multi-Tenant
Micro-SaaS für deutsche Sportvereine (DSGVO-konform).

## Tech-Stack

- **Framework:** Next.js (App Router) + TypeScript + Tailwind CSS
- **UI:** shadcn/ui-Komponenten (handgepflegt, siehe `src/components/ui`) + Lucide Icons
- **Datenbank & Auth:** Supabase (PostgreSQL mit Row Level Security + Supabase Auth)

## Lokale Einrichtung

1. Ein Supabase-Projekt anlegen (EU-Region empfehlenswert, z. B. Frankfurt).
2. `.env.local.example` nach `.env.local` kopieren und mit den Werten aus
   *Project Settings → API* befüllen.
3. Die Migration ausführen, entweder über die Supabase SQL-Einrichtung im
   Dashboard oder lokal mit der Supabase CLI:

   ```bash
   supabase link --project-ref <project-ref>
   supabase db push
   ```

   Es gibt drei Migrationen (in dieser Reihenfolge anwenden):
   - `20261022000000_init_multitenancy.sql` – `tenants`, `profiles`, `memberships` inkl. RLS.
   - `20261022010000_phase2_core_features.sql` – `teams`, `team_members`, `events`,
     `event_rsvps`, `invites` inkl. RLS und der `redeem_invite`/`invite_preview`-Funktionen.
   - `20261022020000_phase3_finance_sponsoring.sql` – `penalty_catalog`,
     `ledger_entries`, `sponsors`, Stripe-Spalten auf `tenants` sowie der
     öffentliche Storage-Bucket `sponsor-logos`.
4. Für Phase 3 zusätzlich ein [Stripe](https://dashboard.stripe.com)-Konto
   (Test-Modus reicht lokal) einrichten:
   - Zwei wiederkehrende Preise für die Tarife "Pro" und "All-In" anlegen
     und deren Price-IDs in `.env.local` eintragen.
   - Einen Webhook-Endpunkt auf `/api/webhooks/stripe` einrichten (lokal am
     einfachsten mit der Stripe CLI: `stripe listen --forward-to
     localhost:3000/api/webhooks/stripe`) und das Signing Secret eintragen.
   - Den *service_role*-Key aus den Supabase Project Settings eintragen
     (wird nur serverseitig vom Webhook verwendet, niemals an den Browser
     ausgeliefert).
5. Abhängigkeiten installieren und Dev-Server starten:

   ```bash
   npm install
   npm run dev
   ```

6. Unter `/signup` einen Account erstellen, die Bestätigungs-E-Mail öffnen und
   anschließend unter `/onboarding` den ersten Verein anlegen.

## Entwicklungsstand (Roadmap)

| Phase | Inhalt | Status |
| --- | --- | --- |
| **1** | Fundament, Auth & Multi-Tenancy Setup | ✅ umgesetzt in diesem Branch |
| **2** | Core Features (Termine & Kader-Logik) | ✅ umgesetzt in diesem Branch |
| **3** | Finanzen, Kassenbuch & Sponsoring | ✅ umgesetzt in diesem Branch |
| 4 | Rechtliches, statische Seiten & Admin-Overlord | geplant |
| 5 | Testing, Optimierung & Deployment | geplant |

### Phase 1 im Detail

- Next.js App Router Projekt mit TypeScript, Tailwind CSS und
  shadcn/ui-Grundkomponenten (`Button`, `Input`, `Label`, `Card`, `Badge`).
- Supabase-Clients für Browser, Server Components und Middleware
  (`src/lib/supabase/*`), inkl. automatischem Session-Refresh.
- DB-Schema mit `tenants`, `profiles`, `memberships` + Rollen-Enum
  (`owner`, `admin`, `captain`, `member`) und Row Level Security, sodass
  Daten strikt pro Verein isoliert sind.
- Auth-Flow: Registrierung mit E-Mail-Bestätigung, Login, Logout.
- Onboarding-Flow zum Anlegen eines neuen Vereins inkl. automatisch
  generierter, eindeutiger Slug/URL.
- Geschütztes Dashboard (`/dashboard`), das Nutzer ohne Vereinszugehörigkeit
  automatisch zu `/onboarding` weiterleitet.

### Phase 2 im Detail

- **Sparten/Teams (VA-01):** `/dashboard/teams` zum Anlegen von Sparten
  (owner/admin), `/dashboard/teams/[teamId]` als Kader-Verwaltung inkl.
  Rollenvergabe (Kapitän/Mitglied) und Entfernen von Mitgliedern.
- **Einladungs-System (VA-02):** `/dashboard/teams/[teamId]/invite` erzeugt
  Mehrfach-Einladungslinks + QR-Code (`qrcode.react`); `/invite/[token]` ist
  die öffentliche Landing-Page, die nach Login/Registrierung die
  Vereins- und Sparten-Mitgliedschaft über die SECURITY DEFINER-Funktion
  `redeem_invite` herstellt (kein direkter Tabellenzugriff auf `invites`
  nötig). Signup/Login tragen dafür optional einen `redirect`-Parameter
  durch die E-Mail-Bestätigung hindurch.
- **Termine (VA-03):** `/dashboard/events` (kommend/vergangen),
  `/dashboard/events/new` (owner/admin oder Kapitän der jeweiligen Sparte),
  `/dashboard/events/[eventId]` mit Rückmeldungs-Übersicht.
- **Rückmeldungen & Fahrgemeinschaften (M-01/M-02):** `RsvpWidget`
  (Zusage/Absage/Unsicher, Absagegrund, Fahrgemeinschafts-Counter bei
  Zusage) wird sowohl auf der Termin-Detailseite als auch als "Nächster
  Termin"-Karte direkt im mobilen Dashboard verwendet.

### Phase 3 im Detail

- **Vereins-Abo (Stripe Billing):** `/dashboard/billing` zeigt die drei
  Tarife und erstellt eine Stripe Checkout Subscription-Session für
  Pro/All-In sowie eine Billing-Portal-Session zum Verwalten/Kündigen.
  Der Webhook (`checkout.session.completed`,
  `customer.subscription.updated|deleted`) hält `tenants.plan`/`status`
  synchron.
- **Kassenwart-Onboarding (Stripe Connect):** `/dashboard/finance` zeigt
  einen Hinweis, solange der Verein noch kein Stripe-Konto verbunden hat;
  "Stripe verbinden" erstellt ein Express-Konto + Onboarding-Link
  (`/dashboard/finance/connect/*`). Der `account.updated`-Webhook pflegt
  `stripe_connect_charges_enabled`.
- **Kassenbuch & Strafenkatalog (VA-04):** `/dashboard/finance` – Vorstand/
  Admin/Kapitän (nur eigene Sparte) können Strafenkatalog-Einträge und
  manuelle Kassenbuch-Posten anlegen; Mitglieder sehen dort ihre offenen
  Beträge mit einem "Jetzt bezahlen"-Button, der eine Stripe Checkout
  Payment-Session (Karte + SEPA-Lastschrift) als Destination-Charge auf das
  Kassenwart-Konto erstellt. `checkout.session.completed` markiert den
  Posten als bezahlt.
- **Lokales Sponsoring (VA-05):** `/dashboard/sponsors` zum Hochladen von
  Logos regionaler Partner (Supabase Storage, Bucket `sponsor-logos`);
  eine zufällige aktive Anzeige erscheint als "Sponsor des Tages"-Karte im
  Mitglieds-Dashboard.

> **Hinweis zu SEPA/Zahlungen:** Umgesetzt ist der nutzerinitiierte Checkout
> (Mitglied bezahlt selbst, einmalig, pro Posten). Das in Mock 3 gezeigte
> "SEPA-Einzug starten"-Sammel-Lastschriftverfahren (Vorstand zieht
> wiederkehrend von bereits hinterlegten Mandaten ein) ist bewusst **nicht**
> implementiert – das erfordert gespeicherte SEPA-Mandate, off-session
> PaymentIntents und eine Prüfung der rechtlichen/regulatorischen Seite
> (Gläubiger-ID, Vorabankündigung, Rückbuchungsfristen) vor einem
> Produktiveinsatz. Vor dem Go-Live außerdem prüfen: Stripe Connect
> Express-Konten in Deutschland, Auszahlungsfristen und ob Rückerstattungen/
> Streitfälle über das Verein- oder Plattform-Konto laufen sollen.

Die übrigen Phasen (rechtliche Seiten, Super-Admin-Dashboard, Tests &
Deployment) sind in der vollständigen SRS beschrieben und folgen in
weiteren Iterationen.
