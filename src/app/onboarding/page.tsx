import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createTenant } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/onboarding");
  }

  const { data: existingMembership } = await supabase
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existingMembership) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Deinen Verein anlegen</CardTitle>
          <CardDescription>
            Du wirst automatisch als Vereins-Admin eingetragen und kannst danach
            Sparten, Termine und Mitglieder verwalten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createTenant} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Vereinsname</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="z. B. VfL Hitzhusen"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">
                Eigene URL <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="slug"
                name="slug"
                type="text"
                placeholder="vfl-hitzhusen"
              />
              <p className="text-xs text-muted-foreground">
                Leer lassen, um die URL automatisch aus dem Vereinsnamen zu erzeugen.
              </p>
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="mt-2">
              Verein anlegen
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
