import React, { useState, useMemo, useEffect } from 'react';
import { User, Product, Order, Agrodealer, Agrovet, PaymentGatewayConfig, LogisticsBooking, Tool, ToolBooking, UserRole } from '../types';
import ProductFormModal from '../components/ProductFormModal';
import UserFormModal from '../components/UserFormModal';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import PointOfSaleTerminal from '../components/PointOfSaleTerminal';
import BulkActionBar from '../components/BulkActionBar';
import ReceiptModal from '../components/ReceiptModal';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { toast } from '../components/ui/sonner';

interface AdminDashboardProps {
    products: Product[];
    setProducts: (products: Product[] | ((prev: Product[]) => Product[])) => void;
    orders: Order[];
    setOrders: (orders: Order[] | ((prev: Order[]) => Order[])) => void;
    vendors: (Agrodealer | Agrovet)[];
    paymentGateways: PaymentGatewayConfig[];
    setPaymentGateways: (gateways: PaymentGatewayConfig[]) => void;
    logisticsBookings: LogisticsBooking[];
    setLogisticsBookings: (bookings: LogisticsBooking[] | ((prev: LogisticsBooking[]) => LogisticsBooking[])) => void;
    tools: Tool[];
    setTools: (tools: Tool[] | ((prev: Tool[]) => Tool[])) => void;
    toolBookings: ToolBooking[];
}

type AdminView = 'overview' | 'products' | 'pos' | 'farmers' | 'vendors' | 'analytics' | 'staff';

// ACL Permission Logic
const HAS_PERMISSION = (role: UserRole | undefined, view: AdminView): boolean => {
    if (!role) return false;
    if (role === 'SuperAdmin' || role === 'Admin') return true;
    
    switch (view) {
        case 'overview': return true;
        case 'analytics': return role === 'FinancialAuditor';
        case 'products': return role === 'CatalogManager';
        case 'farmers': 
        case 'vendors': return role === 'KYCOfficer' || role === 'SupportAgent';
        case 'pos': return role === 'SupportAgent';
        case 'staff': return false; // Only SuperAdmin
        default: return false;
    }
};

// Icons
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ProductsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg>;
const POSIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h3m-3 0v-3m0 0h3m-3 0h-3m3 0v-3m0 0h-3m-3 6h12M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const AnalyticsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>;
const StaffIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;

