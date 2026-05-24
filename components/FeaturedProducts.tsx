import React from 'react';
import { Product, Agrodealer, Agrovet } from '../types';
import ProductCard from './ProductCard';

interface FeaturedProductsProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onVendorClick: (vendor: Agrodealer | Agrovet) => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ products, onProductClick, onVendorClick, onAddToCart }) => {
  if (products.length === 0) {
    return null; // Don't render the section if there are no featured products
  }

  return (
    <section className="py-12 bg-white dark:bg-gray-800/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-brand-green-dark dark:text-brand-brown-light">Featured Products</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">Top picks from our trusted vendors.</p>
        </div>
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
      </div>
    </section>
  );
};

export default FeaturedProducts;
