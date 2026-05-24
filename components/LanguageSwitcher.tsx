import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface LanguageSwitcherProps {
    isScrolled?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ isScrolled }) => {
    const { locale, changeLanguage, t } = useLanguage();

    const toggleLanguage = () => {
        const newLocale = locale === 'en' ? 'sw' : 'en';
        changeLanguage(newLocale);
    };

    const buttonClasses = isScrolled
        ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 ring-gray-200 dark:ring-gray-700 border-gray-200 dark:border-gray-700'
        : 'text-white hover:bg-white/10 ring-white/30 border-white/20 bg-white/10';

    return (
        <button
            onClick={toggleLanguage}
            className={`transition-all p-1 rounded-full focus:outline-none focus:ring-2 font-bold text-xs w-8 h-8 flex items-center justify-center border ${buttonClasses}`}
            aria-label={t(locale === 'en' ? 'header.switchToSwahili' : 'header.switchToEnglish')}
        >
            {locale.toUpperCase()}
        </button>
    );
};

export default LanguageSwitcher;