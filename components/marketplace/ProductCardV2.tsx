import * as React from "react";
import { Product, Agrodealer, Agrovet } from "../../types";
import { Badge } from "../ui/badge";
import { PriceTag } from "../feedback/PriceTag";
import ProductIcon from "../ProductIcon";
import { cn } from "../../lib/utils";

interface ProductCardV2Props {
  product: Product;
  onClick?: (p: Product) => void;
  onVendorClick?: (v: Agrodealer | Agrovet) => void;
  onAddToCart?: (p: Product, qty: number) => void;
  className?: string;
}

/**
 * ProductCardV2 — square image on top, title + vendor + price.
 * Replaces the old `ProductCard.tsx` for re-skinned screens.
 * Per DESIGN_SPEC §6.4.
 */
export function ProductCardV2({
  product,
  onClick,
  onVendorClick,
  onAddToCart,
  className,
}: ProductCardV2Props) {
  const lowStock = product.stock > 0 && product.stock < 10;
  const outOfStock = product.stock <= 0;
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-brand-300/40 dark:hover:border-brand-700/40",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onClick?.(product)}
        className="relative block aspect-square w-full overflow-hidden bg-gradient-to-b from-brand-50/50 to-brand-100/10 dark:from-brand-950/20 dark:to-transparent"
        aria-label={`View ${product.name}`}
      >
        {product.isFeatured ? (
          <Badge
            variant="warning"
            className="absolute left-2.5 top-2.5 z-10 shadow-sm"
          >
            Featured
          </Badge>
        ) : null}
        {outOfStock ? (
          <Badge variant="danger" className="absolute right-2.5 top-2.5 z-10 shadow-sm">
            Out of stock
          </Badge>
        ) : lowStock ? (
          <Badge variant="warning" className="absolute right-2.5 top-2.5 z-10 shadow-sm">
            Low stock
          </Badge>
        ) : null}
        <span className="absolute inset-0 flex items-center justify-center p-6 text-brand-700 dark:text-brand-300 transition-transform duration-500 ease-out group-hover:scale-105">
          <ProductIcon category={product.category} className="h-16 w-16" />
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <button
          type="button"
          onClick={() => onClick?.(product)}
          className="line-clamp-2 text-left text-sm font-semibold text-fg hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          {product.name}
        </button>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onVendorClick?.(product.vendor)}
            className="line-clamp-1 text-left text-xs font-medium text-muted hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            {product.vendor.name}
          </button>
          {product.vendor.rating ? (
            <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500 tabular shrink-0">
              <span className="text-[10px]">★</span>
              <span>{product.vendor.rating.toFixed(1)}</span>
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex items-center justify-between">
          <PriceTag value={product.price} size="sm" />
          <button
            type="button"
            disabled={outOfStock}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(product, 1);
            }}
            aria-label={`Add ${product.name} to cart`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white transition-all duration-300 hover:bg-brand-700 hover:scale-110 active:scale-95 shadow-sm shadow-brand-600/30 hover:shadow-md hover:shadow-brand-600/40 disabled:bg-muted disabled:shadow-none disabled:scale-100 disabled:text-white/80"
          >
            <PlusIcon />
          </button>
        </div>
      </div>
    </article>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

