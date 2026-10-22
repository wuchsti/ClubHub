"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { savePushSubscription } from "@/app/dashboard/push-actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

type Status = "unsupported" | "idle" | "enabled" | "loading" | "denied";

export function PushNotificationButton({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    async function detectStatus(): Promise<Status> {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return "unsupported";
      }
      if (Notification.permission === "denied") {
        return "denied";
      }
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      return subscription ? "enabled" : "idle";
    }

    let cancelled = false;
    detectStatus().then((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleEnable() {
    setStatus("loading");
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const result = await savePushSubscription(subscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      });

      setStatus(result.ok ? "enabled" : "idle");
    } catch {
      setStatus("idle");
    }
  }

  if (status === "unsupported" || status === "enabled") {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleEnable}
      disabled={status === "loading" || status === "denied"}
    >
      {status === "denied" ? <BellRing /> : <Bell />}
      {status === "denied" ? "Benachrichtigungen blockiert" : "Benachrichtigungen aktivieren"}
    </Button>
  );
}
