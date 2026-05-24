
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Order, Weather, CropAdvice } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getWeatherData } from '../services/weatherService';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; colorClass: string }> = ({ title, value, icon, colorClass }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4 hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-full ${colorClass}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
);

const SmartFarmingHub: React.FC<{ coords: { lat: number; lon: number } | undefined }> = ({ coords }) => {
    const [data, setData] = useState<{ weather: Weather, advice: CropAdvice } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        if (!coords) return;
        const fetch = async () => {
            setIsLoading(true);
            try {
                const res = await getWeatherData(coords);
                setData(res);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, [coords]);

    if (!coords) return (
        <div className="bg-brand-green/5 border border-brand-green/20 p-8 rounded-3xl text-center flex flex-col items-center">
            <div className="bg-brand-green/10 p-4 rounded-full mb-4">
                 <svg className="w-8 h-8 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <p className="text-brand-green-dark dark:text-brand-green-light font-bold">Enable location or add a farm to see hyper-local agricultural weather and crop advice.</p>
        </div>
    );

    if (isLoading) return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl animate-pulse flex flex-col items-center justify-center space-y-4 h-64 border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="w-48 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <p className="text-xs text-gray-400">AI Agronomist is analyzing real-time weather for your location...</p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Local Forecast Card */}
            <div className="lg:col-span-1 bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 opacity-10 transition-transform duration-700 group-hover:scale-125">
                    <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zm-12.37 12.37c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>
                </div>
                <div className="relative z-10 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">Current Weather</p>
                            <h4 className="text-3xl font-black">{data?.weather.temp}°C</h4>
                        </div>
                        <div className="text-5xl drop-shadow-md">{data?.weather.icon}</div>
                    </div>
                    
                    <div className="mb-6">
                        <p className="font-bold text-lg leading-tight mb-1">{data?.weather.condition}</p>
                        <p className="text-blue-100 text-xs font-medium opacity-80">Humidity: {data?.weather.humidity}% • Wind: {data?.weather.windSpeed} km/h</p>
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/20 grid grid-cols-3 gap-2">
                        {data?.weather.forecast.slice(0, 3).map((day, i) => (
                            <div key={i} className="text-center group-hover:translate-y-[-2px] transition-transform">
                                <p className="text-[10px] font-bold text-blue-100 uppercase">{day.date}</p>
                                <p className="text-xl my-1">{day.icon}</p>
                                <p className="text-sm font-black">{day.temp}°</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Smart Advice Card */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col group">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                             <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></div>
                             <p className="text-brand-green font-black text-[10px] uppercase tracking-widest">AI Hub Analysis</p>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">Smart Crop Recommendations</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Best crops for your local season and current weather outlook</p>
                    </div>
                    {data?.advice.alert && (
                         <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-xl text-[10px] font-black animate-bounce flex items-center border border-red-100">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                            {data.advice.alert}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {data?.advice.bestCrops.map((crop, i) => (
                        <div key={i} className="bg-brand-green/5 dark:bg-brand-green/10 border border-brand-green/20 p-4 rounded-2xl hover:bg-brand-green hover:border-brand-green transition-all duration-300 group/item cursor-default">
                            <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover/item:scale-110 transition-transform">
                                <span className="text-xl">🌱</span>
                            </div>
                            <h4 className="font-black text-brand-green-dark dark:text-brand-green-light group-hover/item:text-white mb-1">{crop.name}</h4>
                            <p className="text-[10px] text-gray-600 dark:text-gray-400 group-hover/item:text-white/80 line-clamp-2 leading-relaxed">{crop.reason}</p>
                            <div className="mt-3 text-[9px] bg-brand-green/10 dark:bg-black/20 p-2 rounded-lg border border-brand-green/10 group-hover/item:bg-white/20 group-hover/item:border-transparent">
                                <span className="font-black text-brand-green-dark dark:text-brand-green-light group-hover/item:text-white uppercase tracking-tighter mr-1">Pro Tip:</span>
                                <span className="text-gray-700 dark:text-gray-300 group-hover/item:text-white/90">{crop.plantingTip}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto pt-4 border-t dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Soil Preparation Advice</p>
                        <p className="text-sm text-gray-700 dark:text-gray-200 italic font-medium leading-relaxed">"{data?.advice.soilPreparation}"</p>
                    </div>
                    {data?.advice.sources && data.advice.sources.length > 0 && (
                        <div className="flex gap-2">
                             {data.advice.sources.slice(0, 2).map((src, i) => (
                                <a key={i} href={src.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-green hover:underline font-bold flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                    Source {i+1}
                                </a>
                             ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface FarmerDashboardOverviewProps {
    orders: Order[];
    onNavigate: (view: 'marketplace' | 'my_farm' | 'logistics' | 'tool_rentals' | 'my_tool_bookings' | 'order_history' | 'profile_settings') => void;
    onOpenModal: (modal: 'scanner' | 'soil_test' | 'agronomist' | 'veterinary') => void;
}

const FarmerDashboardOverview: React.FC<FarmerDashboardOverviewProps> = ({ orders, onNavigate, onOpenModal }) => {
    const { user, location } = useAuth();
    const { t } = useLanguage();

    const userOrders = user ? orders.filter(o => o.userId === user.id && o.channel !== 'pos') : [];
    const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrdersCount = userOrders.length;
    
    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="animate-fade-in-left">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Farmer's Command Center</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-brand-green mr-2"></span>
                        Status: Active • Welcome back, {user?.name}
                    </p>
                </div>
                <div className="mt-4 md:mt-0 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </div>

            <SmartFarmingHub coords={location || undefined} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Orders" 
                    value={totalOrdersCount} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
                    colorClass="bg-blue-100 dark:bg-blue-900/30"
                />
                <StatCard 
                    title="Total Invested" 
                    value={`Tsh ${totalSpent.toLocaleString()}`} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
                    colorClass="bg-green-100 dark:bg-green-900/30"
                />
                <StatCard 
                    title="Farms Managed" 
                    value={user?.farms?.length || 0} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h1a2 2 0 002-2v-1a2 2 0 012-2h1.945M7 11l5-5 5 5m-5-5v12" /></svg>} 
                    colorClass="bg-brand-brown/20"
                />
            </div>

            <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center">
                    <span className="w-1.5 h-6 bg-brand-green mr-3 rounded-full"></span>
                    Quick Farm Operations
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    <QuickActionButton title={t('services.scannerTitle')} onClick={() => onOpenModal('scanner')} icon="📷" color="blue" />
                    <QuickActionButton title={t('services.soilTitle')} onClick={() => onOpenModal('soil_test')} icon="🌱" color="amber" />
                    <QuickActionButton title={t('services.agronomistTitle')} onClick={() => onOpenModal('agronomist')} icon="👨‍🌾" color="emerald" />
                    <QuickActionButton title={t('services.veterinaryTitle')} onClick={() => onOpenModal('veterinary')} icon="🐄" color="red" />
                    <QuickActionButton title={t('services.logisticsTitle')} onClick={() => onNavigate('logistics')} icon="🚛" color="purple" />
                </div>
            </div>
        </div>
    );
};

const QuickActionButton: React.FC<{title: string, onClick: () => void, icon: string, color: string}> = ({ title, onClick, icon, color }) => {
    const colors: {[key: string]: string} = {
        blue: "group-hover:text-blue-600 group-hover:border-blue-200",
        amber: "group-hover:text-amber-600 group-hover:border-amber-200",
        emerald: "group-hover:text-emerald-600 group-hover:border-emerald-200",
        red: "group-hover:text-red-600 group-hover:border-red-200",
        purple: "group-hover:text-purple-600 group-hover:border-purple-200",
    };
    
    return (
        <button onClick={onClick} className={`flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 group h-full hover:-translate-y-1 ${colors[color] || 'hover:border-brand-green'}`}>
            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform drop-shadow-sm">{icon}</span>
            <p className="font-black text-xs text-gray-700 dark:text-gray-200 text-center uppercase tracking-tighter leading-tight group-hover:text-inherit">{title}</p>
        </button>
    );
};

export default FarmerDashboardOverview;
