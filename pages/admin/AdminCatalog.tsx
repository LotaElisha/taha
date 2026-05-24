import * as React from "react";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/feedback/Skeleton";
import { EmptyState } from "../../components/feedback/EmptyState";
import { PriceTag } from "../../components/feedback/PriceTag";
import { toast } from "../../components/ui/sonner";
import { apiFetch } from "../../lib/apiClient";
import { cn, formatRelativeDate } from "../../lib/utils";

interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  stock: number;
  image_url: string | null;
  vendor_id: number;
  created_at: string;
  vendor?: {
    id: number;
    name: string;
    phone: string;
  };
}

interface Paginated<T> {
  data: T[];
  total: number;
  current_page: number;
  last_page: number;
}

export function AdminCatalog() {
  const [categoryFilter, setCategoryFilter] = React.useState("All");
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [data, setData] = React.useState<Paginated<Product> | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);

  // Debounce search term
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
    if (categoryFilter !== "All") {
      queryParams.push(`category=${encodeURIComponent(categoryFilter)}`);
    }

    const qs = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

    apiFetch<Paginated<Product>>(`/api/v1/admin/products${qs}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Failed to load catalog products");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryFilter, debouncedSearch, page]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4 space-y-4">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-fg">Marketplace Catalog</h1>
          <p className="text-sm text-muted">
            Global catalog inventory monitoring. Track stock levels, pricing, and category distribution.
          </p>
        </div>
        {data ? <Badge variant="default">{data.total} products</Badge> : null}
      </header>

      {/* Filter and search bar */}
      <div className="grid gap-3 sm:grid-cols-3 bg-surface p-3 rounded-lg border border-border">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, description or brand..."
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

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="text-sm rounded-md border border-border bg-surface px-3 py-2 text-fg outline-none focus-visible:border-brand-600"
        >
          <option value="All">All Categories</option>
          <option value="Seeds">Seeds</option>
          <option value="Fertilizer">Fertilizers</option>
          <option value="Pesticide">Pesticides</option>
          <option value="Tools">Equipment & Tools</option>
        </select>
      </div>

      {/* Products table */}
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
            title="No products found"
            body="Try expanding your search query or choosing another category."
          />
        ) : (
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2 text-xs font-semibold text-muted uppercase">
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Vendor</th>
                    <th className="p-3 text-right">Price (TZS)</th>
                    <th className="p-3 text-right">Stock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.data.map((product) => (
                    <ProductRow key={product.id} product={product} />
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

function ProductRow({ product }: { product: Product }) {
  // Low stock check
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock < 10;

  return (
    <tr className="hover:bg-surface-2/30 transition-colors">
      <td className="p-3">
        <div className="flex items-center gap-3">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-10 w-10 rounded-md object-cover border border-border bg-surface-2"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded bg-brand-50 text-brand-600 text-lg font-bold">
              🌱
            </span>
          )}
          <div>
            <p className="font-semibold text-fg leading-none mb-1">{product.name}</p>
            <p className="text-[10px] text-muted font-mono">ID: #{product.id}</p>
          </div>
        </div>
      </td>
      <td className="p-3">
        <Badge variant="default">{product.category}</Badge>
      </td>
      <td className="p-3">
        <p className="text-xs font-medium text-fg">{product.vendor?.name || "Global Supply"}</p>
        {product.vendor?.phone && (
          <p className="text-[10px] text-muted font-mono">{product.vendor.phone}</p>
        )}
      </td>
      <td className="p-3 text-right">
        <PriceTag value={Number(product.price)} size="sm" />
      </td>
      <td className="p-3 text-right">
        <div className="flex flex-col gap-1 items-end">
          <Badge variant={isOutOfStock ? "danger" : isLowStock ? "warning" : "success"}>
            {isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock"}
          </Badge>
          <span className="text-xs font-semibold tabular text-fg">
            {product.stock.toLocaleString()} units
          </span>
        </div>
      </td>
    </tr>
  );
}
