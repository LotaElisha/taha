import * as React from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { AppShell, AppBar, type NavItem } from "../../components/app-shell";
import { OfflineBanner } from "../../components/feedback/OfflineBanner";
import { EmptyState } from "../../components/feedback/EmptyState";
import { StatusChip } from "../../components/feedback/StatusChip";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { toast } from "../../components/ui/sonner";
import { useAuth } from "../../context/AuthContext";
import { LogisticsProvider, LogisticsBooking } from "../../types";
import { cn, formatRelativeDate } from "../../lib/utils";
import { api } from "../../services/api";

interface LogisticsSurfaceProps {
  provider: LogisticsProvider;
  bookings: LogisticsBooking[];
  setBookings: (
    next: LogisticsBooking[] | ((prev: LogisticsBooking[]) => LogisticsBooking[])
  ) => void;
}

/**
 * LogisticsSurface — `/logistics/*` per DESIGN_SPEC §9.6.
 * Bottom nav: Today / Jobs / Earnings / Profile.
 */
export function LogisticsSurface({
  provider,
  bookings,
  setBookings,
}: LogisticsSurfaceProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const activeNavId = location.pathname.startsWith("/logistics/jobs")
    ? "jobs"
    : location.pathname.startsWith("/logistics/earnings")
      ? "earnings"
      : location.pathname.startsWith("/logistics/profile")
        ? "profile"
        : "today";

  const nav: NavItem[] = [
    { id: "today", label: "Today", icon: <HomeIcon />, onClick: () => navigate("/logistics") },
    { id: "jobs", label: "Jobs", icon: <TruckIcon />, onClick: () => navigate("/logistics/jobs") },
    { id: "earnings", label: "Earnings", icon: <CashIcon />, onClick: () => navigate("/logistics/earnings") },
    { id: "profile", label: "Profile", icon: <UserIcon />, onClick: () => navigate("/logistics/profile") },
  ];

  const myBookings = React.useMemo(
    () => bookings.filter((b) => b.providerId === provider.id),
    [bookings, provider.id]
  );
  const available = bookings.filter((b) => !b.providerId && b.status === "Pending");

  return (
    <AppShell
      appBar={
        <AppBar
          leading={
            <span className="flex items-center gap-2 px-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-700 text-white">
                <TruckIcon />
              </span>
              <span className="text-base font-semibold text-fg">Mkulima · Logistics</span>
            </span>
          }
          trailing={
            <>
              <Badge
                variant={
                  provider.status === "Approved"
                    ? "success"
                    : provider.status === "Pending"
                      ? "warning"
                      : "danger"
                }
              >
                {provider.status}
              </Badge>
              <button onClick={logout} className="text-xs font-medium text-muted hover:text-fg">
                Sign out
              </button>
            </>
          }
        />
      }
      navItems={nav}
      activeNavId={activeNavId}
    >
      <OfflineBanner />
      <Routes>
        <Route index element={<Navigate to="/logistics" replace />} />
        <Route
          path="logistics"
          element={
            <TodayView
              provider={provider}
              activeJobs={myBookings.filter((b) => b.status === "Confirmed" || b.status === "In Transit")}
              newJobs={available.length}
              onGoToJobs={() => navigate("/logistics/jobs")}
            />
          }
        />
        <Route
          path="logistics/jobs"
          element={
            <JobsView
              myBookings={myBookings}
              available={available}
              providerId={provider.id}
              setBookings={setBookings}
            />
          }
        />
        <Route
          path="logistics/earnings"
          element={
            <EarningsView
              completed={myBookings.filter((b) => b.status === "Delivered")}
            />
          }
        />
        <Route
          path="logistics/profile"
          element={<ProfileView provider={provider} />}
        />
        <Route path="*" element={<Navigate to="/logistics" replace />} />
      </Routes>
    </AppShell>
  );
}

