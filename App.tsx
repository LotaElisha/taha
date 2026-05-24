import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem, Agrodealer, Review, Order, Agrovet, DeliveryOption, PaymentMethod, PaymentGatewayConfig, LogisticsBooking, Tool, ToolBooking, LogisticsProvider } from './types';
// All data now fetched from Laravel API. Mock data remains in data/mockData for
// local dev seeding, but production builds source from the database.
import { useProducts } from './hooks/queries';
import Footer from './components/Footer';
import SmartAssistantWidget from './components/CropAdvisorWidget';
import { useAuth } from './context/AuthContext';
// Product search now goes through the Laravel API (Postgres FTS + trigram fallback).
// Gemini stays available for plant-scan and weather but is no longer on the
// search hot path.
import { api } from './services/api';
import { useLanguage } from './context/LanguageContext';
import { toast } from './components/ui/sonner';

// New design-system pieces (Sprints 1-3)
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AppShell, AppBar, type NavItem } from './components/app-shell';
import { type CategoryValue } from './components/marketplace/CategoryChips';
import { ProductDetailDrawer } from './components/marketplace/ProductDetailDrawer';
import { CartDrawer } from './components/marketplace/CartDrawer';
import { GuestCheckoutDrawer } from './components/marketplace/GuestCheckoutDrawer';
import { SearchDrawer } from './components/marketplace/SearchDrawer';
import { OfflineBanner } from './components/feedback/OfflineBanner';
import { HomeView } from './pages/public/HomeView';
import { RouteFallback } from './components/feedback/RouteFallback';
// Code-split per route — guests never download admin/dealer/farmer bundles.
const VendorPage = React.lazy(() => import('./pages/public/VendorPage').then(m => ({ default: m.VendorPage })));
const AuthFlow = React.lazy(() => import('./pages/auth/AuthFlow').then(m => ({ default: m.AuthFlow })));
const AdminLoginPage = React.lazy(() => import('./pages/auth/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const FarmerSurface = React.lazy(() => import('./pages/farmer/FarmerSurface').then(m => ({ default: m.FarmerSurface })));
const DealerSurface = React.lazy(() => import('./pages/dealer/DealerSurface').then(m => ({ default: m.DealerSurface })));
const AdminSurface = React.lazy(() => import('./pages/admin/AdminSurface').then(m => ({ default: m.AdminSurface })));
const AgronomistSurface = React.lazy(() => import('./pages/agronomist/AgronomistSurface').then(m => ({ default: m.AgronomistSurface })));
const LogisticsSurface = React.lazy(() => import('./pages/logistics/LogisticsSurface').then(m => ({ default: m.LogisticsSurface })));


// Modals for services
import PlantScannerModal from './components/PlantScannerModal';
import SoilTestingModal from './components/SoilTestingModal';
import AgronomistConsultationModal from './components/AgronomistConsultationModal';
import WarehouseBookingModal from './components/WarehouseBookingModal';
import VeterinaryHelpModal from './components/VeterinaryHelpModal';
import FinancialServicesModal from './components/FinancialServicesModal';
import ApiDocsModal from './components/ApiDocsModal';

const DELIVERY_OPTIONS: DeliveryOption[] = [
  { id: 'standard', name: 'Standard Delivery', cost: 5000, eta: '3-5 business days' },
  { id: 'express', name: 'Express Delivery', cost: 15000, eta: '1-2 business days' },
];

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'mpesa', name: 'M-Pesa' },
  { id: 'card', name: 'Credit/Debit Card' },
  { id: 'cod', name: 'Cash on Delivery' },
];

