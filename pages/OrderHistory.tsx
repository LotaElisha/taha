import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import ProductIcon from '../components/ProductIcon';

interface OrderHistoryProps {
    orders: Order[];
    onViewReceipt: (order: Order) => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, onViewReceipt }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const userOrders = user ? orders.filter(order => order.userId === user.id && order.channel !== 'pos') : [];
  
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return userOrders;

    return userOrders.filter(order => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        const hasMatchingProduct = order.items.some(item =>
            item.product.name.toLowerCase().includes(lowercasedSearchTerm)
        );
        return (
            order.id.toLowerCase().includes(lowercasedSearchTerm) ||
            hasMatchingProduct
        );
    });
  }, [userOrders, searchTerm]);


  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Delivered':
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-brand-green-dark dark:text-gray-100">Your Order History</h1>
        {userOrders.length > 0 && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Order ID or Product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-auto py-2 pl-10 pr-4 border dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
        )}
      </div>

      {userOrders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-100">No Orders Found</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">You haven't placed any orders yet. Start shopping to see them here!</p>
        </div>
      ) : filteredOrders.length === 0 ? (
         <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h2 className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-100">No Orders Match Your Search</h2>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Try a different search term to find what you're looking for.</p>
        </div>
      ) : (
        <div className="space-y-6">
            {filteredOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(order => (
                <div key={order.id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="font-semibold text-gray-600 dark:text-gray-300">ORDER PLACED</p>
                            <p className="text-gray-800 dark:text-gray-100">{new Date(order.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-600 dark:text-gray-300">TOTAL</p>
                            <p className="text-gray-800 dark:text-gray-100">Tsh {order.total.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-600 dark:text-gray-300">STATUS</p>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                        <div className="col-span-2 sm:col-span-1 text-left sm:text-right">
                            <p className="font-semibold text-gray-600 dark:text-gray-300">ORDER #</p>
                            <p className="text-gray-500 dark:text-gray-400 font-mono text-xs">{order.id}</p>
                            <button onClick={() => onViewReceipt(order)} className="text-xs font-semibold text-blue-600 hover:underline mt-1">View Receipt</button>
                        </div>
                    </div>
                    <div className="p-4">
                    {order.items.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4 py-3 border-b dark:border-gray-700 last:border-0">
                            <ProductIcon category={item.product.category} className="w-16 h-16 rounded-md flex-shrink-0" />
                            <div className="flex-grow">
                                <p className="font-semibold text-gray-800 dark:text-gray-100">{item.product.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-brand-green dark:text-brand-green-light">Tsh {(item.product.price * item.quantity).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
