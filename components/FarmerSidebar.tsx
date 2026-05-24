
import React from 'react';
import { useAuth } from '../context/AuthContext';

const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const MarketplaceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const FarmIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 15v4m0 0h4m-4 0l4-4m11-6l-4-4m0 0l-4 4m4-4v12" /><path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path d="M12.793 2.793l-1.414 1.414" /></svg>;
const OrdersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const LogisticsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 17a2 2 0 100-4 2 2 0 000 4zM19 17a2 2 0 100-4 2 2 0 000 4z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8a1 1 0 001-1z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h2a1 1 0 001-1V7.134a1 1 0 00-1-1h-2.438a1 1 0 00-.759.34L9 10" /></svg>;
const ToolIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83M11.42 15.17l-4.24-4.24a5.25 5.25 0 00-7.42 0L0 10.92l4.24 4.24a5.25 5.25 0 007.18 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15.75L3 21m0 0l-3-3m3 3L6 18m12-6.5l-3-3m3 3l-6-6" /></svg>;


export type FarmerView = 'overview' | 'marketplace' | 'my_farm' | 'order_history' | 'profile_settings' | 'logistics' | 'tool_rentals' | 'my_tool_bookings';

interface FarmerSidebarProps {
  activeView: FarmerView;
  setActiveView: (view: FarmerView) => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onOpenApiDocs?: () => void;
}

const FarmerSidebar: React.FC<FarmerSidebarProps> = ({ activeView, setActiveView, isOpen, onClose, isCollapsed, onOpenApiDocs }) => {
    const { user, logout } = useAuth();
    
    const NavItem: React.FC<{view?: FarmerView, label: string, icon: React.ReactNode, onClick?: () => void}> = ({ view, label, icon, onClick }) => (
        <button
            onClick={() => {
                if (onClick) {
                    onClick();
                } else if (view) {
                    setActiveView(view);
                }
                // Close sidebar on mobile after selection
                if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-xl transition-all duration-200 group relative ${
                view && activeView === view 
                ? 'bg-brand-green text-white shadow-md' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
            title={isCollapsed ? label : ''}
        >
            <div className={`transition-colors flex-shrink-0 ${view && activeView === view ? 'text-white' : 'text-gray-500 group-hover:text-white'}`}>
                {icon}
            </div>
            {!isCollapsed && <span className="font-medium text-sm ml-3 whitespace-nowrap">{label}</span>}
        </button>
    );

    // Backdrop for mobile
    const Backdrop = () => (
        <div 
            className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        />
    );

    const sidebarClasses = `
        fixed lg:static inset-y-0 left-0 z-50 
        bg-gray-900 text-white border-r border-gray-800 
        flex flex-col h-full
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-72 w-72'}
    `;

    return (
        <>
            <Backdrop />
            <aside className={sidebarClasses}>
                <div className={`p-6 mb-2 border-b border-gray-800 flex items-center ${isCollapsed ? 'justify-center' : 'space-x-4'}`}>
                     <div className="flex items-center justify-center">
                        <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-brand-green text-white shadow-glow flex-shrink-0">
                            <span className="text-xl font-bold leading-none">{user?.name.charAt(0).toUpperCase()}</span>
                        </div>
                     </div>
                     {!isCollapsed && (
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <h1 className="text-base font-bold text-white truncate">{user?.name}</h1>
                            <p className="text-xs text-gray-400 truncate">Farmer Account</p>
                        </div>
                     )}
                </div>
                
                <nav className="flex-grow px-2 space-y-1.5 overflow-y-auto py-4 custom-scrollbar">
                    {!isCollapsed && <div className="px-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Menu</div>}
                    <NavItem view="overview" label="Dashboard" icon={<DashboardIcon />} />
                    <NavItem view="marketplace" label="Marketplace" icon={<MarketplaceIcon />} />
                    <NavItem view="my_farm" label="My Farm" icon={<FarmIcon />} />
                    
                    {!isCollapsed && <div className="px-4 pb-2 pt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Services</div>}
                    <NavItem view="tool_rentals" label="Tool Rentals" icon={<ToolIcon />} />
                    <NavItem view="my_tool_bookings" label="My Tool Bookings" icon={<ToolIcon />} />
                    <NavItem view="logistics" label="Logistics" icon={<LogisticsIcon />} />
                    
                    {!isCollapsed && <div className="px-4 pb-2 pt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</div>}
                    <NavItem view="order_history" label="Order History" icon={<OrdersIcon />} />
                    <NavItem view="profile_settings" label="Settings" icon={<ProfileIcon />} />

                    {!isCollapsed && <div className="px-4 pb-2 pt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Integrations</div>}
                    <NavItem 
                        label="Developer API" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>} 
                        onClick={onOpenApiDocs}
                    />
                </nav>
                
                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={logout}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : ''} space-x-3 px-4 py-3 rounded-xl transition-colors text-gray-400 hover:bg-red-900/30 hover:text-red-400`}
                        title="Sign Out"
                    >
                        <LogoutIcon />
                        {!isCollapsed && <span className="font-medium text-sm">Sign Out</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default FarmerSidebar;
