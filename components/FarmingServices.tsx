import React from 'react';
import { useLanguage } from '../context/LanguageContext';

// Improved Service Icon Component with Background Colors
const ServiceIcon: React.FC<{ service: 'soil' | 'agronomist' | 'scanner' | 'veterinary' | 'logistics' | 'tool_rental' }> = ({ service }) => {
    let icon;
    let bgColor = "bg-brand-green/10";
    let iconColor = "text-brand-green";

    switch (service) {
        case 'soil':
            bgColor = "bg-amber-100 dark:bg-amber-900/30";
            iconColor = "text-amber-600 dark:text-amber-400";
            icon = <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>;
            break;
        case 'agronomist':
            bgColor = "bg-emerald-100 dark:bg-emerald-900/30";
            iconColor = "text-emerald-600 dark:text-emerald-400";
            icon = <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>;
            break;
        case 'scanner':
            bgColor = "bg-blue-100 dark:bg-blue-900/30";
            iconColor = "text-blue-600 dark:text-blue-400";
             icon = <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75zM16.5 19.5h.75v.75h-.75v-.75zM19.5 16.5h.75v.75h-.75v-.75z" />
                </svg>;
            break;
        case 'veterinary':
             bgColor = "bg-red-100 dark:bg-red-900/30";
             iconColor = "text-red-600 dark:text-red-400";
             icon = <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M12 14.25c-2.485 0-4.5-2.015-4.5-4.5s2.015-4.5 4.5-4.5 4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0 2.485-2.015 4.5-4.5 4.5s-4.5-2.015-4.5-4.5S14.015 3.75 16.5 3.75 21 5.765 21 8.25zM3 8.25c0 2.485 2.015 4.5 4.5 4.5S12 10.735 12 8.25 9.985 3.75 7.5 3.75 3 5.765 3 8.25z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25c-1.023 0-1.99.23-2.854.646m14.708 0c-.863-.416-1.831-.646-2.854-.646M12 21a9 9 0 100-18 9 9 0 000 18z" />
                </svg>;
             break;
        case 'logistics':
            bgColor = "bg-purple-100 dark:bg-purple-900/30";
            iconColor = "text-purple-600 dark:text-purple-400";
            icon = <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path d="M9 17a2 2 0 100-4 2 2 0 000 4zM19 17a2 2 0 100-4 2 2 0 000 4z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8a1 1 0 001-1z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h2a1 1 0 001-1V7.134a1 1 0 00-1-1h-2.438a1 1 0 00-.759.34L9 10" />
            </svg>;
            break;
        case 'tool_rental':
            bgColor = "bg-orange-100 dark:bg-orange-900/30";
            iconColor = "text-orange-600 dark:text-orange-400";
            icon = <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83M11.42 15.17l-4.24-4.24a5.25 5.25 0 00-7.42 0L0 10.92l4.24 4.24a5.25 5.25 0 007.18 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15.75L3 21m0 0l-3-3m3 3L6 18m12-6.5l-3-3m3 3l-6-6" />
                </svg>;
            break;
        default:
            return null;
    }
    return (
        <div className={`h-16 w-16 ${bgColor} rounded-2xl flex items-center justify-center shadow-inner`}>
            {icon}
        </div>
    )
};


const ServiceCard: React.FC<{
    icon: 'soil' | 'agronomist' | 'scanner' | 'veterinary' | 'logistics' | 'tool_rental';
    title: string;
    cta: string;
    onButtonClick: () => void;
}> = ({ icon, title, cta, onButtonClick }) => {
    return (
        <div 
            onClick={onButtonClick}
            className="group bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 dark:border-gray-700 cursor-pointer flex flex-col items-center text-center h-full"
        >
            <div className="mb-4 transition-transform group-hover:scale-110 duration-300">
                <ServiceIcon service={icon} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 group-hover:text-brand-green transition-colors">{title}</h3>
            
            <div className="mt-auto flex items-center text-brand-green font-bold text-sm group-hover:translate-x-1 transition-transform">
                {cta}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
            </div>
        </div>
    );
};

interface FarmingServicesProps {
    onScanClick: () => void;
    onBookSoilTest: () => void;
    onBookAgronomist: () => void;
    onBookVeterinary: () => void;
    onBookToolRental: () => void;
}

const FarmingServices: React.FC<FarmingServicesProps> = ({ onScanClick, onBookSoilTest, onBookAgronomist, onBookVeterinary, onBookToolRental }) => {
    const { t } = useLanguage();
    
    return (
        <section id="services" className="py-20 bg-brand-cream dark:bg-gray-900 relative">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12 max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-brand-green-dark dark:text-white tracking-tight">{t('services.title')}</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mt-4">{t('services.subtitle')}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    <ServiceCard
                        icon="scanner"
                        title={t('services.scannerTitle')}
                        cta={t('services.scannerCta')}
                        onButtonClick={onScanClick}
                    />
                    <ServiceCard
                        icon="soil"
                        title={t('services.soilTitle')}
                        cta={t('services.soilCta')}
                        onButtonClick={onBookSoilTest}
                    />
                    <ServiceCard
                        icon="agronomist"
                        title={t('services.agronomistTitle')}
                        cta={t('services.agronomistCta')}
                        onButtonClick={onBookAgronomist}
                    />
                    <ServiceCard
                        icon="veterinary"
                        title={t('services.veterinaryTitle')}
                        cta={t('services.veterinaryCta')}
                        onButtonClick={onBookVeterinary}
                    />
                     <ServiceCard
                        icon="tool_rental"
                        title={t('services.toolRentalTitle')}
                        cta={t('services.toolRentalCta')}
                        onButtonClick={onBookToolRental}
                    />
                </div>
            </div>
        </section>
    );
};

export default FarmingServices;