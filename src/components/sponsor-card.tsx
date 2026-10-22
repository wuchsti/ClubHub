import { createClient } from "@/lib/supabase/server";
import { pickRandom } from "@/lib/random";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function SponsorCard({ tenantId }: { tenantId: string }) {
  const supabase = await createClient();
  const { data: tenant } = await supabase.from("tenants").select("plan").eq("id", tenantId).single();

  // Starter is the free, ad-supported tier (SA-03): it always shows a
  // global platform banner instead of the club's own local sponsors.
  // Pro/All-In are ad-free and show only sponsors the club set up itself.
  if (tenant?.plan === "starter") {
    const { data: platformSponsors } = await supabase
      .from("platform_sponsors")
      .select("name, logo_path, link_url")
      .eq("is_active", true);

    if (!platformSponsors?.length) {
      return null;
    }

    const sponsor = pickRandom(platformSponsors);
    const { data: publicUrl } = supabase.storage.from("platform-sponsor-logos").getPublicUrl(sponsor.logo_path);
    return <SponsorBanner name={sponsor.name} linkUrl={sponsor.link_url} logoUrl={publicUrl.publicUrl} />;
  }

  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("name, logo_path, link_url")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (!sponsors?.length) {
    return null;
  }

  const sponsor = pickRandom(sponsors);
  const { data: publicUrl } = supabase.storage.from("sponsor-logos").getPublicUrl(sponsor.logo_path);
  return <SponsorBanner name={sponsor.name} linkUrl={sponsor.link_url} logoUrl={publicUrl.publicUrl} />;
}

function SponsorBanner({
  name,
  linkUrl,
  logoUrl,
}: {
  name: string;
  linkUrl: string | null;
  logoUrl: string;
}) {
  const logo = (
    // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
    <img src={logoUrl} alt={name} className="max-h-14 max-w-full object-contain" />
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm text-muted-foreground">Sponsor des Tages</CardTitle>
          <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Anzeige
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex h-16 items-center justify-center rounded-md bg-white">
        {linkUrl ? (
          <a href={linkUrl} target="_blank" rel="noopener noreferrer">
            {logo}
          </a>
        ) : (
          logo
        )}
      </CardContent>
    </Card>
  );
}
