
import React from 'react';
import { Product, Agrodealer, Agrovet } from '../types';
import ProductIcon from './ProductIcon';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  onVendorClick: (vendor: Agrodealer | Agrovet) => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onVendorClick, onAddToCart }) => {
  
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card's onClick from firing
    onAddToCart(product, 1);
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-gray-800 rounded-2xl shadow-soft hover:shadow-xl overflow-hidden cursor-pointer transform hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col h-full relative"
    >
      {/* Image Container */}
      <div className="relative h-56 overflow-hidden bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
        ) : (
          <ProductIcon category={product.category} className="w-full h-full transition-transform duration-700 group-hover:scale-110" />
        )}
        
        {/* Floating Category Badge */}
        <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-brand-green-dark dark:text-brand-green-light text-xs font-bold px-3 py-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
            {product.category}
        </div>

        {/* Overlay Gradient on Hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>

        {/* Quick Add Button (visible on group hover) */}
         <button 
          onClick={handleQuickAdd}
          className="absolute bottom-3 right-3 bg-brand-green text-white rounded-full h-12 w-12 flex items-center justify-center shadow-lg transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-brand-green-dark hover:scale-110 z-10"
          aria-label={`Add ${product.name} to cart`}
         >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow relative">
        <div className="mb-2 flex justify-between items-start">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-brand-green transition-colors">
                {product.name}
            </h3>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
            {product.description}
        </p>

        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-end justify-between">
            <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Price</p>
                <p className="text-xl font-extrabold text-brand-green dark:text-brand-green-light">
                    Tsh {product.price.toLocaleString()}
                </p>
            </div>
            
            <div className="flex flex-col items-end">
                 <button
                    onClick={(e) => {
                    e.stopPropagation();
                    onVendorClick(product.vendor);
                    }}
                    className="text-xs font-medium text-gray-500 hover:text-brand-green dark:text-gray-400 dark:hover:text-brand-green-light transition-colors flex items-center gap-1"
                >
                    {product.vendor.name}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
                <div className="flex items-center mt-1 bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded text-xs font-bold text-yellow-700 dark:text-yellow-400">
                    <span>★ {product.vendor.rating.toFixed(1)}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
