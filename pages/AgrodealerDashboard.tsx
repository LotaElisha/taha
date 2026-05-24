import React, { useState, useMemo, useEffect } from 'react';
import { Agrodealer, Agrovet, Product, Order, User, Tool, ToolBooking, WhatsAppConfig, ToolBookingStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import ProductFormModal from '../components/ProductFormModal';
import { useUser } from '../context/UserContext';
import ToolFormModal from '../components/ToolFormModal';
import PointOfSaleTerminal from '../components/PointOfSaleTerminal';
import BulkActionBar from '../components/BulkActionBar';
import ReceiptModal from '../components/ReceiptModal';
import VendorAnalyticsDashboard from '../components/VendorAnalyticsDashboard';
import BusinessProfileSettings from '../components/BusinessProfileSettings';
import { toast } from '../components/ui/sonner';

// Props interface
interface AgrodealerDashboardProps {
  vendor: Agrodealer | Agrovet;
  allProducts: Product[]; // Full product list from App state
  setProducts: (products: Product[] | ((prev: Product[]) => Product[])) => void; // To update the main product list
  orders: Order[]; // All orders
  setOrders: (orders: Order[] | ((prev: Order[]) => Order[])) => void; // Fixed type: updater must return Order[]
  tools: Tool[];
  setTools: (tools: Tool[] | ((prev: Tool[]) => Tool[])) => void;
  toolBookings: ToolBooking[];
  setToolBookings: (bookings: ToolBooking[] | ((prev: ToolBooking[]) => ToolBooking[])) => void;
}

// Re-using icons for consistency
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ProductsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const OrdersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const ToolIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83M11.42 15.17l-4.24-4.24a5.25 5.25 0 00-7.42 0L0 10.92l4.24 4.24a5.25 5.25 0 007.18 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15.75L3 21m0 0l-3-3m3 3L6 18m12-6.5l-3-3m3 3l-6-6" /></svg>;
const POSIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h3m-3 0v-3m0 0h3m-3 0h-3m3 0v-3m0 0h-3m-3 6h12M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const AnalyticsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;


type AgrodealerView = 'overview' | 'products' | 'orders' | 'tool_management' | 'tool_bookings' | 'pos' | 'analytics' | 'business_profile';

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-4">
      <div className="bg-brand-brown-light p-3 rounded-full">
        {icon}
      </div>
      <div>
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">{title}</h3>
        <p className="text-3xl font-bold text-brand-green-dark dark:text-white">{value}</p>
      </div>
    </div>
);

const DashboardOverview: React.FC<{ vendor: Agrodealer | Agrovet, products: Product[], allOrders: Order[] }> = ({ vendor, products, allOrders }) => {
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);
    return (
        <div className="space-y-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-brand-green-dark dark:text-gray-100">Welcome, {vendor.name}!</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Revenue" value={`Tsh ${totalRevenue.toLocaleString()}`} icon={<ProductsIcon />} />
                <StatCard title="Total Orders" value={allOrders.length} icon={<OrdersIcon />} />
                <StatCard title="Listed Products" value={products.length} icon={<ProductsIcon />} />
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Quick Stats</h3>
                <p className="text-gray-600 dark:text-gray-300">More detailed analytics coming soon!</p>
            </div>
        </div>
    );
};

