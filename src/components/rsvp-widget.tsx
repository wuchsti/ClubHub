"use client";

import { useState } from "react";
import { Check, HelpCircle, Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RsvpStatus } from "@/types/database";

const STATUS_OPTIONS: { value: RsvpStatus; label: string; icon: typeof Check }[] = [
  { value: "yes", label: "Dabei", icon: Check },
  { value: "no", label: "Absage", icon: X },
  { value: "maybe", label: "Unsicher", icon: HelpCircle },
];

export function RsvpWidget({
  eventId,
  action,
  initialStatus,
  initialCarpoolSeats,
  initialDeclineReason,
}: {
  eventId: string;
  action: (formData: FormData) => void;
  initialStatus: RsvpStatus | null;
  initialCarpoolSeats: number | null;
  initialDeclineReason: string | null;
}) {
  const [status, setStatus] = useState<RsvpStatus | null>(initialStatus);
  const [seats, setSeats] = useState(initialCarpoolSeats ?? 0);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="status" value={status ?? ""} />

      <div className="grid grid-cols-3 gap-2">
        {STATUS_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={status === option.value ? "default" : "outline"}
            onClick={() => setStatus(option.value)}
            className={cn("flex-col gap-1 h-auto py-3")}
          >
            <option.icon />
            {option.label}
          </Button>
        ))}
      </div>

      {status === "no" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="declineReason">Grund (optional)</Label>
          <Input
            id="declineReason"
            name="declineReason"
            defaultValue={initialDeclineReason ?? ""}
            placeholder="z. B. im Urlaub"
          />
        </div>
      ) : null}

      {status === "yes" ? (
        <div className="flex flex-col gap-2">
          <Label>Freie Plätze im Auto</Label>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setSeats((value) => Math.max(0, value - 1))}
            >
              <Minus />
            </Button>
            <span className="w-6 text-center text-sm font-medium">{seats}</span>
            <Button type="button" variant="outline" size="icon" onClick={() => setSeats((value) => value + 1)}>
              <Plus />
            </Button>
          </div>
          <input type="hidden" name="carpoolSeats" value={seats} />
        </div>
      ) : null}

      <Button type="submit" disabled={!status}>
        Rückmeldung speichern
      </Button>
    </form>
  );
}
