import React from 'react';

// SVG Icons for social providers
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A8 8 0 0124 36c-5.222 0-9.612-3.87-11.084-8.868l-6.571 4.819A20 20 0 0024 44z"></path>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.083 5.571l6.19 5.238C42.018 35.843 44 30.222 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
  </svg>
);
const AppleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.01,1.99C9.94,1.99 8.33,3.31 7.31,4.9C6.2,3.32 4.38,1.99 2.5,1.99c-1.89,0 -3.49,1.33 -4.5,2.99C-3.26,7.57 -1.6,12.01 1.05,16.51c1.29,2.2 2.8,4.1 4.89,4.1c1.99,0 2.65,-1.3 4.9,-1.3c2.25,0 2.8,1.3 4.9,1.3c2.09,0 3.5,-1.99 4.79,-4.19c1.69,-2.89 2.19,-5.39 1.19,-7.39c-1.09,-2.19 -3.19,-3.41 -5.29,-3.41zM11.01,2.99c1,-1 2.5,-1.5 3.5,-0.5c-1,1 -2.5,1.5 -3.5,0.5z" transform="translate(4.5, 0.5)"></path>
    </svg>
);
const FacebookIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v7.028C18.343 21.128 22 16.991 22 12z"></path>
    </svg>
);

interface SocialLoginsProps {
    onSocialLogin: (provider: 'Google' | 'Apple' | 'Facebook') => void;
    isLoading: boolean;
}

const SocialLogins: React.FC<SocialLoginsProps> = ({ onSocialLogin, isLoading }) => {
  return (
    <>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            OR
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <button type="button" onClick={() => onSocialLogin('Google')} disabled={isLoading} className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors">
            <GoogleIcon />
            <span className="ml-3">Continue with Google</span>
        </button>
        <button type="button" onClick={() => onSocialLogin('Apple')} disabled={isLoading} className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm bg-black text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors">
            <AppleIcon />
            <span className="ml-3">Continue with Apple</span>
        </button>
        <button type="button" onClick={() => onSocialLogin('Facebook')} disabled={isLoading} className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <FacebookIcon />
            <span className="ml-3">Continue with Facebook</span>
        </button>
      </div>
    </>
  );
};
export default SocialLogins;