function TodayView({
  provider,
  activeJobs,
  newJobs,
  onGoToJobs,
}: {
  provider: LogisticsProvider;
  activeJobs: LogisticsBooking[];
  newJobs: number;
  onGoToJobs: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 text-base font-semibold text-white">
          {(provider.companyName || provider.name || "?")
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted">Habari,</p>
          <p className="truncate text-lg font-semibold text-fg">
            {provider.companyName || provider.name}
          </p>
          <p className="text-xs text-muted">
            {provider.vehicleType} · {provider.licensePlate}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Active jobs" value={activeJobs.length.toString()} />
        <Stat label="New nearby" value={newJobs.toString()} />
        <Stat label="Status" value={provider.status} />
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-fg">In progress</h2>
        {activeJobs.length === 0 ? (
          <EmptyState
            className="rounded-md border border-dashed border-border bg-surface-2/50 py-10"
            title="No active jobs"
            body="When you accept a job from Jobs, it shows up here."
            action={
              newJobs > 0 ? (
                <Button variant="primary" onClick={onGoToJobs}>
                  See {newJobs} new {newJobs === 1 ? "job" : "jobs"}
                </Button>
              ) : null
            }
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {activeJobs.map((b) => (
              <li
                key={b.id}
                className="rounded-md border border-border bg-surface p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-fg">
                    {b.pickupLocation} → {b.dropoffLocation}
                  </p>
                  <StatusChip status={mapStatus(b.status)} />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {b.cargoDetails} · {formatRelativeDate(b.pickupDate)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function JobsView({
  myBookings,
  available,
  providerId,
  setBookings,
}: {
  myBookings: LogisticsBooking[];
  available: LogisticsBooking[];
  providerId: string;
  setBookings: (
    next: LogisticsBooking[] | ((prev: LogisticsBooking[]) => LogisticsBooking[])
  ) => void;
}) {
  const accept = async (id: string) => {
    const res = await api.logistics.accept(id, providerId);
    if (res.success && res.data) {
      setBookings((prev) => prev.map((b) => (b.id === id ? res.data! : b)));
      toast.success("Job accepted.");
    } else {
      toast.error(res.error || "Failed to accept job.");
    }
  };
  const advance = async (id: string, to: LogisticsBooking["status"]) => {
    const res = await api.logistics.advance(id, to);
    if (res.success && res.data) {
      setBookings((prev) => prev.map((b) => (b.id === id ? res.data! : b)));
    } else {
      toast.error(res.error || "Failed to update status.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4">
      <Tabs defaultValue="available">
        <TabsList>
          <TabsTrigger value="available">Available · {available.length}</TabsTrigger>
          <TabsTrigger value="mine">Mine · {myBookings.length}</TabsTrigger>
        </TabsList>
        <TabsContent value="available" className="mt-3">
          {available.length === 0 ? (
            <EmptyState className="py-12" title="No new jobs right now" body="Check back in a bit." />
          ) : (
            <ul className="flex flex-col gap-2">
              {available.map((b) => (
                <li
                  key={b.id}
                  className="rounded-md border border-border bg-surface p-3"
                >
                  <p className="text-sm font-medium text-fg">
                    {b.pickupLocation} → {b.dropoffLocation}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{b.cargoDetails}</p>
                  <p className="text-xs text-muted">
                    Pickup {formatRelativeDate(b.pickupDate)}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-2"
                    onClick={() => accept(b.id)}
                  >
                    Accept
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
        <TabsContent value="mine" className="mt-3">
          {myBookings.length === 0 ? (
            <EmptyState className="py-12" title="No accepted jobs" />
          ) : (
            <ul className="flex flex-col gap-2">
              {myBookings.map((b) => (
                <li
                  key={b.id}
                  className="rounded-md border border-border bg-surface p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-fg">
                      {b.pickupLocation} → {b.dropoffLocation}
                    </p>
                    <StatusChip status={mapStatus(b.status)} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{b.cargoDetails}</p>
                  <div className="mt-2 flex gap-2">
                    {b.status === "Confirmed" ? (
                      <Button size="sm" onClick={() => advance(b.id, "In Transit")}>
                        Start transit
                      </Button>
                    ) : null}
                    {b.status === "In Transit" ? (
                      <Button size="sm" onClick={() => advance(b.id, "Delivered")}>
                        Mark delivered
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EarningsView({ completed }: { completed: LogisticsBooking[] }) {
  // No price field on the booking yet — placeholder until Sprint 6 wires fares.
  const total = completed.length * 25_000;
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4">
      <h1 className="text-xl font-semibold text-fg">Earnings</h1>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Completed" value={completed.length.toString()} />
        <Stat label="Estimated" value={`TZS ${total.toLocaleString("sw-TZ")}`} />
      </div>
      <p className="mt-3 text-xs text-muted">
        Real fare tracking lands in Sprint 6 with the payments wiring.
      </p>
    </div>
  );
}

function ProfileView({ provider }: { provider: LogisticsProvider }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4">
      <h1 className="text-xl font-semibold text-fg">{provider.companyName}</h1>
      <p className="mt-1 text-sm text-muted">Run by {provider.name}</p>
      <div className="mt-4 flex flex-col gap-2">
        <InfoRow label="Vehicle" value={provider.vehicleType} />
        <InfoRow label="Plate" value={<span className="tabular">{provider.licensePlate}</span>} />
        <InfoRow
          label="Status"
          value={
            <Badge
              variant={
                provider.status === "Approved"
                  ? "success"
                  : provider.status === "Pending"
                    ? "warning"
                    : "danger"
              }
            >
              {provider.status}
            </Badge>
          }
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface-2 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular text-fg">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm text-fg">{value}</span>
    </div>
  );
}

function mapStatus(s: LogisticsBooking["status"]) {
  switch (s) {
    case "Pending":
      return "pending" as const;
    case "Confirmed":
      return "confirmed" as const;
    case "In Transit":
      return "in-transit" as const;
    case "Delivered":
      return "delivered" as const;
    case "Cancelled":
      return "cancelled" as const;
  }
}

function HomeIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2Z" /></svg>); }
function TruckIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 18V6h7l3 5v7h-3" /><path d="M14 18H3V6h11Z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>); }
function CashIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>); }
function UserIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>); }
