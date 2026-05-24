
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface FinancialServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FinancialServicesModal: React.FC<FinancialServicesModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    serviceType: 'Input Loan',
    amount: '',
    purpose: ''
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      console.log('Financial Service Request Submitted:', formData);
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 3000);
    }, 1500);
  };

  const handleClose = () => {
    setIsSuccess(false);
    setFormData({
        name: '', phone: '', location: '', serviceType: 'Input Loan',
        amount: '', purpose: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <header className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-brand-green-dark dark:text-gray-100">Request Financial Services</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white text-3xl">&times;</button>
        </header>

        {isSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center flex-grow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Application Submitted!</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">A financial partner will review your application and contact you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-grow p-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name-finance" className="input-label">Full Name</label>
                  <input type="text" name="name" id="name-finance" value={formData.name} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label htmlFor="phone-finance" className="input-label">Phone Number</label>
                  <input type="tel" name="phone" id="phone-finance" value={formData.phone} onChange={handleChange} required className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="serviceType-finance" className="input-label">Service Type</label>
                  <select name="serviceType" id="serviceType-finance" value={formData.serviceType} onChange={handleChange} required className="input-field">
                    <option>Input Loan</option>
                    <option>Crop Insurance</option>
                    <option>Equipment Financing</option>
                    <option>Savings Account</option>
                    <option>Other</option>
                  </select>
                </div>
                {(formData.serviceType.toLowerCase().includes('loan') || formData.serviceType.toLowerCase().includes('financing')) && (
                  <div>
                    <label htmlFor="amount-finance" className="input-label">Amount Required (Tsh)</label>
                    <input type="number" name="amount" id="amount-finance" value={formData.amount} onChange={handleChange} required className="input-field" min="0" placeholder="e.g., 500000" />
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="purpose-finance" className="input-label">Purpose of Request</label>
                <textarea name="purpose" id="purpose-finance" value={formData.purpose} onChange={handleChange} rows={4} required className="input-field" placeholder="e.g., To purchase seeds and fertilizer for the upcoming season..."></textarea>
              </div>
            </div>
            <footer className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3 -m-6 mt-6">
              <button type="button" onClick={handleClose} className="btn-secondary-outline">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary disabled:bg-gray-400">
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
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
        .btn-primary { padding: 0.5rem 1.25rem; background-color: #556B2F; color: white; font-weight: bold; border-radius: 0.5rem; transition: background-color 0.2s; }
        .btn-primary:hover { background-color: #2E4628; }
        .btn-secondary-outline { padding: 0.5rem 1.25rem; background-color: white; color: #374151; font-weight: bold; border-radius: 0.5rem; transition: background-color 0.2s; border: 1px solid #D1D5DB; }
        .dark .btn-secondary-outline { background-color: #374151; color: #D1D5DB; border-color: #4B5563; }
        .btn-secondary-outline:hover { background-color: #F3F4F6; }
        .dark .btn-secondary-outline:hover { background-color: #4B5563; }
      `}</style>
    </div>
  );
};

export default FinancialServicesModal;
