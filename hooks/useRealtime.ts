import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { getEcho, resetEcho } from "../lib/echo";
import { qk } from "../lib/queryClient";
import { toast } from "../components/ui/sonner";

/**
 * useRealtime — mount once at the route shell level (FarmerSurface,
 * DealerSurface, AdminSurface). Subscribes to the channels relevant to the
 * current user and dispatches:
 *   • TanStack Query invalidations so screens re-fetch fresh data.
 *   • Toasts so the user sees the change even when they're on a different tab.
 *
 * Sanctum's CSRF cookie + session cookie must already be present, which is
 * always true after AuthContext bootstraps.
 */
export function useRealtime(): void {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) {
      resetEcho();
      return;
    }
    const echo = getEcho();

    // Every authenticated user gets their personal channel.
    const userChannel = echo.private(`users.${user.id}`);

    userChannel.listen(".OrderStatusUpdated", (payload: { id: number; status: string }) => {
      qc.invalidateQueries({ queryKey: qk.ordersByUser(String(user.id)) });
      qc.invalidateQueries({ queryKey: qk.orders() });
      toast.info(`Order #${payload.id} is now ${payload.status}.`);
    });

    userChannel.listen(".KycStatusUpdated", (payload: { status: string }) => {
      // Server-side mirror of the user's kyc_status; refetch /me to pick it up.
      qc.invalidateQueries({ queryKey: ["users", String(user.id)] });
      const verb =
        payload.status === "Verified"
          ? "Your ID was verified. Financial services are unlocked."
          : payload.status === "Rejected"
            ? "Your KYC was rejected. Please resubmit with clearer photos."
            : `KYC update: ${payload.status}`;
      toast.info(verb);
    });

    // Vendors also listen for their vendor channel.
    let vendorChannel: ReturnType<typeof echo.private> | null = null;
    if (user.role === "Agrodealer" || user.role === "Agrovet") {
      vendorChannel = echo.private(`vendors.${user.id}`);
      vendorChannel.listen(".OrderStatusUpdated", (p: { id: number; status: string }) => {
        qc.invalidateQueries({ queryKey: qk.orders() });
        toast.info(`New order #${p.id}`);
      });
      vendorChannel.listen(".LowStockAlert", (p: { name: string; stock: number }) => {
        qc.invalidateQueries({ queryKey: qk.products() });
        toast.warning(`Low stock: ${p.name} (${p.stock} left).`);
      });
    }

    return () => {
      echo.leave(`users.${user.id}`);
      if (vendorChannel) echo.leave(`vendors.${user.id}`);
    };
  }, [user, qc]);
}
