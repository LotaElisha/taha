import * as React from "react";
import { Product, Agrodealer, Agrovet } from "../../types";
import { ResponsiveDialog } from "../feedback/ResponsiveDialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { PriceTag } from "../feedback/PriceTag";
import ProductIcon from "../ProductIcon";

interface ProductDetailDrawerProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (p: Product, qty: number) => void;
  onVendorClick?: (v: Agrodealer | Agrovet) => void;
}

/**
 * ProductDetailDrawer — drawer on mobile, dialog on desktop.
 * Sticky bottom bar with quantity stepper and primary CTA per DESIGN_SPEC §9.1.3.
 */
export function ProductDetailDrawer({
  product,
  onClose,
  onAddToCart,
  onVendorClick,
}: ProductDetailDrawerProps) {
  const [qty, setQty] = React.useState(1);
  React.useEffect(() => {
    if (product) setQty(1);
  }, [product?.id]);

  if (!product) return null;

  const outOfStock = product.stock <= 0;
  const lineTotal = product.price * qty;

  return (
    <ResponsiveDialog
      open={!!product}
      onOpenChange={(open) => !open && onClose()}
      title={product.name}
      description={product.vendor.name}
      desktopMaxWidthClass="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        <div className="relative flex aspect-[4/3] items-center justify-center rounded-md bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          {product.isFeatured ? (
            <Badge variant="warning" className="absolute left-3 top-3">
              Featured
            </Badge>
          ) : null}
          <ProductIcon category={product.category} className="h-24 w-24" />
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <PriceTag value={product.price} size="lg" />
          {outOfStock ? (
            <Badge variant="danger">Out of stock</Badge>
          ) : (
            <Badge variant="success">In stock</Badge>
          )}
        </div>

        <button
          type="button"
          onClick={() => onVendorClick?.(product.vendor)}
          className="flex items-center gap-3 rounded-md border border-border bg-surface-2 p-3 text-left transition-colors hover:bg-surface"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-medium text-white">
            {product.vendor.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-fg">
              {product.vendor.name}
            </div>
            <div className="truncate text-xs text-muted">
              {product.vendor.location ?? "Visit vendor profile"}
            </div>
          </div>
          <ChevronRightIcon />
        </button>

        <p className="text-sm leading-relaxed text-muted">{product.description}</p>

        <div className="sticky bottom-0 -mx-4 mt-2 flex items-center gap-2 border-t border-border bg-surface px-4 pb-[env(safe-area-inset-bottom)] pt-3">
          <QuantityStepper value={qty} onChange={setQty} max={Math.max(product.stock, 1)} />
          <Button
            variant="primary"
            size="lg"
            disabled={outOfStock}
            onClick={() => {
              onAddToCart(product, qty);
              onClose();
            }}
            className="flex-1"
          >
            <CartIcon />
            <span className="tabular">
              Add · TZS {lineTotal.toLocaleString("sw-TZ")}
            </span>
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}

function QuantityStepper({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  max: number;
}) {
  return (
    <div className="flex h-12 items-center rounded-md border border-border bg-surface">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="flex h-12 w-10 items-center justify-center text-fg disabled:text-muted"
        disabled={value <= 1}
      >
        <MinusIcon />
      </button>
      <span className="tabular w-8 text-center text-sm font-medium">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-12 w-10 items-center justify-center text-fg disabled:text-muted"
        disabled={value >= max}
      >
        <PlusIcon />
      </button>
    </div>
  );
}

function CartIcon() {
  return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.6a2 2 0 0 0 2-1.6L23 6H6" /></svg>);
}
function ChevronRightIcon() {
  return (<svg viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m9 18 6-6-6-6" /></svg>);
}
function MinusIcon() {
  return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14" /></svg>);
}
function PlusIcon() {
  return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>);
}
