import React, { useState, useEffect } from 'react';
import { Farm } from '../types';
import { useAuth } from '../context/AuthContext';
import { toast } from './ui/sonner';

interface FarmFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (farmData: Omit<Farm, 'id' | 'userId'>) => void;
  farmToEdit: Farm | null;
}

const FarmFormModal: React.FC<FarmFormModalProps> = ({ isOpen, onClose, onSave, farmToEdit }) => {
  const { location, requestLocation, isRequestingLocation, locationError } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    coords: { lat: 0, lon: 0 },
    size: 0,
    mainCrops: '',
  });

  useEffect(() => {
    if (farmToEdit) {
      setFormData({
        name: farmToEdit.name,
        location: farmToEdit.location,
        coords: farmToEdit.coords,
        size: farmToEdit.size,
        mainCrops: farmToEdit.mainCrops.join(', '),
      });
    } else {
      setFormData({ name: '', location: '', coords: { lat: 0, lon: 0 }, size: 0, mainCrops: '' });
    }
  }, [farmToEdit, isOpen]);
  
  const handleUseCurrentLocation = () => {
    requestLocation();
  };
  
  const handleFindAddress = () => {
    // Simulate finding a specific address
    setFormData(prev => ({
      ...prev,
      location: 'Kilimo Bora Farm, Kilosa District',
      coords: { lat: -6.838, lon: 37.001 }
    }));
  };

  useEffect(() => {
    if(location){
      // A more robust solution would use a reverse geocoding API
      const locationString = `Lat: ${location.lat.toFixed(4)}, Lon: ${location.lon.toFixed(4)}`;
      setFormData(prev => ({ ...prev, location: locationString, coords: location }));
    }
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mainCropsArray = formData.mainCrops.split(',').map(crop => crop.trim()).filter(Boolean);
    
    // Basic validation
    if (!formData.location && (formData.coords.lat === 0 || formData.coords.lon === 0)) {
        toast.error('Please provide a location or use current location.');
        return;
    }
    
    onSave({
        name: formData.name,
        location: formData.location,
        coords: formData.coords,
        size: Number(formData.size),
        mainCrops: mainCropsArray,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <header className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-brand-green-dark dark:text-gray-100">
            {farmToEdit ? 'Edit Farm' : 'Add a New Farm'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white text-3xl">&times;</button>
        </header>
        <form onSubmit={handleSubmit} className="flex-grow p-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="input-label">Farm Name</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="input-field" />
            </div>
            <div>
              <label htmlFor="location" className="input-label">Location</label>
              <div className="mt-1">
                 <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} required className="input-field" placeholder="e.g., Kilosa, Morogoro"/>
                 <div className="flex space-x-2 mt-2">
                    <button type="button" onClick={handleFindAddress} className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm font-semibold hover:bg-gray-200">
                        Find Address
                    </button>
                    <button type="button" onClick={handleUseCurrentLocation} disabled={isRequestingLocation} className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm font-semibold hover:bg-gray-200 disabled:opacity-50">
                        {isRequestingLocation ? 'Getting...' : 'Use My Location'}
                    </button>
                 </div>
              </div>
               {locationError && <p className="text-xs text-red-500 mt-1">{locationError}</p>}
            </div>
            <div>
              <label htmlFor="size" className="input-label">Farm Size (in acres)</label>
              <input type="number" name="size" id="size" value={formData.size} onChange={handleChange} required className="input-field" min="0" />
            </div>
            <div>
              <label htmlFor="mainCrops" className="input-label">Main Crops (comma-separated)</label>
              <input type="text" name="mainCrops" id="mainCrops" value={formData.mainCrops} onChange={handleChange} required className="input-field" placeholder="e.g., Maize, Beans, Sunflowers" />
            </div>
          </div>
          <footer className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3 -m-6 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary-outline">Cancel</button>
            <button type="submit" className="btn-primary">
              {farmToEdit ? 'Save Changes' : 'Add Farm'}
            </button>
          </footer>
        </form>
      </div>
       <style>{`
        .input-label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; }
        .dark .input-label { color: #D1D5DB; }
        .input-field { display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; }
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

export default FarmFormModal;