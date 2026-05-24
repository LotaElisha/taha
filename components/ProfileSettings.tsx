import React, { useState, useEffect } from 'react';
import { User, Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface ProfileSettingsProps {
  orders: Order[];
  onOpenKycModal: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ orders, onOpenKycModal }) => {
  const { user, updateUserAuthData } = useAuth();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone || '',
        location: user.location || '',
      });
    }
  }, [user]);

  if (!user) {
    return <div>Loading user profile...</div>;
  }

  // Calculate purchase summary
  const userOrders = orders.filter(o => o.userId === user.id && o.channel !== 'pos');
  const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrdersCount = userOrders.length;
  const spendingByCategory = userOrders.reduce((acc, order) => {
      order.items.forEach(item => {
          const category = item.product.category;
          const itemTotal = item.product.price * item.quantity;
          acc[category] = (acc[category] || 0) + itemTotal;
      });
      return acc;
  }, {} as Record<string, number>);
  const favoriteCategory = Object.entries(spendingByCategory).sort(([, a]: [string, number], [, b]: [string, number]) => b - a)[0]?.[0] || 'N/A';
    
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateUserAuthData(formData);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
      setFormData({
        name: user.name,
        phone: user.phone || '',
        location: user.location || '',
      });
      setIsEditing(false);
  };

  const DetailItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 sm:mt-0 sm:col-span-2">
        {value || <span className="italic text-gray-400">{t('userProfile.notProvided')}</span>}
      </dd>
    </div>
  );
  
  const KYCStatusSection: React.FC = () => {
    const kycStatusInfo = {
      'Not Submitted': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      'Rejected': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      'Pending': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      'Verified': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
    };

    const status = user?.kycStatus || 'Not Submitted';
    const statusKey = status.toLowerCase().replace(' ', '_');
    const text = t(`userProfile.kycStatus.${statusKey}`);
    const actionText = t(`userProfile.kycAction.${statusKey}`);
    
    const { color } = kycStatusInfo[status];
    const isActionable = status === 'Not Submitted' || status === 'Rejected';
    
    return (
        <div className="mt-6 border-t dark:border-gray-600 pt-6">
            <h4 className="text-lg font-bold text-brand-green-dark dark:text-gray-100 mb-2">{t('userProfile.verificationTitle')}</h4>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 text-sm font-bold rounded-full ${color}`}>{text}</span>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {status !== 'Verified' ? t('userProfile.verificationSub') : t('userProfile.verificationDone')}
                    </p>
                </div>
                {status !== 'Verified' && (
                     <button
                        onClick={isActionable ? onOpenKycModal : undefined}
                        disabled={!isActionable}
                        className={`font-bold py-2 px-4 rounded-lg transition-colors text-sm ${
                            isActionable 
                            ? 'bg-brand-green hover:bg-brand-green-dark text-white' 
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {actionText}
                    </button>
                )}
            </div>
        </div>
    );
  };

  return (
     <div className="bg-white dark:bg-gray-800 shadow-lg overflow-hidden sm:rounded-lg animate-fade-in max-w-4xl mx-auto">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 flex justify-between items-center">
             <h3 className="text-xl leading-6 font-bold text-brand-green-dark dark:text-gray-100">
                Profile and Settings
             </h3>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                {t('userProfile.editProfile')}
            </button>
          )}
        </div>
        <div className="px-4 py-5 sm:p-6">
          {isEditing ? (
            <div className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('userProfile.fullName')}</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                 <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('userProfile.phoneNumber')}</label>
                    <input type="text" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('userProfile.location')}</label>
                    <input type="text" name="location" id="location" value={formData.location} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={handleCancel} className="bg-white hover:bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-bold py-2 px-4 rounded-lg border dark:border-gray-600 border-gray-300 transition-colors">{t('userProfile.cancel')}</button>
                    <button onClick={handleSave} className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">{t('userProfile.saveChanges')}</button>
                </div>
            </div>
          ) : (
            <>
                <dl className="divide-y divide-gray-200 dark:divide-gray-600">
                <DetailItem label={t('userProfile.fullName')} value={user.name} />
                <DetailItem label={t('userProfile.emailAddress')} value={user.email} />
                <DetailItem label={t('userProfile.phoneNumber')} value={user.phone} />
                <DetailItem label={t('userProfile.location')} value={user.location} />
                </dl>
                
                <KYCStatusSection />

                <div className="mt-6 border-t dark:border-gray-600 pt-6">
                    <h4 className="text-lg font-bold text-brand-green-dark dark:text-gray-100 mb-2">{t('userProfile.purchaseSummary')}</h4>
                    <dl className="divide-y divide-gray-200 dark:divide-gray-600">
                        <DetailItem label={t('userProfile.totalSpent')} value={`Tsh ${totalSpent.toLocaleString()}`} />
                        <DetailItem label={t('userProfile.totalOrders')} value={totalOrdersCount.toString()} />
                        <DetailItem label={t('userProfile.favoriteCategory')} value={favoriteCategory} />
                    </dl>
                </div>
            </>
          )}
        </div>
      </div>
  );
};

export default ProfileSettings;
