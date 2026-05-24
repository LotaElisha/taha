import React from 'react';

interface PasswordStrengthIndicatorProps {
  password?: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password = '' }) => {
  const calculateStrength = (pass: string) => {
    let strength = 0;
    if (pass.length === 0) return 0;
    if (pass.length >= 8) strength++;
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength++;
    if (pass.match(/[0-9]/)) strength++;
    if (pass.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const strength = calculateStrength(password);
  
  if (!password) {
    return null;
  }

  const strengthLevels = [
    { label: 'Weak', color: 'bg-red-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Good', color: 'bg-blue-500' },
    { label: 'Strong', color: 'bg-green-500' },
  ];

  const currentStrength = strength > 0 ? strengthLevels[strength - 1] : { label: 'Weak', color: 'bg-red-500'};
  
  return (
    <div className="mt-2">
      <div className="flex space-x-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full ${index < strength ? currentStrength.color : 'bg-gray-200 dark:bg-gray-600'}`}
            style={{ transition: 'background-color 0.3s ease-in-out' }}
          />
        ))}
      </div>
      {strength > 0 && (
         <p className="text-xs text-right mt-1 font-semibold text-gray-600 dark:text-gray-300">{currentStrength.label}</p>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;