import * as React from "react";

/**
 * OfflineBanner — appears at the top when the browser reports `offline`.
 * Hidden when navigator.onLine === true. No-op on SSR.
 */
export function OfflineBanner() {
  const [online, setOnline] = React.useState<boolean>(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  React.useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-harvest-500 px-3 py-1.5 text-xs font-medium text-white"
    >
      <span aria-hidden>●</span>
      <span>You're offline — changes will sync when you're back online.</span>
    </div>
  );
}
