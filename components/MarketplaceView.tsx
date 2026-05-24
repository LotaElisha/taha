import React, { useMemo } from 'react';
import { Product, Agrodealer, Agrovet } from '../types';
import ProductGrid from './ProductGrid';
import { useLanguage } from '../context/LanguageContext';

interface MarketplaceViewProps {
    products: Product[];
    searchTerm: string;
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    isAiSearching: boolean;
    aiFilteredProductIds: string[] | null;
    onProductClick: (product: Product) => void;
    onVendorClick: (vendor: Agrodealer | Agrovet) => void;
    onAddToCart: (product: Product, quantity: number) => void;
}

const MarketplaceView: React.FC<MarketplaceViewProps> = (props) => {
    const { t } = useLanguage();
    const categoryKeys = useMemo(() => ['All', 'Seeds', 'Fertilizers', 'Pesticides', 'Tools', 'Animal Medicine', 'Agrovet Services'], []);
    
    const filteredProducts = useMemo(() => {
        let baseProducts = props.products;

        if (!props.searchTerm.trim()) {
            // No search query, show all products
        } else if (props.aiFilteredProductIds !== null) {
            // An AI search has completed, use its results
            const productMap = new Map(props.products.map(p => [p.id, p]));
            baseProducts = props.aiFilteredProductIds
                .map(id => productMap.get(id))
                .filter((p): p is Product => p !== undefined);
        } else {
            // A search is in progress, so show an empty list while loading
            return [];
        }
        
        return baseProducts.filter(product =>
            props.selectedCategory === 'All' || product.category === props.selectedCategory
        );
    }, [props.products, props.searchTerm, props.selectedCategory, props.aiFilteredProductIds]);

    return (
        <section id="marketplace" className="animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-brand-green-dark dark:text-brand-brown-light">Marketplace</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">Find all your essential agricultural inputs from trusted vendors.</p>
            </div>

            <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-8 overflow-x-auto pb-2">
            {categoryKeys.map(key => (
                <button
                key={key}
                onClick={() => props.setSelectedCategory(key)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap border-2 ${
                    props.selectedCategory === key
                    ? 'bg-brand-green text-white border-brand-green shadow-md scale-105'
                    : 'bg-white text-brand-green-dark border-gray-200 hover:border-brand-green hover:bg-brand-brown-light/50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:border-brand-green-light'
                }`}
                >
                {t(`categories.${key.toLowerCase().replace(/ /g, '')}`)}
                </button>
            ))}
            </div>

            <ProductGrid 
                products={filteredProducts} 
                onProductClick={props.onProductClick} 
                onVendorClick={props.onVendorClick}
                onAddToCart={props.onAddToCart}
                isLoading={props.isAiSearching}
            />
        </section>
    );
};

export default MarketplaceView;
