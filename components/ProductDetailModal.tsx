import React, { useState } from 'react';
import { Product, Agrodealer, Agrovet } from '../types';
import ProductIcon from './ProductIcon';
import { useLanguage } from '../context/LanguageContext';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onVendorClick: (vendor: Agrodealer | Agrovet) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose, onAddToCart, onVendorClick }) => {
  const { locale } = useLanguage();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCartClick = () => {
    onAddToCart(product, quantity);
    onClose();
  };

  const handleVendorClick = () => {
    onVendorClick(product.vendor);
    onClose();
  };
  
  const hasWhatsApp = product.vendor.whatsappConfig?.enabled && product.vendor.whatsappConfig.phoneNumber;

  const whatsappMessage = locale === 'sw'
    ? `Habari ${product.vendor.name}, ninapenda kununua bidhaa yako ya "${product.name}" (${product.category}) kwa gharama ya TZS ${product.price.toLocaleString()} iliyoorodheshwa kwenye Programu ya Mkulima. Je, inapatikana kwa sasa?`
    : `Hi ${product.vendor.name}, I'm interested in buying your product "${product.name}" (${product.category}) priced at TZS ${product.price.toLocaleString()} listed on Mkulima App. Do you have it in stock?`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="md:w-1/2 bg-gray-50 dark:bg-gray-700 flex items-center justify-center p-8">
            {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-auto max-h-full object-contain rounded-xl shadow-md" />
            ) : (
                <ProductIcon category={product.category} className="w-2/3 h-auto" />
            )}
        </div>
        <div className="md:w-1/2 p-8 flex flex-col overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{product.name}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          
          <div className="mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest bg-brand-green/10 text-brand-green-dark dark:text-brand-green-light px-3 py-1.5 rounded-lg border border-brand-green/20">{product.category}</span>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">{product.description}</p>
          
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-black mb-2">Sold By</p>
            <div className="flex items-center justify-between">
                <button 
                  onClick={handleVendorClick}
                  className="font-black text-gray-900 dark:text-white hover:text-brand-green transition-colors text-lg"
                >
                  {product.vendor.name}
                </button>
                <div className="flex items-center bg-white dark:bg-gray-800 px-2 py-1 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <svg className="h-4 w-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="ml-1 text-xs font-bold">{product.vendor.rating}</span>
                </div>
            </div>
          </div>
          
          <div className="flex items-end justify-between mb-8">
            <div>
                 <p className="text-xs text-gray-400 uppercase tracking-widest font-black mb-1">Unit Price</p>
                 <p className="text-3xl font-black text-brand-green dark:text-brand-green-light">Tsh {product.price.toLocaleString()}</p>
            </div>
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 p-1.5 rounded-xl">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold hover:shadow-md transition-shadow">-</button>
                <span className="w-8 text-center font-black dark:text-white">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold hover:shadow-md transition-shadow">+</button>
            </div>
          </div>
          
          <div className="space-y-3 mt-auto">
              <button 
                onClick={handleAddToCartClick}
                className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-black py-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center space-x-2 text-lg"
              >
                 <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                 </svg>
                 <span>Add to Cart</span>
              </button>
              
              {hasWhatsApp && (
                <a
                    href={`https://wa.me/${product.vendor.whatsappConfig!.phoneNumber.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black py-4 rounded-2xl shadow-[0_4px_14px_rgba(37,211,102,0.3)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.5)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center space-x-2 border border-[#34D399]/20"
                >
                    <svg className="w-5 h-5 fill-current animate-pulse" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.455h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    <span>{locale === 'sw' ? 'Uliza kwenye WhatsApp' : 'Enquire on WhatsApp'}</span>
                </a>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;