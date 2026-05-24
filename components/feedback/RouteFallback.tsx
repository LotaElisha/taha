import * as React from "react";
import { Skeleton } from "./Skeleton";

/**
 * RouteFallback — the placeholder we show while a lazy-loaded route chunk
 * downloads. Mimics the shape of the most common screen (app bar + a few
 * skeleton cards) so the transition feels like "the page is loading" not
 * "the app crashed". 200 ms delay avoids a flash for fast chunks.
 */
export function RouteFallback() {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6" role="status" aria-busy>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-4 h-32 w-full" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="mt-4 h-48 w-full" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
