
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { getWeatherData } from '../services/weatherService';
import { Weather } from '../types';

interface HeaderProps {
  onCartClick: () => void;
  cartItemCount: number;
  searchTerm: string;
  onSearchSubmit: (term: string) => void;
  onProfileClick: () => void;
  onLoginClick: () => void;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCartClick, cartItemCount, searchTerm, onSearchSubmit, onProfileClick, onLoginClick, onMenuClick }) => {
  const { user, logout, location } = useAuth();
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState(searchTerm);
  const [isScrolled, setIsScrolled] = useState(false);
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (location) {
        getWeatherData(location).then(data => setWeather(data.weather)).catch(console.error);
    }
  }, [location]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(inputValue);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-500/90 text-white';
      case 'Agrodealer': return 'bg-blue-500/90 text-white';
      case 'Farmer': return 'bg-brand-green text-white';
      default: return 'bg-gray-500 text-white';
    }
  };
  
  const headerClasses = `sticky top-0 z-30 transition-all duration-300 ease-in-out border-b ${
    isScrolled 
    ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm border-gray-200 dark:border-gray-800 py-2' 
    : 'bg-brand-green-dark/95 backdrop-blur-sm shadow-lg border-transparent py-4'
  }`;

  const textClasses = isScrolled ? 'text-gray-800 dark:text-white' : 'text-white';
  const logoClasses = isScrolled ? 'text-brand-green' : 'text-brand-brown-light';
  const searchInputBg = isScrolled 
    ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-brand-green' 
    : 'bg-white/10 text-white placeholder-white/70 focus:bg-white/20 focus:ring-brand-brown-light';
  const searchIconColor = isScrolled ? 'text-gray-400' : 'text-white/70';

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-2 md:gap-4">
            <button 
                onClick={onMenuClick}
                className={`p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors ${isScrolled ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300' : 'hover:bg-white/10 text-white'}`}
                aria-label="Toggle Menu"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>

            <a href="/" className="flex items-center space-x-2 cursor-pointer group">
                <span className={`text-lg md:text-2xl font-bold tracking-tight ${textClasses}`}>Mkulima<span className={`${isScrolled ? 'text-brand-brown' : 'text-brand-brown-light'}`}>App</span></span>
            </a>
        </div>

        {(!user || user.role === 'Farmer') && (
          <div className="flex-1 max-w-md mx-4 hidden lg:block transition-all duration-300">
              <form onSubmit={handleSubmit} className="relative group">
                  <input
                      type="text"
                      placeholder={t('header.searchPlaceholder')}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className={`w-full py-2 pl-10 pr-4 rounded-full outline-none border-transparent focus:border-transparent focus:ring-2 transition-all duration-300 shadow-inner text-sm ${searchInputBg}`}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className={`h-4 w-4 transition-colors ${searchIconColor}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
              </form>
          </div>
        )}

        <div className="flex items-center space-x-2 sm:space-x-4">
          {weather && (
            <div className={`hidden md:flex items-center space-x-1 font-bold text-xs px-2 py-1 rounded-lg ${isScrolled ? 'bg-gray-100 text-gray-700' : 'bg-white/10 text-white'}`}>
                <span>{weather.icon}</span>
                <span>{weather.temp}°C</span>
            </div>
          )}
          
          <div className="hidden sm:flex items-center space-x-2">
             <ThemeToggle isScrolled={isScrolled} />
             <LanguageSwitcher isScrolled={isScrolled} />
          </div>
          
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden md:block leading-tight">
                <button onClick={onProfileClick} className={`block font-semibold hover:underline text-sm ${textClasses}`}>{user.name}</button>
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.role)}`}>{user.role}</span>
              </div>
              <button onClick={logout} className={`p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group ${textClasses}`} aria-label="Logout">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V5.414l7.293 7.293a1 1 0 001.414-1.414L5.414 4H15a1 1 0 100-2H4a1 1 0 00-1 1z" clipRule="evenodd" /></svg>
              </button>
            </div>
          ) : (
             <div className="flex items-center space-x-3">
                <button onClick={onLoginClick} className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2 px-4 sm:px-5 rounded-full transition-all shadow-md text-sm whitespace-nowrap">Join Now</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
