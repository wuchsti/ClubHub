import Link from "next/link";
import { CircleAlert, PartyPopper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: preview } = await supabase.rpc("invite_preview", { p_token: token });
  const info = preview?.[0];
  const isValid = info?.valid ?? false;

  const { data: { user } } = await supabase.auth.getUser();
  const redirectTarget = `/invite/${token}`;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-secondary">
            {isValid ? <PartyPopper className="size-5" /> : <CircleAlert className="size-5" />}
          </div>
          <CardTitle className="text-xl">
            {isValid ? `Einladung zu ${info?.tenant_name}` : "Einladung ungültig"}
          </CardTitle>
          <CardDescription>
            {isValid
              ? info?.team_name
                ? `Du wirst der Sparte "${info.team_name}" beitreten.`
                : "Du wirst dem Verein beitreten."
              : "Dieser Link ist abgelaufen oder wurde bereits zu oft verwendet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {isValid && user ? (
            <form action={acceptInvite}>
              <input type="hidden" name="token" value={token} />
              <Button type="submit" className="w-full">
                Einladung annehmen
              </Button>
            </form>
          ) : null}
          {isValid && !user ? (
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href={`/signup?redirect=${encodeURIComponent(redirectTarget)}`}>
                  Konto erstellen
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/login?redirect=${encodeURIComponent(redirectTarget)}`}>
                  Ich habe schon ein Konto
                </Link>
              </Button>
            </div>
          ) : null}
          {!isValid ? (
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Zur Startseite</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
