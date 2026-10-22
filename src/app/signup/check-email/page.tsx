import { MailCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-secondary">
            <MailCheck className="size-5" />
          </div>
          <CardTitle className="text-xl">Fast geschafft</CardTitle>
          <CardDescription>
            Wir haben dir eine Bestätigungs-E-Mail geschickt. Klicke auf den Link darin,
            um dein Konto zu aktivieren und deinen Verein anzulegen.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </main>
  );
}
