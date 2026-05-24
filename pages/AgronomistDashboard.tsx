import React from 'react';

// FIX: Changed JSX.Element to React.ReactNode to fix "Cannot find namespace 'JSX'" error.
const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-start space-x-4">
      <div className="bg-brand-brown-light p-3 rounded-full flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">{title}</h3>
        <p className="text-2xl font-bold text-brand-green-dark dark:text-white">{value}</p>
      </div>
    </div>
);

const AgronomistDashboard: React.FC = () => {
  const commonTopics = [
    'Maize stalk borer control',
    'Fertilizer application for tomatoes',
    'Identifying late blight in potatoes',
    'Soil testing and pH correction',
    'Weed management in bean fields',
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-brand-green-dark dark:text-gray-100 mb-6">Agronomist Dashboard</h1>
      
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard 
                title="Inquiries Handled (Month)" 
                value="128" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-green-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>} 
            />
            <StatCard 
                title="Average Response Time" 
                value="~15 mins" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-green-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
            />
            <StatCard 
                title="Farmer Satisfaction" 
                value="95%" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-green-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.94l-2.5 5M14 10L9 15m0 0l2 2m-2-2v-4a2 2 0 012-2h2.5" /></svg>} 
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Common Topics This Week</h3>
                <ul className="space-y-3">
                    {commonTopics.map((topic, index) => (
                        <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-brand-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {topic}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center flex flex-col items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-brand-green mb-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15v1a1 1 0 001 1h12a1 1 0 001-1v-1a1 1 0 00-.293-.707L16 11.586V8a6 6 0 00-6-6zM8.05 17a2 2 0 103.9 0H8.05z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM5.5 10a.5.5 0 01.5-.5h8a.5.5 0 010 1H6a.5.5 0 01-.5-.5z" clipRule="evenodd" />
                </svg>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Ready to Assist</h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                    Use the <span className="font-semibold text-brand-green-dark dark:text-brand-green-light">AI Crop Advisor</span> widget to receive and respond to inquiries from farmers.
                </p>
            </div>
        </div>
    </div>
  );
};

export default AgronomistDashboard;