import React from 'react';
import { Order, WhatsAppConfig } from '../types';
import { sendWhatsAppMessage } from '../services/whatsappService';
import { toast } from './ui/sonner';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  vendorName?: string;
  whatsappConfig?: WhatsAppConfig;
}

const ReceiptContent: React.FC<{ order: Order, vendorName?: string }> = ({ order, vendorName }) => {
    const effectiveVendorName = vendorName || 'Mkulima Super App';
    return (
        <div id="receipt-content" className="p-6 text-black">
            <div className="text-center">
                <h2 className="text-xl font-bold">{effectiveVendorName}</h2>
                <p className="text-sm">Sale Receipt</p>
                <p className="text-xs mt-2">Date: {new Date(order.date).toLocaleString()}</p>
                <p className="text-xs font-mono">Order ID: {order.id}</p>
            </div>
            <div className="border-t border-dashed border-gray-400 my-4"></div>
            <div className="space-y-2 text-sm">
                {order.items.map(item => (
                    <div key={item.product.id} className="flex justify-between">
                        <div>
                            <p className="font-semibold">{item.product.name}</p>
                            {!vendorName && (
                                <p className="text-xs text-gray-500">Sold by: {item.product.vendor.name}</p>
                            )}
                            <p className="text-xs text-gray-500">{item.quantity} @ Tsh {item.product.price.toLocaleString()}</p>
                        </div>
                        <p>Tsh {(item.product.price * item.quantity).toLocaleString()}</p>
                    </div>
                ))}
            </div>
            <div className="border-t border-dashed border-gray-400 my-4"></div>
            <div className="space-y-1 font-semibold text-sm">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Tsh {order.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tax</span>
                    <span>Tsh 0</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>Tsh {order.total.toLocaleString()}</span>
                </div>
            </div>
            <div className="text-center mt-6 text-xs text-gray-500">
                <p>Thank you for your business!</p>
            </div>
        </div>
    );
};


const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, order, vendorName, whatsappConfig }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };
  
  const handleSendWhatsApp = async () => {
    const customerPhone = prompt("Please enter the customer's phone number (e.g., 255712345678):");
    if (customerPhone && order && whatsappConfig) {
        // A simple text-based receipt for WhatsApp
        const receiptText = `*Receipt from ${vendorName || 'Mkulima App'}*\n\nOrder ID: ${order.id}\nDate: ${new Date(order.date).toLocaleString()}\n\n*Items:*\n${order.items.map(i => `- ${i.product.name} (x${i.quantity})`).join('\n')}\n\n*Total: Tsh ${order.total.toLocaleString()}*\n\nThank you!`;
        const result = await sendWhatsAppMessage(customerPhone, receiptText, whatsappConfig);
        if (result.success) {
            toast.success('Receipt sent successfully.');
        } else {
            toast.error('Failed to send receipt.');
        }
    }
  };

  const effectiveVendorName = vendorName || 'Mkulima Super App';

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 print:hidden">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-sm w-full max-h-[90vh] flex flex-col">
          <div className="p-6 overflow-y-auto text-gray-800 dark:text-gray-200">
            <div className="text-center">
                <h2 className="text-xl font-bold">{effectiveVendorName}</h2>
                <p className="text-sm">Sale Receipt</p>
                <p className="text-xs mt-2">Date: {new Date(order.date).toLocaleString()}</p>
                <p className="text-xs font-mono">Order ID: {order.id}</p>
            </div>
            <div className="border-t border-dashed my-4 dark:border-gray-600"></div>
            <div className="space-y-2 text-sm">
                {order.items.map(item => (
                <div key={item.product.id} className="flex justify-between">
                    <div>
                    <p className="font-semibold">{item.product.name}</p>
                    {!vendorName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Sold by: {item.product.vendor.name}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.quantity} @ Tsh {item.product.price.toLocaleString()}</p>
                    </div>
                    <p>Tsh {(item.product.price * item.quantity).toLocaleString()}</p>
                </div>
                ))}
            </div>
            <div className="border-t border-dashed my-4 dark:border-gray-600"></div>
            <div className="space-y-1 font-semibold text-sm">
                <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Tsh {order.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                <span>Tax</span>
                <span>Tsh 0</span>
                </div>
                <div className="flex justify-between text-lg border-t dark:border-gray-600 pt-2 mt-2">
                <span>Total</span>
                <span>Tsh {order.total.toLocaleString()}</span>
                </div>
            </div>
            <div className="text-center mt-6 text-xs text-gray-500 dark:text-gray-400">
                <p>Thank you for your business!</p>
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end space-x-3 border-t dark:border-gray-700">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
            {whatsappConfig?.enabled && (
                <button onClick={handleSendWhatsApp} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Send WhatsApp</button>
            )}
            <button onClick={handlePrint} className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-brand-green-dark">Print Receipt</button>
          </div>
        </div>
      </div>
      <style>{`
        @media print {
          body > *:not(#receipt-printable-area) {
            display: none !important;
          }
          #receipt-printable-area {
            display: block !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
        }
      `}</style>
      <div id="receipt-printable-area" className="hidden print:block">
        <ReceiptContent order={order} vendorName={vendorName} />
      </div>
    </>
  );
};

export default ReceiptModal;
