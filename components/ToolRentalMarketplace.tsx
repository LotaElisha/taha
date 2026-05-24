
import React, { useState, useMemo } from 'react';
import { Tool } from '../types';
import ProductIcon from './ProductIcon';

const ToolCard: React.FC<{ tool: Tool; onBookNow: (tool: Tool) => void }> = ({ tool, onBookNow }) => {
    const isAvailable = tool.availability === 'Available';

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col border dark:border-gray-700 ${!isAvailable ? 'opacity-60' : 'transform hover:-translate-y-1 transition-all duration-300 group hover:shadow-2xl'}`}>
            <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {tool.imageUrl ? (
                    <img src={tool.imageUrl} alt={tool.name} className="w-full h-full object-cover" />
                ) : (
                    <ProductIcon category={tool.category} className="w-full h-full" />
                )}
                
                {!isAvailable && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <span className="text-white text-xl font-bold bg-red-500 px-4 py-2 rounded-md transform -rotate-12">{tool.availability}</span>
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-brand-brown-light text-brand-green-dark text-xs font-bold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    {tool.category}
                </div>
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">{tool.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">by {tool.owner.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 flex-grow">{tool.description.substring(0, 100)}...</p>
                <div className="mt-auto flex justify-between items-center">
                    <div>
                        <p className="text-xl font-bold text-brand-green dark:text-brand-green-light">Tsh {tool.dailyRate.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">/ day</p>
                    </div>
                    <button
                        onClick={() => onBookNow(tool)}
                        disabled={!isAvailable}
                        className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Book Now
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ToolRentalMarketplaceProps {
    tools: Tool[];
    onBookNow: (tool: Tool) => void;
}

const ToolRentalMarketplace: React.FC<ToolRentalMarketplaceProps> = ({ tools, onBookNow }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showAvailableOnly, setShowAvailableOnly] = useState(false);
    
    const toolCategories = useMemo(() => ['All', ...Array.from(new Set(tools.map(t => t.category)))], [tools]);

    const filteredTools = useMemo(() => {
        return tools.filter(tool => {
            const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || tool.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
            const matchesAvailability = !showAvailableOnly || tool.availability === 'Available';

            return matchesSearch && matchesCategory && matchesAvailability;
        });
    }, [tools, searchTerm, selectedCategory, showAvailableOnly]);


    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-brand-green-dark dark:text-gray-100 mb-6">Farm Tool Rentals</h1>
            
            {/* Search and Filter Bar */}
            <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label htmlFor="tool-search" className="sr-only">Search Tools</label>
                        <input
                            id="tool-search"
                            type="text"
                            placeholder="Search by tool name..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <div className="flex items-center justify-center md:justify-end">
                        <label htmlFor="available-only" className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200">
                            <input
                                id="available-only"
                                type="checkbox"
                                checked={showAvailableOnly}
                                onChange={e => setShowAvailableOnly(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green-light"
                            />
                            <span>Show available only</span>
                        </label>
                    </div>
                </div>
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                    {toolCategories.map(cat => (
                         <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors whitespace-nowrap border-2 ${
                                selectedCategory === cat
                                ? 'bg-brand-green text-white border-brand-green shadow-sm'
                                : 'bg-white text-brand-green-dark border-gray-200 hover:border-brand-green dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:border-brand-green-light'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {filteredTools.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h2 className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-100">No Tools Found</h2>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTools.map(tool => (
                        <ToolCard key={tool.id} tool={tool} onBookNow={onBookNow} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ToolRentalMarketplace;
