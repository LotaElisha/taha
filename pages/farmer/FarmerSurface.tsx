import * as React from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  Product,
  CartItem,
  Agrodealer,
  Agrovet,
  Review,
  Order,
  DeliveryOption,
  PaymentMethod,
  LogisticsBooking,
  Tool,
  ToolBooking,
} from "../../types";
import { AppShell, AppBar, type NavItem } from "../../components/app-shell";
import { OfflineBanner } from "../../components/feedback/OfflineBanner";
import { CartDrawer } from "../../components/marketplace/CartDrawer";
import { ProductDetailDrawer } from "../../components/marketplace/ProductDetailDrawer";
import { ProductGridV2 } from "../../components/marketplace/ProductGridV2";
import { CategoryChips, type CategoryValue } from "../../components/marketplace/CategoryChips";
import { useLanguage } from "../../context/LanguageContext";
import { FarmerToday } from "./FarmerToday";
import { KycFlow } from "./KycFlow";
import { useRealtime } from "../../hooks/useRealtime";
import { usePushSubscription } from "../../hooks/usePushSubscription";
import OrderHistory from "../OrderHistory";
import ProfileSettings from "../../components/ProfileSettings";
import MyFarm from "../../components/MyFarm";
import { MyDisputesPanel } from "../../components/disputes/MyDisputesPanel";
import { RouteFallback } from "../../components/feedback/RouteFallback";

const VendorPage = React.lazy(() =>
  import("../public/VendorPage").then((m) => ({ default: m.VendorPage }))
);

interface FarmerSurfaceProps {
  products: Product[];
  vendors: (Agrodealer | Agrovet)[];
  reviews: Review[];
  onAddReview: (r: Omit<Review, "id" | "date">) => void;
  orders: Order[];
  setOrders: (orders: Order[] | ((prev: Order[]) => Order[])) => void;
  cartItems: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  onAddToCart: (p: Product, qty: number) => void;
  onUpdateQuantity: (productId: string, q: number) => void;
  onRemoveFromCart: (productId: string) => void;
  selectedDeliveryOption: DeliveryOption;
  setSelectedDeliveryOption: (o: DeliveryOption) => void;
  selectedPaymentMethod: PaymentMethod;
  setSelectedPaymentMethod: (m: PaymentMethod) => void;
  paymentMethods: PaymentMethod[];
  deliveryOptions: DeliveryOption[];
  onCheckout: () => void;
  // Service modal openers
  onOpenScanner: () => void;
  onOpenSoilTest: () => void;
  onOpenAgronomist: () => void;
  onOpenVet: () => void;
  onOpenWarehouse: () => void;
  // For deep features kept on legacy plumbing (tools, logistics)
  tools: Tool[];
  setTools: (tools: Tool[] | ((prev: Tool[]) => Tool[])) => void;
  toolBookings: ToolBooking[];
  setToolBookings: (b: ToolBooking[] | ((prev: ToolBooking[]) => ToolBooking[])) => void;
  logisticsBookings: LogisticsBooking[];
  setLogisticsBookings: (b: LogisticsBooking[] | ((prev: LogisticsBooking[]) => LogisticsBooking[])) => void;
}

/**
 * FarmerSurface — `/farmer/*` routed sub-app.
 * Shell + bottom nav are constant; the main slot swaps with the route.
 */
