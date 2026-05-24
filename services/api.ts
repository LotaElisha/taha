/**
 * services/api.ts — real Laravel API client.
 *
 * Replaces the in-memory mock from Sprints 1-5. Public function shapes are
 * preserved so `hooks/queries.ts` and every component that consumes them keep
 * working without changes.
 *
 * Endpoints live under /api/v1 (apiPrefix in api/bootstrap/app.php).
 * The fetch helper handles credentials, CSRF, and validation-error unwrapping.
 */

import { apiFetch } from "../lib/apiClient";
import { Product, Order, User, CartItem } from "../types";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

const ok = <T>(data: T): ApiResponse<T> => ({ success: true, data });
const fail = <T>(error: string): ApiResponse<T> => ({ success: false, error });

async function safe<T>(call: () => Promise<T>): Promise<ApiResponse<T>> {
  try {
    return ok(await call());
  } catch (e) {
    return fail<T>(e instanceof Error ? e.message : "Unknown error");
  }
}

interface Paginated<T> { data: T[]; meta?: unknown; links?: unknown; }
interface OneOf<T> { data: T; }

export const api = {
  auth: {
    /** Returns `null` for guests. /me responds 204 when unauthenticated. */
    me: async (): Promise<User | null> => {
      const res = await apiFetch<{ user: User } | null>("/api/v1/me", { skipCsrf: true });
      return res?.user ?? null;
    },
    logout: async (): Promise<void> => {
      await apiFetch<void>("/api/v1/auth/logout", { method: "POST" });
    },
  },

  products: {
    getAll: async (category?: string): Promise<ApiResponse<Product[]>> =>
      safe(async () => {
        const qs = category && category !== "All"
          ? `?category=${encodeURIComponent(category)}`
          : "";
        const res = await apiFetch<Paginated<Product>>(`/api/v1/products${qs}`);
        return res.data;
      }),

    getById: async (id: string): Promise<ApiResponse<Product>> =>
      safe(async () => {
        const res = await apiFetch<OneOf<Product>>(`/api/v1/products/${id}`);
        return res.data;
      }),

    /**
     * Free-text product search. The server uses Postgres full-text first,
     * then trigram fuzzy match on misses. Never calls Gemini — callers can
     * escalate to a semantic endpoint themselves if both layers return empty.
     */
    search: async (q: string, category?: string): Promise<ApiResponse<Product[]>> =>
      safe(async () => {
        const qs = new URLSearchParams({ q });
        if (category && category !== "All") qs.set("category", category);
        const res = await apiFetch<Paginated<Product>>(`/api/v1/products?${qs.toString()}`);
        return res.data;
      }),

    create: async (payload: { name: string; description?: string; price: number; category: string; stock: number; barcode?: string; imageUrl?: string; image_url?: string; isFeatured?: boolean; is_featured?: boolean }): Promise<ApiResponse<Product>> =>
      safe(async () => {
        const res = await apiFetch<OneOf<Product>>("/api/v1/products", {
          method: "POST",
          body: {
            name: payload.name,
            description: payload.description,
            price: Number(payload.price),
            category: payload.category,
            image_url: payload.imageUrl || payload.image_url,
            stock: Number(payload.stock),
            barcode: payload.barcode,
            is_featured: payload.isFeatured || payload.is_featured,
          },
        });
        return res.data;
      }),

    update: async (id: string, payload: Partial<Product>): Promise<ApiResponse<Product>> =>
      safe(async () => {
        const res = await apiFetch<OneOf<Product>>(`/api/v1/products/${id}`, {
          method: "PUT",
          body: {
            name: payload.name,
            description: payload.description,
            price: payload.price !== undefined ? Number(payload.price) : undefined,
            category: payload.category,
            image_url: payload.imageUrl || payload.image_url,
            stock: payload.stock !== undefined ? Number(payload.stock) : undefined,
            barcode: payload.barcode,
            is_featured: payload.isFeatured || payload.is_featured,
          },
        });
        return res.data;
      }),

    delete: async (id: string): Promise<ApiResponse<void>> =>
      safe(async () => {
        await apiFetch<void>(`/api/v1/products/${id}`, {
          method: "DELETE",
        });
      }),
  },

  orders: {
    create: async (
      _userId: string,
      items: CartItem[],
      total: number,
      extras?: {
        deliveryOptionId?: string;
        deliveryCost?: number;
        paymentMethodId?: string;
        guest?: { name: string; phone: string; address: string };
      }
    ): Promise<ApiResponse<Order>> =>
      safe(async () => {
        const computedDelivery = extras?.deliveryCost ?? Math.max(
          0,
          total - items.reduce((s, i) => s + i.product.price * i.quantity, 0)
        );
        const res = await apiFetch<OneOf<Order>>("/api/v1/orders", {
          method: "POST",
          body: {
            items: items.map((i) => ({
              product_id: Number(i.product.id),
              quantity: i.quantity,
            })),
            delivery_option_id: extras?.deliveryOptionId ?? "standard",
            delivery_cost: computedDelivery,
            payment_method_id: extras?.paymentMethodId ?? "mpesa",
            guest_name: extras?.guest?.name,
            guest_phone: extras?.guest?.phone,
            guest_address: extras?.guest?.address,
          },
        });
        return res.data;
      }),

    getHistory: async (_userId: string): Promise<ApiResponse<Order[]>> =>
      safe(async () => {
        const res = await apiFetch<Paginated<Order>>("/api/v1/orders/mine");
        return res.data;
      }),
  },

  users: {
    getProfile: async (_userId: string): Promise<ApiResponse<User>> =>
      safe(async () => {
        const me = await api.auth.me();
        if (!me) throw new Error("Not authenticated");
        return me;
      }),
  },

  pushTokens: {
    register: async (token: string, platform: "web" | "expo", keys?: Record<string, string>): Promise<ApiResponse<void>> =>
      safe(async () => {
        await apiFetch<void>("/api/v1/push-tokens", {
          method: "POST",
          body: { token, platform, keys },
        });
      }),
    remove: async (token: string): Promise<ApiResponse<void>> =>
      safe(async () => {
        await apiFetch<void>(`/api/v1/push-tokens/${encodeURIComponent(token)}`, {
          method: "DELETE",
        });
      }),
  },
};

export const apiDocs = {
  baseUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000/api/v1",
  endpoints: [
    { method: "POST", path: "/auth/otp/request", description: "Send an SMS OTP to the given phone.", body: { phone: "+255712345678", region: "TZ", channel: "sms" } },
    { method: "POST", path: "/auth/otp/verify", description: "Verify an OTP and open a session cookie. Pass role + name on first sign-in.", body: { phone: "+255712345678", code: "000000", region: "TZ", role: "Farmer", name: "Joseph" } },
    { method: "GET", path: "/me", description: "Hydrate the React AuthContext on app boot." },
    { method: "GET", path: "/products", description: "Public marketplace listing.", params: [{ name: "category", type: "string", optional: true, desc: "Filter by category" }] },
    { method: "POST", path: "/orders", description: "Place a new order.", body: { items: [{ product_id: 1, quantity: 2 }], delivery_option_id: "standard", delivery_cost: 5000, payment_method_id: "mpesa" } },
    { method: "POST", path: "/kyc/submit", description: "Multipart upload of NIN + ID + selfie. Auth required." },
    { method: "POST", path: "/ai/plant-scan", description: "Server-side Gemini call. Returns diagnosis + product suggestions." },
  ],
};
