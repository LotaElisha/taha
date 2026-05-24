import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LegacyModalChrome } from './feedback/LegacyModalChrome';

interface WarehouseBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WarehouseBookingModal: React.FC<WarehouseBookingModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cropType: '',
    quantity: '',
    startDate: '',
    duration: '',
    preferredLocation: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        preferredLocation: user.location || ''
      }));
    }
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      console.log('Warehouse Booking Request Submitted:', formData);
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
        name: '', phone: '', cropType: '', quantity: '',
        startDate: '', duration: '', preferredLocation: ''
    });
    onClose();
  };

  return (
    <LegacyModalChrome
      isOpen={isOpen}
      onClose={handleClose}
      title="Book Warehouse Storage"
      desktopMaxWidthClass="max-w-2xl"
    >
      <div className="p-4">
        {isSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center flex-grow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Booking Request Sent!</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">A warehouse partner will contact you shortly to confirm availability and details.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-grow p-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name-warehouse" className="input-label">Full Name</label>
                  <input type="text" name="name" id="name-warehouse" value={formData.name} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label htmlFor="phone-warehouse" className="input-label">Phone Number</label>
                  <input type="tel" name="phone" id="phone-warehouse" value={formData.phone} onChange={handleChange} required className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="cropType" className="input-label">Crop Type</label>
                    <input type="text" name="cropType" id="cropType" value={formData.cropType} onChange={handleChange} required className="input-field" placeholder="e.g., Maize" />
                </div>
                <div>
                    <label htmlFor="quantity" className="input-label">Quantity to Store</label>
                    <input type="text" name="quantity" id="quantity" value={formData.quantity} onChange={handleChange} required className="input-field" placeholder="e.g., 50 bags or 5 tons" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startDate" className="input-label">Storage Start Date</label>
                    <input type="date" name="startDate" id="startDate" value={formData.startDate} onChange={handleChange} required className="input-field" />
                </div>
                 <div>
                    <label htmlFor="duration" className="input-label">Storage Duration</label>
                    <input type="text" name="duration" id="duration" value={formData.duration} onChange={handleChange} required className="input-field" placeholder="e.g., 3 months" />
                </div>
              </div>
               <div>
                  <label htmlFor="preferredLocation" className="input-label">Preferred Location/Town</label>
                  <input type="text" name="preferredLocation" id="preferredLocation" value={formData.preferredLocation} onChange={handleChange} required className="input-field" />
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

export default WarehouseBookingModal;
