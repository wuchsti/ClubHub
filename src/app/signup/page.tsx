import Link from "next/link";
import { signup } from "./actions";
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

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}) {
  const { error, redirect: redirectTo } = await searchParams;
  const isInvite = redirectTo?.startsWith("/invite/");

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            {isInvite ? "Konto erstellen & Einladung annehmen" : "Verein kostenlos anlegen"}
          </CardTitle>
          <CardDescription>
            {isInvite
              ? "Erstelle dein ClubHub-Konto, um der Einladung zu folgen."
              : "Erstelle dein ClubHub-Konto. Im nächsten Schritt legst du deinen Verein an."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signup} className="flex flex-col gap-4">
            <input type="hidden" name="redirect" value={redirectTo ?? "/onboarding"} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName">Name</Label>
              <Input id="fullName" name="fullName" type="text" autoComplete="name" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="mt-2">
              Konto erstellen
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Bereits registriert?{" "}
            <Link
              href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Anmelden
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
