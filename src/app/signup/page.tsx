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
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Verein kostenlos anlegen</CardTitle>
          <CardDescription>
            Erstelle dein ClubHub-Konto. Im nächsten Schritt legst du deinen Verein an.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signup} className="flex flex-col gap-4">
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
            <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Anmelden
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
