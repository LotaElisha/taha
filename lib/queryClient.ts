import { QueryClient } from "@tanstack/react-query";

/**
 * App-wide TanStack Query client.
 *
 * Defaults tuned for the mock API today and a Tanzanian 3G/4G reality:
 *   • staleTime 30 s — refetching is expensive on flaky networks.
 *   • gcTime 5 min — keep recently used queries warm in memory.
 *   • retry 2 — most failures recover; more than 2 wastes data.
 *   • refetchOnWindowFocus false — too aggressive for PWAs on mobile.
 *
 * When the real backend lands, override per-query as needed.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Centralized query keys so hooks can invalidate each other reliably.
 * Keep tuple-typed: every key starts with a domain string + identifying args.
 */
export const qk = {
  products: () => ["products"] as const,
  product: (id: string) => ["products", id] as const,
  orders: () => ["orders"] as const,
  ordersByUser: (userId: string) => ["orders", "user", userId] as const,
  user: (id: string) => ["users", id] as const,
  pushToken: (userId: string) => ["push-token", userId] as const,
};
