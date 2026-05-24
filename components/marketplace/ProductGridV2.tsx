import * as React from "react";
import { Product, Agrodealer, Agrovet } from "../../types";
import { ProductCardV2 } from "./ProductCardV2";
import { Skeleton } from "../feedback/Skeleton";
import { EmptyState } from "../feedback/EmptyState";

interface ProductGridV2Props {
  products: Product[];
  isLoading?: boolean;
  onProductClick?: (p: Product) => void;
  onVendorClick?: (v: Agrodealer | Agrovet) => void;
  onAddToCart?: (p: Product, qty: number) => void;
}

/**
 * ProductGridV2 — 2-col mobile, 3-col tablet, 4-col desktop.
 * Loading state mirrors final shape (skeleton cards).
 * Per DESIGN_SPEC §4.3.
 */
export function ProductGridV2({
  products,
  isLoading,
  onProductClick,
  onVendorClick,
  onAddToCart,
}: ProductGridV2Props) {
  if (isLoading) {
    return (
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-3 px-4 py-2 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-md border border-border bg-surface">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-2/5" />
              <Skeleton className="mt-2 h-5 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <EmptyState
          title="No products yet"
          body="Try a different category or come back soon — vendors are listing new stock every day."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-3 px-4 py-2 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCardV2
          key={p.id}
          product={p}
          onClick={onProductClick}
          onVendorClick={onVendorClick}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