const ProductManagement: React.FC<{ 
    products: Product[], 
    setProducts: (p: Product[] | ((prev: Product[]) => Product[])) => void, 
    onEdit: (p: Product) => void, 
    onCreate: () => void 
}> = ({ products, setProducts, onEdit, onCreate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

    const filteredProducts = useMemo(() =>
        products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase())
        ), [products, searchTerm]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedProductIds(filteredProducts.map(p => p.id));
        } else {
            setSelectedProductIds([]);
        }
    };

    const handleSelectOne = (productId: string) => {
        setSelectedProductIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handleDelete = (productId: string) => {
        setProducts(prev => {
            const removed = prev.find(p => p.id === productId);
            const next = prev.filter(p => p.id !== productId);
            toast('Product deleted.', {
                action: removed ? { label: 'Undo', onClick: () => setProducts(curr => [...curr, removed]) } : undefined,
            });
            return next;
        });
    };

    const handleBulkDelete = () => {
        const count = selectedProductIds.length;
        if (count === 0) return;
        setProducts(prev => {
            const removed = prev.filter(p => selectedProductIds.includes(p.id));
            const next = prev.filter(p => !selectedProductIds.includes(p.id));
            toast(`${count} products deleted.`, {
                action: { label: 'Undo', onClick: () => setProducts(curr => [...curr, ...removed]) },
            });
            return next;
        });
        setSelectedProductIds([]);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Manage Your Products</h2>
                <div className="flex items-center gap-2">
                    <input type="text" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-auto px-4 py-2 border rounded-full dark:bg-gray-700 dark:border-gray-600"/>
                    <button onClick={onCreate} className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2 px-4 rounded-full transition-colors whitespace-nowrap">+ Add Product</button>
                </div>
            </div>

            <BulkActionBar selectedCount={selectedProductIds.length} onExport={() => {}} onDelete={handleBulkDelete} />

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="p-3 w-4"><input type="checkbox" onChange={handleSelectAll} checked={selectedProductIds.length > 0 && selectedProductIds.length === filteredProducts.length}/></th>
                            <th className="text-left py-2 px-3">Product</th>
                            <th className="text-left py-2 px-3">Category</th>
                            <th className="text-right py-2 px-3">Price</th>
                            <th className="text-right py-2 px-3">Stock</th>
                            <th className="text-center py-2 px-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredProducts.map(product => (
                            <tr key={product.id}>
                                <td className="p-3"><input type="checkbox" checked={selectedProductIds.includes(product.id)} onChange={() => handleSelectOne(product.id)} /></td>
                                <td className="py-2 px-3 font-semibold text-gray-800 dark:text-gray-100">{product.name}</td>
                                <td className="py-2 px-3 text-gray-600 dark:text-gray-300">{product.category}</td>
                                <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-300">Tsh {product.price.toLocaleString()}</td>
                                <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-300">{product.stock}</td>
                                <td className="py-2 px-3 text-center space-x-2">
                                    <button onClick={() => onEdit(product)} className="text-blue-600 hover:underline text-sm">Edit</button>
                                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ToolManagement: React.FC<{ tools: Tool[], setTools: (t: Tool[] | ((prev: Tool[]) => Tool[])) => void, onEdit: (t: Tool) => void, onCreate: () => void }> = ({ tools, setTools, onEdit, onCreate }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Manage Tools</h2>
                <button onClick={onCreate} className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2 px-4 rounded-lg">+ Add Tool</button>
            </div>
            <p className="text-gray-600 dark:text-gray-300">Tool list and management tools will be displayed here.</p>
        </div>
    );
};

const ToolBookingManagement: React.FC<{ vendor: Agrodealer | Agrovet, toolBookings: ToolBooking[], tools: Tool[] }> = ({ vendor, toolBookings, tools }) => {
    const vendorToolIds = useMemo(() => new Set(tools.filter(t => t.owner.id === vendor.id).map(t => t.id)), [tools, vendor.id]);
    const vendorBookings = useMemo(() => toolBookings.filter(b => vendorToolIds.has(b.toolId)), [toolBookings, vendorToolIds]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Manage Tool Bookings</h2>
            <p className="text-gray-600 dark:text-gray-300">A list of bookings for your tools will be displayed here.</p>
            <p className="text-gray-600 dark:text-gray-300">You have {vendorBookings.length} bookings for your tools.</p>
        </div>
    );
};

const AgrodealerDashboard: React.FC<AgrodealerDashboardProps> = (props) => {
    const { vendor, allProducts, setProducts, orders: allOrders, setOrders, tools, setTools, toolBookings, setToolBookings } = props;
    
    const vendorProducts = useMemo(() => allProducts.filter(p => p.vendor.id === vendor.id), [allProducts, vendor.id]);
    const vendorTools = useMemo(() => tools.filter(t => t.owner.id === vendor.id), [tools, vendor.id]);
    const vendorOrders = useMemo(() => allOrders.filter(order => order.items.some(item => item.product.vendor.id === vendor.id)), [allOrders, vendor.id]);

    const { user, logout, updateUserAuthData } = useAuth();
    const { updateUser } = useUser();
    const [activeView, setActiveView] = useState<AgrodealerView>('overview');
    const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

    // Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // State for Product CRUD Modal
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);

    // State for Tool CRUD Modal
    const [isToolFormModalOpen, setIsToolFormModalOpen] = useState(false);
    const [toolToEdit, setToolToEdit] = useState<Tool | null>(null);
    
    useEffect(() => {
        const isModalOpen = isProductModalOpen || isToolFormModalOpen || !!receiptOrder;
        if (isModalOpen) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = 'auto';
        }
    }, [isProductModalOpen, isToolFormModalOpen, receiptOrder]);

    const handleSaveProduct = (productData: Product) => {
        setProducts(prev => {
            const existing = prev.find(p => p.id === productData.id);
            if (existing) {
                return prev.map(p => p.id === productData.id ? productData : p);
            }
            return [productData, ...prev];
        });
        setIsProductModalOpen(false);
        setProductToEdit(null);
    };

    const handleEditProduct = (product: Product) => {
        setProductToEdit(product);
        setIsProductModalOpen(true);
    };
    
    const handleCreateProduct = () => {
        setProductToEdit(null);
        setIsProductModalOpen(true);
    };

    const handleSaveTool = (toolData: Tool) => {
        setTools(prev => {
            const existing = prev.find(t => t.id === toolData.id);
            if (existing) {
                return prev.map(t => t.id === toolData.id ? toolData : t);
            }
            return [toolData, ...prev];
        });
        setIsToolFormModalOpen(false);
        setToolToEdit(null);
    };

    const handleEditTool = (tool: Tool) => {
        setToolToEdit(tool);
        setIsToolFormModalOpen(true);
    };

    const handleCreateTool = () => {
        setToolToEdit(null);
        setIsToolFormModalOpen(true);
    };
    
    const handleUpdateProfile = (updatedData: Partial<User>) => {
        if (!user) return;
        const fullyUpdatedUser = { ...user, ...updatedData };
        updateUserAuthData(updatedData); // Updates the user in AuthContext
        updateUser(fullyUpdatedUser as User); // Updates the user in the global list
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
                return <DashboardOverview vendor={vendor} products={vendorProducts} allOrders={vendorOrders} />;
            case 'products':
                return <ProductManagement 
                    products={vendorProducts} 
                    setProducts={setProducts}
                    onEdit={handleEditProduct}
                    onCreate={handleCreateProduct}
                />;
            case 'orders':
                return <OrderManagement vendor={vendor} orders={vendorOrders} setOrders={setOrders} onViewReceipt={setReceiptOrder} />;
            case 'analytics':
                return <VendorAnalyticsDashboard vendor={vendor} products={vendorProducts} orders={vendorOrders} />;
            case 'tool_management':
                return <ToolManagement 
                    tools={vendorTools}
                    setTools={setTools}
                    onEdit={handleEditTool}
                    onCreate={handleCreateTool}
                />;
            case 'tool_bookings':
                return <ToolBookingManagement 
                    vendor={vendor}
                    toolBookings={toolBookings}
                    tools={tools}
                />;
            case 'pos':
                return <PointOfSaleTerminal 
                            products={vendorProducts} 
                            setProducts={setProducts} 
                            setOrders={setOrders} 
                            whatsappConfig={vendor.whatsappConfig || {enabled: false, phoneNumber: '', accountId: '', phoneNumberId: '', accessToken: ''}} 
                            onSaleComplete={setReceiptOrder}
                       />;
            case 'business_profile':
                return <BusinessProfileSettings user={vendor} onSave={handleUpdateProfile} />;
            default:
                return <DashboardOverview vendor={vendor} products={vendorProducts} allOrders={vendorOrders} />;
        }
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans overflow-hidden">
            <Sidebar 
                activeView={activeView} 
                setActiveView={setActiveView} 
                logout={logout} 
                vendorName={vendor.name} 
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isCollapsed={isSidebarCollapsed}
            />
            <main className="flex-1 flex flex-col overflow-hidden min-w-0">
                <header className="bg-white dark:bg-gray-800 shadow-sm z-20 p-4 flex items-center">
                    <button onClick={toggleSidebar} className="p-2 rounded-md text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 mr-4 focus:outline-none">
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white truncate">{vendor.name} Panel</h1>
                </header>
                <div className="flex-1 overflow-x-hidden overflow-y-auto p-8">
                    {renderContent()}
                </div>
            </main>
            <ProductFormModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSave={handleSaveProduct}
                productToEdit={productToEdit}
                currentUser={user}
            />
             <ToolFormModal
                isOpen={isToolFormModalOpen}
                onClose={() => setIsToolFormModalOpen(false)}
                onSave={handleSaveTool}
                toolToEdit={toolToEdit}
                currentUser={user}
            />
            <ReceiptModal
                isOpen={!!receiptOrder}
                onClose={() => setReceiptOrder(null)}
                order={receiptOrder}
                vendorName={vendor.name}
                whatsappConfig={vendor.whatsappConfig}
            />
        </div>
    );
};

