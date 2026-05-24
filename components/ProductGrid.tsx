import React from 'react';
import { Product, Agrodealer, Agrovet } from '../types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onVendorClick: (vendor: Agrodealer | Agrovet) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  isLoading?: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onProductClick, onVendorClick, onAddToCart, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="loader mx-auto"></div>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mt-4">AI Assistant is searching...</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Finding the best products for your query.</p>
        <style>{`
          .loader { 
            border: 5px solid #F5DEB3; /* brand-brown-light */
            border-top: 5px solid #556B2F; /* brand-green */
            border-radius: 50%; 
            width: 50px; 
            height: 50px; 
            animation: spin 1s linear infinite; 
          }
          @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
          }
        `}</style>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">No Products Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your search or filter criteria. The AI may not have found a match.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard 
            key={product.id} 
            product={product} 
            onClick={() => onProductClick(product)}
            onVendorClick={onVendorClick}
            onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
};

export default ProductGrid;