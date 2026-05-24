import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';

type Locale = 'en' | 'sw';

interface LanguageContextType {
  locale: Locale;
  changeLanguage: (locale: Locale) => void;
  t: (key: string, params?: { [key: string]: string }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getNestedTranslation = (obj: any, path: string): string | undefined => {
    return path.split('.').reduce((o, key) => (o && o[key] !== undefined ? o[key] : undefined), obj);
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>(() => {
    const storedLocale = localStorage.getItem('mkulimaLocale') as Locale | null;
    return storedLocale || 'sw';
  });

  const [translations, setTranslations] = useState<{ [key in Locale]?: any }>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    localStorage.setItem('mkulimaLocale', locale);
  }, [locale]);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const [enRes, swRes] = await Promise.all([
          fetch('/locales/en.json'),
          fetch('/locales/sw.json'),
        ]);
        if (!enRes.ok || !swRes.ok) {
          throw new Error('Failed to fetch translation files');
        }
        const enData = await enRes.json();
        const swData = await swRes.json();
        setTranslations({ en: enData, sw: swData });
        setIsLoaded(true);
      } catch (error) {
        console.error("Error loading translation files:", error);
      }
    };
    fetchTranslations();
  }, []); // Fetch only once on component mount

  const changeLanguage = (newLocale: Locale) => {
    setLocale(newLocale);
  };

  const t = useCallback((key: string, params: { [key: string]: string } = {}): string => {
    if (!isLoaded || !translations[locale]) {
      return key; // Return key if translations are not loaded yet
    }

    const languageFile = translations[locale];
    let translation = getNestedTranslation(languageFile, key);

    if (translation === undefined) {
      // Fallback to English if translation is missing in the current language
      const fallbackLanguageFile = translations['en'];
      if (fallbackLanguageFile) {
        translation = getNestedTranslation(fallbackLanguageFile, key);
      }
    }

    if (translation === undefined) {
      console.warn(`Translation key '${key}' not found.`);
      return key;
    }

    // Replace placeholders
    Object.keys(params).forEach(paramKey => {
      const regex = new RegExp(`{${paramKey}}`, 'g');
      translation = translation.replace(regex, params[paramKey]);
    });

    return translation;
  }, [locale, translations, isLoaded]);

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};