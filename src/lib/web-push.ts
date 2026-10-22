import "server-only";
import webpush from "web-push";

let configured = false;

function ensureConfigured() {
  if (configured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error("VAPID keys are not configured");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export function isPushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
  );
}

export type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
};

/**
 * Sends a push notification to every given subscription, best-effort.
 * Returns the ids of subscriptions that came back 404/410 Gone, so the
 * caller can prune them (the browser revoked/replaced the subscription).
 */
export async function sendPushToSubscriptions(
  subscriptions: PushSubscriptionRow[],
  payload: { title: string; body: string; url: string }
): Promise<{ expiredIds: string[] }> {
  if (!isPushConfigured() || subscriptions.length === 0) {
    return { expiredIds: [] };
  }

  ensureConfigured();

  const expiredIds: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          JSON.stringify(payload)
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          expiredIds.push(sub.id);
        }
      }
    })
  );

  return { expiredIds };
}