export function FarmerSurface(p: FarmerSurfaceProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  useRealtime();
  // Refreshes push subscription if the user previously granted permission.
  // The first-time prompt is opt-in — call requestPermissionAndSubscribe()
  // from a meaningful moment (e.g. after the first order is placed).
  usePushSubscription();

  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryValue>("All");

  const featuredProducts = React.useMemo(
    () => p.products.filter((x) => x.isFeatured).slice(0, 4),
    [p.products]
  );

  const filteredProducts = React.useMemo(
    () =>
      selectedCategory === "All"
        ? p.products
        : p.products.filter((x) => x.category === selectedCategory),
    [p.products, selectedCategory]
  );

  // Derive active bottom-nav tab from the route.
  const activeNavId: string = location.pathname.startsWith("/farmer/shop")
    ? "shop"
    : location.pathname.startsWith("/farmer/orders")
      ? "orders"
      : location.pathname.startsWith("/farmer/profile") ||
        location.pathname.startsWith("/farmer/kyc") ||
        location.pathname.startsWith("/farmer/farms")
        ? "profile"
        : "today";

  const farmerNav: NavItem[] = [
    { id: "today", label: "Today", icon: <HomeIcon />, onClick: () => navigate("/farmer") },
    { id: "shop", label: "Shop", icon: <BagIcon />, onClick: () => navigate("/farmer/shop") },
    { id: "scan", label: "Scan", icon: <CameraIcon />, fab: true, onClick: p.onOpenScanner },
    { id: "orders", label: "Orders", icon: <ListIcon />, onClick: () => navigate("/farmer/orders") },
    { id: "profile", label: "Profile", icon: <UserIcon />, onClick: () => navigate("/farmer/profile") },
  ];

  const cartCount = p.cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <AppShell
      appBar={
        <AppBar
          leading={
            <button
              type="button"
              onClick={() => navigate("/farmer")}
              className="flex items-center gap-2 px-1"
              aria-label="Today"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-white" aria-hidden>
                <LeafIcon />
              </span>
              <span className="text-base font-semibold text-fg">Mkulima</span>
            </button>
          }
          trailing={
            <>
              <button
                type="button"
                aria-label="Cart"
                onClick={() => p.setIsCartOpen(true)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-fg"
              >
                <BagIcon />
                {cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                    {cartCount}
                  </span>
                ) : null}
              </button>
            </>
          }
        />
      }
      navItems={farmerNav}
      activeNavId={activeNavId}
    >
      <OfflineBanner />
      <Routes>
        <Route index element={<Navigate to="/farmer" replace />} />
        <Route
          path="farmer"
          element={
            <FarmerToday
              orders={p.orders}
              featuredProducts={featuredProducts}
              onOpenScanner={p.onOpenScanner}
              onOpenSoilTest={p.onOpenSoilTest}
              onOpenVet={p.onOpenVet}
              onProductClick={setSelectedProduct}
              onVendorClick={(v: Agrodealer | Agrovet) => navigate(`/farmer/v/${v.id}`)}
              onAddToCart={p.onAddToCart}
            />
          }
        />
        <Route
          path="farmer/shop"
          element={
            <div className="mx-auto w-full max-w-7xl">
              <CategoryChips
                value={selectedCategory}
                onChange={setSelectedCategory}
                translate={(c) =>
                  t(`categories.${c.toLowerCase().replace(/ /g, "")}`)
                }
              />
              <ProductGridV2
                products={filteredProducts}
                onProductClick={setSelectedProduct}
                onVendorClick={(v) => navigate(`/farmer/v/${v.id}`)}
                onAddToCart={p.onAddToCart}
              />
            </div>
          }
        />
        <Route
          path="farmer/orders"
          element={
            <div className="mx-auto w-full max-w-3xl px-4 py-4">
              <h1 className="mb-3 text-xl font-semibold text-fg">Orders</h1>
              {/* Disputes panel pulls from /api/v1/disputes/mine +
                  /api/v1/orders/mine; it renders nothing when there's no
                  active dispute and no disputable order. */}
              <MyDisputesPanel />
              <OrderHistory orders={p.orders} onViewReceipt={() => {}} />
            </div>
          }
        />
        <Route
          path="farmer/farms"
          element={
            <div className="mx-auto w-full max-w-3xl px-4 py-4">
              <MyFarm />
            </div>
          }
        />
        <Route
          path="farmer/profile"
          element={
            <div className="mx-auto w-full max-w-3xl px-4 py-4">
              <ProfileSettings
                orders={p.orders}
                onOpenKycModal={() => navigate("/farmer/kyc")}
              />
            </div>
          }
        />
        <Route
          path="farmer/kyc"
          element={<KycFlow onDone={() => navigate("/farmer/profile")} />}
        />
        <Route
          path="farmer/v/:vendorId"
          element={
            <React.Suspense fallback={<RouteFallback />}>
              <VendorPage
                vendors={p.vendors}
                products={p.products}
                reviews={p.reviews}
                onAddReview={p.onAddReview}
                onProductClick={setSelectedProduct}
                onAddToCart={p.onAddToCart}
              />
            </React.Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/farmer" replace />} />
      </Routes>

      <CartDrawer
        isOpen={p.isCartOpen}
        onClose={() => p.setIsCartOpen(false)}
        cartItems={p.cartItems}
        onUpdateQuantity={p.onUpdateQuantity}
        onRemoveItem={p.onRemoveFromCart}
        deliveryOptions={p.deliveryOptions}
        selectedDeliveryOption={p.selectedDeliveryOption}
        onSelectDeliveryOption={p.setSelectedDeliveryOption}
        paymentMethods={p.paymentMethods}
        selectedPaymentMethod={p.selectedPaymentMethod}
        onSelectPaymentMethod={p.setSelectedPaymentMethod}
        onCheckout={p.onCheckout}
      />

      <ProductDetailDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={p.onAddToCart}
        onVendorClick={(v) => {
          setSelectedProduct(null);
          navigate(`/farmer/v/${v.id}`);
        }}
      />
    </AppShell>
  );
}

/* --------------------------------- icons --------------------------------- */
function HomeIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2Z" /></svg>); }
function BagIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>); }
function CameraIcon() { return (<svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z" /><circle cx="12" cy="13" r="4" /></svg>); }
function ListIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>); }
function UserIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>); }
function LeafIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M11 20A7 7 0 0 1 4 13c0-4 3-9 11-11-1 5-1 9-3 12s-5 4-7 4Z" /><path d="M2 22c2-3 5-6 9-9" /></svg>); }
