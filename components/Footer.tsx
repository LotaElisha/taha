import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  onBookWarehouseClick: () => void;
  onAccessFinanceClick: () => void;
  onBookLogisticsClick: () => void;
  onOpenApiDocs: () => void;
}

const Footer: React.FC<FooterProps> = ({ 
  onBookWarehouseClick, 
  onAccessFinanceClick, 
  onBookLogisticsClick, 
  onOpenApiDocs 
}) => {
  const { locale, t } = useLanguage();
  const isSw = locale === "sw";

  return (
    <footer className="bg-gradient-to-b from-brand-950 to-emerald-950 text-emerald-100/70 border-t border-white/5 pt-16 pb-24 md:pb-12 mt-auto animate-fade-in">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 lg:gap-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.712,4.417a1,1,0,0,0-.956-.584H14.6V3.75a.75.75,0,0,0-1.5,0v.083H6.9V3.75a.75.75,0,0,0-1.5,0v.083H3.244a1,1,0,0,0-.956.584L.288,10.583a1,1,0,0,0,.956,1.417H2.833V15a1,1,0,0,0,1,1H16.167a1,1,0,0,0,1-1V12h1.589a1,1,0,0,0,.956-1.417ZM15.167,14H4.833V12h10.334Zm1.5-3.5a.5.5,0,0,1-.5.5H3.833a.5.5,0,0,1,0-1h12.334a.5.5,0,0,1,.5.5Z"/>
                </svg>
                Mkulima App
            </h3>
            <p className="text-sm leading-relaxed text-emerald-100/50">
              {isSw 
                ? "Kuwezesha wakulima kupitia teknolojia ya kisasa. Mshirika wako wa ukuaji, tija na ufikiaji wa masoko." 
                : "Empowering farmers with modern technology. Your partner for growth, productivity, and market access."}
            </p>
          </div>
          
          {/* Services */}
          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-widest mb-4">
              {isSw ? "Huduma" : "Services"}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <button 
                  onClick={onBookWarehouseClick} 
                  className="text-left hover:text-emerald-400 hover:translate-x-1 transition-all duration-200"
                >
                  {t('services.warehouseTitle')}
                </button>
              </li>
              <li>
                <button 
                  onClick={onAccessFinanceClick} 
                  className="text-left hover:text-emerald-400 hover:translate-x-1 transition-all duration-200"
                >
                  {t('services.financeTitle')}
                </button>
              </li>
              <li>
                <button 
                  onClick={onBookLogisticsClick} 
                  className="text-left hover:text-emerald-400 hover:translate-x-1 transition-all duration-200"
                >
                  {t('services.logisticsTitle')}
                </button>
              </li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-widest mb-4">
              {isSw ? "Rasilimali" : "Resources"}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a 
                  href="https://www.kilimo.go.tz/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-200"
                >
                  {isSw ? "Wizara ya Kilimo" : "Ministry of Agriculture"}
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-200"
                >
                  {isSw ? "Bei za Masoko" : "Market Prices"}
                </a>
              </li>
              <li>
                <button 
                  onClick={onOpenApiDocs} 
                  className="text-left hover:text-emerald-400 hover:translate-x-1 transition-all duration-200"
                >
                  {isSw ? "Wasanidi / API ya Soko" : "Developers / Market API"}
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
           <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-widest mb-4">
              {isSw ? "Msaada" : "Support"}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a 
                  href="mailto:support@mkulima.app" 
                  className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-200"
                >
                  support@mkulima.app
                </a>
              </li>
              <li>
                <a 
                  href="tel:+255712345678" 
                  className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-200"
                >
                  +255 712 345 678
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-200"
                >
                  {isSw ? "Kituo cha Msaada" : "Help Center"}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom footer */}
        <div className="border-t border-emerald-900/60 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-emerald-100/40 gap-4">
            <p>&copy; {new Date().getFullYear()} Mkulima Super App. {isSw ? "Haki zote zimehifadhiwa." : "All Rights Reserved."}</p>
            <div className="flex space-x-6">
                <a href="#" className="hover:text-emerald-300 transition-colors">
                  {isSw ? "Sera ya Faragha" : "Privacy Policy"}
                </a>
                <a href="#" className="hover:text-emerald-300 transition-colors">
                  {isSw ? "Masharti ya Huduma" : "Terms of Service"}
                </a>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
