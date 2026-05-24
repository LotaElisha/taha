import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import { Button } from "../ui/button";
import { PriceTag } from "../feedback/PriceTag";
import { EmptyState } from "../feedback/EmptyState";
import {
  CartItem,
  DeliveryOption,
  PaymentMethod,
} from "../../types";
import ProductIcon from "../ProductIcon";
import { cn, formatTZS } from "../../lib/utils";
import { useLanguage } from "../../context/LanguageContext";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
  deliveryOptions: DeliveryOption[];
  selectedDeliveryOption: DeliveryOption;
  onSelectDeliveryOption: (o: DeliveryOption) => void;
  paymentMethods: PaymentMethod[];
  selectedPaymentMethod: PaymentMethod;
  onSelectPaymentMethod: (p: PaymentMethod) => void;
  onCheckout: () => void;
}

/**
 * CartDrawer — bottom drawer on mobile, right side-sheet visually on desktop.
 * Items list, delivery segmented control, payment radio group, totals, sticky CTA.
 * Implements DESIGN_SPEC §9.1.5.
 */
export function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  deliveryOptions,
  selectedDeliveryOption,
  onSelectDeliveryOption,
  paymentMethods,
  selectedPaymentMethod,
  onSelectPaymentMethod,
  onCheckout,
}: CartDrawerProps) {
  const { locale } = useLanguage();
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const total = subtotal + selectedDeliveryOption.cost;

  const handleWhatsAppCheckout = () => {
    const isSw = locale === "sw";
    const title = isSw ? "🛒 *Ombi la Agizo la Mkulima*" : "🛒 *Mkulima Order Request*";
    const subtotalText = isSw ? "Jumla Ndogo" : "Subtotal";
    const deliveryText = isSw ? "Uwasilishaji" : "Delivery";
    const totalText = isSw ? "Jumla Kuu" : "Total";
    const paymentText = isSw ? "Malipo" : "Payment";
    const delTypeText = isSw ? "Njia ya Uwasilishaji" : "Delivery Type";

    let message = `${title}\n`;
    message += `-------------------------\n`;
    cartItems.forEach((item) => {
      message += `• ${item.product.name} x ${item.quantity} - ${formatTZS(item.product.price * item.quantity)}\n`;
    });
    message += `-------------------------\n`;
    message += `${subtotalText}: ${formatTZS(subtotal)}\n`;
    message += `${deliveryText}: ${selectedDeliveryOption.name} (${formatTZS(selectedDeliveryOption.cost)})\n`;
    message += `${totalText}: ${formatTZS(total)}\n\n`;
    message += `${paymentText}: ${selectedPaymentMethod.name}\n`;
    message += `${delTypeText}: ${selectedDeliveryOption.name}`;

    const uniqueVendors = Array.from(new Set(cartItems.map((item) => item.product.vendor.id)))
      .map((id) => cartItems.find((item) => item.product.vendor.id === id)!.product.vendor);

    let targetPhone = "255700000000"; // Central Order Desk
    if (uniqueVendors.length === 1) {
      const singleVendor = uniqueVendors[0];
      if (singleVendor.whatsappConfig?.enabled && singleVendor.whatsappConfig.phoneNumber) {
        targetPhone = singleVendor.whatsappConfig.phoneNumber.replace(/\D/g, "");
      }
    }

    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[92dvh]">
        <DrawerHeader className="flex-row items-center justify-between border-b border-border">
          <DrawerTitle>
            Your cart · {cartItems.length} item{cartItems.length === 1 ? "" : "s"}
          </DrawerTitle>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-fg active:scale-95 transition-transform"
          >
            <XIcon />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {cartItems.length === 0 ? (
            <EmptyState
              title="Your cart is empty"
              body="Browse the marketplace and add items to get started."
              illustration={<BagIcon className="h-16 w-16" />}
            />
          ) : (
            <div className="divide-y divide-border">
              {cartItems.map((item) => (
                <CartRow
                  key={item.product.id}
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={() => onRemoveItem(item.product.id)}
                />
              ))}
            </div>
          )}

          {cartItems.length > 0 && (
            <>
              <Section title="Delivery">
                <Segmented
                  options={deliveryOptions}
                  value={selectedDeliveryOption}
                  onChange={onSelectDeliveryOption}
                  render={(o) => (
                    <span className="flex flex-col items-center text-center leading-tight">
                      <span>{o.name}</span>
                      <span className="text-[10px] font-normal text-muted">
                        {o.eta} · {formatTZS(o.cost)}
                      </span>
                    </span>
                  )}
                />
              </Section>

              <Section title="Payment">
                <div className="space-y-2">
                  {paymentMethods.map((p) => (
                    <PayRow
                      key={p.id}
                      method={p}
                      selected={p.id === selectedPaymentMethod.id}
                      onSelect={() => onSelectPaymentMethod(p)}
                    />
                  ))}
                </div>
              </Section>

              <Section title="Summary">
                <Totals
                  subtotal={subtotal}
                  delivery={selectedDeliveryOption.cost}
                  total={total}
                />
              </Section>
              <div className="h-3" />
            </>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="sticky bottom-0 border-t border-border bg-surface px-4 py-3 pb-[env(safe-area-inset-bottom)] flex flex-col gap-2">
            <Button size="lg" className="w-full" onClick={onCheckout}>
              <LockIcon />
              <span className="tabular">Checkout · {formatTZS(total)}</span>
            </Button>
            <Button
              size="lg"
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-[0_4px_14px_rgba(37,211,102,0.3)] transition-all duration-300 hover:shadow-[0_6px_20px_rgba(37,211,102,0.5)] active:scale-[0.98]"
              onClick={handleWhatsAppCheckout}
            >
              <WhatsAppIcon />
              <span>{locale === "sw" ? "Agiza kupitia WhatsApp" : "Order via WhatsApp"}</span>
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-3">
      <h3 className="mb-2 text-sm font-medium text-fg">{title}</h3>
      {children}
    </section>
  );
}

function CartRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (productId: string, q: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
        <ProductIcon category={item.product.category} className="h-8 w-8" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-sm font-medium text-fg">
          {item.product.name}
        </div>
        <div className="text-xs text-muted">
          {item.product.vendor.name}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <Stepper
            value={item.quantity}
            onChange={(q) => onUpdateQuantity(item.product.id, q)}
          />
          <button
            type="button"
            onClick={onRemove}
            className="px-2 py-1.5 text-xs font-medium text-muted hover:text-danger active:text-danger rounded-md active:bg-surface-2 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
      <PriceTag
        value={item.product.price * item.quantity}
        size="sm"
        className="self-start"
      />
    </div>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (q: number) => void }) {
  return (
    <div className="inline-flex h-11 items-center rounded-md border border-border">
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="flex h-11 w-11 items-center justify-center text-fg active:bg-surface-2 rounded-l-md transition-colors"
      >
        <MinusIcon />
      </button>
      <span className="tabular min-w-8 text-center text-sm font-medium px-2">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase"
        onClick={() => onChange(value + 1)}
        className="flex h-11 w-11 items-center justify-center text-fg active:bg-surface-2 rounded-r-md transition-colors"
      >
        <PlusIcon />
      </button>
    </div>
  );
}

function Segmented<T>({
  options,
  value,
  onChange,
  render,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  render: (o: T) => React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-md bg-surface-2 p-1">
      {options.map((o, i) => {
        const active = o === value;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={active}
            className={cn(
              "rounded-sm px-2 py-2 text-xs font-medium transition-colors",
              active
                ? "bg-surface text-fg shadow-sm"
                : "bg-transparent text-muted"
            )}
          >
            {render(o)}
          </button>
        );
      })}
    </div>
  );
}

