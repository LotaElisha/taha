import React, { useState, useMemo } from 'react';
import { CartItem, Product, Order, WhatsAppConfig } from '../types';
import BarcodeScannerModal from './BarcodeScannerModal';
import ProductIcon from './ProductIcon';
import { toast } from './ui/sonner';

interface PointOfSaleTerminalProps {
    products: Product[];
    setProducts: (p: Product[] | ((prev: Product[]) => Product[])) => void;
    setOrders: (orders: Order[] | ((prev: Order[]) => Order[])) => void;
    whatsappConfig: WhatsAppConfig;
    onSaleComplete: (order: Order) => void;
}

const PointOfSaleTerminal: React.FC<PointOfSaleTerminalProps> = ({ products, setProducts, setOrders, whatsappConfig, onSaleComplete }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const filteredProducts = useMemo(() => {
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.stock > 0);
    }, [products, searchTerm]);

    const addToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.product.id === product.id);
            if (existingItem) {
                if(existingItem.quantity < product.stock) {
                    return prevCart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
                }
                return prevCart;
            }
            return [...prevCart, { product, quantity: 1 }];
        });
    };
    
    const updateQuantity = (productId: string, newQuantity: number) => {
        setCart(prevCart => {
            const itemToUpdate = prevCart.find(item => item.product.id === productId);
            if (itemToUpdate && newQuantity > itemToUpdate.product.stock) {
                newQuantity = itemToUpdate.product.stock;
            }

            if (newQuantity <= 0) {
                return prevCart.filter(item => item.product.id !== productId);
            }
            return prevCart.map(item => item.product.id === productId ? { ...item, quantity: newQuantity } : item);
        });
    };

    const total = useMemo(() => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cart]);

    const handleScanSuccess = (scannedCode: string) => {
        setIsScannerOpen(false); // Close modal immediately
        const product = products.find(p => p.barcode === scannedCode);
        if (product) {
            addToCart(product);
        } else {
            toast.error(`Barcode "${scannedCode}" not found.`);
        }
    };

    const completeSale = () => {
        // 1. Update stock levels
        setProducts(prevProducts => prevProducts.map(p => {
            const cartItem = cart.find(item => item.product.id === p.id);
            if (cartItem) {
                return { ...p, stock: p.stock - cartItem.quantity };
            }
            return p;
        }));

        // 2. Create a new order record
        const newOrder: Order = {
            id: `pos-${Date.now()}`,
            userId: 'pos-sale', // Generic ID for in-person sales
            date: new Date().toISOString(),
            items: cart,
            total: total,
            status: 'Completed',
            channel: 'pos',
        };
        setOrders(prevOrders => [newOrder, ...prevOrders]);

        // 3. Notify parent about completion for receipt generation
        onSaleComplete(newOrder);

        // 4. Clear cart
        setCart([]);
    };

    return (
        <>
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6 h-[calc(100vh-9rem)]">
                {/* Product List Section */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden flex-1 min-h-0 order-1">
                    <div className="flex gap-3 mb-4 flex-shrink-0">
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full py-2.5 pl-10 pr-4 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-green outline-none transition-all"
                            />
                            <svg className="w-5 h-5 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <button 
                            onClick={() => setIsScannerOpen(true)}
                            className="flex-shrink-0 bg-brand-green text-white rounded-lg px-4 py-2 hover:bg-brand-green-dark transition-colors flex items-center gap-2 font-medium shadow-sm"
                            title="Scan Product Barcode"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7v-1a2 2 0 0 1 2 -2h2" /><path d="M4 17v1a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v1" /><path d="M16 20h2a2 2 0 0 0 2 -2v-1" /><path d="M5 11h1v2h-1z" /><path d="M10 11l0 2" /><path d="M14 11h1v2h-1z" /><path d="M19 11l0 2" /></svg>
                            <span className="hidden sm:inline">Scan</span>
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto pr-1">
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                            {filteredProducts.map(p => (
                                <button key={p.id} onClick={() => addToCart(p)} className="group bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-left hover:bg-white dark:hover:bg-gray-600 hover:shadow-md transition-all border border-transparent hover:border-brand-green/20 flex flex-col h-full relative overflow-hidden">
                                    <div className="w-full aspect-[4/3] mb-2 flex items-center justify-center bg-white dark:bg-gray-800 rounded-md overflow-hidden relative">
                                         {p.imageUrl ? (
                                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                         ) : (
                                            <ProductIcon category={p.category} className="w-full h-full p-2 text-gray-300" />
                                         )}
                                         <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 rounded-full">
                                            {p.stock} left
                                         </div>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight mb-1">{p.name}</p>
                                    <p className="text-brand-green font-bold text-sm mt-auto">Tsh {p.price.toLocaleString()}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cart/Sale Section - Fixed height ratio on mobile to ensure visibility */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-0 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden h-[45vh] lg:h-auto lg:flex-1 min-h-0 order-2 relative z-10">
                    {/* Cart Header */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Current Sale</h3>
                        <span className="text-xs font-semibold bg-brand-green/10 text-brand-green-dark px-2 py-1 rounded-full">
                            {cart.reduce((acc, item) => acc + item.quantity, 0)} Items
                        </span>
                    </div>
                    
                    {/* Cart Items List */}
                    <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/20">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 opacity-60">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                <p className="font-medium">Cart is empty</p>
                                <p className="text-xs mt-1">Select products to start sale</p>
                            </div>
                        ) : cart.map(item => (
                            <div key={item.product.id} className="flex items-center bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600">
                                <div className="flex-grow min-w-0 mr-3">
                                    <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{item.product.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">@{item.product.price.toLocaleString()}</p>
                                </div>
                                <div className="flex items-center bg-gray-100 dark:bg-gray-600 rounded-lg h-8">
                                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-8 h-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-l-lg transition-colors">−</button>
                                    <span className="w-8 h-full flex items-center justify-center text-sm font-bold text-gray-800 dark:text-white">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-8 h-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-r-lg transition-colors">+</button>
                                </div>
                                <div className="ml-3 text-right min-w-[4rem]">
                                    <p className="text-sm font-bold text-brand-green dark:text-brand-green-light">{(item.product.price * item.quantity).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Cart Footer (Total + Checkout) */}
                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Total Amount</span>
                            <span className="text-2xl font-extrabold text-gray-900 dark:text-white">Tsh {total.toLocaleString()}</span>
                        </div>
                        <button 
                            onClick={completeSale} 
                            disabled={cart.length === 0} 
                            className="w-full bg-brand-green text-white font-bold py-3.5 rounded-xl hover:bg-brand-green-dark disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98] flex justify-center items-center text-lg"
                        >
                            <span>Complete Sale</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                </div>
            </div>
            <BarcodeScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScanSuccess={handleScanSuccess}
            />
        </>
    );
};

export default PointOfSaleTerminal;
