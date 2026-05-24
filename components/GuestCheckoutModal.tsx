import React, { useState } from 'react';
import { CartItem, DeliveryOption } from '../types';

interface GuestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceOrder: (details: { name: string; phone: string; address: string }) => void;
  cartItems: CartItem[];
  deliveryOption: DeliveryOption;
}

const GuestCheckoutModal: React.FC<GuestCheckoutModalProps> = ({ isOpen, onClose, onPlaceOrder, cartItems, deliveryOption }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = subtotal + deliveryOption.cost;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAutofill = () => {
    setFormData(prev => ({ ...prev, address: 'Plot 42, Mjini Street, Arusha, Tanzania' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      onPlaceOrder(formData);
      setIsSubmitting(false);
      setIsSuccess(true);
      // Reset form and close modal after a delay
      setTimeout(() => {
        handleClose();
      }, 4000);
    }, 1500);
  };

  const handleClose = () => {
    // Reset state before closing
    setIsSuccess(false);
    setFormData({ name: '', phone: '', address: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <header className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-brand-green-dark dark:text-gray-100">Guest Checkout</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white text-3xl">&times;</button>
        </header>

        {isSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center flex-grow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Order Placed Successfully!</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Thank you for your purchase. You will receive a confirmation message shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-grow p-6 overflow-y-auto">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Please provide your details for delivery.</p>
              <div>
                <label htmlFor="name-guest" className="input-label">Full Name</label>
                <input type="text" name="name" id="name-guest" value={formData.name} onChange={handleChange} required className="input-field" />
              </div>
              <div>
                <label htmlFor="phone-guest" className="input-label">Phone Number</label>
                <input type="tel" name="phone" id="phone-guest" value={formData.phone} onChange={handleChange} required className="input-field" placeholder="e.g., 0712345678"/>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <label htmlFor="address-guest" className="input-label">Delivery Address</label>
                  <button type="button" onClick={handleAutofill} className="text-xs font-semibold text-brand-green-dark dark:text-brand-green-light hover:underline">Autofill Address</button>
                </div>
                <textarea name="address" id="address-guest" value={formData.address} onChange={handleChange} required rows={3} className="input-field" placeholder="Please provide a detailed address or nearest landmark."></textarea>
              </div>

              <div className="border-t dark:border-gray-700 pt-4 mt-4">
                 <div className="flex justify-between items-center text-lg font-bold">
                  <span className="dark:text-gray-100">Order Total:</span>
                  <span className="text-brand-green dark:text-brand-green-light">Tsh {total.toLocaleString()}</span>
                </div>
              </div>

            </div>
            <footer className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3 -m-6 mt-6">
              <button type="button" onClick={handleClose} className="btn-secondary-outline">Cancel</button>
              <button type="submit" disabled={isSubmitting || cartItems.length === 0} className="btn-primary disabled:bg-gray-400">
                {isSubmitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </footer>
          </form>
        )}
      </div>
      <style>{`
        .input-label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; }
        .dark .input-label { color: #D1D5DB; }
        .input-field { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
        .dark .input-field { background-color: #374151; border-color: #4B5563; color: #F9FAFB; }
        .input-field:focus { outline: none; box-shadow: 0 0 0 2px #556B2F; border-color: #556B2F; }
        .btn-primary { padding: 0.5rem 1.25rem; background-color: #556B2F; color: white; font-weight: bold; border-radius: 0.5rem; transition: background-color 0.2s; }
        .btn-primary:hover { background-color: #2E4628; }
        .btn-secondary-outline { padding: 0.5rem 1.25rem; background-color: white; color: #374151; font-weight: bold; border-radius: 0.5rem; transition: background-color 0.2s; border: 1px solid #D1D5DB; }
        .dark .btn-secondary-outline { background-color: #374151; color: #D1D5DB; border-color: #4B5563; }
        .btn-secondary-outline:hover { background-color: #F3F4F6; }
        .dark .btn-secondary-outline:hover { background-color: #4B5563; }
      `}</style>
    </div>
  );
};

export default GuestCheckoutModal;