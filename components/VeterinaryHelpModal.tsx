import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LegacyModalChrome } from './feedback/LegacyModalChrome';

interface VeterinaryHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VeterinaryHelpModal: React.FC<VeterinaryHelpModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    serviceType: 'General Checkup',
    animalType: '',
    animalCount: '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      console.log('Veterinary Help Request Submitted:', formData);
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
        name: '', phone: '', location: '', serviceType: 'General Checkup',
        animalType: '', animalCount: '', issueDescription: ''
    });
    onClose();
  };

  return (
    <LegacyModalChrome
      isOpen={isOpen}
      onClose={handleClose}
      title="Request Veterinary Help"
      desktopMaxWidthClass="max-w-2xl"
    >
      <div className="p-4">
        {isSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center flex-grow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Request Sent!</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">An agrovet will review your request and contact you soon to confirm the details.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-grow p-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name-vet" className="input-label">Full Name</label>
                  <input type="text" name="name" id="name-vet" value={formData.name} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label htmlFor="phone-vet" className="input-label">Phone Number</label>
                  <input type="tel" name="phone" id="phone-vet" value={formData.phone} onChange={handleChange} required className="input-field" />
                </div>
              </div>
              
              <div>
                <label htmlFor="location-vet" className="input-label">Farm Location</label>
                <input type="text" name="location" id="location-vet" value={formData.location} onChange={handleChange} required className="input-field" />
              </div>
              
              <div>
                <label htmlFor="serviceType" className="input-label">Service Type</label>
                <select name="serviceType" id="serviceType" value={formData.serviceType} onChange={handleChange} required className="input-field">
                    <option>General Checkup</option>
                    <option>Vaccination</option>
                    <option>Deworming</option>
                    <option>Emergency</option>
                    <option>Nutrition Advice</option>
                    <option>Other</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="animalType" className="input-label">Animal Type</label>
                  <input type="text" name="animalType" id="animalType" value={formData.animalType} onChange={handleChange} required className="input-field" placeholder="e.g., Cattle, Poultry" />
                </div>
                <div>
                  <label htmlFor="animalCount" className="input-label">Number of Animals</label>
                  <input type="number" name="animalCount" id="animalCount" value={formData.animalCount} onChange={handleChange} required className="input-field" min="1" />
                </div>
              </div>

              <div>
                <label htmlFor="issueDescription" className="input-label">Briefly describe the issue</label>
                <textarea name="issueDescription" id="issueDescription" value={formData.issueDescription} onChange={handleChange} rows={3} required className="input-field" placeholder="e.g., One of my cows is not eating..."></textarea>
              </div>
            </div>
            <footer className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3 -m-6 mt-6">
              <button type="button" onClick={handleClose} className="btn-secondary-outline">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary disabled:bg-gray-400">
                {isSubmitting ? 'Submitting...' : 'Request Help'}
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
    </LegacyModalChrome>
  );
};

export default VeterinaryHelpModal;