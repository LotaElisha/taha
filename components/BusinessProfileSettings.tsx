import React, { useState, useEffect } from 'react';
import { User, Agrodealer, Agrovet, LogisticsProvider, WhatsAppConfig, GoogleBusinessConfig } from '../types';
import { toast } from './ui/sonner';

interface BusinessProfileSettingsProps {
    user: Agrodealer | Agrovet | LogisticsProvider;
    onSave: (updatedData: Partial<User>) => void;
}

const BusinessProfileSettings: React.FC<BusinessProfileSettingsProps> = ({ user, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        location: '',
        logoUrl: '',
        businessDescription: '',
        operatingHours: '',
        specialties: '', // Comma-separated for easier input
    });
    const [whatsappFormData, setWhatsappFormData] = useState<WhatsAppConfig>({
        enabled: false,
        phoneNumber: '',
        accountId: '',
        phoneNumberId: '',
        accessToken: '',
    });
    const [googleFormData, setGoogleFormData] = useState<GoogleBusinessConfig>({
        enabled: false,
        placeId: '',
        businessUrl: '',
        isVerified: false
    });
    
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                phone: user.phone || '',
                location: user.location || '',
                logoUrl: user.logoUrl || '',
                businessDescription: user.businessDescription || '',
                operatingHours: user.operatingHours || '',
                specialties: (user.specialties || []).join(', '),
            });
            setWhatsappFormData(user.whatsappConfig || {
                enabled: false,
                phoneNumber: '',
                accountId: '',
                phoneNumberId: '',
                accessToken: '',
            });
            setGoogleFormData(user.googleBusinessConfig || {
                enabled: false,
                placeId: '',
                businessUrl: '',
                isVerified: false
            });
        }
    }, [user]);

    const handleSave = () => {
        const updatedData: Partial<User> = {
            ...user,
            name: formData.name,
            phone: formData.phone,
            location: formData.location,
            logoUrl: formData.logoUrl,
            businessDescription: formData.businessDescription,
            operatingHours: formData.operatingHours,
            specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
            whatsappConfig: whatsappFormData,
            googleBusinessConfig: googleFormData,
        };
        onSave(updatedData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        if (user) {
            setFormData({
                name: user.name,
                phone: user.phone || '',
                location: user.location || '',
                logoUrl: user.logoUrl || '',
                businessDescription: user.businessDescription || '',
                operatingHours: user.operatingHours || '',
                specialties: (user.specialties || []).join(', '),
            });
            setWhatsappFormData(user.whatsappConfig || {
                enabled: false,
                phoneNumber: '',
                accountId: '',
                phoneNumberId: '',
                accessToken: '',
            });
            setGoogleFormData(user.googleBusinessConfig || {
                enabled: false,
                placeId: '',
                businessUrl: '',
                isVerified: false
            });
        }
        setIsEditing(false);
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const newLogoUrl = `https://picsum.photos/seed/${user.id}_logo_${Date.now()}/200/200`;
            setFormData(prev => ({ ...prev, logoUrl: newLogoUrl }));
        }
    };
    
    const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setWhatsappFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleGoogleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setGoogleFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };
    
    const testWhatsAppConnection = () => {
        console.log("Testing WhatsApp Connection with:", whatsappFormData);
        toast.success('Connection test passed.', { description: 'A test message would be sent to your number in production.' });
    };

    const syncGoogleBusiness = () => {
        if(!googleFormData.placeId) {
            toast.error('Please enter a Place ID first.');
            return;
        }
        setGoogleFormData(prev => ({ ...prev, googleRating: 4.7, reviewCount: 120, isVerified: true }));
        toast.success('Synced with Google Business.');
    };


    return (
        <div className="bg-white dark:bg-gray-800 shadow-lg sm:rounded-lg animate-fade-in max-w-4xl mx-auto">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                    <h3 className="text-xl leading-6 font-bold text-brand-green-dark dark:text-gray-100">
                        Business Profile & Integrations
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                        Manage your public business information and connect to external services.
                    </p>
                </div>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="btn-primary-outline text-sm">
                        Edit Profile
                    </button>
                )}
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-0">
                {isEditing ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6 space-y-6">
                        {/* Profile Section */}
                        <fieldset className="space-y-4">
                            <legend className="text-lg font-semibold text-gray-800 dark:text-gray-100">Business Details</legend>
                            <div className="flex items-center space-x-4">
                                <img src={formData.logoUrl || `https://picsum.photos/seed/${user.id}/200`} alt="Business Logo" className="h-24 w-24 rounded-full object-cover bg-gray-200"/>
                                <div>
                                    <label htmlFor="logo-upload" className="cursor-pointer bg-white dark:bg-gray-600 py-2 px-3 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50">
                                        Change Logo
                                    </label>
                                    <input id="logo-upload" name="logo" type="file" className="hidden" onChange={handleLogoChange}/>
                                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB.</p>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="name" className="input-label">Business Name</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field"/>
                            </div>
                            <div>
                                <label htmlFor="description" className="input-label">Business Description</label>
                                <textarea name="description" id="description" rows={4} value={formData.businessDescription} onChange={e => setFormData({...formData, businessDescription: e.target.value})} className="input-field"></textarea>
                            </div>
                            <div>
                                <label htmlFor="phone" className="input-label">Public Phone Number</label>
                                <input type="text" name="phone" id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field"/>
                            </div>
                            <div>
                                <label htmlFor="location" className="input-label">Business Address</label>
                                <input type="text" name="location" id="location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="input-field"/>
                            </div>
                            <div>
                                <label htmlFor="hours" className="input-label">Operating Hours</label>
                                <input type="text" name="hours" id="hours" value={formData.operatingHours} onChange={e => setFormData({...formData, operatingHours: e.target.value})} className="input-field" placeholder="e.g., Mon-Fri: 8am - 5pm"/>
                            </div>
                            <div>
                                <label htmlFor="specialties" className="input-label">Specialties (comma-separated)</label>
                                <input type="text" name="specialties" id="specialties" value={formData.specialties} onChange={e => setFormData({...formData, specialties: e.target.value})} className="input-field" placeholder="e.g., Organic Seeds, Pest Control"/>
                            </div>
                        </fieldset>

                        {/* WhatsApp Section */}
                        <fieldset className="space-y-4 border-t dark:border-gray-600 pt-6">
                            <legend className="text-lg font-semibold text-green-600 flex items-center">
                                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.456l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.267.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                                WhatsApp Business API
                            </legend>
                             <div className="relative flex items-start">
                                <div className="flex h-5 items-center">
                                    <input id="whatsapp-enabled" name="enabled" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green-light" checked={whatsappFormData.enabled} onChange={handleWhatsappChange} />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="whatsapp-enabled" className="font-medium text-gray-700 dark:text-gray-200">Enable WhatsApp Features</label>
                                    <p className="text-gray-500 dark:text-gray-400">Receive order notifications and chat with customers.</p>
                                </div>
                            </div>
                            {whatsappFormData.enabled && (
                                <div className="space-y-4 pl-8 border-l-2 border-brand-green-light/50">
                                    <div>
                                        <label htmlFor="whatsapp-phone" className="input-label">Business WhatsApp Number</label>
                                        <input type="text" name="phoneNumber" id="whatsapp-phone" value={whatsappFormData.phoneNumber} onChange={handleWhatsappChange} className="input-field" placeholder="255712345678" />
                                        <p className="text-xs text-gray-500 mt-1">International format, digits only.</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="whatsapp-account" className="input-label">Meta Account ID</label>
                                            <input type="text" name="accountId" id="whatsapp-account" value={whatsappFormData.accountId} onChange={handleWhatsappChange} className="input-field" />
                                        </div>
                                        <div>
                                            <label htmlFor="whatsapp-phone-id" className="input-label">Phone Number ID</label>
                                            <input type="text" name="phoneNumberId" id="whatsapp-phone-id" value={whatsappFormData.phoneNumberId} onChange={handleWhatsappChange} className="input-field" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="whatsapp-token" className="input-label">Permanent Access Token</label>
                                        <input type="password" name="accessToken" id="whatsapp-token" value={whatsappFormData.accessToken} onChange={handleWhatsappChange} className="input-field" />
                                    </div>
                                    <button type="button" onClick={testWhatsAppConnection} className="btn-secondary-outline text-sm">Test WhatsApp Connection</button>
                                </div>
                            )}
                        </fieldset>

                        {/* Google Business Section */}
                        <fieldset className="space-y-4 border-t dark:border-gray-600 pt-6">
                            <legend className="text-lg font-semibold text-blue-500 flex items-center">
                                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032 c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10 c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                                Google Business Profile
                            </legend>
                            <div className="relative flex items-start">
                                <div className="flex h-5 items-center">
                                    <input id="google-enabled" name="enabled" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={googleFormData.enabled} onChange={handleGoogleChange} />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="google-enabled" className="font-medium text-gray-700 dark:text-gray-200">Enable Google Business Features</label>
                                    <p className="text-gray-500 dark:text-gray-400">Display Google ratings and maps link on your profile.</p>
                                </div>
                            </div>
                            {googleFormData.enabled && (
                                <div className="space-y-4 pl-8 border-l-2 border-blue-400/50">
                                    <div>
                                        <label htmlFor="place-id" className="input-label">Google Place ID</label>
                                        <input type="text" name="placeId" id="place-id" value={googleFormData.placeId} onChange={handleGoogleChange} className="input-field" placeholder="e.g. ChIJN1t_tDeuEmsR..."/>
                                        <p className="text-xs text-gray-500 mt-1">Used to pull your official Google ratings and reviews.</p>
                                    </div>
                                    <div>
                                        <label htmlFor="business-url" className="input-label">Maps URL / CID Link</label>
                                        <input type="text" name="businessUrl" id="business-url" value={googleFormData.businessUrl} onChange={handleGoogleChange} className="input-field" placeholder="https://maps.google.com/?cid=..."/>
                                    </div>
                                    <button type="button" onClick={syncGoogleBusiness} className="px-4 py-2 border border-blue-500 text-blue-600 rounded-md text-sm font-bold hover:bg-blue-50 transition-colors">
                                        Sync with Google
                                    </button>
                                </div>
                            )}
                        </fieldset>


                        <div className="flex justify-end space-x-3 pt-4">
                            <button type="button" onClick={handleCancel} className="btn-secondary-outline">Cancel</button>
                            <button type="submit" className="btn-primary">Save Business Profile</button>
                        </div>
                    </form>
                ) : (
                    <dl className="sm:divide-y sm:divide-gray-200 dark:sm:divide-gray-700">
                        <ProfileRow label="Store Logo"><img src={formData.logoUrl || `https://picsum.photos/seed/${user.id}/200`} alt="Business Logo" className="h-16 w-16 rounded-full object-cover bg-gray-200 border-2 border-brand-green/20"/></ProfileRow>
                        <ProfileRow label="Business Name" value={formData.name} />
                        <ProfileRow label="Description" value={formData.businessDescription} />
                        <ProfileRow label="WhatsApp API">
                           <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${user.whatsappConfig?.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {user.whatsappConfig?.enabled ? 'Active' : 'Disconnected'}
                                </span>
                                {user.whatsappConfig?.enabled && <span className="text-sm text-gray-500">{user.whatsappConfig.phoneNumber}</span>}
                           </div>
                        </ProfileRow>
                        <ProfileRow label="Google Business">
                           <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${user.googleBusinessConfig?.enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {user.googleBusinessConfig?.enabled ? 'Synced' : 'Not Integrated'}
                                </span>
                                {user.googleBusinessConfig?.googleRating && (
                                     <span className="text-sm text-gray-500">★ {user.googleBusinessConfig.googleRating} ({user.googleBusinessConfig.reviewCount} reviews)</span>
                                )}
                           </div>
                        </ProfileRow>
                        <ProfileRow label="Hours" value={formData.operatingHours} />
                        <ProfileRow label="Specialties">
                            <div className="flex flex-wrap gap-2">
                                {formData.specialties.split(',').map(s => s.trim()).filter(Boolean).map((spec, i) => (
                                    <span key={i} className="px-2 py-1 text-xs font-semibold bg-brand-brown-light text-brand-green-dark rounded-full">{spec}</span>
                                ))}
                            </div>
                        </ProfileRow>
                    </dl>
                )}
            </div>
            <style>{`
                .input-label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; } .dark .input-label { color: #D1D5DB; }
                .input-field { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; } .dark .input-field { background-color: #374151; border-color: #4B5563; color: #F9FAFB; }
                .btn-primary { padding: 0.5rem 1.25rem; background-color: #16a34a; color: white; font-weight: bold; border-radius: 0.5rem; } .btn-primary:hover { background-color: #14532d; }
                .btn-secondary-outline { padding: 0.5rem 1.25rem; background-color: white; color: #374151; font-weight: bold; border-radius: 0.5rem; border: 1px solid #D1D5DB; } .dark .btn-secondary-outline { background-color: #374151; color: #D1D5DB; border-color: #4B5563; }
                .btn-primary-outline { padding: 0.5rem 1rem; background-color: transparent; color: #16a34a; font-weight: bold; border-radius: 0.5rem; border: 2px solid #16a34a; } .dark .btn-primary-outline { color: #4ade80; border-color: #4ade80 }
            `}</style>
        </div>
    );
};

const ProfileRow: React.FC<{ label: string; value?: string; children?: React.ReactNode }> = ({ label, value, children }) => (
    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 sm:mt-0 sm:col-span-2">
            {children || value || <span className="italic text-gray-400">Not provided</span>}
        </dd>
    </div>
);

export default BusinessProfileSettings;