
import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem, Review, Order, Agrodealer, Agrovet, DeliveryOption, PaymentMethod, LogisticsBooking, Tool, ToolBooking } from '../types';
import { useAuth } from '../context/AuthContext';
import { getAiEnhancedSearchResults } from '../services/geminiService';
import { useLanguage } from '../context/LanguageContext';
import { sendWhatsAppMessage } from '../services/whatsappService';
import { toast } from '../components/ui/sonner';

// Components
import Header from '../components/Header';
import FarmerSidebar, { FarmerView } from '../components/FarmerSidebar';
import FarmerDashboardOverview from '../components/FarmerDashboardOverview';
import MarketplaceView from '../components/MarketplaceView';
import MyFarm from '../components/MyFarm';
import OrderHistory from './OrderHistory';
import ProfileSettings from '../components/ProfileSettings';
import SmartAssistantWidget from '../components/CropAdvisorWidget';
import CartSidebar from '../components/CartSidebar';
import ProductDetailModal from '../components/ProductDetailModal';
import PlantScannerModal from '../components/PlantScannerModal';
import SoilTestingModal from '../components/SoilTestingModal';
import AgronomistConsultationModal from '../components/AgronomistConsultationModal';
import WarehouseBookingModal from '../components/WarehouseBookingModal';
import VeterinaryHelpModal from '../components/VeterinaryHelpModal';
import FinancialServicesModal from '../components/FinancialServicesModal';
import KYCModal from '../components/KYCModal';
import Logistics from '../components/Logistics';
import LogisticsBookingModal from '../components/LogisticsBookingModal';
import ToolRentalMarketplace from '../components/ToolRentalMarketplace';
import MyToolBookings from '../components/MyToolBookings';
import ToolBookingModal from '../components/ToolBookingModal';
import ReceiptModal from '../components/ReceiptModal';

// Mock data (could be passed as props or from context)
const DELIVERY_OPTIONS: DeliveryOption[] = [
  { id: 'standard', name: 'Standard Delivery', cost: 5000, eta: '3-5 business days' },
  { id: 'express', name: 'Express Delivery', cost: 15000, eta: '1-2 business days' },
];

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'mpesa', name: 'M-Pesa' },
  { id: 'card', name: 'Credit/Debit Card' },
  { id: 'cod', name: 'Cash on Delivery' },
];

interface FarmerDashboardProps {
    products: Product[];
    reviews: Review[];
    setReviews: (reviews: Review[] | ((prev: Review[]) => Review[])) => void;
    orders: Order[];
    setOrders: (orders: Order[] | ((prev: Order[]) => Order[])) => void;
    cartItems: CartItem[];
    setCartItems: (items: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void;
    onUpdateQuantity: (productId: string, newQuantity: number) => void;
    onRemoveFromCart: (productId: string) => void;
    onAddToCart: (product: Product, quantity: number) => void;
    isCartOpen: boolean;
    setIsCartOpen: (isOpen: boolean) => void;
    logisticsBookings: LogisticsBooking[];
    setLogisticsBookings: (bookings: LogisticsBooking[] | ((prev: LogisticsBooking[]) => LogisticsBooking[])) => void;
    tools: Tool[];
    setTools: (tools: Tool[] | ((prev: Tool[]) => Tool[])) => void;
    toolBookings: ToolBooking[];
    setToolBookings: (bookings: ToolBooking[] | ((prev: ToolBooking[]) => ToolBooking[])) => void;
    onOpenApiDocs: () => void;
}

const FarmerDashboard: React.FC<FarmerDashboardProps> = (props) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [activeView, setActiveView] = useState<FarmerView>('overview');

    // Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // State for marketplace within the dashboard
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [aiFilteredProductIds, setAiFilteredProductIds] = useState<string[] | null>(null);