const ProductManagement = (props: {
    products: Product[],
    setProducts: (p: Product[] | ((prev: Product[]) => Product[])) => void,
    onEdit: (p: Product) => void,
    onCreate: () => void,
}) => {
    const { products, setProducts, onEdit, onCreate } = props;
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

    const filteredProducts = useMemo(() =>
        products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase())
        ), [products, searchTerm]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedProductIds(e.target.checked ? filteredProducts.map(p => p.id) : []);
    };

    const handleSelectOne = (productId: string) => {
        setSelectedProductIds(prev =>
            prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
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
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Catalog Management</h2>
                <div className="flex items-center gap-2">
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-auto px-4 py-2 border rounded-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
                    <button onClick={onCreate} className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2 px-4 rounded-full transition-colors">+ Product</button>
                </div>
            </div>
            <BulkActionBar selectedCount={selectedProductIds.length} onExport={() => {}} onDelete={() => {}} />
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="p-3 w-4"><input type="checkbox" onChange={handleSelectAll} checked={selectedProductIds.length > 0 && selectedProductIds.length === filteredProducts.length}/></th>
                            <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-300">Product</th>
                            <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-300">Vendor</th>
                            <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-300">Stock</th>
                            <th className="text-center py-2 px-3 text-gray-600 dark:text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredProducts.map(product => (
                            <tr key={product.id}>
                                <td className="p-3"><input type="checkbox" checked={selectedProductIds.includes(product.id)} onChange={() => handleSelectOne(product.id)} /></td>
                                <td className="py-2 px-3 font-semibold text-gray-800 dark:text-gray-100">{product.name}</td>
                                <td className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">{product.vendor.name}</td>
                                <td className="py-2 px-3 text-right text-gray-700 dark:text-gray-300">{product.stock}</td>
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

const UserManagement = ({ 
    targetRoles, 
    title,
    showRating = false,
    showKyc = false
}: { 
    targetRoles: UserRole[], 
    title: string,
    showRating?: boolean,
    showKyc?: boolean
}) => {
    const { users, deleteUser, updateUser, addUser, bulkDeleteUsers } = useUser();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const filteredUsers = useMemo(() => 
        users.filter(u => 
            targetRoles.includes(u.role) && 
            (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
        ), 
    [users, targetRoles, searchTerm]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedUserIds(e.target.checked ? filteredUsers.map(u => u.id) : []);
    };

    const handleSelectOne = (userId: string) => {
        setSelectedUserIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const handleEdit = (user: User) => { setCurrentUser(user); setIsModalOpen(true); };
    const handleCreate = () => { setCurrentUser(null); setIsModalOpen(true); };

    const handleSave = (userData: User) => {
        currentUser ? updateUser(userData) : addUser(userData);
        setIsModalOpen(false);
    };

    const getKycBadge = (status: string = 'Not Submitted') => {
        const colors: {[key: string]: string} = {
            'Verified': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            'Not Submitted': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status] || colors['Not Submitted']}`}>{status}</span>;
    };

    const getRoleBadge = (role: string) => {
        const colors: {[key: string]: string} = {
            'SuperAdmin': 'bg-red-500 text-white',
            'KYCOfficer': 'bg-blue-500 text-white',
            'CatalogManager': 'bg-emerald-500 text-white',
            'SupportAgent': 'bg-amber-500 text-white',
            'FinancialAuditor': 'bg-indigo-500 text-white',
            'Farmer': 'bg-gray-100 text-gray-800',
        };
        return <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${colors[role] || 'bg-gray-500 text-white'}`}>{role}</span>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
                <div className="flex items-center gap-2">
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-auto px-4 py-2 border rounded-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
                    <button onClick={handleCreate} className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2 px-4 rounded-full transition-colors">+ User</button>
                </div>
            </div>
            <BulkActionBar selectedCount={selectedUserIds.length} onExport={() => {}} onDelete={() => { bulkDeleteUsers(selectedUserIds); setSelectedUserIds([]); }} />
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="p-3 w-4"><input type="checkbox" onChange={handleSelectAll} checked={selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length}/></th>
                            <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-300">Name</th>
                            <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-300">Role</th>
                            {showKyc && <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-300">KYC Status</th>}
                            {showRating && <th className="text-center py-2 px-3 text-gray-600 dark:text-gray-300">Rating</th>}
                            <th className="text-center py-2 px-3 text-gray-600 dark:text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredUsers.map(u => (
                            <tr key={u.id}>
                                <td className="p-3"><input type="checkbox" checked={selectedUserIds.includes(u.id)} onChange={() => handleSelectOne(u.id)} /></td>
                                <td className="py-2 px-3 font-semibold text-gray-800 dark:text-gray-100">{u.name}</td>
                                <td className="py-2 px-3">{getRoleBadge(u.role)}</td>
                                {showKyc && <td className="py-2 px-3">{getKycBadge(u.kycStatus)}</td>}
                                {showRating && <td className="py-2 px-3 text-center text-yellow-500 font-bold">{((u as Agrodealer | Agrovet).rating || 0).toFixed(1)} ★</td>}
                                <td className="py-2 px-3 text-center space-x-2">
                                    <button onClick={() => handleEdit(u)} className="text-blue-600 hover:underline text-sm">Edit</button>
                                    <button onClick={() => {
                                        toast('Delete this user?', {
                                            description: u.name,
                                            action: { label: 'Delete', onClick: () => deleteUser(u.id) },
                                            cancel: { label: 'Cancel', onClick: () => {} },
                                            duration: 8000,
                                        });
                                    }} className="text-red-600 hover:underline text-sm">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <UserFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} userToEdit={currentUser} />
        </div>
    );
};

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
    const { products, setProducts, orders, vendors } = props;
    const { users } = useUser();
    const { user, logout } = useAuth();
    const [activeView, setActiveView] = useState<AdminView>('overview');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Initial permission check for default view
    useEffect(() => {
        if (!HAS_PERMISSION(user?.role, activeView)) {
            setActiveView('overview');
        }
    }, [user?.role, activeView]);

    const handleSaveProduct = (productData: Product) => {
        setProducts(prev => {
            const existing = prev.find(p => p.id === productData.id);
            return existing ? prev.map(p => (p.id === productData.id ? productData : p)) : [productData, ...prev];
        });
        setIsProductModalOpen(false);
    };

    const renderContent = () => {
        switch (activeView) {
            case 'products': return <ProductManagement products={products} setProducts={setProducts} onEdit={(p) => { setProductToEdit(p); setIsProductModalOpen(true); }} onCreate={() => { setProductToEdit(null); setIsProductModalOpen(true); }} />;
            case 'farmers': return <UserManagement targetRoles={['Farmer']} title="Farmer & KYC Verification" showKyc={true} />;
            case 'vendors': return <UserManagement targetRoles={['Agrodealer', 'Agrovet']} title="Vendor Verification" showRating={true} />;
            case 'staff': return <UserManagement targetRoles={['SuperAdmin', 'KYCOfficer', 'CatalogManager', 'SupportAgent', 'FinancialAuditor']} title="Internal Staff Management" />;
            case 'analytics': return <AnalyticsDashboard users={users} products={products} orders={orders} />;
            case 'pos': return <PointOfSaleTerminal products={products} setProducts={props.setProducts} setOrders={props.setOrders} whatsappConfig={{enabled: false, phoneNumber: '', accountId: '', phoneNumberId: '', accessToken: ''}} onSaleComplete={setReceiptOrder} />;
            case 'overview':
            default:
                return (
                    <div className="space-y-8 animate-fade-in">
                        <div className="bg-gradient-to-r from-brand-green-dark to-brand-green p-8 rounded-2xl shadow-lg text-white">
                            <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
                            <p className="mt-2 opacity-90">Role: <span className="font-bold">{user?.role}</span></p>
                            <p className="text-sm mt-4 italic">Assigned permissions: {HAS_PERMISSION(user?.role, 'staff') ? 'Full System Access' : 'Modular Restricted Access'}</p>
                        </div>
                        {HAS_PERMISSION(user?.role, 'analytics') && <AnalyticsDashboard users={users} products={products} orders={orders} />}
                    </div>
                );
        }
    };
    
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans overflow-hidden">
            <Sidebar activeView={activeView} setActiveView={setActiveView} logout={logout} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} isCollapsed={isSidebarCollapsed} role={user?.role} />
            <main className="flex-1 flex flex-col overflow-hidden min-w-0">
                <header className="bg-white dark:bg-gray-800 shadow-sm z-20 p-4 flex items-center">
                    <button onClick={() => { window.innerWidth >= 1024 ? setIsSidebarCollapsed(!isSidebarCollapsed) : setIsSidebarOpen(!isSidebarOpen); }} className="p-2 rounded-md text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 mr-4">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Admin Console</h2>
                </header>
                <div className="flex-1 overflow-x-hidden overflow-y-auto p-8">{renderContent()}</div>
            </main>
            <ProductFormModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSave={handleSaveProduct} productToEdit={productToEdit} vendors={vendors} currentUser={user} />
            <ReceiptModal isOpen={!!receiptOrder} onClose={() => setReceiptOrder(null)} order={receiptOrder} />
        </div>
    );
};

