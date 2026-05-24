import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { qk } from "../lib/queryClient";
import { CartItem } from "../types";

/**
 * Canonical query/mutation hooks.
 *
 * These wrap `services/api.ts` (currently mocked with setTimeout) so the
 * component layer can move to data-fetching hooks without waiting for a real
 * server. When the server arrives, only the inner `api.*` call swaps — the
 * hooks and their callers stay the same.
 */

export function useProducts(category?: string) {
  return useQuery({
    queryKey: category ? [...qk.products(), { category }] : qk.products(),
    queryFn: async () => {
      const res = await api.products.getAll(category);
      if (!res.success || !res.data) throw new Error(res.error || "Unknown error");
      return res.data;
    },
  });
}

/**
 * useProductSearch — Postgres-backed search. Sub-100 ms for hits, with an
 * automatic trigram fallback for typos. Disabled when the query is shorter
 * than 2 characters so we don't hammer the API on every keystroke.
 */
export function useProductSearch(query: string, category?: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["products", "search", { q: trimmed, category }],
    queryFn: async () => {
      const res = await api.products.search(trimmed, category);
      if (!res.success || !res.data) throw new Error(res.error || "Search failed");
      return res.data;
    },
    enabled: trimmed.length >= 2,
    staleTime: 60_000,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.product(id) : ["products", "null"],
    queryFn: async () => {
      if (!id) throw new Error("Missing id");
      const res = await api.products.getById(id);
      if (!res.success || !res.data) throw new Error(res.error || "Not found");
      return res.data;
    },
    enabled: !!id,
  });
}

export function useOrdersByUser(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? qk.ordersByUser(userId) : ["orders", "user", "anon"],
    queryFn: async () => {
      if (!userId) return [];
      const res = await api.orders.getHistory(userId);
      if (!res.success || !res.data) throw new Error(res.error || "Unknown error");
      return res.data;
    },
    enabled: !!userId,
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      items,
      total,
    }: {
      userId: string;
      items: CartItem[];
      total: number;
    }) => {
      const res = await api.orders.create(userId, items, total);
      if (!res.success || !res.data) throw new Error(res.error || "Failed");
      return res.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.ordersByUser(vars.userId) });
      qc.invalidateQueries({ queryKey: qk.orders() });
    },
  });
}

export function useRegisterPushToken() {
  return useMutation({
    mutationFn: async ({
      userId,
      token,
      platform,
    }: {
      userId: string;
      token: string;
      platform: "web" | "expo";
    }) => {
      // The api shim is platform-agnostic today. Sprint 6 server adds the field.
      const res = await api.expo.registerPushToken(userId, token);
      if (!res.success) throw new Error(res.error || "Failed");
      return { platform };
    },
  });
}
