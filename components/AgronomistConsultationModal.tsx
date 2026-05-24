import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LegacyModalChrome } from './feedback/LegacyModalChrome';
import { useLanguage } from '../context/LanguageContext';

interface AgronomistConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AgronomistConsultationModal: React.FC<AgronomistConsultationModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    consultationType: 'Virtual',
    preferredDate: '',
    preferredTime: '',
    issueDescription: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        location: user.location || ''
      }));
    }
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({...prev, consultationType: e.target.value}));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      console.log('Agronomist Consultation Request Submitted:', formData);
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 3000);
    }, 1500);
  };

  const handleWhatsAppBypass = () => {
    const isSw = locale === 'sw';
    const nameStr = formData.name ? formData.name : (isSw ? 'Mkulima' : 'Farmer');
    const locationStr = formData.location ? formData.location : (isSw ? 'Haijatajwa' : 'Not Specified');
    const issueStr = formData.issueDescription ? formData.issueDescription : (isSw ? 'Haijatajwa' : 'Not Specified');
    
    const message = isSw
      ? `Habari, nahitaji msaada wa haraka wa kitaalamu wa kilimo.\n\n*Jina:* ${nameStr}\n*Mahali:* ${locationStr}\n*Changamoto:* ${issueStr}`
      : `Hi, I need immediate agronomic support.\n\n*Name:* ${nameStr}\n*Location:* ${locationStr}\n*Issue:* ${issueStr}`;
      
    const url = `https://wa.me/255700000000?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleClose = () => {
    setIsSuccess(false);
    setFormData({
        name: '', phone: '', location: '', consultationType: 'Virtual',
        preferredDate: '', preferredTime: '', issueDescription: ''
    });
    onClose();
  };

  return (
    <LegacyModalChrome
      isOpen={isOpen}
      onClose={handleClose}
      title="Book Agronomist Consultation"
      desktopMaxWidthClass="max-w-2xl"
    >
      <div className="p-4">
        {isSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center flex-grow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Booking Request Sent!</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">An agronomist will review your request and contact you soon to confirm the appointment.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-grow p-6 overflow-y-auto">
            <div className="space-y-4">
              {/* WhatsApp Quick Bypass Banner */}
              <div className="bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 p-4.5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm backdrop-blur-md relative overflow-hidden group">
                <div className="space-y-1 z-10 max-w-[70%]">
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <span>⚡</span> {locale === 'sw' ? 'Njia ya Haraka ya WhatsApp' : 'WhatsApp Instant Bypass'}
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    {locale === 'sw' 
                      ? 'Je, unahitaji msaada wa haraka? Ruka fomu na uzungumze moja kwa moja na Mtaalamu wetu wa Kilimo sasa.' 
                      : 'Need immediate help? Skip the form and chat with our verified online Agronomists instantly.'}
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={handleWhatsAppBypass}
                  className="z-10 bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-black px-5 py-3 rounded-xl shadow-[0_4px_14px_rgba(37,211,102,0.3)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.5)] active:scale-[0.97] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.455h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  <span>{locale === 'sw' ? 'Ongea Sasa' : 'Chat Now'}</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name-agronomist" className="input-label">Full Name</label>
                  <input type="text" name="name" id="name-agronomist" value={formData.name} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label htmlFor="phone-agronomist" className="input-label">Phone Number</label>
                  <input type="tel" name="phone" id="phone-agronomist" value={formData.phone} onChange={handleChange} required className="input-field" />
                </div>
              </div>

              <div>
                <label className="input-label">Consultation Type</label>
                <div className="mt-2 flex gap-x-6">
                    <label className="flex items-center space-x-2">
                        <input type="radio" name="consultationType" value="Virtual" checked={formData.consultationType === 'Virtual'} onChange={handleRadioChange} className="form-radio" />
                        <span>Virtual</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input type="radio" name="consultationType" value="Field Visit" checked={formData.consultationType === 'Field Visit'} onChange={handleRadioChange} className="form-radio" />
                        <span>Field Visit</span>
                    </label>
                </div>
              </div>

              {formData.consultationType === 'Field Visit' && (
                <div>
                    <label htmlFor="location-agronomist" className="input-label">Farm Location</label>
                    <input type="text" name="location" id="location-agronomist" value={formData.location} onChange={handleChange} required className="input-field" />
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="preferredDate" className="input-label">Preferred Date</label>
                  <input type="date" name="preferredDate" id="preferredDate" value={formData.preferredDate} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label htmlFor="preferredTime" className="input-label">Preferred Time</label>
                  <input type="time" name="preferredTime" id="preferredTime" value={formData.preferredTime} onChange={handleChange} required className="input-field" />
                </div>
              </div>

              <div>
                <label htmlFor="issueDescription" className="input-label">Briefly describe the issue</label>
                <textarea name="issueDescription" id="issueDescription" value={formData.issueDescription} onChange={handleChange} rows={4} required className="input-field" placeholder="e.g., My maize leaves are turning yellow..."></textarea>
              </div>
            </div>
            <footer className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3 -m-6 mt-6">
              <button type="button" onClick={handleClose} className="btn-secondary-outline">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary disabled:bg-gray-400">
                {isSubmitting ? 'Submitting...' : 'Request Booking'}
              </button>
            </footer>
          </form>
        )}
      </div>
      <style>{`
        .input-label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; }
        .dark .input-label { color: #D1D5DB; }
        .input-field { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
        .dark .input-field { background-color: #374151; border-color: #4B5563; color: #F9FAFB; }
        .input-field:focus { outline: none; box-shadow: 0 0 0 2px #556B2F; border-color: #556B2F; }
        .form-radio { color: #556B2F; } .form-radio:focus { ring-color: #6B8E23; }
        .btn-primary { padding: 0.5rem 1.25rem; background-color: #556B2F; color: white; font-weight: bold; border-radius: 0.5rem; transition: background-color 0.2s; }
        .btn-primary:hover { background-color: #2E4628; }
        .btn-secondary-outline { padding: 0.5rem 1.25rem; background-color: white; color: #374151; font-weight: bold; border-radius: 0.5rem; transition: background-color 0.2s; border: 1px solid #D1D5DB; }
        .dark .btn-secondary-outline { background-color: #374151; color: #D1D5DB; border-color: #4B5563; }
        .btn-secondary-outline:hover { background-color: #F3F4F6; }
        .dark .btn-secondary-outline:hover { background-color: #4B5563; }
      `}</style>
    </LegacyModalChrome>
  );
};

export default AgronomistConsultationModal;
