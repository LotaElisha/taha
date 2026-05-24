import React from 'react';
import { Order } from '../types';
import ProfileSettings from '../components/ProfileSettings';
import { toast } from '../components/ui/sonner';

interface UserProfileProps {
    onBack: () => void;
    orders: Order[];
}

const UserProfile: React.FC<UserProfileProps> = ({ onBack, orders }) => {
    // This component is currently a wrapper for ProfileSettings to facilitate
    // navigation from the main App component. A more robust routing solution
    // would be better in the long term.
    
    // The onOpenKycModal prop isn't available here, so it needs to be handled.
    // For now, it won't be passed. This functionality is available within the FarmerDashboard.
    
    return (
        <div className="p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
            <button onClick={onBack} className="mb-4 text-brand-green-dark dark:text-brand-green-light hover:underline flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <span>Back to Marketplace</span>
            </button>
            <ProfileSettings orders={orders} onOpenKycModal={() => toast.info('Manage KYC from your main dashboard view.')} />
        </div>
    );
};

export default UserProfile;
