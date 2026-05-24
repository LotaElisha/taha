import React, { useState, useEffect } from 'react';
import { User, UserRole, Agrodealer, Agrovet, LogisticsProvider } from '../types';
import { toast } from './ui/sonner';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  userToEdit?: User | null;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, userToEdit }) => {
  const [formData, setFormData] = useState<Partial<User> & Partial<Omit<LogisticsProvider, 'role'>>>({
    name: '',
    email: '',
    password: '',
    role: 'Farmer',
    companyName: '',
    vehicleType: '',
    licensePlate: '',
  });

  const isEditMode = !!userToEdit;

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        id: userToEdit.id,
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        password: '', 
        companyName: (userToEdit as LogisticsProvider).companyName || '',
        vehicleType: (userToEdit as LogisticsProvider).vehicleType || '',
        licensePlate: (userToEdit as LogisticsProvider).licensePlate || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'Farmer',
        companyName: '',
        vehicleType: '',
        licensePlate: '',
      });
    }
  }, [userToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || (!isEditMode && !formData.password)) {
      toast.error('Please fill in all required fields.');
      return;
    }

    let userData: User = {
      id: userToEdit?.id || `user-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      role: formData.role || 'Farmer',
      password: formData.password || userToEdit?.password, 
    };
    
    if(userData.role === 'Agrodealer' || userData.role === 'Agrovet'){
        (userData as Agrodealer | Agrovet).rating = (userToEdit as Agrodealer | Agrovet)?.rating || 4.0;
    }
    if (userData.role === 'LogisticsProvider') {
        const providerData = userData as LogisticsProvider;
        providerData.companyName = formData.companyName || '';
        providerData.vehicleType = formData.vehicleType || '';
        providerData.licensePlate = formData.licensePlate || '';
        providerData.status = (userToEdit as LogisticsProvider)?.status || 'Pending';
        providerData.kycStatus = userToEdit?.kycStatus || 'Not Submitted';
    }

    onSave(userData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <header className="p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-brand-green-dark dark:text-gray-100">
            {isEditMode ? 'Edit User' : 'Create New User'}
          </h2>
        </header>
        <form onSubmit={handleSubmit} className="flex-grow p-6 overflow-y-auto space-y-4">
          <div>
            <label htmlFor="name" className="input-label">Full Name</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="input-field" />
          </div>
          <div>
            <label htmlFor="email" className="input-label">Email Address</label>
            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="input-field" />
          </div>
          <div>
            <label htmlFor="password" className="input-label">
              Password {isEditMode && <span className="text-xs text-gray-400">(Leave blank to keep current password)</span>}
            </label>
            <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required={!isEditMode} className="input-field" />
          </div>
          <div>
            <label htmlFor="role" className="input-label">Role</label>
            <select name="role" id="role" value={formData.role} onChange={handleChange} required className="input-field">
              <optgroup label="Core Roles">
                <option value="Farmer">Farmer</option>
                <option value="Agrodealer">Agrodealer</option>
                <option value="Agrovet">Agrovet</option>
                <option value="Agronomist">Agronomist</option>
                <option value="LogisticsProvider">LogisticsProvider</option>
              </optgroup>
              <optgroup label="Admin Roles">
                <option value="SuperAdmin">Super Admin</option>
                <option value="KYCOfficer">KYC Officer</option>
                <option value="CatalogManager">Catalog Manager</option>
                <option value="SupportAgent">Support Agent</option>
                <option value="FinancialAuditor">Financial Auditor</option>
              </optgroup>
            </select>
          </div>
          {formData.role === 'LogisticsProvider' && (
            <>
                <div>
                    <label htmlFor="companyName" className="input-label">Company Name</label>
                    <input type="text" name="companyName" id="companyName" value={formData.companyName} onChange={handleChange} className="input-field" />
                </div>
                 <div>
                    <label htmlFor="vehicleType" className="input-label">Vehicle Type</label>
                    <input type="text" name="vehicleType" id="vehicleType" value={formData.vehicleType} onChange={handleChange} className="input-field" />
                </div>
                 <div>
                    <label htmlFor="licensePlate" className="input-label">License Plate</label>
                    <input type="text" name="licensePlate" id="licensePlate" value={formData.licensePlate} onChange={handleChange} className="input-field" />
                </div>
            </>
          )}
        </form>
        <footer className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="btn-secondary-outline">Cancel</button>
          <button type="submit" onClick={handleSubmit} className="btn-primary">Save User</button>
        </footer>
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

export default UserFormModal;