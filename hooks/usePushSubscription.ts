import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/apiClient";
import { toast } from "../components/ui/sonner";

/**
 * usePushSubscription — opt-in Web Push wiring.
 *
 *   • Runs only when the user is authenticated AND VITE_VAPID_PUBLIC is set.
 *   • Subscribes via the registered service worker (vite-plugin-pwa registers
 *     one at /sw.js).
 *   • Posts the subscription JSON to /api/v1/push-tokens — idempotent on the
 *     server side, so this is safe to re-run on every mount.
 *
 * We deliberately don't auto-prompt the user — call `requestPermissionAndSubscribe`
 * after a meaningful moment (placed first order, KYC submitted) so the prompt
 * lands when consent feels natural.
 */
export function usePushSubscription(): {
  requestPermissionAndSubscribe: () => Promise<boolean>;
} {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    // If permission is already granted, refresh the subscription so the
    // server has a fresh token (some browsers rotate the endpoint).
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      subscribeAndRegister().catch(() => {});
    }
  }, [user]);

  const requestPermissionAndSubscribe = async (): Promise<boolean> => {
    if (typeof Notification === "undefined") return false;
    if (Notification.permission === "denied") return false;
    if (Notification.permission !== "granted") {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return false;
    }
    try {
      await subscribeAndRegister();
      toast.success("Notifications on.");
      return true;
    } catch (e) {
      console.warn("Push subscribe failed:", e);
      return false;
    }
  };

  return { requestPermissionAndSubscribe };
}

async function subscribeAndRegister(): Promise<void> {
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC as string | undefined;
  if (!publicKey) return; // Web Push not configured for this environment.
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  await apiFetch("/api/v1/push-tokens", {
    method: "POST",
    body: {
      token: JSON.stringify(sub.toJSON()),
      platform: "web",
      keys: sub.toJSON().keys ?? null,
    },
  });
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const padded = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
