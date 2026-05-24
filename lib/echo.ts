/**
 * lib/echo.ts — laravel-echo client wired to Laravel Reverb.
 *
 * Reverb speaks the Pusher protocol, so we use pusher-js as the transport.
 * Channel auth goes through the Sanctum-protected /broadcasting/auth route,
 * which automatically uses the same session cookie our other API calls do.
 */

import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<"reverb">;
  }
}

let instance: Echo<"reverb"> | null = null;

export function getEcho(): Echo<"reverb"> {
  if (instance) return instance;

  window.Pusher = Pusher;
  const apiBase =
    (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

  instance = new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY ?? "mkulima-local-key",
    wsHost: import.meta.env.VITE_REVERB_HOST ?? "localhost",
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "http") === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${apiBase}/broadcasting/auth`,
    auth: {
      headers: {
        // CSRF gets injected by the browser cookie; Sanctum reads it off
        // the request because we set X-XSRF-TOKEN in the apiClient wrapper.
        Accept: "application/json",
      },
    },
    // Send credentials so the session cookie reaches /broadcasting/auth.
    csrfToken: getCookie("XSRF-TOKEN") ?? undefined,
  });

  // Echo's underlying Pusher client only sends cookies if we ask.
  const pusher = (instance as unknown as { connector: { pusher: Pusher } })
    .connector.pusher;
  pusher.config.cluster = pusher.config.cluster || "";
  return instance;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Tear down on logout so the next user gets a clean socket. */
export function resetEcho(): void {
  if (instance) {
    instance.disconnect();
    instance = null;
  }
}
