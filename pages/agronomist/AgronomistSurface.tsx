import * as React from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { AppShell, AppBar, type NavItem } from "../../components/app-shell";
import { OfflineBanner } from "../../components/feedback/OfflineBanner";
import { EmptyState } from "../../components/feedback/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../context/AuthContext";

/**
 * AgronomistSurface — `/agronomist/*` per DESIGN_SPEC §9.5.
 * Bottom nav: Today / Requests / Schedule / Profile.
 *
 * Requests are stubbed for now (no real data model yet). Sprint 6 wires
 * `services/api.ts` consultation endpoints + a real inbox.
 */
export function AgronomistSurface() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const activeNavId = location.pathname.startsWith("/agronomist/requests")
    ? "requests"
    : location.pathname.startsWith("/agronomist/schedule")
      ? "schedule"
      : location.pathname.startsWith("/agronomist/profile")
        ? "profile"
        : "today";

  const nav: NavItem[] = [
    { id: "today", label: "Today", icon: <HomeIcon />, onClick: () => navigate("/agronomist") },
    { id: "requests", label: "Requests", icon: <InboxIcon />, onClick: () => navigate("/agronomist/requests") },
    { id: "schedule", label: "Schedule", icon: <CalendarIcon />, onClick: () => navigate("/agronomist/schedule") },
    { id: "profile", label: "Profile", icon: <UserIcon />, onClick: () => navigate("/agronomist/profile") },
  ];

  return (
    <AppShell
      appBar={
        <AppBar
          leading={
            <span className="flex items-center gap-2 px-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-700 text-white">
                <UserSearchIcon />
              </span>
              <span className="text-base font-semibold text-fg">Mkulima · Agronomist</span>
            </span>
          }
          trailing={
            <button onClick={logout} className="text-xs font-medium text-muted hover:text-fg">
              Sign out
            </button>
          }
        />
      }
      navItems={nav}
      activeNavId={activeNavId}
    >
      <OfflineBanner />
      <Routes>
        <Route index element={<Navigate to="/agronomist" replace />} />
        <Route path="agronomist" element={<AgronomistToday name={user?.name || "Agronomist"} />} />
        <Route path="agronomist/requests" element={<RequestsView />} />
        <Route path="agronomist/schedule" element={<ScheduleView />} />
        <Route path="agronomist/profile" element={<ProfileView name={user?.name || ""} />} />
        <Route path="*" element={<Navigate to="/agronomist" replace />} />
      </Routes>
    </AppShell>
  );
}

function AgronomistToday({ name }: { name: string }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 text-base font-semibold text-white">
          {(name || "?")
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div>
          <p className="text-xs text-muted">Habari za asubuhi,</p>
          <p className="truncate text-lg font-semibold text-fg">{name}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Open requests" value="0" />
        <Stat label="Today's visits" value="0" />
        <Stat label="Rating" value="—" />
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-fg">Recent activity</h2>
        <EmptyState
          className="rounded-md border border-dashed border-border bg-surface-2/50 py-10"
          title="Quiet morning"
          body="When farmers request your help, they'll show up here."
        />
      </section>
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

function RequestsView() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4">
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <EmptyState
            className="py-12"
            title="No pending requests"
            body="You'll be notified when a farmer books a consultation."
          />
        </TabsContent>
        <TabsContent value="accepted">
          <EmptyState className="py-12" title="No accepted requests yet" />
        </TabsContent>
        <TabsContent value="completed">
          <EmptyState className="py-12" title="No completed visits yet" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScheduleView() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4">
      <h1 className="text-xl font-semibold text-fg">This week</h1>
      <p className="text-sm text-muted">A simple calendar lives here in Sprint 6.</p>
      <EmptyState
        className="mt-4 py-12"
        title="No visits scheduled"
        body="Accept a pending request to see it on your calendar."
      />
    </div>
  );
}

function ProfileView({ name }: { name: string }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4">
      <h1 className="text-xl font-semibold text-fg">{name || "Agronomist"}</h1>
      <p className="mt-1 text-sm text-muted">Public profile + rates editor land in Sprint 6.</p>
      <div className="mt-4 flex flex-col gap-2">
        <InfoRow label="Status" value={<Badge variant="success">Active</Badge>} />
        <InfoRow label="Specialties" value="—" />
        <InfoRow label="Hourly rate" value="—" />
      </div>
      <Button variant="primary" size="md" className="mt-4">
        Edit profile
      </Button>
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

function HomeIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2Z" /></svg>); }
function InboxIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="m5.45 5.11-3.05 6.32A2 2 0 0 0 2 12.34V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.66c0-.3-.07-.6-.2-.87L18.55 5.1A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" /></svg>); }
function CalendarIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>); }
function UserIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>); }
function UserSearchIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="9" cy="8" r="4" /><path d="M2 20a7 7 0 0 1 14 0" /><path d="m17 11 2 2 4-4" /></svg>); }