    // State for modals
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedVendor, setSelectedVendor] = useState<Agrodealer | Agrovet | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isSoilTestModalOpen, setIsSoilTestModalOpen] = useState(false);
    const [isAgronomistModalOpen, setIsAgronomistModalOpen] = useState(false);
    const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
    const [isVeterinaryModalOpen, setIsVeterinaryModalOpen] = useState(false);
    const [isFinancialServicesModalOpen, setIsFinancialServicesModalOpen] = useState(false);
    const [isKycModalOpen, setIsKycModalOpen] = useState(false);
    const [isLogisticsModalOpen, setIsLogisticsModalOpen] = useState(false);
    const [isToolBookingModalOpen, setIsToolBookingModalOpen] = useState(false);
    const [toolToBook, setToolToBook] = useState<Tool | null>(null);
    const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

    // Delivery and Payment state
    const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<DeliveryOption>(DELIVERY_OPTIONS[0]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0]);

    const handleSearchSubmit = async (query: string) => {
        setSearchTerm(query);
        if (!query.trim()) {
            setAiFilteredProductIds(null);
            return;
        }
        setIsAiSearching(true);
        setAiFilteredProductIds(null);
        try {
            const productInfoForAI = props.products.map(({ id, name, description, category }) => ({ id, name, description, category }));
            const productIds = await getAiEnhancedSearchResults(query, productInfoForAI);
            setAiFilteredProductIds(productIds);
        } catch (error) {
            console.error("AI search failed:", error);
            setAiFilteredProductIds([]);
        } finally {
            setIsAiSearching(false);
        }
    };
    
    useEffect(() => {
        const isModalOpen = props.isCartOpen || selectedProduct || isScannerOpen || isSoilTestModalOpen || isAgronomistModalOpen || isWarehouseModalOpen || isVeterinaryModalOpen || isFinancialServicesModalOpen || isKycModalOpen || isLogisticsModalOpen || isToolBookingModalOpen || !!receiptOrder;
        if (isModalOpen) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = 'auto';
        }
      }, [props.isCartOpen, selectedProduct, isScannerOpen, isSoilTestModalOpen, isAgronomistModalOpen, isWarehouseModalOpen, isVeterinaryModalOpen, isFinancialServicesModalOpen, isKycModalOpen, isLogisticsModalOpen, isToolBookingModalOpen, receiptOrder]);

    const handleAccessFinance = () => {
        if(user?.kycStatus === 'Verified') {
            setIsFinancialServicesModalOpen(true)
        } else {
            toast.warning('Verify your ID to access financial services.', {
                description: 'It takes about 2 minutes.',
                action: { label: 'Go to profile', onClick: () => setActiveView('profile_settings') },
            });
        }
    };

    const handleCheckout = () => {
        if (!user || props.cartItems.length === 0) {
            return;
        }

        const subtotal = props.cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        const total = subtotal + selectedDeliveryOption.cost;

        const newOrder: Order = {
            id: `ord-${Date.now()}`,
            userId: user.id,
            date: new Date().toISOString(),
            items: props.cartItems,
            total: total,
            status: 'Processing',
            channel: 'online'
        };

        props.setOrders(prev => [newOrder, ...prev]);

        const itemsByVendor = props.cartItems.reduce((acc, item) => {
            const vendorId = item.product.vendor.id;
            if (!acc[vendorId]) {
                acc[vendorId] = { vendor: item.product.vendor, items: [] };
            }
            acc[vendorId].items.push(item);
            return acc;
        }, {} as { [key: string]: { vendor: Agrodealer | Agrovet, items: CartItem[] } });

        Object.values(itemsByVendor).forEach(({ vendor, items }) => {
            if (vendor.whatsappConfig?.enabled && vendor.whatsappConfig.phoneNumber) {
                const vendorItems = items.map(i => `${i.product.name} (x${i.quantity})`).join(', ');
                const message = `New Order #${newOrder.id} received from ${user.name}. Items: ${vendorItems}. Please prepare for delivery.`;
                sendWhatsAppMessage(vendor.whatsappConfig.phoneNumber, message, vendor.whatsappConfig);
            }
        });
        
        if(user.phone) {
             const message = `Hi ${user.name}, your order #${newOrder.id} has been placed successfully. Total: Tsh ${total.toLocaleString()}. You will be notified once it's shipped.`;
             console.log(`--- Mock WhatsApp to Farmer ${user.phone} ---`);
             console.log(message);
        }

        props.setCartItems([]);
        props.setIsCartOpen(false);
        setReceiptOrder(newOrder);
    };

    const handleSaveLogisticsBooking = (bookingData: Omit<LogisticsBooking, 'id' | 'farmerId' | 'status'>) => {
        if (!user) return;
        const newBooking: LogisticsBooking = {
            id: `log-${Date.now()}`,
            farmerId: user.id,
            status: 'Pending',
            ...bookingData,
        };
        props.setLogisticsBookings(prev => [newBooking, ...prev]);
        setIsLogisticsModalOpen(false);
    };

    const handleSaveToolBooking = (bookingData: Omit<ToolBooking, 'id' | 'farmerId' | 'status'>) => {
        if (!user) return;
        const newBooking: ToolBooking = {
            id: `tb-${Date.now()}`,
            farmerId: user.id,
            status: 'Pending',
            ...bookingData
        };
        props.setToolBookings(prev => [newBooking, ...prev]);
        setIsToolBookingModalOpen(false);
    };

    const userLogisticsBookings = useMemo(() => {
        if (!user) return [];
        return props.logisticsBookings.filter(b => b.farmerId === user.id);
    }, [props.logisticsBookings, user]);

    const userToolBookings = useMemo(() => {
        if (!user) return [];
        return props.toolBookings.filter(b => b.farmerId === user.id);
    }, [props.toolBookings, user]);

    const handleBookTool = (tool: Tool) => {
        setToolToBook(tool);
        setIsToolBookingModalOpen(true);
    };

    const toggleSidebar = () => {
        if (window.innerWidth >= 1024) {
            setIsSidebarCollapsed(!isSidebarCollapsed);
        } else {
            setIsSidebarOpen(!isSidebarOpen);
        }
    };

    const renderContent = () => {
        switch(activeView) {
            case 'overview':
                return <FarmerDashboardOverview 
                            orders={props.orders}
                            onNavigate={setActiveView}
                            onOpenModal={(modal) => {
                                if (modal === 'scanner') setIsScannerOpen(true);
                                if (modal === 'soil_test') setIsSoilTestModalOpen(true);
                                if (modal === 'agronomist') setIsAgronomistModalOpen(true);
                                if (modal === 'veterinary') setIsVeterinaryModalOpen(true);
                            }}
                        />;
            case 'marketplace':
                return <MarketplaceView 
                            products={props.products}
                            searchTerm={searchTerm}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            isAiSearching={isAiSearching}
                            aiFilteredProductIds={aiFilteredProductIds}
                            onProductClick={setSelectedProduct}
                            onVendorClick={setSelectedVendor}
                            onAddToCart={props.onAddToCart}
                        />;
            case 'my_farm':
                return <MyFarm />;
            case 'tool_rentals':
                return <ToolRentalMarketplace tools={props.tools} onBookNow={handleBookTool} />;
            case 'my_tool_bookings':
                return <MyToolBookings bookings={userToolBookings} tools={props.tools} />;
            case 'logistics':
                return <Logistics bookings={userLogisticsBookings} onBookNew={() => setIsLogisticsModalOpen(true)} />;
            case 'order_history':
                return <OrderHistory orders={props.orders} onViewReceipt={setReceiptOrder} />;
            case 'profile_settings':
                return <ProfileSettings orders={props.orders} onOpenKycModal={() => setIsKycModalOpen(true)} />;
            default:
                return <FarmerDashboardOverview orders={props.orders} onNavigate={setActiveView} onOpenModal={() => {}}/>;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans overflow-hidden">
            <FarmerSidebar 
                activeView={activeView} 
                setActiveView={setActiveView} 
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isCollapsed={isSidebarCollapsed}
                onOpenApiDocs={props.onOpenApiDocs}
            />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <Header
                    onCartClick={() => props.setIsCartOpen(true)}
                    cartItemCount={props.cartItems.reduce((total, item) => total + item.quantity, 0)}
                    searchTerm={searchTerm}
                    onSearchSubmit={handleSearchSubmit}
                    onProfileClick={() => setActiveView('profile_settings')}
                    onLoginClick={() => {}} // Not used in dashboard
                    onMenuClick={toggleSidebar}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
                    {renderContent()}
                </main>
            </div>
            
            {/* Modals and Sidebars */}
            <CartSidebar
                isOpen={props.isCartOpen}
                onClose={() => props.setIsCartOpen(false)}
                cartItems={props.cartItems}
                onUpdateQuantity={props.onUpdateQuantity}
                onRemoveItem={props.onRemoveFromCart}
                deliveryOptions={DELIVERY_OPTIONS}
                selectedDeliveryOption={selectedDeliveryOption}
                onSelectDeliveryOption={setSelectedDeliveryOption}
                paymentMethods={PAYMENT_METHODS}
                selectedPaymentMethod={selectedPaymentMethod}
                onSelectPaymentMethod={setSelectedPaymentMethod}
                onCheckout={handleCheckout}
            />

            <KYCModal
                isOpen={isKycModalOpen}
                onClose={() => setIsKycModalOpen(false)}
            />

            <LogisticsBookingModal
                isOpen={isLogisticsModalOpen}
                onClose={() => setIsLogisticsModalOpen(false)}
                onSave={handleSaveLogisticsBooking}
            />

            {toolToBook && (
                <ToolBookingModal
                    isOpen={isToolBookingModalOpen}
                    onClose={() => setIsToolBookingModalOpen(false)}
                    tool={toolToBook}
                    onSave={handleSaveToolBooking}
                    allBookings={props.toolBookings}
                />
            )}
            
            {selectedProduct && (
                <ProductDetailModal
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
                onAddToCart={props.onAddToCart}
                onVendorClick={(v) => {
                    setSelectedVendor(v);
                    // Optionally navigate to a vendor profile view if that's desired
                }}
                />
            )}
            
            <PlantScannerModal 
                isOpen={isScannerOpen} 
                onClose={() => setIsScannerOpen(false)}
                products={props.products}
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
            
            <ReceiptModal
                isOpen={!!receiptOrder}
                onClose={() => setReceiptOrder(null)}
                order={receiptOrder}
            />

            <SmartAssistantWidget />
        </div>
    );
};

export default FarmerDashboard;
