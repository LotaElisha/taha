import * as React from "react";
import { Drawer, DrawerContent, DrawerTitle } from "../../components/ui/drawer";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { toast } from "../../components/ui/sonner";
import { CartItem, Order, Product, Agrodealer, Agrovet, WhatsAppConfig } from "../../types";
import ProductIcon from "../../components/ProductIcon";
import { cn, formatTZS } from "../../lib/utils";

interface PosRegisterProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Agrodealer | Agrovet;
  vendorProducts: Product[];
  setProducts: (next: Product[] | ((prev: Product[]) => Product[])) => void;
  setOrders: (next: Order[] | ((prev: Order[]) => Order[])) => void;
}

type Tender = "mpesa" | "cash" | "card" | "credit";

/**
 * PosRegister — full-screen drawer. Per DESIGN_SPEC §9.4.4.
 *   • Live-scan bar at the top with a hint about camera state.
 *   • Category tabs over a product grid (3 columns on mobile, 4 on tablet+).
 *   • Cart panel (bottom drawer on mobile, side panel on desktop) with line
 *     stepper, loyalty discount, VAT, and four tender options + Charge.
 */
export function PosRegister({
  isOpen,
  onClose,
  vendor,
  vendorProducts,
  setProducts,
  setOrders,
}: PosRegisterProps) {
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [category, setCategory] = React.useState<string>("All");
  const [tender, setTender] = React.useState<Tender>("mpesa");
  const [loyaltyOn, setLoyaltyOn] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) setCart([]);
  }, [isOpen]);

  const cats = React.useMemo(() => {
    const set = new Set<string>(vendorProducts.map((p) => p.category));
    return ["All", ...Array.from(set)];
  }, [vendorProducts]);

  const visible = React.useMemo(
    () =>
      category === "All"
        ? vendorProducts
        : vendorProducts.filter((p) => p.category === category),
    [vendorProducts, category]
  );

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const loyaltyDiscount = loyaltyOn ? subtotal * 0.05 : 0;
  // Agricultural inputs in TZ are mostly VAT-zero-rated; we still display the
  // breakdown so receipts are unambiguous. Adjustable per product later.
  const vatTaxable = subtotal - loyaltyDiscount;
  const vat = 0;
  const total = vatTaxable + vat;

  const addItem = (p: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === p.id);
      if (existing) {
        if (p.stock <= existing.quantity) {
          toast.warning(`Only ${p.stock} ${p.name} in stock.`);
          return prev;
        }
        return prev.map((i) =>
          i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      if (p.stock <= 0) {
        toast.error(`${p.name} is out of stock.`);
        return prev;
      }
      return [...prev, { product: p, quantity: 1 }];
    });
  };

  const inc = (id: string) =>
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === id && i.product.stock > i.quantity
          ? { ...i, quantity: i.quantity + 1 }
          : i
      )
    );
  const dec = (id: string) =>
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  const removeItem = (id: string) =>
    setCart((prev) => prev.filter((i) => i.product.id !== id));

  const charge = () => {
    if (cart.length === 0) return;
    // 1. Decrement stock.
    setProducts((prev) =>
      prev.map((p) => {
        const inCart = cart.find((i) => i.product.id === p.id);
        return inCart ? { ...p, stock: Math.max(0, p.stock - inCart.quantity) } : p;
      })
    );
    // 2. Write the order.
    const order: Order = {
      id: `pos-${Date.now()}`,
      userId: "walkin",
      date: new Date().toISOString(),
      items: cart,
      total,
      status: "Completed",
      channel: "pos",
    };
    setOrders((prev) => [order, ...prev]);
    toast.success(`Sale recorded · ${formatTZS(total)}`);
    setCart([]);
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="h-[100dvh] max-h-[100dvh] rounded-t-none">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close POS"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-fg"
          >
            <XIcon />
          </button>
          <DrawerTitle className="flex-1">POS · {vendor.name}</DrawerTitle>
          <Badge variant="success" className="hidden sm:inline-flex">
            <DotIcon className="text-success" /> Camera live
          </Badge>
        </header>

        {/* Scan bar */}
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2">
            <BarcodeIcon />
            <input
              type="text"
              className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-muted"
              placeholder="Scan barcode or type to search products…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const q = (e.target as HTMLInputElement).value
                    .trim()
                    .toLowerCase();
                  const hit = vendorProducts.find(
                    (p) =>
                      p.barcode?.toLowerCase() === q ||
                      p.name.toLowerCase().includes(q)
                  );
                  if (hit) {
                    addItem(hit);
                    (e.target as HTMLInputElement).value = "";
                  } else {
                    toast.error(`No product matches "${q}".`);
                  }
                }
              }}
            />
            <Button size="sm" variant="primary" onClick={() => toast.info("Camera scan stub — use barcode search.")}>
              <CameraIcon /> Scan
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden md:grid md:grid-cols-[1.4fr,1fr]">
          {/* Left: catalog */}
          <section className="flex min-h-0 flex-col overflow-hidden border-b border-border md:border-b-0 md:border-r">
            <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-border px-4 py-2">
              {cats.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                    c === category
                      ? "bg-brand-600 text-white"
                      : "border border-border bg-surface text-muted"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="grid flex-1 auto-rows-max grid-cols-3 gap-2 overflow-y-auto p-3 sm:grid-cols-4">
              {visible.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addItem(p)}
                  disabled={p.stock <= 0}
                  className="flex flex-col gap-1 rounded-md border border-border bg-surface p-2 text-left transition-colors hover:bg-surface-2 disabled:opacity-50"
                >
                  <div className="relative flex aspect-square items-center justify-center rounded-md bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    <ProductIcon category={p.category} className="h-8 w-8" />
                    {p.stock <= 0 ? (
                      <span className="absolute right-1 top-1 rounded-full bg-danger/15 px-1.5 py-0.5 text-[9px] font-medium text-danger">
                        Out
                      </span>
                    ) : p.stock < 10 ? (
                      <span className="absolute right-1 top-1 rounded-full bg-harvest-100 px-1.5 py-0.5 text-[9px] font-medium text-harvest-700">
                        {p.stock}
                      </span>
                    ) : (
                      <span className="absolute right-1 top-1 rounded-full bg-surface/90 px-1.5 py-0.5 text-[9px] font-medium text-muted">
                        {p.stock}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-[11px] font-medium text-fg">
                    {p.name}
                  </p>
                  <p className="text-[11px] font-medium tabular text-brand-700 dark:text-brand-300">
                    {formatTZS(p.price)}
                  </p>
                </button>
              ))}
              {visible.length === 0 ? (
                <p className="col-span-full py-8 text-center text-sm text-muted">
                  No products in this category.
                </p>
              ) : null}
            </div>
          </section>

          {/* Right: cart */}
          <section className="flex min-h-0 flex-col">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-fg">
                Sale · #{Date.now().toString().slice(-5)}
              </span>
              <button
                type="button"
                onClick={() => setLoyaltyOn((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  loyaltyOn
                    ? "bg-brand-50 text-brand-700"
                    : "bg-surface-2 text-muted"
                )}
              >
                <UserIcon /> {loyaltyOn ? "Loyalty 5% on" : "Loyalty"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center text-muted">
                  <BagIcon />
                  <p className="text-sm">No items yet</p>
                  <p className="text-xs">Scan a barcode or tap a product.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {cart.map((i) => (
                    <li
                      key={i.product.id}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-2 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-fg">
                          {i.product.name}
                        </p>
                        <p className="text-xs text-muted">
                          {formatTZS(i.product.price)} ea
                        </p>
                      </div>
                      <div className="inline-flex h-7 items-center rounded-md border border-border">
                        <button
                          type="button"
                          onClick={() => dec(i.product.id)}
                          className="flex h-7 w-7 items-center justify-center"
                          aria-label="Decrease"
                        >
                          <MinusIcon />
                        </button>
                        <span className="tabular w-6 text-center text-xs font-medium">
                          {i.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => inc(i.product.id)}
                          className="flex h-7 w-7 items-center justify-center"
                          aria-label="Increase"
                        >
                          <PlusIcon />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="tabular text-sm font-medium text-fg">
                          {formatTZS(i.product.price * i.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(i.product.id)}
                          aria-label="Remove"
                          className="text-muted hover:text-danger"
                        >
                          <XIcon />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Totals + tender */}
            <div className="border-t border-border bg-surface px-4 py-3">
              <div className="space-y-1 text-sm">
                <Row label="Subtotal" value={subtotal} />
                {loyaltyOn ? (
                  <Row
                    label="Loyalty (5%)"
                    value={-loyaltyDiscount}
                    accent="discount"
                  />
                ) : null}
                <Row label="VAT (0% on inputs)" value={vat} />
                <div className="my-1 h-px bg-border" />
                <div className="flex justify-between text-base font-semibold text-fg">
                  <span>Total</span>
                  <span className="tabular">{formatTZS(total)}</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <TenderButton
                  active={tender === "mpesa"}
                  onClick={() => setTender("mpesa")}
                  icon={<PhoneIcon />}
                  label="M-Pesa"
                />
                <TenderButton
                  active={tender === "cash"}
                  onClick={() => setTender("cash")}
                  icon={<CashIcon />}
                  label="Cash"
                />
                <TenderButton
                  active={tender === "card"}
                  onClick={() => setTender("card")}
                  icon={<CardIcon />}
                  label="Card"
                />
                <TenderButton
                  active={tender === "credit"}
                  onClick={() => setTender("credit")}
                  icon={<ClockPauseIcon />}
                  label="On credit"
                />
              </div>

              <Button
                size="lg"
                className="mt-3 w-full"
                disabled={cart.length === 0}
                onClick={charge}
              >
                <LockIcon />
                <span className="tabular">Charge {formatTZS(total)}</span>
              </Button>
            </div>
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "discount";
}) {
  return (
    <div
      className={cn(
        "flex justify-between text-muted",
        accent === "discount" && "text-success"
      )}
    >
      <span>{label}</span>
      <span className="tabular">{formatTZS(value)}</span>
    </div>
  );
}

function TenderButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center justify-center gap-2 rounded-md border bg-surface px-3 py-2 text-xs font-medium transition-colors",
        active
          ? "border-brand-600 bg-brand-50/60 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100"
          : "border-border text-muted hover:bg-surface-2"
      )}
    >
      <span aria-hidden>{icon}</span>
      {label}
    </button>
  );
}

/* --------------------------------- icons --------------------------------- */
function XIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>); }
function DotIcon({ className }: { className?: string }) { return (<svg viewBox="0 0 24 24" className={cn("h-2 w-2", className)} fill="currentColor" aria-hidden><circle cx="12" cy="12" r="6" /></svg>); }
function BarcodeIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-600" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14" /></svg>); }
function CameraIcon() { return (<svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z" /><circle cx="12" cy="13" r="4" /></svg>); }
function UserIcon() { return (<svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>); }
function BagIcon() { return (<svg viewBox="0 0 24 24" className="h-12 w-12 text-brand-300" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>); }
function MinusIcon() { return (<svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14" /></svg>); }
function PlusIcon() { return (<svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>); }
function LockIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>); }
function PhoneIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></svg>); }
function CardIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>); }
function CashIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>); }
function ClockPauseIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10" /><path d="M10 8v8M14 8v8" /></svg>); }
