import * as React from "react";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/feedback/Skeleton";
import { EmptyState } from "../../components/feedback/EmptyState";
import { toast } from "../../components/ui/sonner";
import { apiFetch } from "../../lib/apiClient";
import { cn, formatRelativeDate } from "../../lib/utils";
import { UserRole } from "../../types";

interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  role: UserRole;
  kyc_status: "Verified" | "Pending" | "Rejected" | "Not Submitted";
  nin: string | null;
  location: string | null;
  region: string | null;
  rating: string | null;
  created_at: string;
}

interface Paginated<T> {
  data: T[];
  total: number;
  current_page: number;
  last_page: number;
}

type RoleFilter = "All" | "Farmer" | "Vendor" | "Staff";

export function AdminUsers() {
  const [roleFilter, setRoleFilter] = React.useState<RoleFilter>("All");
  const [kycFilter, setKycFilter] = React.useState<string>("All");
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [data, setData] = React.useState<Paginated<User> | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [version, setVersion] = React.useState(0);

  // Debounce search term to limit API calls
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    let queryParams = [`page=${page}`];
    if (debouncedSearch) {
      queryParams.push(`q=${encodeURIComponent(debouncedSearch)}`);
    }
    if (roleFilter !== "All") {
      queryParams.push(`role=${roleFilter}`);
    }
    if (kycFilter !== "All") {
      queryParams.push(`kyc=${kycFilter}`);
    }

    const qs = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

    apiFetch<Paginated<User>>(`/api/v1/admin/users${qs}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Failed to load users");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roleFilter, kycFilter, debouncedSearch, page, version]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4 space-y-4">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-fg">User Directory</h1>
          <p className="text-sm text-muted">
            Platform account management. View details, verification status, and credentials.
          </p>
        </div>
        {data ? <Badge variant="default">{data.total} total</Badge> : null}
      </header>

      {/* Filter and search bar */}
      <div className="grid gap-3 sm:grid-cols-4 bg-surface p-3 rounded-lg border border-border">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone or email..."
            className="w-full text-sm rounded-md border border-border bg-surface px-3 py-2 text-fg outline-none focus-visible:border-brand-600 focus-visible:ring-1 focus-visible:ring-brand-600"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2.5 text-xs text-muted hover:text-fg"
            >
              Clear
            </button>
          )}
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as RoleFilter);
            setPage(1);
          }}
          className="text-sm rounded-md border border-border bg-surface px-3 py-2 text-fg outline-none focus-visible:border-brand-600"
        >
          <option value="All">All Roles</option>
          <option value="Farmer">Farmers</option>
          <option value="Vendor">Vendors (Agrodealer / Agrovet)</option>
          <option value="Staff">Staff Members</option>
        </select>

        {/* KYC Status Filter */}
        <select
          value={kycFilter}
          onChange={(e) => {
            setKycFilter(e.target.value);
            setPage(1);
          }}
          className="text-sm rounded-md border border-border bg-surface px-3 py-2 text-fg outline-none focus-visible:border-brand-600"
        >
          <option value="All">All KYC Statuses</option>
          <option value="Verified">Verified</option>
          <option value="Pending">Pending Review</option>
          <option value="Rejected">Rejected</option>
          <option value="Not Submitted">Not Submitted</option>
        </select>
      </div>

      {/* Users table/list */}
      <section>
        {isLoading && !data ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            className="py-16"
            title="No users found"
            body="Try broadening your search criteria or changing your filters."
          />
        ) : (
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2 text-xs font-semibold text-muted uppercase">
                    <th className="p-3">User Details</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Location / Region</th>
                    <th className="p-3">KYC / ID Verification</th>
                    <th className="p-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.data.map((u) => (
                    <UserRow key={u.id} user={u} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {data.last_page > 1 && (
              <div className="flex items-center justify-between border-t border-border bg-surface-2 px-4 py-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:text-fg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-xs text-muted">
                  Page {page} of {data.last_page}
                </span>
                <button
                  disabled={page >= data.last_page}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:text-fg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function UserRow({ user }: { user: User }) {
  const initials = user.name
    ? user.name
        .split(" ")
        .map((s) => s[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <tr className="hover:bg-surface-2/30 transition-colors">
      <td className="p-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex-shrink-0">
            {initials}
          </span>
          <div>
            <p className="font-semibold text-fg leading-none mb-1">{user.name || "Unnamed user"}</p>
            <p className="text-xs text-muted font-mono">{user.phone} {user.email ? `· ${user.email}` : ""}</p>
          </div>
        </div>
      </td>
      <td className="p-3">
        <div className="flex flex-col gap-1 items-start">
          <Badge variant={user.role === "SuperAdmin" || user.role === "Admin" ? "danger" : "default"}>
            {user.role}
          </Badge>
          {user.rating && (
            <span className="text-xs text-yellow-500 font-medium">★ {Number(user.rating).toFixed(1)}</span>
          )}
        </div>
      </td>
      <td className="p-3">
        <p className="text-xs text-fg leading-snug">{user.location || "Not specified"}</p>
        {user.region && <p className="text-[10px] text-muted">{user.region}</p>}
      </td>
      <td className="p-3">
        <div className="flex flex-col gap-1 items-start">
          <Badge
            variant={
              user.kyc_status === "Verified"
                ? "success"
                : user.kyc_status === "Pending"
                  ? "warning"
                  : user.kyc_status === "Rejected"
                    ? "danger"
                    : "default"
            }
          >
            {user.kyc_status}
          </Badge>
          {user.nin && <span className="text-[10px] font-mono text-muted">NIN: {user.nin}</span>}
        </div>
      </td>
      <td className="p-3 text-xs text-muted tabular">
        {formatRelativeDate(user.created_at)}
      </td>
    </tr>
  );
}
