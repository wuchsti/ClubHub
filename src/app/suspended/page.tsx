import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-secondary">
            <Lock className="size-5" />
          </div>
          <CardTitle className="text-xl">Verein gesperrt</CardTitle>
          <CardDescription>
            Dieser Vereins-Account wurde von ClubHub vorübergehend gesperrt, z. B. wegen
            ausstehender Zahlungen. Bitte wendet euch an euren Vorstand oder an den
            ClubHub-Support, um die Sperrung zu klären.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline" className="w-full">
              Abmelden
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
