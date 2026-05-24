

import React from 'react';
import { CartItem, DeliveryOption, PaymentMethod } from '../types';
import ProductIcon from './ProductIcon';
import { useLanguage } from '../context/LanguageContext';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
  deliveryOptions: DeliveryOption[];
  selectedDeliveryOption: DeliveryOption;
  onSelectDeliveryOption: (option: DeliveryOption) => void;
  paymentMethods: PaymentMethod[];
  selectedPaymentMethod: PaymentMethod;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
  onCheckout: () => void;
}

const PaymentIcon: React.FC<{ method: PaymentMethod['id'], className?: string }> = ({ method, className="h-6 w-6" }) => {
    switch (method) {
        case 'mpesa':
            return (
                <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 4H7C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V6C19 4.89543 18.1046 4 17 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 16V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            );
        case 'card':
            return (
                 <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 15H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            );
        case 'cod':
            return (
                <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 9V5C17 3.89543 16.1046 3 15 3H8C6.89543 3 6 3.89543 6 5V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 9H20L21 14H3L4 9H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 14H21V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            );
        default:
            return null;
    }
};

const CartSidebar: React.FC<CartSidebarProps> = ({ 
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
  onCheckout
}) => {
  const { t } = useLanguage();
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryCost = cartItems.length > 0 ? selectedDeliveryOption.cost : 0;
  const total = subtotal + deliveryCost;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold text-brand-green-dark dark:text-white">{t('cart.title')}</h2>
            <button onClick={onClose} className="text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {cartItems.length === 0 ? (
            <div className="flex-grow flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">{t('cart.empty')}</p>
            </div>
          ) : (
            <div className="flex-grow overflow-y-auto">
              <div className="p-4">
                {cartItems.map(item => (
                  <div key={item.product.id} className="flex items-center space-x-4 mb-4">
                    <ProductIcon category={item.product.category} className="w-20 h-20 rounded-md flex-shrink-0" />
                    <div className="flex-grow">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">{item.product.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Tsh {item.product.price.toLocaleString()}</p>
                      <div className="flex items-center mt-2">
                        <button onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)} className="px-2 py-1 border dark:border-gray-600 dark:text-gray-200 rounded">-</button>
                        <span className="px-4 dark:text-gray-200">{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)} className="px-2 py-1 border dark:border-gray-600 dark:text-gray-200 rounded">+</button>
                      </div>
                    </div>
                    <button onClick={() => onRemoveItem(item.product.id)} className="text-red-500 hover:text-red-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">{t('cart.deliveryOptions')}</h3>
                <div className="space-y-3">
                  {deliveryOptions.map(option => (
                    <label key={option.id} className={`flex items-center p-3 border dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedDeliveryOption.id === option.id ? 'border-brand-green dark:border-brand-green-light ring-2 ring-brand-green/50' : ''}`}>
                      <input 
                        type="radio" 
                        name="deliveryOption" 
                        value={option.id}
                        checked={selectedDeliveryOption.id === option.id}
                        onChange={() => onSelectDeliveryOption(option)}
                        className="h-4 w-4 text-brand-green focus:ring-brand-green-light"
                      />
                      <div className="ml-3 flex-grow">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{option.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{option.eta}</p>
                      </div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">Tsh {option.cost.toLocaleString()}</p>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">{t('cart.paymentMethod')}</h3>
                <div className="space-y-3">
                    {paymentMethods.map(method => (
                        <label key={method.id} className={`flex items-center p-3 border dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedPaymentMethod.id === method.id ? 'border-brand-green dark:border-brand-green-light ring-2 ring-brand-green/50' : ''}`}>
                             <input 
                                type="radio" 
                                name="paymentMethod" 
                                value={method.id}
                                checked={selectedPaymentMethod.id === method.id}
                                onChange={() => onSelectPaymentMethod(method)}
                                className="h-4 w-4 text-brand-green focus:ring-brand-green-light"
                            />
                            <div className="ml-3 flex-grow flex items-center space-x-3">
                                <PaymentIcon method={method.id} className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{method.name}</p>
                            </div>
                        </label>
                    ))}
                </div>
              </div>

            </div>
          )}

          <div className="p-4 border-t dark:border-gray-700">
            <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-md text-gray-600 dark:text-gray-300">{t('cart.subtotal')}</span>
                  <span className="text-md font-semibold text-gray-800 dark:text-gray-100">Tsh {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-md text-gray-600 dark:text-gray-300">{t('cart.deliveryFee')}</span>
                  <span className="text-md font-semibold text-gray-800 dark:text-gray-100">Tsh {deliveryCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t dark:border-gray-600 pt-2 mt-2">
                  <span className="dark:text-gray-100">{t('cart.total')}</span>
                  <span className="text-brand-green dark:text-brand-green-light">Tsh {total.toLocaleString()}</span>
                </div>
            </div>
            <button
              onClick={onCheckout}
              disabled={cartItems.length === 0}
              className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {t('cart.checkout')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartSidebar;