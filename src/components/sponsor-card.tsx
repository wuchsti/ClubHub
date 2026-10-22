import { createClient } from "@/lib/supabase/server";
import { pickRandom } from "@/lib/random";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function SponsorCard({ tenantId }: { tenantId: string }) {
  const supabase = await createClient();
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

  const logo = (
    // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
    <img src={publicUrl.publicUrl} alt={sponsor.name} className="max-h-14 max-w-full object-contain" />
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">Sponsor des Tages</CardTitle>
      </CardHeader>
      <CardContent className="flex h-16 items-center justify-center rounded-md bg-white">
        {sponsor.link_url ? (
          <a href={sponsor.link_url} target="_blank" rel="noopener noreferrer">
            {logo}
          </a>
        ) : (
          logo
        )}
      </CardContent>
    </Card>
  );
}
