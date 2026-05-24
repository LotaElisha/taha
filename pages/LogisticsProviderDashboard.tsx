
import React, { useState } from 'react';
import { LogisticsProvider, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import BusinessProfileSettings from '../components/BusinessProfileSettings';

interface LogisticsProviderDashboardProps {
    provider: LogisticsProvider;
}

const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

type LogisticsView = 'overview' | 'bookings' | 'profile';

const LogisticsProviderDashboard: React.FC<LogisticsProviderDashboardProps> = ({ provider }) => {
    const { user, logout, updateUserAuthData } = useAuth();
    const { updateUser } = useUser();
    const [activeView, setActiveView] = useState<LogisticsView>('overview');

    // Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handleUpdateProfile = (updatedData: Partial<User>) => {
        if (!user) return;
        const fullyUpdatedUser = { ...user, ...updatedData };
        updateUserAuthData(updatedData);
        updateUser(fullyUpdatedUser as User);
    };

    const toggleSidebar = () => {
        if (window.innerWidth >= 1024) {
            setIsSidebarCollapsed(!isSidebarCollapsed);
        } else {
            setIsSidebarOpen(!isSidebarOpen);
        }
    };

    const renderContent = () => {
        switch (activeView) {
            case 'profile':
                return <BusinessProfileSettings user={provider} onSave={handleUpdateProfile} />;
            case 'overview':
            default:
                return (
                    <div className="space-y-8">
                        <h1 className="text-3xl font-bold text-brand-green-dark dark:text-gray-100">Logistics Overview</h1>
                        <p className="dark:text-gray-300">Welcome, {provider.name}. This dashboard is under construction.</p>
                    </div>
                );
        }
    };
    
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans overflow-hidden">
            <Sidebar 
                activeView={activeView} 
                setActiveView={setActiveView} 
                logout={logout} 
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isCollapsed={isSidebarCollapsed}
            />
            <main className="flex-1 flex flex-col overflow-hidden min-w-0">
                <header className="bg-white dark:bg-gray-800 shadow-sm z-20 p-4 flex items-center">
                    <button onClick={toggleSidebar} className="p-2 rounded-md text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 mr-4 focus:outline-none">
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white truncate">Logistics Panel</h1>
                </header>
                <div className="flex-1 overflow-x-hidden overflow-y-auto p-8">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

const Sidebar: React.FC<{
    activeView: LogisticsView, 
    setActiveView: (view: LogisticsView) => void, 
    logout: () => void,
    isOpen: boolean,
    onClose: () => void,
    isCollapsed: boolean
}> = ({ activeView, setActiveView, logout, isOpen, onClose, isCollapsed }) => {
    const NavItem: React.FC<{view: LogisticsView, label: string, icon: React.ReactNode}> = ({ view, label, icon }) => (
        <button
            onClick={() => {
                setActiveView(view);
                if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-lg transition-colors ${
                activeView === view ? 'bg-brand-green text-white shadow-lg' : 'text-gray-300 hover:bg-brand-green-light hover:text-white'
            }`}
            title={isCollapsed ? label : ''}
        >
            {icon}
            {!isCollapsed && <span className="font-semibold ml-3 whitespace-nowrap">{label}</span>}
        </button>
    );

    const Backdrop = () => (
        <div 
            className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        />
    );

    const sidebarClasses = `
        fixed lg:static inset-y-0 left-0 z-50 
        bg-brand-green-dark text-white 
        flex flex-col h-full
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64 w-64'}
    `;

    return (
        <>
            <Backdrop />
            <aside className={sidebarClasses}>
                <div className={`text-center py-4 mb-4 flex justify-center items-center ${isCollapsed ? 'px-2' : 'px-4'}`}>
                     {!isCollapsed ? <h1 className="text-xl font-bold text-white truncate">Logistics Panel</h1> : <span className="font-bold text-xl">LP</span>}
                </div>
                <nav className="flex-grow space-y-2 px-2 overflow-y-auto custom-scrollbar">
                    <NavItem view="overview" label="Overview" icon={<DashboardIcon />} />
                    <NavItem view="profile" label="Business Profile" icon={<ProfileIcon />} />
                </nav>
                <div className="mt-auto p-4">
                    <button
                        onClick={logout}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-lg transition-colors text-gray-300 hover:bg-red-500/80 hover:text-white`}
                        title="Logout"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        {!isCollapsed && <span className="font-semibold ml-3 whitespace-nowrap">Logout</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default LogisticsProviderDashboard;
