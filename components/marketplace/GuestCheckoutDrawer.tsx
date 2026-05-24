import * as React from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { CartItem, DeliveryOption } from "../../types";
import { cn, formatTZS } from "../../lib/utils";

interface GuestCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceOrder: (details: { name: string; phone: string; address: string }) => void;
  cartItems: CartItem[];
  deliveryOption: DeliveryOption;
}

type Step = 0 | 1 | 2;

/**
 * GuestCheckoutDrawer — 3-step responsive drawer/dialog.
 * Step 0: Contact (name + phone).
 * Step 1: Address.
 * Step 2: Confirm — full summary with per-step edit links.
 * Implements DESIGN_SPEC §9.1.6.
 */
export function GuestCheckoutDrawer({
  isOpen,
  onClose,
  onPlaceOrder,
  cartItems,
  deliveryOption,
}: GuestCheckoutDrawerProps) {
  const [step, setStep] = React.useState<Step>(0);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");

  // Reset state when the drawer closes.
  React.useEffect(() => {
    if (!isOpen) {
      setStep(0);
      setName("");
      setPhone("");
      setAddress("");
    }
  }, [isOpen]);

  const subtotal = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const total = subtotal + deliveryOption.cost;

  const canContinue =
    (step === 0 && name.trim().length >= 2 && phone.trim().length >= 9) ||
    (step === 1 && address.trim().length >= 4) ||
    step === 2;

  const onPrimary = () => {
    if (step === 2) {
      onPlaceOrder({ name, phone, address });
      onClose();
      return;
    }
    setStep(((step + 1) as Step));
  };

  return (
    <Drawer open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[92dvh]">
        <DrawerHeader className="flex-row items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (step === 0 ? onClose() : setStep((step - 1) as Step))}
              aria-label="Back"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-fg"
            >
              <ArrowLeftIcon />
            </button>
            <DrawerTitle>Checkout</DrawerTitle>
          </div>
          <span className="text-xs font-medium text-muted">Step {step + 1} of 3</span>
        </DrawerHeader>

        {/* Progress bar */}
        <div className="h-1 w-full bg-surface-2">
          <div
            className="h-1 bg-brand-600 transition-all"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {step === 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-semibold text-fg">Who's this order for?</h3>
              <div>
                <Label htmlFor="gc-name">Full name</Label>
                <Input
                  id="gc-name"
                  className="mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Joseph Mwangi"
                  autoComplete="name"
                />
              </div>
              <div>
                <Label htmlFor="gc-phone">Phone</Label>
                <Input
                  id="gc-phone"
                  type="tel"
                  inputMode="tel"
                  className="mt-1 tabular"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+255 712 345 678"
                  autoComplete="tel"
                />
                <p className="mt-1 text-xs text-muted">
                  We'll send delivery updates here.
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-semibold text-fg">Where should we deliver?</h3>
              <div>
                <Label htmlFor="gc-addr">Delivery address</Label>
                <textarea
                  id="gc-addr"
                  className="mt-1 flex min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-fg shadow-sm transition-colors placeholder:text-muted focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House number, street, district, region"
                  autoComplete="street-address"
                />
                <p className="mt-1 text-xs text-muted">
                  Include landmarks if the location is hard to find.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-semibold text-fg">Review &amp; confirm</h3>
              <SummaryRow
                label="Contact"
                value={`${name} · ${phone}`}
                onEdit={() => setStep(0)}
              />
              <SummaryRow
                label="Delivery to"
                value={address}
                onEdit={() => setStep(1)}
              />
              <SummaryRow
                label="Delivery option"
                value={`${deliveryOption.name} · ${deliveryOption.eta}`}
                onEdit={() => onClose()}
              />

              <div className="rounded-md border border-border bg-surface-2 p-3">
                <div className="mb-2 text-xs font-medium text-muted">
                  {cartItems.length} item{cartItems.length === 1 ? "" : "s"}
                </div>
                <ul className="space-y-1 text-sm">
                  {cartItems.map((i) => (
                    <li
                      key={i.product.id}
                      className="flex items-baseline justify-between gap-3"
                    >
                      <span className="line-clamp-1 text-fg">
                        {i.product.name}{" "}
                        <span className="text-muted">×{i.quantity}</span>
                      </span>
                      <span className="tabular text-fg">
                        {formatTZS(i.product.price * i.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 space-y-1 border-t border-border pt-2 text-sm">
                  <div className="flex justify-between text-muted">
                    <span>Subtotal</span>
                    <span className="tabular">{formatTZS(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Delivery</span>
                    <span className="tabular">{formatTZS(deliveryOption.cost)}</span>
                  </div>
                  <div className="flex justify-between text-base font-medium text-fg">
                    <span>Total</span>
                    <span className="tabular">{formatTZS(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-border bg-surface px-4 py-3 pb-[env(safe-area-inset-bottom)]">
          <Button
            size="lg"
            className="w-full"
            disabled={!canContinue}
            onClick={onPrimary}
          >
            {step === 2 ? (
              <>
                <CheckIcon />
                <span className="tabular">Place order · {formatTZS(total)}</span>
              </>
            ) : (
              <>
                Continue <ArrowRightIcon />
              </>
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function SummaryRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface p-3">
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted">{label}</div>
        <div className="mt-0.5 break-words text-sm font-medium text-fg">
          {value || "—"}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-xs font-medium text-brand-600"
      >
        Edit
      </button>
    </div>
  );
}

function ArrowLeftIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 12H5M12 19l-7-7 7-7" /></svg>); }
function ArrowRightIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M12 5l7 7-7 7" /></svg>); }
function CheckIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>); }