function PayRow({
  method,
  selected,
  onSelect,
}: {
  method: PaymentMethod;
  selected: boolean;
  onSelect: () => void;
}) {
  const icon =
    method.id === "mpesa" ? (
      <PhoneIcon />
    ) : method.id === "card" ? (
      <CardIcon />
    ) : (
      <CashIcon />
    );
  return (
    <button
      type="button"
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-md border bg-surface px-3 py-2.5 text-left transition-colors",
        selected
          ? "border-brand-600 bg-brand-50/60 dark:bg-brand-900/40"
          : "border-border hover:bg-surface-2"
      )}
    >
      <span
        className={cn(
          "h-4 w-4 rounded-full border-[1.5px]",
          selected
            ? "border-brand-600 ring-2 ring-surface ring-offset-1 ring-offset-brand-600"
            : "border-border"
        )}
        aria-hidden
      />
      <span className="text-muted" aria-hidden>
        {icon}
      </span>
      <span className="text-sm font-medium text-fg">{method.name}</span>
    </button>
  );
}

function Totals({
  subtotal,
  delivery,
  total,
}: {
  subtotal: number;
  delivery: number;
  total: number;
}) {
  return (
    <div className="space-y-1.5">
      <Line label="Subtotal" value={subtotal} />
      <Line label="Delivery" value={delivery} />
      <div className="my-1.5 h-px bg-border" />
      <div className="flex items-baseline justify-between text-base font-medium text-fg">
        <span>Total</span>
        <span className="tabular">{formatTZS(total)}</span>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between text-sm text-muted">
      <span>{label}</span>
      <span className="tabular">{formatTZS(value)}</span>
    </div>
  );
}

/* ------------------------------- Local icons ------------------------------ */
function XIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>); }
function MinusIcon() { return (<svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14" /></svg>); }
function PlusIcon() { return (<svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>); }
function LockIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>); }
function PhoneIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></svg>); }
function CardIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>); }
function CashIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 6v.01M18 18v.01" /></svg>); }
function BagIcon(props: { className?: string }) { return (<svg viewBox="0 0 24 24" className={props.className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>); }
function WhatsAppIcon() { return (<svg viewBox="0 0 24 24" className="mr-2 h-4 w-4 fill-current" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.455h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>); }

