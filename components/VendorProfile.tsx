import React from 'react';
import { Agrodealer, Product, Review, Agrovet } from '../types';
import ProductGrid from './ProductGrid';
import ReviewSection from './ReviewSection';
import StarRating from './StarRating';
import { useAuth } from '../context/AuthContext';
import { calculateDistance } from '../services/geolocationService';

interface AgrodealerProfileProps {
  vendor: Agrodealer | Agrovet;
  products: Product[];
  reviews: Review[];
  onAddReview: (reviewData: {
    vendorId: string;
    userName:string;
    rating: number;
    comment: string;
  }) => void;
  onBack: () => void;
  onProductClick: (product: Product) => void;
  onVendorClick: (vendor: Agrodealer | Agrovet) => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

const AgrodealerProfile: React.FC<AgrodealerProfileProps> = ({ vendor, products, reviews, onAddReview, onBack, onProductClick, onVendorClick, onAddToCart }) => {
  const { location: userLocation } = useAuth();

  // Calculate average rating
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = reviews.length > 0 ? totalRating / reviews.length : vendor.rating;

  // Calculate distance
  const distance = React.useMemo(() => {
    if (userLocation && vendor.coords) {
      return calculateDistance(userLocation.lat, userLocation.lon, vendor.coords.lat, vendor.coords.lon);
    }
    return null;
  }, [userLocation, vendor.coords]);
  
  const hasWhatsApp = vendor.whatsappConfig?.enabled && vendor.whatsappConfig.phoneNumber;
  const hasGoogle = vendor.googleBusinessConfig?.enabled && vendor.googleBusinessConfig.placeId;

  return (
    <div className="animate-fade-in container mx-auto px-4 py-8">
      <div className="mb-8">
        <button onClick={onBack} className="flex items-center text-brand-green-dark dark:text-brand-green-light hover:underline mb-4 font-bold">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Marketplace
        </button>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 md:flex gap-8 relative overflow-hidden">
            {/* Trust Badges */}
            <div className="absolute top-4 right-4 flex space-x-2">
                {vendor.kycStatus === 'Verified' && (
                    <div title="Verified by Mkulima" className="bg-brand-green text-white p-1 rounded-full shadow-lg">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                    </div>
                )}
                {hasGoogle && vendor.googleBusinessConfig?.isVerified && (
                     <div title="Verified on Google" className="bg-blue-500 text-white p-1 rounded-full shadow-lg">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/></svg>
                    </div>
                )}
            </div>

            <div className="md:w-1/4 flex flex-col items-center text-center">
                 <img src={vendor.logoUrl || `https://picsum.photos/seed/${vendor.id}_logo/200/200`} alt={`${vendor.name} logo`} className="h-32 w-32 rounded-full object-cover mb-4 border-4 border-white dark:border-gray-700 shadow-2xl ring-4 ring-brand-green/20"/>
                 <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{vendor.name}</h1>
                
                <div className="mt-3 flex flex-col items-center">
                    <div className="flex items-center space-x-1">
                        <StarRating rating={averageRating} readOnly={true} size="sm" />
                        <span className="text-gray-900 dark:text-white font-bold ml-1">{averageRating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{reviews.length} Platform Reviews</p>
                    
                    {hasGoogle && vendor.googleBusinessConfig?.googleRating && (
                         <div className="mt-2 flex flex-col items-center py-2 px-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032 c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10 c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                                <span className="font-black">Google {vendor.googleBusinessConfig.googleRating}</span>
                            </div>
                            <p className="text-[10px] text-blue-500 mt-0.5">{vendor.googleBusinessConfig.reviewCount} Maps Reviews</p>
                         </div>
                    )}
                </div>

                 {distance !== null && (
                    <div className="mt-4 py-1 px-4 bg-brand-brown-light text-brand-green-dark text-xs font-black rounded-full shadow-sm">
                        ~{distance.toFixed(1)} km away
                    </div>
                  )}
            </div>

            <div className="md:w-3/4 mt-6 md:mt-0 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 md:pl-8 pt-6 md:pt-0">
                <h2 className="text-sm font-black text-brand-green dark:text-brand-green-light uppercase tracking-widest mb-2">Our Story</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{vendor.businessDescription || 'No description provided.'}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Contact & Store Info</h3>
                        <div className="space-y-4">
                          <div className="flex items-center group">
                             <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3 group-hover:bg-brand-green group-hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                             </div>
                             <span className={`text-sm font-bold ${!vendor.phone ? "text-gray-400 italic" : "text-gray-700 dark:text-gray-200"}`}>{vendor.phone || 'Not available'}</span>
                          </div>
                          <div className="flex items-center group">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                            </div>
                            <span className={`text-sm font-bold ${!vendor.location ? "text-gray-400 italic" : "text-gray-700 dark:text-gray-200"}`}>{vendor.location || 'Not available'}</span>
                          </div>
                           <div className="flex items-center group">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{vendor.operatingHours || 'Not specified'}</span>
                           </div>
                        </div>
                    </div>
                    <div>
                         <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Specialties</h3>
                         {vendor.specialties && vendor.specialties.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {vendor.specialties.map((spec, i) => (
                                    <span key={i} className="px-3 py-1.5 text-[10px] font-black bg-brand-green/5 text-brand-green-dark dark:text-brand-green-light border border-brand-green/20 rounded-lg uppercase tracking-tight">{spec}</span>
                                ))}
                            </div>
                         ) : <p className="text-sm text-gray-500 dark:text-gray-400 italic">Not specified</p>}
                    </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    {hasWhatsApp && (
                        <a 
                            href={`https://wa.me/${vendor.whatsappConfig!.phoneNumber}?text=${encodeURIComponent(`Hello ${vendor.name}, I found your shop on Mkulima App. I'm interested in your services.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center px-8 py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] font-black text-lg"
                        >
                            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.456l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.267.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                            <span>WhatsApp Shop</span>
                        </a>
                    )}
                    {hasGoogle && (
                         <a 
                            href={vendor.googleBusinessConfig!.businessUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] font-black text-lg"
                        >
                            <svg className="w-6 h-6 mr-3 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                            <span>Get Directions</span>
                        </a>
                    )}
                </div>
            </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center">
        <span className="w-1.5 h-8 bg-brand-green mr-3 rounded-full"></span>
        Store Inventory
      </h2>
      <ProductGrid 
        products={products} 
        onProductClick={onProductClick}
        onVendorClick={onVendorClick}
        onAddToCart={onAddToCart}
      />

      <ReviewSection reviews={reviews} vendorId={vendor.id} onAddReview={onAddReview} />
    </div>
  );
};

export default AgrodealerProfile;