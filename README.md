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
   - `20261022030000_phase4_platform_admin.sql` – `platform_sponsors`,
     `tenants.is_suspended`, die `is_platform_admin()`-Funktion und
     zugehörige RLS-Policies, Storage-Bucket `platform-sponsor-logos`.
   - `20261022040000_phase5_push_subscriptions.sql` – `push_subscriptions`
     für Web-Push-Benachrichtigungen (siehe Phase 5).
4. Den ersten Platform-Admin freischalten (es gibt dafür bewusst keine
   Self-Service-UI): in der Supabase SQL-Konsole

   ```sql
   update public.profiles set is_platform_admin = true where email = '<deine-email>';
   ```

   Danach ist `/admin` erreichbar (Mandanten-Übersicht, Sperren/Limits,
   globale Sponsoren-Banner).
5. Für Phase 3 zusätzlich ein [Stripe](https://dashboard.stripe.com)-Konto
   (Test-Modus reicht lokal) einrichten:
   - Zwei wiederkehrende Preise für die Tarife "Pro" und "All-In" anlegen
     und deren Price-IDs in `.env.local` eintragen.
   - Einen Webhook-Endpunkt auf `/api/webhooks/stripe` einrichten (lokal am
     einfachsten mit der Stripe CLI: `stripe listen --forward-to
     localhost:3000/api/webhooks/stripe`) und das Signing Secret eintragen.
   - Den *service_role*-Key aus den Supabase Project Settings eintragen
     (wird nur serverseitig vom Webhook verwendet, niemals an den Browser
     ausgeliefert).
6. Für Push-Benachrichtigungen (Phase 5) ein VAPID-Schlüsselpaar erzeugen
   und in `.env.local` eintragen:

   ```bash
   npx web-push generate-vapid-keys
   ```

7. Abhängigkeiten installieren und Dev-Server starten:

   ```bash
   npm install
   npm run dev
   ```

8. Unter `/signup` einen Account erstellen, die Bestätigungs-E-Mail öffnen und
   anschließend unter `/onboarding` den ersten Verein anlegen.

## Tests

```bash
npm run test    # Vitest: Unit-Tests + Schema-Sanity-Checks gegen supabase/migrations/*.sql
npm run lint
npm run build
```

Die Schema-Sanity-Tests (`test/schema.test.ts`) parsen alle Migrationsdateien
statisch und stellen sicher, dass jede neu angelegte Tabelle RLS aktiviert
hat, mindestens eine Policy existiert und jeder Storage-Bucket eine
`storage.objects`-Policy hat – ganz ohne laufende Datenbank. `.github/workflows/ci.yml`
führt das bei jedem Push/PR aus und spült zusätzlich alle Migrationen gegen
einen echten lokalen Supabase-Stack (`supabase start` + `supabase db push`),
um Supabase-spezifisches Verhalten (`auth.users`, `auth.uid()`,
`storage.buckets`) abzudecken, das eine reine Postgres-Instanz nicht bieten
kann.

## Deployment

**Vercel (empfohlen für den Start):** Repo importieren, die Variablen aus
`.env.local.example` in den Project Settings eintragen, fertig – Next.js
läuft dort zero-config inkl. automatischem SSL.

**Self-hosted (z. B. netcup) via Docker:**

```bash
docker build -t clubhub .
docker run -p 3000:3000 --env-file .env.local clubhub
# oder: docker compose up -d
```

Der `Dockerfile` nutzt Next.js' `output: "standalone"` für ein schlankes
Image. Davor einen Reverse Proxy (Caddy, Nginx, Traefik) mit eigenem
Let's-Encrypt-Zertifikat für SSL + eigene Domain schalten. **Hinweis:**
Der Docker-Build wurde in dieser Sandbox nicht ausgeführt (kein laufender
Docker-Daemon verfügbar) – vor dem Produktiveinsatz lokal `docker build`
verifizieren.

## Entwicklungsstand (Roadmap)

| Phase | Inhalt | Status |
| --- | --- | --- |
| **1** | Fundament, Auth & Multi-Tenancy Setup | ✅ umgesetzt in diesem Branch |
| **2** | Core Features (Termine & Kader-Logik) | ✅ umgesetzt in diesem Branch |
| **3** | Finanzen, Kassenbuch & Sponsoring | ✅ umgesetzt in diesem Branch |
| **4** | Rechtliches, statische Seiten & Admin-Overlord | ✅ umgesetzt in diesem Branch |
| **5** | Testing, Optimierung & Deployment | ✅ umgesetzt in diesem Branch |

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

### Phase 4 im Detail

- **Public Landing Page (PUB-01):** `src/app/(marketing)` – gemeinsames
  Layout mit Header/Footer für `/`, `/impressum`, `/datenschutz`; die
  Startseite zeigt Hero, Feature-Übersicht und dieselbe Tarif-Tabelle wie
  `/dashboard/billing` (geteilt über `src/lib/plans.ts`).
- **Impressum & Datenschutz (PUB-02, PUB-03):** `/impressum` (§ 5 DDG) und
  `/datenschutz` (DSGVO, inkl. Supabase- und Stripe-Auftragsverarbeitung,
  Cookie-Hinweis, Betroffenenrechte). Beide enthalten `[Platzhalter: ...]`
  für Betreiberdaten, Registereintrag und Aufsichtsbehörde – **diese
  Platzhalter müssen vor einem echten Go-Live durch eine Rechtsberatung
  befüllt/geprüft werden**, sie sind absichtlich nicht mit erfundenen
  Angaben gefüllt.
- **Super-Admin-Dashboard (SA-01, SA-02):** `/admin` (geschützt durch
  `profiles.is_platform_admin`, siehe Einrichtung oben) zeigt eine
  Mandanten-Übersicht (Tarif, Abo-Status, Mitgliederzahl/-Limit) und pro
  Verein unter `/admin/tenants/[tenantId]` Buttons zum Sperren/Entsperren
  sowie zum Anpassen des Mitglieder-Limits. Ein gesperrter Verein wird
  beim nächsten Dashboard-Aufruf seiner Mitglieder auf `/suspended`
  umgeleitet (Platform-Admins sind davon ausgenommen).
- **Globales Werbe-Dashboard (SA-03):** `/admin/sponsors` pflegt globale
  Sponsoren-Banner (eigener Storage-Bucket `platform-sponsor-logos`). Die
  `SponsorCard`-Komponente zeigt für Vereine im kostenlosen Starter-Tarif
  immer ein zufälliges globales Banner, für Pro/All-In stattdessen (falls
  vorhanden) deren eigenen lokalen Sponsor – passend zur "mit
  Werbung"/"werbefrei"-Unterscheidung in der Preistabelle.

### Phase 5 im Detail

- **Automatisierte Tests:** Vitest-Setup (`vitest.config.ts`) mit
  Unit-Tests für `slugify`, `euroToCents`/`formatEuro`, `pickRandom`,
  `isTenantManager` sowie Komponenten-Tests für `RsvpWidget`
  (React Testing Library). Die Schema-Sanity-Tests oben prüfen die
  Migrationen statisch.
- **CI (`.github/workflows/ci.yml`):** Job 1 führt Lint/Test/Build aus
  (identisch zu den oben genannten lokalen Befehlen). Job 2 spült alle
  Migrationen gegen einen frischen lokalen Supabase-Stack.
- **Performance (Lighthouse):** Lokal gegen den Produktions-Build
  gemessen (Playwright-Chromium, `npx lighthouse`) – alle öffentlichen
  Seiten liegen deutlich über der Zielmarke von 90:

  | Seite | Performance | Accessibility | Best Practices | SEO |
  | --- | --- | --- | --- | --- |
  | `/` | 96 | 100 | 100 | 100 |
  | `/login` | 99 | 100 | 100 | 100 |
  | `/signup` | 98 | 100 | 100 | 100 |
  | `/impressum` | 99 | 100 | 100 | 100 |
  | `/datenschutz` | 99 | 100 | 100 | 100 |

  (Authentifizierte `/dashboard/*`-Seiten wurden nicht gemessen, da sie
  eine echte Supabase-Session voraussetzen und für eine Login-geschützte
  Area ohnehin kein öffentlicher Lighthouse-Score relevant ist.)
- **PWA-Kompatibilität:** `public/manifest.json` + generierte Icons
  (`public/icons/`, erzeugt via `scripts/generate-icons.mjs`) machen
  ClubHub auf Mobilgeräten installierbar (`display: "standalone"`,
  Start-URL `/dashboard`).
- **Push-Benachrichtigungen für Termine:** `public/sw.js` (Service
  Worker) + `push_subscriptions`-Tabelle (RLS: nur eigene Zeilen) +
  "Benachrichtigungen aktivieren"-Button im Dashboard-Header
  (`PushNotificationButton`, Web Push API mit VAPID). Beim Anlegen eines
  Termins (`dashboard/events/new/actions.ts`) wird allen Mitgliedern der
  betroffenen Sparte (außer dem Ersteller) serverseitig über `web-push`
  eine Benachrichtigung geschickt (`src/lib/web-push.ts`, nutzt den
  Service-Role-Client, da fremde Subscriptions gelesen werden müssen);
  abgelaufene Subscriptions (404/410) werden automatisch entfernt. Eine
  zeitgesteuerte Erinnerung vor der Rückmelde-Deadline bräuchte einen
  externen Scheduler (z. B. Supabase Cron oder Vercel Cron) und ist nicht
  Teil dieser Iteration.
- **Deployment:** `next.config.ts` nutzt `output: "standalone"`; ein
  mehrstufiger `Dockerfile` + `docker-compose.yml` fürs Self-Hosting
  (z. B. netcup) liegen bei. Siehe Abschnitt "Deployment" oben für
  Vercel- und Docker-Vorgehen.
