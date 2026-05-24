
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getWeatherData } from '../services/weatherService';
import { Weather, CropAdvice } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudRain, 
  MapPin, 
  Smartphone, 
  ChevronRight, 
  Sprout, 
  Wind, 
  Droplets, 
  Thermometer,
  AlertTriangle,
  ArrowRight,
  Search,
  Zap
} from 'lucide-react';

const SmartFarmWidget: React.FC = () => {
    const { location, requestLocation, isRequestingLocation } = useAuth();
    const { locale } = useLanguage();
    const languageName = locale === 'sw' ? 'Swahili' : 'English';
    const [data, setData] = useState<{ weather: Weather, advice: CropAdvice } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (location) {
            setLoading(true);
            getWeatherData(location, languageName).then(setData).finally(() => setLoading(false));
        }
    }, [location, languageName]);

    if (!location) {
        return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-[3rem] text-center max-w-sm shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-green to-brand-green-light opacity-50"></div>
                <div className="w-20 h-20 bg-brand-green/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    <MapPin className="w-10 h-10 text-brand-green-light" />
                </div>
                <h3 className="text-2xl font-black mb-3 text-white">Smart Farming Hub</h3>
                <p className="text-sm text-white/60 mb-8 leading-relaxed">Enable location to unlock hyper-local weather insights and AI crop recommendations.</p>
                <button 
                    onClick={requestLocation}
                    disabled={isRequestingLocation}
                    className="w-full bg-brand-green hover:bg-brand-green-dark text-white py-5 rounded-[1.5rem] font-black text-sm transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(22,163,74,0.3)] active:scale-95 disabled:opacity-50"
                >
                    {isRequestingLocation ? (
                        <>
                            <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
                            Locating...
                        </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Activate AI Insights
                      </>
                    )}
                </button>
            </motion.div>
        );
    }

    if (loading) return (
        <div className="w-full max-w-md h-[450px] bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 flex flex-col items-center justify-center gap-6 relative overflow-hidden">
             <div className="w-20 h-20 bg-white/10 rounded-[2rem] animate-pulse"></div>
             <div className="w-48 h-6 bg-white/10 rounded-full animate-pulse"></div>
             <div className="w-32 h-6 bg-white/10 rounded-full animate-pulse"></div>
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
        </div>
    );

    return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-3xl border border-white/20 p-8 rounded-[3.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.5)] flex flex-col gap-8 w-full max-w-md relative group"
        >
            <div className="absolute -top-4 -right-4 bg-brand-green text-white text-[11px] font-black px-5 py-2.5 rounded-full shadow-2xl rotate-12 group-hover:rotate-0 transition-all duration-500">
              LIVE SATELLITE
            </div>

            <div className="flex justify-between items-start">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-green-light mb-3">Tanzania / Arusha</p>
                    <div className="flex items-center gap-5">
                        <span className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">{data?.weather.temp}°C</span>
                        <span className="text-5xl filter drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">{data?.weather.icon}</span>
                    </div>
                    <p className="text-xl font-bold text-white/90 mt-2">{data?.weather.condition}</p>
                </div>
                {data?.advice.alert && (
                    <motion.div 
                      animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="bg-red-500/20 border border-red-500/40 text-red-500 p-3 rounded-2xl backdrop-blur-md"
                    >
                      <AlertTriangle className="w-6 h-6" />
                    </motion.div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                <p className="text-[11px] text-white/40 uppercase font-black mb-3 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-brand-green-light" /> Humidity
                </p>
                <p className="text-2xl font-black text-white leading-none">{data?.weather.humidity}%</p>
              </div>
              <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                <p className="text-[11px] text-white/40 uppercase font-black mb-3 flex items-center gap-2">
                  <Wind className="w-4 h-4 text-brand-green-light" /> Vector
                </p>
                <p className="text-2xl font-black text-white leading-none">{data?.weather.windSpeed} <span className="text-xs font-bold opacity-40">km/h</span></p>
              </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-green-light">Agri-Forecast</p>
                  <motion.div animate={{ y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <CloudRain className="w-4 h-4 text-white/20" />
                  </motion.div>
                </div>
                <div className="flex gap-4">
                    {data?.weather.forecast.slice(0, 2).map((day, i) => (
                        <div key={i} className="flex-1 bg-white/5 border border-white/10 p-5 rounded-[2rem] flex flex-col items-center text-center hover:bg-white/10 transition-all duration-300">
                            <p className="text-[10px] font-black text-white/30 uppercase mb-3">{day.date}</p>
                            <span className="text-3xl mb-3 drop-shadow-md">{day.icon}</span>
                            <p className="text-lg font-black text-white">{day.temp}°C</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-green-light">AI Recommendations</p>
                  <Sprout className="w-4 h-4 text-brand-green-light/20" />
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {data?.advice.bestCrops.slice(0, 2).map((crop, i) => (
                        <motion.div 
                          key={i} 
                          whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.08)' }}
                          className="bg-white/5 border border-white/10 p-5 rounded-[1.5rem] flex items-center justify-between group cursor-pointer"
                        >
                            <div className="flex-grow">
                              <p className="text-md font-black text-white mb-0.5">{crop.name}</p>
                              <p className="text-[11px] text-white/50 line-clamp-1">{crop.reason}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center group-hover:bg-brand-green transition-all">
                              <ArrowRight className="w-5 h-5 text-brand-green-light group-hover:text-white transition-colors" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

const HeroSection: React.FC = () => {
  const { t } = useLanguage();

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-[900px] lg:h-screen bg-black text-white overflow-hidden flex items-center">
      {/* Dynamic Background */}
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.6 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 bg-cover bg-center grayscale shadow-inner"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop')" }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/80 to-transparent"></div>
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black to-transparent"></div>

      <div className="relative z-10 container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-3 py-2 px-5 rounded-full bg-brand-green/10 border border-brand-green/20 text-brand-green-light text-xs font-black tracking-widest uppercase backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
            #1 East African Agri-Network
            <span className="h-4 w-px bg-white/20 ml-2"></span>
            <div className="flex items-center ml-2 text-white/60">
              <Smartphone className="w-3 h-3 mr-1" />
              Apps live on iOS & Android
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl sm:text-8xl font-black leading-[0.9] tracking-tighter"
          >
            {t('hero.title').split(' ').map((word, i) => (
              <span key={i} className={i === 0 ? 'text-white' : 'text-brand-green block sm:inline'}>
                {word}{' '}
              </span>
            ))}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-xl text-xl text-white/60 font-medium leading-relaxed"
          >
            {t('hero.subtitle')}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <button 
              onClick={() => handleScroll('marketplace')}
              className="group relative w-full sm:w-auto px-10 py-6 bg-brand-green hover:bg-brand-green-dark text-white font-black rounded-2xl text-lg transition-all shadow-[0_20px_50px_rgba(22,163,74,0.4)] flex items-center justify-center overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
              <span className="relative flex items-center">
                {t('hero.cta')}
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button 
              onClick={() => handleScroll('services')}
              className="w-full sm:w-auto px-10 py-6 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl text-lg transition-all backdrop-blur-md border border-white/10 flex items-center justify-center group cursor-pointer"
            >
              Expert Services
              <ArrowRight className="ml-2 w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
            </button>
          </motion.div>

          {/* Social Proof */}
          <div className="flex items-center gap-8 pt-4">
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                  {i === 4 ? '+10k' : <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" />}
                </div>
              ))}
            </div>
            <p className="text-sm text-white/40 font-bold">
              Trusted by <span className="text-white">10,000+</span> farmers across the region
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-20 bg-brand-green/20 blur-[150px] opacity-30 rounded-full"></div>
          <div className="relative z-10 w-full flex justify-center lg:justify-end">
              <SmartFarmWidget />
          </div>
        </div>
      </div>
      
      <style>{`
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
      `}</style>
    </section>
  );
};

export default HeroSection;
