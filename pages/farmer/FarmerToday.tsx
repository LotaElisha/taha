import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { Weather, CropAdvice, Order, Product, Agrodealer, Agrovet } from "../../types";
import { getWeatherData } from "../../services/weatherService";
import { Button } from "../../components/ui/button";
import { StatusChip } from "../../components/feedback/StatusChip";
import { Skeleton } from "../../components/feedback/Skeleton";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ProductCardV2 } from "../../components/marketplace/ProductCardV2";
import { cn, formatRelativeDate } from "../../lib/utils";

interface FarmerTodayProps {
  orders: Order[];
  featuredProducts: Product[];
  onOpenScanner: () => void;
  onOpenSoilTest: () => void;
  onOpenVet: () => void;
  onProductClick: (p: Product) => void;
  onVendorClick: (v: Agrodealer | Agrovet) => void;
  onAddToCart: (p: Product, qty: number) => void;
}

/**
 * FarmerToday — `/farmer` route.
 * Greeting + Weather + AI tip + Quick actions + Orders rail + Featured products.
 * Per DESIGN_SPEC §9.3.1.
 */
export function FarmerToday({
  orders,
  featuredProducts,
  onOpenScanner,
  onOpenSoilTest,
  onOpenVet,
  onProductClick,
  onVendorClick,
  onAddToCart,
}: FarmerTodayProps) {
  const navigate = useNavigate();
  const { user, location, requestLocation, isRequestingLocation } = useAuth();
  const { locale } = useLanguage();
  const isSw = locale === "sw";

  const userOrders = React.useMemo(
    () =>
      orders
        .filter((o) => o.userId === user?.id)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date))
        .slice(0, 3),
    [orders, user?.id]
  );

  const greeting = useTimeGreeting(isSw);
  const firstName = (user?.name || "").split(" ")[0] || "Mkulima";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4">
      {/* Greeting */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-base font-semibold text-white">
          {firstName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted">{greeting},</p>
          <p className="truncate text-lg font-semibold text-fg">{firstName}</p>
        </div>
      </div>

      {/* Weather */}
      <WeatherCard
        location={location}
        onEnableLocation={requestLocation}
        isRequestingLocation={isRequestingLocation}
      />

      {/* Quick actions */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <QuickAction icon={<CameraIcon />} label="Scan" onClick={onOpenScanner} />
        <QuickAction icon={<TestTubeIcon />} label="Soil test" onClick={onOpenSoilTest} />
        <QuickAction icon={<TractorIcon />} label="Tools" onClick={() => navigate("/farmer/tools")} />
        <QuickAction icon={<PawIcon />} label="Vet" onClick={onOpenVet} />
      </div>

      {/* Orders rail */}
      <section className="mt-6">
        <header className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-fg">Your orders</h2>
          <button
            type="button"
            onClick={() => navigate("/farmer/orders")}
            className="text-xs font-medium text-brand-600"
          >
            See all
          </button>
        </header>
        {userOrders.length === 0 ? (
          <EmptyState
            className="rounded-md border border-dashed border-border bg-surface-2/50 py-8"
            title="No orders yet"
            body="Buy inputs from the marketplace to see them here."
            action={
              <Button variant="primary" onClick={() => navigate("/farmer/shop")}>
                Browse marketplace
              </Button>
            }
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {userOrders.map((o) => (
              <li
                key={o.id}
                className="flex items-center gap-3 rounded-md border border-border bg-surface p-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                  <PackageIcon />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">
                    Order #{o.id.slice(-5)} ·{" "}
                    <span className="text-muted">{o.items.length} items</span>
                  </p>
                  <p className="text-xs text-muted">{formatRelativeDate(o.date, locale)}</p>
                </div>
                <StatusChip status={mapOrderStatus(o.status)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Featured marketplace rail */}
      {featuredProducts.length > 0 ? (
        <section className="mt-6">
          <header className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-fg">Featured inputs</h2>
            <button
              type="button"
              onClick={() => navigate("/farmer/shop")}
              className="text-xs font-medium text-brand-600"
            >
              See all
            </button>
          </header>
          <div className="grid grid-cols-2 gap-3">
            {featuredProducts.slice(0, 4).map((p) => (
              <ProductCardV2
                key={p.id}
                product={p}
                onClick={onProductClick}
                onVendorClick={onVendorClick}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/* ----------------------------- Weather card ------------------------------ */
function WeatherCard({
  location,
  onEnableLocation,
  isRequestingLocation,
}: {
  location: { lat: number; lon: number } | null;
  onEnableLocation: () => void;
  isRequestingLocation: boolean;
}) {
  const { locale } = useLanguage();
  const languageName = locale === "sw" ? "Swahili" : "English";
  const [data, setData] = React.useState<{
    weather: Weather;
    advice: CropAdvice;
  } | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!location) return;
    setLoading(true);
    getWeatherData(location, languageName)
      .then(setData)
      .finally(() => setLoading(false));
  }, [location, languageName]);

  if (!location) {
    return (
      <div className="rounded-md border border-border bg-brand-50 p-4 dark:bg-brand-900/40">
        <p className="text-sm font-medium text-brand-900 dark:text-brand-50">
          Enable location for hyper-local weather and crop tips.
        </p>
        <p className="mt-1 text-xs text-brand-800/80 dark:text-brand-200/80">
          We only ask once — your coordinates stay on your device.
        </p>
        <Button
          variant="primary"
          size="sm"
          className="mt-3"
          onClick={onEnableLocation}
          disabled={isRequestingLocation}
        >
          {isRequestingLocation ? "Detecting..." : "Enable location"}
        </Button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="rounded-md border border-border bg-brand-50 p-4 dark:bg-brand-900/40">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-brand-50 p-4 dark:bg-brand-900/40">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-full bg-harvest-200 text-2xl"
        >
          {data.weather.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-semibold text-brand-900 dark:text-brand-50 tabular">
            {Math.round(data.weather.temp)}°C
          </p>
          <p className="truncate text-xs text-brand-800/80 dark:text-brand-200/80">
            {data.weather.condition}
          </p>
        </div>
      </div>
      {data.advice.bestCrops?.length ? (
        <div className="mt-3 rounded-md bg-surface p-3 dark:bg-surface-2">
          <p className="text-xs font-medium text-fg">
            Crop tip
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            <span className="font-medium text-fg">
              {data.advice.bestCrops[0].name}:
            </span>{" "}
            {data.advice.bestCrops[0].plantingTip}
          </p>
        </div>
      ) : null}
      {data.weather.forecast?.length ? (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {data.weather.forecast.slice(0, 4).map((d) => (
            <div
              key={d.date}
              className="rounded-md bg-surface/70 p-2 text-center dark:bg-surface-2/70"
            >
              <p className="text-[10px] font-medium text-brand-800 dark:text-brand-200">
                {d.date}
              </p>
              <p className="text-base">{d.icon}</p>
              <p className="text-xs font-medium text-fg tabular">{Math.round(d.temp)}°</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------ QuickAction ------------------------------ */
function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-md border border-border bg-surface p-2 text-fg transition-colors hover:bg-surface-2"
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
        {icon}
      </span>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

/* --------------------------------- helpers -------------------------------- */
function useTimeGreeting(swahili: boolean) {
  return React.useMemo(() => {
    const h = new Date().getHours();
    if (swahili) {
      if (h < 12) return "Habari za asubuhi";
      if (h < 17) return "Habari za mchana";
      return "Habari za jioni";
    }
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, [swahili]);
}

function mapOrderStatus(s: Order["status"]) {
  switch (s) {
    case "Processing":
      return "processing" as const;
    case "Shipped":
      return "shipped" as const;
    case "Delivered":
      return "delivered" as const;
    case "Cancelled":
      return "cancelled" as const;
    case "Completed":
      return "completed" as const;
    default:
      return "pending" as const;
  }
}

/* --------------------------------- icons --------------------------------- */
function CameraIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z" /><circle cx="12" cy="13" r="4" /></svg>); }
function TestTubeIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 2v17a3 3 0 0 1-6 0V2" /><path d="M8 13h6" /></svg>); }
function TractorIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 12h6M9 7h7M3 16a3 3 0 1 0 6 0M16 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /></svg>); }
function PawIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="4" cy="8" r="2" /><circle cx="20" cy="16" r="2" /><circle cx="4" cy="16" r="2" /><path d="M8 22a4 4 0 1 1 8 0" /></svg>); }
function PackageIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>); }