// Sidebar Component
const Sidebar: React.FC<{
    activeView: AgrodealerView, 
    setActiveView: (view: AgrodealerView) => void, 
    logout: () => void, 
    vendorName: string,
    isOpen: boolean,
    onClose: () => void,
    isCollapsed: boolean
}> = ({ activeView, setActiveView, logout, vendorName, isOpen, onClose, isCollapsed }) => {
    const NavItem: React.FC<{view: AgrodealerView, label: string, icon: React.ReactNode}> = ({ view, label, icon }) => (
        <button
            onClick={() => {
                setActiveView(view);
                if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-lg transition-colors ${
                activeView === view ? 'bg-brand-green text-white shadow-lg' : 'text-gray-300 hover:bg-brand-green-light hover:text-white'
            }`}
            title={isCollapsed ? label : ''}
        >
            {icon}
            {!isCollapsed && <span className="font-semibold ml-3 whitespace-nowrap">{label}</span>}
        </button>
    );

    const Backdrop = () => (
        <div 
            className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        />
    );

    const sidebarClasses = `
        fixed lg:static inset-y-0 left-0 z-50 
        bg-brand-green-dark text-white 
        flex flex-col h-full
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64 w-64'}
    `;

    return (
        <>
            <Backdrop />
            <aside className={sidebarClasses}>
                <div className={`text-center py-4 mb-4 flex flex-col items-center ${isCollapsed ? 'px-2' : 'px-4'}`}>
                     {!isCollapsed ? (
                        <>
                            <h1 className="text-xl font-bold text-white truncate w-full">{vendorName}</h1>
                            <p className="text-sm text-brand-brown-light">Vendor Panel</p>
                        </>
                     ) : (
                        <span className="font-bold text-xl truncate">VP</span>
                     )}
                </div>
                <nav className="flex-grow space-y-2 px-2 overflow-y-auto custom-scrollbar">
                    <NavItem view="overview" label="Dashboard" icon={<DashboardIcon />} />
                    <NavItem view="analytics" label="Analytics" icon={<AnalyticsIcon />} />
                    <NavItem view="products" label="Products" icon={<ProductsIcon />} />
                    <NavItem view="orders" label="Orders" icon={<OrdersIcon />} />
                    <NavItem view="tool_management" label="Tool Management" icon={<ToolIcon />} />
                    <NavItem view="tool_bookings" label="Tool Bookings" icon={<ToolIcon />} />
                    <NavItem view="pos" label="Point of Sale" icon={<POSIcon />} />
                    <NavItem view="business_profile" label="Business Profile" icon={<ProfileIcon />} />
                </nav>
                <div className="mt-auto p-4">
                    <button
                        onClick={logout}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-lg transition-colors text-gray-300 hover:bg-red-500/80 hover:text-white`}
                        title="Logout"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        {!isCollapsed && <span className="font-semibold ml-3 whitespace-nowrap">Logout</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}


const OrderManagement: React.FC<{ vendor: Agrodealer | Agrovet; orders: Order[]; setOrders: (orders: Order[] | ((prev: Order[]) => Order[])) => void; onViewReceipt: (order: Order) => void; }> = ({ vendor, orders, setOrders, onViewReceipt }) => {
    const { users } = useUser();

    const handleDownloadReceipt = (order: Order) => {
        const receiptHtml = `
          <html>
            <head>
              <title>Receipt for Order ${order.id}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @media print {
                  body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                }
              </style>
            </head>
            <body class="font-sans">
              <div class="p-6 text-black max-w-sm mx-auto">
                <div class="text-center">
                  <h2 class="text-xl font-bold">${vendor.name}</h2>
                  <p class="text-sm">Sale Receipt</p>
                  <p class="text-xs mt-2">Date: ${new Date(order.date).toLocaleString()}</p>
                  <p class="text-xs font-mono">Order ID: ${order.id}</p>
                </div>
                <div class="border-t border-dashed border-gray-400 my-4"></div>
                <div class="space-y-2 text-sm">
                  ${order.items.map(item => `
                    <div class="flex justify-between">
                      <div>
                        <p class="font-semibold">${item.product.name}</p>
                        <p class="text-xs text-gray-500">${item.quantity} @ Tsh ${item.product.price.toLocaleString()}</p>
                      </div>
                      <p>Tsh ${(item.product.price * item.quantity).toLocaleString()}</p>
                    </div>
                  `).join('')}
                </div>
                <div class="border-t border-dashed border-gray-400 my-4"></div>
                <div class="space-y-1 font-semibold text-sm">
                  <div class="flex justify-between">
                    <span>Subtotal</span>
                    <span>Tsh ${order.total.toLocaleString()}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Tax</span>
                    <span>Tsh 0</span>
                  </div>
                  <div class="flex justify-between text-lg border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>Tsh ${order.total.toLocaleString()}</span>
                  </div>
                </div>
                <div class="text-center mt-6 text-xs text-gray-500">
                  <p>Thank you for your business!</p>
                </div>
              </div>
            </body>
          </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(receiptHtml);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500); // Wait for styles to apply
        }
    };

    const getStatusBadge = (status: Order['status']) => {
        const colorClasses = {
            Delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            Completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            Shipped: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            Processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClasses[status]}`}>{status}</span>;
    };

     const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'In-Person Sale';

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Manage Orders</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                     <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="text-left py-2 px-3">Order ID</th>
                            <th className="text-left py-2 px-3">Date</th>
                            <th className="text-left py-2 px-3">Customer</th>
                            <th className="text-left py-2 px-3">Total</th>
                            <th className="text-left py-2 px-3">Status</th>
                            <th className="text-left py-2 px-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {orders.map(order => (
                             <tr key={order.id}>
                                <td className="py-3 px-3 font-mono text-xs text-gray-800 dark:text-gray-100">{order.id}</td>
                                <td className="py-3 px-3 text-gray-600 dark:text-gray-300">{new Date(order.date).toLocaleDateString()}</td>
                                <td className="py-3 px-3 text-gray-600 dark:text-gray-300">{getUserName(order.userId)}</td>
                                <td className="py-3 px-3 text-gray-600 dark:text-gray-300">Tsh {order.total.toLocaleString()}</td>
                                <td className="py-3 px-3">{getStatusBadge(order.status)}</td>
                                <td className="py-3 px-3 space-x-3">
                                    <button onClick={() => onViewReceipt(order)} className="text-xs font-semibold text-blue-600 hover:underline">View</button>
                                    <button onClick={() => handleDownloadReceipt(order)} className="text-xs font-semibold text-green-600 hover:underline">Download</button>
                                </td>
                             </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AgrodealerDashboard;