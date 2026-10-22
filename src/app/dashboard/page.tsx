import { CalendarDays, PiggyBank, Megaphone } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Willkommen zurück. Termine, Kasse und Ankündigungen folgen in den nächsten Ausbaustufen.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CalendarDays className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Nächster Termin</CardTitle>
            <CardDescription>Noch keine Termine angelegt.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
        <Card>
          <CardHeader>
            <PiggyBank className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Offene Beträge</CardTitle>
            <CardDescription>Keine offenen Posten.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
        <Card>
          <CardHeader>
            <Megaphone className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Team-Pinnwand</CardTitle>
            <CardDescription>Noch keine Ankündigungen.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </div>
    </div>
  );
}
