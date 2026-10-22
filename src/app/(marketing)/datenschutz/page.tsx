export const metadata = { title: "Datenschutz – ClubHub" };

export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Datenschutzerklärung</h1>
      <p className="mt-2 text-sm text-muted-foreground">Stand: [Platzhalter: Datum]</p>

      <div className="mt-8 flex flex-col gap-8 text-sm leading-6 text-foreground">
        <section>
          <h2 className="font-semibold">1. Verantwortlicher</h2>
          <p>
            Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
            <br />
            [Platzhalter: Name/Firma, Anschrift, E-Mail-Adresse – siehe Impressum]
          </p>
        </section>

        <section>
          <h2 className="font-semibold">2. Datenschutzbeauftragte/r</h2>
          <p>
            [Platzhalter: Name und Kontaktdaten eines/einer Datenschutzbeauftragten, sofern
            nach Art. 37 DSGVO bestellt. Falls keine Bestellpflicht besteht, kann dieser
            Abschnitt entfallen.]
          </p>
        </section>

        <section>
          <h2 className="font-semibold">3. Registrierung und Nutzerkonto</h2>
          <p>
            Bei der Registrierung erheben wir E-Mail-Adresse, Name und ein verschlüsseltes
            Passwort. Die Authentifizierung erfolgt über{" "}
            <strong>Supabase</strong> (Supabase Inc.), das für uns als Auftragsverarbeiter im
            Sinne von Art. 28 DSGVO tätig ist. Wir nutzen ein Supabase-Projekt in der EU-Region
            [Platzhalter: z. B. Frankfurt]. Rechtsgrundlage ist die Erfüllung des
            Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO).
          </p>
        </section>

        <section>
          <h2 className="font-semibold">4. Vereins-, Termin- und Kassenbuchdaten</h2>
          <p>
            Innerhalb eines Vereins verarbeiten wir die von Vorstand/Admins und Mitgliedern
            eingegebenen Daten, u. a. Namen, Rollen, Termine, Rückmeldungen (Zu-/Absagen,
            Fahrgemeinschaften) sowie Kassenbuch-Einträge (Strafen, Beiträge, Zahlstatus).
            Rechtsgrundlage ist die Vertragserfüllung mit dem jeweiligen Verein bzw. unser
            berechtigtes Interesse an einer funktionierenden Vereinsorganisation (Art. 6 Abs. 1
            lit. b, f DSGVO). Diese Daten sind durch Datenbankrichtlinien (Row Level Security)
            strikt auf den jeweiligen Verein beschränkt.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">5. Zahlungsabwicklung</h2>
          <p>
            Für Vereins-Abonnements sowie Mitgliedsbeiträge/Strafen setzen wir{" "}
            <strong>Stripe</strong> (Stripe Payments Europe, Ltd. bzw. Stripe, Inc., USA) ein.
            Bei Kartenzahlungen und SEPA-Lastschriften werden Zahlungsdaten direkt an Stripe
            übermittelt; wir selbst speichern keine vollständigen Kartendaten. Für
            Mitgliedsbeiträge/Strafen wird zusätzlich <strong>Stripe Connect</strong> genutzt,
            über das Zahlungen direkt an das mit dem Verein verbundene Stripe-Konto
            (Kassenwart) weitergeleitet werden. Soweit Daten hierbei in die USA übermittelt
            werden, stützen wir dies auf Standardvertragsklauseln bzw. ein
            Angemessenheitsbeschluss-Rahmenwerk (z. B. EU-U.S. Data Privacy Framework).
            Rechtsgrundlage ist die Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO). Weitere
            Informationen:{" "}
            <a
              href="https://stripe.com/de/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              stripe.com/de/privacy
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-semibold">6. Hosting</h2>
          <p>
            Diese Anwendung wird bei [Platzhalter: Hosting-Anbieter, z. B. netcup oder Vercel]
            gehostet. Dabei werden automatisch Server-Log-Daten (z. B. IP-Adresse, Zeitpunkt
            des Zugriffs, aufgerufene Seite) verarbeitet, um den sicheren Betrieb der Anwendung
            zu gewährleisten (Art. 6 Abs. 1 lit. f DSGVO).
          </p>
        </section>

        <section>
          <h2 className="font-semibold">7. Cookies</h2>
          <p>
            Wir setzen ausschließlich technisch notwendige Cookies ein, insbesondere ein
            Session-Cookie zur Aufrechterhaltung Ihrer Anmeldung (Supabase Auth). Diese Cookies
            fallen unter die Ausnahme des § 25 Abs. 2 TTDSG/DDG und erfordern keine Einwilligung.
            Wir setzen aktuell keine Marketing- oder Tracking-Cookies von Drittanbietern ein.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">8. Empfänger / Auftragsverarbeiter</h2>
          <ul className="list-inside list-disc">
            <li>Supabase Inc. – Datenbank, Authentifizierung, Dateispeicher</li>
            <li>Stripe – Zahlungsabwicklung, Vereins-Abos, Kassenwart-Auszahlungen</li>
            <li>[Platzhalter: Hosting-Anbieter]</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold">9. Speicherdauer</h2>
          <p>
            Wir speichern personenbezogene Daten so lange, wie es für die genannten Zwecke
            erforderlich ist bzw. gesetzliche Aufbewahrungsfristen (z. B. handels- und
            steuerrechtliche Aufbewahrungspflichten für Zahlungsbelege) bestehen. Nach Löschung
            eines Vereins-Accounts bzw. Widerruf werden Daten gelöscht, soweit keine
            gesetzlichen Aufbewahrungspflichten entgegenstehen.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">10. Ihre Rechte</h2>
          <p>
            Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO),
            Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO),
            Datenübertragbarkeit (Art. 20 DSGVO) sowie Widerspruch gegen die Verarbeitung
            (Art. 21 DSGVO). Eine erteilte Einwilligung können Sie jederzeit mit Wirkung für
            die Zukunft widerrufen.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">11. Beschwerderecht</h2>
          <p>
            Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren,
            z. B. bei [Platzhalter: zuständige Landesdatenschutzbehörde, Anschrift].
          </p>
        </section>

        <section>
          <h2 className="font-semibold">12. Automatisierte Entscheidungsfindung</h2>
          <p>
            Eine automatisierte Entscheidungsfindung einschließlich Profiling im Sinne von
            Art. 22 DSGVO findet nicht statt.
          </p>
        </section>
      </div>
    </div>
  );
}
