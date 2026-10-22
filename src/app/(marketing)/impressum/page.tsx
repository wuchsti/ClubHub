export const metadata = { title: "Impressum – ClubHub" };

export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Impressum</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)
      </p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-6 text-foreground">
        <section>
          <h2 className="font-semibold">Diensteanbieter</h2>
          <p>
            [Platzhalter: Name/Firma des Betreibers]
            <br />
            [Platzhalter: Straße und Hausnummer]
            <br />
            [Platzhalter: PLZ und Ort]
            <br />
            [Platzhalter: Land]
          </p>
        </section>

        <section>
          <h2 className="font-semibold">Vertretungsberechtigte</h2>
          <p>[Platzhalter: Name der vertretungsberechtigten Person(en), z. B. Geschäftsführer/in]</p>
        </section>

        <section>
          <h2 className="font-semibold">Kontakt</h2>
          <p>
            Telefon: [Platzhalter: Telefonnummer]
            <br />
            E-Mail: [Platzhalter: E-Mail-Adresse]
          </p>
        </section>

        <section>
          <h2 className="font-semibold">Registereintrag</h2>
          <p>
            [Platzhalter: Eintragung im Handels-/Vereinsregister, Registergericht und
            Registernummer, sofern vorhanden]
          </p>
        </section>

        <section>
          <h2 className="font-semibold">Umsatzsteuer-ID</h2>
          <p>
            [Platzhalter: Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG, sofern vorhanden]
          </p>
        </section>

        <section>
          <h2 className="font-semibold">Zuständige Aufsichtsbehörde</h2>
          <p>
            [Platzhalter: nur erforderlich, falls die Tätigkeit einer behördlichen Zulassung
            bedarf]
          </p>
        </section>

        <section>
          <h2 className="font-semibold">Verantwortlich für den Inhalt</h2>
          <p>
            [Platzhalter: Name und Anschrift der inhaltlich verantwortlichen Person gemäß § 18
            Abs. 2 MStV, falls redaktionelle Inhalte angeboten werden]
          </p>
        </section>

        <section>
          <h2 className="font-semibold">EU-Streitschlichtung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
            bereit:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              https://ec.europa.eu/consumers/odr/
            </a>
            . Unsere E-Mail-Adresse finden Sie oben. Wir sind nicht verpflichtet und nicht
            bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
            teilzunehmen, sofern hierzu keine gesonderte Angabe erfolgt.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">Haftung für Inhalte</h2>
          <p>
            Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den
            allgemeinen Gesetzen verantwortlich. Für von Nutzern (z. B. Vereinen oder deren
            Mitgliedern) eingestellte Inhalte, wie Termine, Kassenbucheinträge oder
            Sponsorenlogos, sind wir als Hostprovider nicht verantwortlich, sofern wir keine
            Kenntnis von einer rechtswidrigen Nutzung haben.
          </p>
        </section>
      </div>
    </div>
  );
}
