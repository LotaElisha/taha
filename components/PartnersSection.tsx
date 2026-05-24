import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const partners = [
    { name: 'Ministry of Agriculture', typeEn: 'Government', typeSw: 'Serikali' },
    { name: 'Yara', typeEn: 'Fertilizers', typeSw: 'Mbolea' },
    { name: 'Seed Co', typeEn: 'Seeds', typeSw: 'Mbegu' },
    { name: 'CRDB Bank', typeEn: 'Finance', typeSw: 'Kifedha' },
    { name: 'Sokoine Univ.', typeEn: 'Research', typeSw: 'Utafiti' },
    { name: 'Tigo Pesa', typeEn: 'Payments', typeSw: 'Malipo' },
];

const PartnersSection: React.FC = () => {
  const { locale } = useLanguage();
  const isSw = locale === 'sw';

  return (
    <section className="py-16 bg-gradient-to-b from-bg to-surface-2/40 dark:to-bg/30 border-t border-border/60">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-10 max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 dark:bg-brand-950/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
            {isSw ? "Ushirikiano Wetu" : "Ecosystem partners"}
          </div>
          <h2 className="text-2xl font-black tracking-tight text-fg sm:text-3xl">
            {isSw ? "Wanaushirikiano Wetu wa Kimkakati" : "Our Strategic Partners"}
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            {isSw 
              ? "Tunashirikiana na viongozi wa sekta ili kuwawezesha wakulima kupata zana bora, maarifa na huduma za kifedha." 
              : "Collaborating with industry leaders to empower farmers with the best tools, knowledge, and financial access."}
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 items-stretch">
           {partners.map((partner, index) => (
             <div 
               key={index} 
               className="group flex flex-col items-center justify-center p-5 bg-surface/50 dark:bg-white/[0.02] border border-border/70 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-md hover:border-brand-500/30 dark:hover:border-brand-400/30 hover:-translate-y-1 active:scale-98 transition-all duration-300 text-center relative overflow-hidden"
             >
                {/* Visual ambient accent in back */}
                <div className="absolute inset-0 bg-gradient-to-b from-brand-500/[0.01] to-transparent dark:from-brand-500/[0.02] pointer-events-none" />
                <div className="text-sm font-extrabold text-fg group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {partner.name}
                </div>
                <div className="mt-2.5 inline-flex items-center rounded-full bg-brand-50 dark:bg-brand-950/40 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300 transition-colors group-hover:bg-brand-100 dark:group-hover:bg-brand-950/70">
                    {isSw ? partner.typeSw : partner.typeEn}
                </div>
             </div>
           ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;

