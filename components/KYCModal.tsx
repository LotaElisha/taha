import React, { useState, useEffect, ChangeEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface KYCModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FileInput: React.FC<{
    id: string;
    label: string;
    description: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    fileName: string | null;
}> = ({ id, label, description, onChange, fileName }) => {
    const { t } = useLanguage();
    return (
    <div>
        <label htmlFor={id} className="input-label">{label}</label>
        <div className="mt-2 flex items-center justify-center w-full">
            <label htmlFor={id} className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">{t('kycModal.uploadPrompt')}</span></p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
                </div>
                <input id={id} type="file" className="hidden" accept="image/png, image/jpeg" onChange={onChange} />
            </label>
        </div>
        {fileName && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('kycModal.selectedFile', { fileName })}</p>}
    </div>
)};

const KYCModal: React.FC<KYCModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUserAuthData } = useAuth();
  const { t } = useLanguage();
  const [nin, setNin] = useState('');
  const [idFront, setIdFront] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.nin) {
      setNin(user.nin);
    }
  }, [user, isOpen]);

  const handleFileChange = (setter: React.Dispatch<React.SetStateAction<File | null>>) => (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nin || !idFront || !selfie) {
      setError(t('kycModal.error'));
      return;
    }
    setError('');
    setIsSubmitting(true);
    // Simulate API call for KYC verification
    setTimeout(() => {
      console.log('KYC Submitted:', { nin, idFront: idFront.name, selfie: selfie.name });
      updateUserAuthData({ kycStatus: 'Pending', nin });
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 3000);
    }, 2000);
  };

  const handleClose = () => {
    // Reset state before closing
    setIsSuccess(false);
    setError('');
    setNin('');
    setIdFront(null);
    setSelfie(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <header className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-brand-green-dark dark:text-gray-100">{t('kycModal.title')}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white text-3xl">&times;</button>
        </header>

        {isSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center flex-grow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('kycModal.successTitle')}</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{t('kycModal.successDescription')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-grow p-6 overflow-y-auto">
            <div className="space-y-6">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('kycModal.description')}
              </p>
              <div>
                <label htmlFor="nin" className="input-label">{t('kycModal.ninLabel')}</label>
                <input
                  type="text"
                  name="nin"
                  id="nin"
                  value={nin}
                  onChange={(e) => setNin(e.target.value)}
                  required
                  className="input-field"
                  placeholder={t('kycModal.ninPlaceholder')}
                />
              </div>

              <FileInput
                id="id-front"
                label={t('kycModal.idFrontLabel')}
                description={t('kycModal.idFrontDescription')}
                onChange={handleFileChange(setIdFront)}
                fileName={idFront?.name || null}
              />
              
              <FileInput
                id="selfie"
                label={t('kycModal.selfieLabel')}
                description={t('kycModal.selfieDescription')}
                onChange={handleFileChange(setSelfie)}
                fileName={selfie?.name || null}
              />

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
            <footer className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3 -m-6 mt-6">
              <button type="button" onClick={handleClose} className="btn-secondary-outline">{t('userProfile.cancel')}</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary disabled:bg-gray-400 flex items-center">
                {isSubmitting && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {isSubmitting ? t('kycModal.submitting') : t('kycModal.submit')}
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

export default KYCModal;