const App: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: apiProducts } = useProducts();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (apiProducts) setProducts(apiProducts);
  }, [apiProducts]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logisticsBookings, setLogisticsBookings] = useState<LogisticsBooking[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [toolBookings, setToolBookings] = useState<ToolBooking[]>([]);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedVendor, setSelectedVendor] = useState<Agrodealer | Agrovet | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isGuestCheckoutOpen, setIsGuestCheckoutOpen] = useState<boolean>(false);

  // State for service modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSoilTestModalOpen, setIsSoilTestModalOpen] = useState(false);
  const [isAgronomistModalOpen, setIsAgronomistModalOpen] = useState(false);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isVeterinaryModalOpen, setIsVeterinaryModalOpen] = useState(false);
  const [isFinancialServicesModalOpen, setIsFinancialServicesModalOpen] = useState(false);
  const [isViewingProfile, setIsViewingProfile] = useState(false);
  const [isApiDocsOpen, setIsApiDocsOpen] = useState(false);


  const [paymentGateways, setPaymentGateways] = useState<PaymentGatewayConfig[]>([
    { provider: 'Selcom', enabled: false, apiKey: '', vendorId: '' },
    { provider: 'AzamPay', enabled: false, apiKey: '', apiSecret: '' },
    { provider: 'M-Pesa', enabled: true, shortcode: '123456', apiKey: '' },
    { provider: 'TigoPesa', enabled: false, shortcode: '', apiKey: '' },
    { provider: 'Bank', enabled: false, bankName: 'CRDB', accountName: 'Mkulima App', accountNumber: '0123456789012' }
  ]);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<DeliveryOption>(DELIVERY_OPTIONS[0]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0]);

  // AI Search State
  const [isAiSearching, setIsAiSearching] = useState<boolean>(false);
  const [aiFilteredProductIds, setAiFilteredProductIds] = useState<string[] | null>(null);
  
  // Derive vendors from the live product catalog instead of the mock user pool.
  const vendors = useMemo(() => {
    const map = new Map<string, Agrodealer | Agrovet>();
    products.forEach((p) => {
      if (p.vendor && !map.has(p.vendor.id)) {
        map.set(p.vendor.id, p.vendor);
      }
    });
    return Array.from(map.values());
  }, [products]);

  useEffect(() => {
    const isModalOpen = isCartOpen || selectedVendor || isLoginModalOpen || isGuestCheckoutOpen || selectedProduct || isScannerOpen || isSoilTestModalOpen || isAgronomistModalOpen || isWarehouseModalOpen || isVeterinaryModalOpen || isFinancialServicesModalOpen || isApiDocsOpen;
    if (user) return; 
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isCartOpen, selectedVendor, isLoginModalOpen, isGuestCheckoutOpen, selectedProduct, isScannerOpen, isSoilTestModalOpen, isAgronomistModalOpen, isWarehouseModalOpen, isVeterinaryModalOpen, isFinancialServicesModalOpen, isApiDocsOpen, user]);

  const handleAddToCart = (product: Product, quantity: number) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { product, quantity }];
    });
    setIsCartOpen(true);
  };
  
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    setCartItems(prevItems => {
      if (newQuantity <= 0) {
        return prevItems.filter(item => item.product.id !== productId);
      }
      return prevItems.map(item =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  };
  
  const handleSearchSubmit = async (query: string) => {
    setSearchTerm(query);
    setSelectedVendor(null);
    if (!query.trim()) {
      setAiFilteredProductIds(null);
      return;
    }
    setIsAiSearching(true);
    setAiFilteredProductIds(null);
    try {
      // Server-side Postgres full-text + trigram fallback (Sprint 9).
      // No Gemini call on the hot path — sub-100 ms typical.
      const res = await api.products.search(query, selectedCategory);
      if (res.success && res.data) {
        setAiFilteredProductIds(res.data.map(p => p.id));
      } else {
        setAiFilteredProductIds([]);
      }
    } catch (error) {
      toast.error('Search failed. Please check your connection and try again.');
      setAiFilteredProductIds([]);
    } finally {
      setIsAiSearching(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let baseProducts = products;
    if (aiFilteredProductIds !== null) {
      const productMap = new Map(products.map(p => [p.id, p]));
      baseProducts = aiFilteredProductIds
        .map(id => productMap.get(id))
        .filter((p): p is Product => p !== undefined);
    }
    return baseProducts.filter(product =>
      (selectedCategory === 'All' || product.category === selectedCategory)
    );
  }, [products, selectedCategory, aiFilteredProductIds]);
  
  const handleCheckout = () => {
    if (user) {
        setIsCartOpen(true); 
    } else {
        setIsGuestCheckoutOpen(true);
    }
  };
  
  const handlePlaceGuestOrder = async (details: { name: string; phone: string; address: string }) => {
    const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0) + selectedDeliveryOption.cost;
    const res = await api.orders.create('guest', cartItems, total, {
      deliveryOptionId: selectedDeliveryOption.id,
      deliveryCost: selectedDeliveryOption.cost,
      paymentMethodId: selectedPaymentMethod.id,
      guest: details,
    });
    if (!res.success || !res.data) {
      toast.error('Failed to place order. Please try again.');
      throw new Error(res.error || 'Order failed');
    }
    setOrders(prev => [res.data!, ...prev]);
    setCartItems([]);
    toast.success('Order placed successfully!');
  };

  const handleAddReview = (reviewData: Omit<Review, 'id' | 'date'>) => {
    const newReview: Review = {
        ...reviewData,
        id: `r${Date.now()}`,
        date: new Date().toISOString(),
    };
    setReviews(prev => [newReview, ...prev]);
  };
  
  const handleAccessFinance = () => {
    if(!user) {
        setIsLoginModalOpen(true);
        return;
    }
    if(user.kycStatus === 'Verified') {
        setIsFinancialServicesModalOpen(true)
    } else {
        toast.warning('Verify your ID to access financial services.', {
            description: 'It takes about 2 minutes. You can do it from your profile.',
            action: user.role === 'Farmer'
                ? { label: 'Go to profile', onClick: () => setIsViewingProfile(true) }
                : undefined,
        });
    }
  };

  // The whole app lives inside BrowserRouter so every role can grow into routes.
  // For now: Farmer is routed (Sprint 3). Other roles still render the legacy
  // dashboards as single non-routed elements; Sprint 4 routifies them.
  const roleSurface = (() => {
    if (!user) return null;
    switch (user.role) {
      case 'Admin':
      case 'SuperAdmin':
      case 'KYCOfficer':
      case 'CatalogManager':
      case 'SupportAgent':
      case 'FinancialAuditor':
        return (
          <AdminSurface
            products={products}
            setProducts={setProducts}
            orders={orders}
            setOrders={setOrders}
            vendors={vendors}
            paymentGateways={paymentGateways}
            setPaymentGateways={setPaymentGateways}
            logisticsBookings={logisticsBookings}
            setLogisticsBookings={setLogisticsBookings}
            tools={tools}
            setTools={setTools}
            toolBookings={toolBookings}
          />
        );
      case 'Agrodealer':
      case 'Agrovet':
        return (
          <DealerSurface
            vendor={user as Agrodealer | Agrovet}
            allProducts={products}
            setProducts={setProducts}
            orders={orders}
            setOrders={setOrders}
            tools={tools}
            setTools={setTools}
            toolBookings={toolBookings}
            setToolBookings={setToolBookings}
          />
        );
      case 'Agronomist':
        return <AgronomistSurface />;
      case 'LogisticsProvider':
        return (
          <LogisticsSurface
            provider={user as LogisticsProvider}
            bookings={logisticsBookings}
            setBookings={setLogisticsBookings}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <BrowserRouter>
      {user?.role === 'Farmer' ? (
        <React.Suspense fallback={<RouteFallback />}>
        <FarmerSurface
          products={products}
          vendors={vendors}
          reviews={reviews}
          onAddReview={handleAddReview}
          orders={orders}
          setOrders={setOrders}
          cartItems={cartItems}
          isCartOpen={isCartOpen}
          setIsCartOpen={setIsCartOpen}
          onAddToCart={handleAddToCart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveFromCart={handleRemoveFromCart}
          selectedDeliveryOption={selectedDeliveryOption}
          setSelectedDeliveryOption={setSelectedDeliveryOption}
          selectedPaymentMethod={selectedPaymentMethod}
          setSelectedPaymentMethod={setSelectedPaymentMethod}
          paymentMethods={PAYMENT_METHODS}
          deliveryOptions={DELIVERY_OPTIONS}
          onCheckout={handleCheckout}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenSoilTest={() => setIsSoilTestModalOpen(true)}
          onOpenAgronomist={() => setIsAgronomistModalOpen(true)}
          onOpenVet={() => setIsVeterinaryModalOpen(true)}
          onOpenWarehouse={() => setIsWarehouseModalOpen(true)}
          tools={tools}
          setTools={setTools}
          toolBookings={toolBookings}
          setToolBookings={setToolBookings}
          logisticsBookings={logisticsBookings}
          setLogisticsBookings={setLogisticsBookings}
        />
        </React.Suspense>
      ) : roleSurface ? (
        <React.Suspense fallback={<RouteFallback />}>{roleSurface}</React.Suspense>
      ) : (
      <PublicSurface
        // Shared state from App
        products={products}
        filteredProducts={filteredProducts}
        vendors={vendors}
        reviews={reviews}
        cartItems={cartItems}
        cartCount={cartItems.reduce((total, item) => total + item.quantity, 0)}
        isAiSearching={isAiSearching}
        selectedCategory={selectedCategory as CategoryValue}
        onCategoryChange={setSelectedCategory}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        isGuestCheckoutOpen={isGuestCheckoutOpen}
        setIsGuestCheckoutOpen={setIsGuestCheckoutOpen}
        selectedDeliveryOption={selectedDeliveryOption}
        setSelectedDeliveryOption={setSelectedDeliveryOption}
        selectedPaymentMethod={selectedPaymentMethod}
        setSelectedPaymentMethod={setSelectedPaymentMethod}
        // Handlers
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onAddReview={handleAddReview}
        onCheckout={handleCheckout}
        onPlaceGuestOrder={handlePlaceGuestOrder}
        onSearchSubmit={handleSearchSubmit}
        onAccessFinance={handleAccessFinance}
        // Service modal openers
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenSoilTest={() => setIsSoilTestModalOpen(true)}
        onOpenAgronomist={() => setIsAgronomistModalOpen(true)}
        onOpenVet={() => setIsVeterinaryModalOpen(true)}
        onOpenWarehouse={() => setIsWarehouseModalOpen(true)}
        onOpenApiDocs={() => setIsApiDocsOpen(true)}
      />
      )}

      {/* Service modals + AI widget are mounted outside the route tree
          so they remain controllable from any role/surface. */}
      <PlantScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
      />
      <SoilTestingModal
        isOpen={isSoilTestModalOpen}
        onClose={() => setIsSoilTestModalOpen(false)}
      />
      <AgronomistConsultationModal
        isOpen={isAgronomistModalOpen}
        onClose={() => setIsAgronomistModalOpen(false)}
      />
      <WarehouseBookingModal
        isOpen={isWarehouseModalOpen}
        onClose={() => setIsWarehouseModalOpen(false)}
      />
      <VeterinaryHelpModal
        isOpen={isVeterinaryModalOpen}
        onClose={() => setIsVeterinaryModalOpen(false)}
      />
      <FinancialServicesModal
        isOpen={isFinancialServicesModalOpen}
        onClose={() => setIsFinancialServicesModalOpen(false)}
      />
      <ApiDocsModal
        isOpen={isApiDocsOpen}
        onClose={() => setIsApiDocsOpen(false)}
      />
      <SmartAssistantWidget />
    </BrowserRouter>
  );
};

export default App;

/* -------------------------------------------------------------------------
 * PublicSurface — AppShell + Routes for the guest/public side of the app.
 * Owns route-aware bottom-nav state via useLocation; receives all data
 * and handlers from App as props.
 * ------------------------------------------------------------------------- */
interface PublicSurfaceProps {
  products: Product[];
  filteredProducts: Product[];
  vendors: (Agrodealer | Agrovet)[];
  reviews: Review[];
  cartItems: CartItem[];
  cartCount: number;
  isAiSearching: boolean;
  selectedCategory: CategoryValue;
  onCategoryChange: (c: CategoryValue) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isGuestCheckoutOpen: boolean;
  setIsGuestCheckoutOpen: (open: boolean) => void;
  selectedDeliveryOption: DeliveryOption;
  setSelectedDeliveryOption: (o: DeliveryOption) => void;
  selectedPaymentMethod: PaymentMethod;
  setSelectedPaymentMethod: (m: PaymentMethod) => void;
  onAddToCart: (p: Product, qty: number) => void;
  onUpdateQuantity: (productId: string, q: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onAddReview: (r: Omit<Review, 'id' | 'date'>) => void;
  onCheckout: () => void;
  onPlaceGuestOrder: (d: { name: string; phone: string; address: string }) => void;
  onSearchSubmit: (q: string) => Promise<void> | void;
  onAccessFinance: () => void;
  onOpenScanner: () => void;
  onOpenSoilTest: () => void;
  onOpenAgronomist: () => void;
  onOpenVet: () => void;
  onOpenWarehouse: () => void;
  onOpenApiDocs: () => void;
}

const PublicSurface: React.FC<PublicSurfaceProps> = (p) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Derive bottom-nav active id from the URL so it stays in sync with the route.
  const activeNavId: string =
    location.pathname.startsWith('/login') || location.pathname.startsWith('/admin/login')
      ? 'signin'
      : location.pathname.startsWith('/v/')
        ? 'shop'
        : 'home';

  const guestNav: NavItem[] = [
    { id: 'home', label: 'Home', icon: <HomeIcon />, onClick: () => navigate('/') },
    { id: 'shop', label: 'Shop', icon: <BagIcon />, onClick: () => { navigate('/'); requestAnimationFrame(() => document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })); } },
    { id: 'scan', label: 'Scan', icon: <CameraIcon />, fab: true, onClick: p.onOpenScanner },
    { id: 'services', label: 'Services', icon: <ServicesIcon />, onClick: () => { navigate('/'); requestAnimationFrame(() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })); } },
    { id: 'signin', label: 'Sign in', icon: <UserIcon />, onClick: () => navigate('/login') },
  ];

  const isAuthRoute =
    location.pathname.startsWith('/login') || location.pathname.startsWith('/admin/login');

  return (
    <AppShell
      appBar={
        <AppBar
          leading={
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-1"
              aria-label="Mkulima home"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-white" aria-hidden>
                <LeafIcon />
              </span>
              <span className="text-base font-semibold text-fg">Mkulima</span>
            </button>
          }
          trailing={
            isAuthRoute ? null : (
              <>
                <button
                  type="button"
                  aria-label="Search"
                  onClick={() => setIsSearchOpen(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-fg active:scale-95 transition-transform"
                >
                  <SearchIcon />
                </button>
                <button
                  type="button"
                  aria-label="Cart"
                  onClick={() => p.setIsCartOpen(true)}
                  className="relative flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-fg active:scale-95 transition-transform"
                >
                  <BagIcon />
                  {p.cartCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                      {p.cartCount}
                    </span>
                  ) : null}
                </button>
              </>
            )
          }
        />
      }
      navItems={isAuthRoute ? undefined : guestNav}
      activeNavId={activeNavId}
    >
      <OfflineBanner />

      <React.Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route
          path="/"
          element={
            <HomeView
              products={p.products}
              filteredProducts={p.filteredProducts}
              isLoading={p.isAiSearching}
              selectedCategory={p.selectedCategory}
              onCategoryChange={p.onCategoryChange}
              onProductClick={p.setSelectedProduct}
              onAddToCart={p.onAddToCart}
              onOpenScanner={p.onOpenScanner}
              onOpenSoilTest={p.onOpenSoilTest}
              onOpenAgronomist={p.onOpenAgronomist}
              onOpenVet={p.onOpenVet}
              onOpenWarehouse={p.onOpenWarehouse}
              onLogisticsClick={() => toast.info('Sign in as a farmer to book logistics.', { action: { label: 'Sign in', onClick: () => navigate('/login') } })}
            />
          }
        />
        <Route
          path="/v/:vendorId"
          element={
            <VendorPage
              vendors={p.vendors}
              products={p.products}
              reviews={p.reviews}
              onAddReview={p.onAddReview}
              onProductClick={p.setSelectedProduct}
              onAddToCart={p.onAddToCart}
            />
          }
        />
        <Route path="/login" element={<AuthFlow />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </React.Suspense>

      <Footer
        onBookWarehouseClick={p.onOpenWarehouse}
        onAccessFinanceClick={p.onAccessFinance}
        onBookLogisticsClick={() => toast.info('Sign in as a farmer to book logistics.', { action: { label: 'Sign in', onClick: () => navigate('/login') } })}
        onOpenApiDocs={p.onOpenApiDocs}
      />

      <CartDrawer
        isOpen={p.isCartOpen}
        onClose={() => p.setIsCartOpen(false)}
        cartItems={p.cartItems}
        onUpdateQuantity={p.onUpdateQuantity}
        onRemoveItem={p.onRemoveFromCart}
        deliveryOptions={DELIVERY_OPTIONS}
        selectedDeliveryOption={p.selectedDeliveryOption}
        onSelectDeliveryOption={p.setSelectedDeliveryOption}
        paymentMethods={PAYMENT_METHODS}
        selectedPaymentMethod={p.selectedPaymentMethod}
        onSelectPaymentMethod={p.setSelectedPaymentMethod}
        onCheckout={p.onCheckout}
      />

      <GuestCheckoutDrawer
        isOpen={p.isGuestCheckoutOpen}
        onClose={() => p.setIsGuestCheckoutOpen(false)}
        onPlaceOrder={p.onPlaceGuestOrder}
        cartItems={p.cartItems}
        deliveryOption={p.selectedDeliveryOption}
      />

      <SearchDrawer
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSubmit={p.onSearchSubmit}
      />

      <ProductDetailDrawer
        product={p.selectedProduct}
        onClose={() => p.setSelectedProduct(null)}
        onAddToCart={p.onAddToCart}
        onVendorClick={(v) => navigate(`/v/${v.id}`)}
      />
    </AppShell>
  );
};

// ---------- Small inline icons used by the AppBar + BottomNav ----------
function HomeIcon() {
  return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2Z" /></svg>);
}
function BagIcon() {
  return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>);
}
function CameraIcon() {
  return (<svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z" /><circle cx="12" cy="13" r="4" /></svg>);
}
function ServicesIcon() {
  return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>);
}
function UserIcon() {
  return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>);
}
function SearchIcon() {
  return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>);
}
function LeafIcon() {
  return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M11 20A7 7 0 0 1 4 13c0-4 3-9 11-11-1 5-1 9-3 12s-5 4-7 4Z" /><path d="M2 22c2-3 5-6 9-9" /></svg>);
}