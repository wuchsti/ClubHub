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

   Die Migration liegt unter `supabase/migrations/20261022000000_init_multitenancy.sql`
   und legt die Tabellen `tenants`, `profiles`, `memberships` inkl. RLS-Policies an.
4. Abhängigkeiten installieren und Dev-Server starten:

   ```bash
   npm install
   npm run dev
   ```

5. Unter `/signup` einen Account erstellen, die Bestätigungs-E-Mail öffnen und
   anschließend unter `/onboarding` den ersten Verein anlegen.

## Entwicklungsstand (Roadmap)

| Phase | Inhalt | Status |
| --- | --- | --- |
| **1** | Fundament, Auth & Multi-Tenancy Setup | ✅ umgesetzt in diesem Branch |
| 2 | Core Features (Termine & Kader-Logik) | geplant |
| 3 | Finanzen, Kassenbuch & Sponsoring | geplant |
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

Die übrigen Phasen (Termine, Kassenbuch/SEPA, Sponsoring, rechtliche Seiten,
Super-Admin-Dashboard, Tests & Deployment) sind in der vollständigen SRS
beschrieben und folgen in weiteren Iterationen.
