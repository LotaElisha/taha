
import React from 'react';

interface ProductIconProps {
  category: string;
  className?: string;
}

const ProductIcon: React.FC<ProductIconProps> = ({ category, className = '' }) => {
    let icon;

    switch (category) {
        case 'Seeds':
            icon = (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h1a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.881 4.002l.023.023a1.5 1.5 0 01.023 2.121L6.9 7.5l2.121-2.121a1.5 1.5 0 012.121 0l2.121 2.121 1.028-1.028a1.5 1.5 0 012.121-.023l.023.023a1.5 1.5 0 010 2.121L13.5 9.45l2.121-2.121a1.5 1.5 0 012.121 0l.023.023a1.5 1.5 0 01-.023 2.121l-1.028 1.028 2.121 2.121a1.5 1.5 0 010 2.121l-8.485 8.485a1.5 1.5 0 01-2.121 0l-8.485-8.485a1.5 1.5 0 010-2.121l2.121-2.121L4.8 7.379a1.5 1.5 0 01-.023-2.121l.023-.023a1.5 1.5 0 012.121 0L7.88 6.158l-1.028-1.028a1.5 1.5 0 012.121-2.121z" />
                </svg>
            );
            break;
        case 'Fertilizers':
            icon = (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
            );
            break;
        case 'Pesticides':
            icon = (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
                </svg>
            );
            break;
        case 'Tools':
            icon = (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83M11.42 15.17l-4.24-4.24a5.25 5.25 0 00-7.42 0L0 10.92l4.24 4.24a5.25 5.25 0 007.18 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15.75L3 21m0 0l-3-3m3 3L6 18m12-6.5l-3-3m3 3l-6-6" />
                </svg>
            );
            break;
        case 'Animal Medicine':
            icon = (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
            );
            break;
        case 'Agrovet Services':
            icon = (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0 1.22-.504 2.34-1.318 3.14-1.636 1.636-3.875 2.86-6.432 3.116m-1.318-3.116a9.006 9.006 0 00-6.432 3.116C3.504 10.59 3 9.47 3 8.25c0-4.97 4.03-9 9-9s9 4.03 9 9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.682-6.843" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                    <path d="M12.75 21v-4.507c0-1.045.848-1.893 1.893-1.893h.907c1.028 0 1.86.832 1.86 1.86v4.54" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.607 14.607c1.028 0 1.86.832 1.86 1.86v4.54" />
                </svg>
            );
            break;
        // Tool Categories
        case 'Tractor':
            icon = (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /> {/* Placeholder path, using a switch-like icon for now or simpler rep */}
                    <circle cx="7" cy="17" r="3" />
                    <circle cx="17" cy="17" r="3" />
                    <path d="M14 14h4v-4h-4v4z" />
                    <path d="M4 14h4v-2H4v2z" />
                </svg>
            );
            break;
        case 'Tillage':
            icon = (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16M4 16l4-8 4 8m4-8l4 8" />
                </svg>
            );
            break;
        case 'Seeding':
            icon = (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-8-8h16" />
                    <circle cx="12" cy="12" r="4" />
                </svg>
            );
            break;
        case 'Harvester':
            icon = (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18v18H3z" />
                    <path d="M8 8h8v8H8z" />
                </svg>
            );
            break;
        case 'Other':
        default:
            icon = (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            );
    }
  
    return (
        <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-700/50 text-brand-green-dark dark:text-brand-green-light p-4 rounded-lg ${className}`}>
            <div className="w-3/4 h-3/4">
                {icon}
            </div>
        </div>
    );
};

export default ProductIcon;
