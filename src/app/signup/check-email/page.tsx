import { MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckEmailPage() {
  return (
    <AuthShell>
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
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
    </AuthShell>
  );
}