const Sidebar: React.FC<{
    activeView: AdminView, 
    setActiveView: (view: AdminView) => void, 
    logout: () => void,
    isOpen: boolean,
    onClose: () => void,
    isCollapsed: boolean,
    role: UserRole | undefined
}> = ({ activeView, setActiveView, logout, isOpen, onClose, isCollapsed, role }) => {
    
    const NavItem: React.FC<{view: AdminView, label: string, icon: React.ReactNode}> = ({ view, label, icon }) => {
        if (!HAS_PERMISSION(role, view)) return null;
        return (
            <button
                onClick={() => { setActiveView(view); if (window.innerWidth < 1024) onClose(); }}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-lg transition-colors ${activeView === view ? 'bg-brand-green text-white shadow-lg' : 'text-gray-300 hover:bg-brand-green-light hover:text-white'}`}
                title={isCollapsed ? label : ''}
            >
                {icon}
                {!isCollapsed && <span className="font-semibold ml-3 whitespace-nowrap">{label}</span>}
            </button>
        );
    }

    return (
        <>
            <div className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
            <aside className={`fixed lg:static inset-y-0 left-0 z-50 bg-brand-green-dark text-white flex flex-col h-full transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isCollapsed ? 'lg:w-20' : 'lg:w-64 w-64'}`}>
                <div className={`text-center py-4 mb-4 flex items-center justify-center`}>
                     {!isCollapsed ? <h1 className="text-xl font-bold text-white truncate px-2">Mkulima Hub</h1> : <span className="font-bold text-xl">MH</span>}
                </div>
                <nav className="flex-grow space-y-2 px-2 overflow-y-auto">
                    <NavItem view="overview" label="Overview" icon={<DashboardIcon />} />
                    <NavItem view="analytics" label="Financial Reports" icon={<AnalyticsIcon />} />
                    <NavItem view="products" label="Market Catalog" icon={<ProductsIcon />} />
                    <NavItem view="farmers" label="Farmers & KYC" icon={<UsersIcon />} />
                    <NavItem view="vendors" label="Vendors List" icon={<UsersIcon />} />
                    <NavItem view="pos" label="Field POS" icon={<POSIcon />} />
                    <NavItem view="staff" label="Admin Staff" icon={<StaffIcon />} />
                </nav>
                <div className="mt-auto p-4">
                    <button onClick={logout} className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-lg transition-colors text-gray-300 hover:bg-red-500/80 hover:text-white`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        {!isCollapsed && <span className="font-semibold ml-3 whitespace-nowrap">Logout</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default AdminDashboard;