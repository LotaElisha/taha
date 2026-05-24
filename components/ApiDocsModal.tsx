
import React, { useState } from 'react';
import { apiDocs, api } from '../services/api';
import { Smartphone, Code, Globe, Zap, Copy } from 'lucide-react';
import { toast } from './ui/sonner';

interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiDocsModal: React.FC<ApiDocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints' | 'sdk' | 'expo'>('overview');

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard.');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div>
            <h2 className="text-3xl font-black text-brand-green-dark dark:text-white tracking-tighter">Developer API Hub</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Unified backend interface for Web, iOS, and Android.</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4">
            <button onClick={() => setActiveTab('overview')} className={`px-6 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'overview' ? 'border-brand-green text-brand-green' : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>Overview</button>
            <button onClick={() => setActiveTab('endpoints')} className={`px-6 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'endpoints' ? 'border-brand-green text-brand-green' : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>REST Endpoints</button>
            <button onClick={() => setActiveTab('sdk')} className={`px-6 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'sdk' ? 'border-brand-green text-brand-green' : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>TS SDK</button>
            <button onClick={() => setActiveTab('expo')} className={`px-6 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'expo' ? 'border-brand-green text-brand-green' : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>Expo Go / Mobile</button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 bg-gray-50 dark:bg-gray-950">
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-brand-green/10 dark:bg-brand-green/5 border-l-8 border-brand-green p-8 rounded-r-3xl">
                        <h3 className="text-xl font-black text-brand-green-dark dark:text-brand-green-light mb-3">Multi-Platform Ecosystem</h3>
                        <p className="text-gray-700 dark:text-gray-300 text-md leading-relaxed">
                            This platform is designed as a headless commerce engine for agriculture. Our API handles authentication, product management, orders, and AI services synchronously across all devices.
                            <br/><br/>
                            <span className="font-black">Production Endpoint:</span> <code className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 ml-2 shadow-sm">{apiDocs.baseUrl}</code>
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center"><span className="text-2xl mr-2">⚛️</span> React Native</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Since this is a TypeScript project, you can directly share the <code>types.ts</code> and <code>services/api.ts</code> files between your web and mobile projects (using Monorepo or copy-paste).
                            </p>
                            <button onClick={() => setActiveTab('sdk')} className="text-brand-green font-semibold text-sm hover:underline">View SDK Code &rarr;</button>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center"><span className="text-2xl mr-2">💙</span> Flutter</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Use the <code>http</code> package. Create Dart models matching the JSON structure shown in the "Endpoints" tab. Use <code>json_serializable</code> for parsing.
                            </p>
                            <button onClick={() => setActiveTab('endpoints')} className="text-brand-green font-semibold text-sm hover:underline">View JSON Contracts &rarr;</button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'endpoints' && (
                <div className="space-y-6">
                    {apiDocs.endpoints.map((ep, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700 flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${ep.method === 'GET' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{ep.method}</span>
                                    <code className="text-sm font-mono text-gray-800 dark:text-gray-200">{ep.path}</code>
                                </div>
                                <span className="text-xs text-gray-500">{ep.description}</span>
                            </div>
                            <div className="p-4">
                                {ep.params && (
                                    <div className="mb-4">
                                        <h5 className="text-xs font-bold uppercase text-gray-500 mb-2">Query Parameters</h5>
                                        <ul className="space-y-1">
                                            {ep.params.map((p: any, i: number) => (
                                                <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                                                    <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{p.name}</code> <span className="text-xs text-gray-500">({p.type})</span> - {p.desc}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {ep.body && (
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <h5 className="text-xs font-bold uppercase text-gray-500">Request Body Example</h5>
                                            <button onClick={() => copyToClipboard(JSON.stringify(ep.body, null, 2))} className="text-xs text-brand-green hover:underline">Copy JSON</button>
                                        </div>
                                        <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto font-mono">
                                            {JSON.stringify(ep.body, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'sdk' && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Copy this code into your project to immediately interact with the backend logic.
                    </p>
                    <div className="relative">
                        <button onClick={() => copyToClipboard("See services/api.ts file")} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-xs border border-white/20">Copy All</button>
                        <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg text-xs overflow-x-auto font-mono h-96">
{`// services/api.ts

import { Product, User, Order } from './types';

export const api = {
  auth: {
    login: async (email, password) => { 
      /* POST /auth/login */ 
    }
  },
  products: {
    getAll: async (category) => { 
      /* GET /products?category=... */ 
    },
    getById: async (id) => {
      /* GET /products/:id */
    }
  },
  orders: {
    create: async (orderData) => {
      /* POST /orders */
    }
  }
};

// Usage Example:
const products = await api.products.getAll('Seeds');`}
                        </pre>
                    </div>
                </div>
            )}

            {activeTab === 'expo' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-200 dark:border-gray-700">
                      <h4 className="text-xl font-black mb-4 flex items-center gap-3">
                        <Smartphone className="w-6 h-6 text-brand-green" /> 
                        Connect with Expo Go
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Integrating push notifications is easy. Use our specialized Expo endpoints to register device tokens.
                      </p>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-900 rounded-2xl overflow-hidden">
                          <p className="text-brand-green-light text-xs font-mono mb-2">// 1. Install Expo Notifications</p>
                          <code className="text-white text-xs">npx expo install expo-notifications expo-device</code>
                        </div>
                        
                        <div className="p-4 bg-gray-900 rounded-2xl overflow-hidden">
                          <p className="text-brand-green-light text-xs font-mono mb-2">// 2. Register Token with our API</p>
                          <pre className="text-white text-xs">{`const token = (await Notifications.getExpoPushTokenAsync()).data;
await fetch('${apiDocs.baseUrl}/expo/register-token', {
  method: 'POST',
  body: JSON.stringify({ userId, token })
});`}</pre>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700">
                        <h5 className="font-bold mb-2">Deep Linking</h5>
                        <p className="text-xs text-gray-500">Configure your app.json to handle <code>mkulima://</code> links from the web app or push notifications.</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700">
                        <h5 className="font-bold mb-2">Sentry Monitoring</h5>
                        <p className="text-xs text-gray-500">Ensure consistent bug tracking between Web and Expo by sharing your Sentry configuration.</p>
                      </div>
                    </div>
                </div>
            )}
        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsModal;
