import { createClient } from "@/lib/supabase/server";
import { createPlatformSponsor, deletePlatformSponsor, togglePlatformSponsorActive } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminSponsorsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: sponsors } = await supabase
    .from("platform_sponsors")
    .select("id, name, logo_path, link_url, is_active")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Globale Sponsoren</h1>
        <p className="text-muted-foreground">
          Werbebanner, die auf dem Dashboard aller Vereine im kostenlosen Starter-Tarif erscheinen.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(sponsors ?? []).map((sponsor) => {
          const { data: publicUrl } = supabase.storage
            .from("platform-sponsor-logos")
            .getPublicUrl(sponsor.logo_path);
          return (
            <Card key={sponsor.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{sponsor.name}</CardTitle>
                  <Badge variant={sponsor.is_active ? "default" : "secondary"}>
                    {sponsor.is_active ? "Aktiv" : "Pausiert"}
                  </Badge>
                </div>
                {sponsor.link_url ? <CardDescription>{sponsor.link_url}</CardDescription> : null}
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex h-20 items-center justify-center rounded-md border bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL */}
                  <img
                    src={publicUrl.publicUrl}
                    alt={sponsor.name}
                    className="max-h-16 max-w-full object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <form action={togglePlatformSponsorActive} className="flex-1">
                    <input type="hidden" name="sponsorId" value={sponsor.id} />
                    <input type="hidden" name="nextActive" value={(!sponsor.is_active).toString()} />
                    <Button type="submit" variant="outline" size="sm" className="w-full">
                      {sponsor.is_active ? "Pausieren" : "Aktivieren"}
                    </Button>
                  </form>
                  <form action={deletePlatformSponsor}>
                    <input type="hidden" name="sponsorId" value={sponsor.id} />
                    <input type="hidden" name="logoPath" value={sponsor.logo_path} />
                    <Button type="submit" variant="ghost" size="sm">
                      Löschen
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!sponsors?.length ? (
          <p className="text-sm text-muted-foreground">Noch keine globalen Sponsoren hinterlegt.</p>
        ) : null}
      </div>

      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle className="text-base">Neuen globalen Sponsor hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createPlatformSponsor} encType="multipart/form-data" className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="z. B. Sportswear GmbH" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="linkUrl">
                Link <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="linkUrl" name="linkUrl" type="url" placeholder="https://..." />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="logo">Logo</Label>
              <Input id="logo" name="logo" type="file" accept="image/*" required />
            </div>
            <Button type="submit">Sponsor hinzufügen</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
