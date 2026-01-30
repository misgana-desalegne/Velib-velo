import React from 'react';
import { Loader } from 'lucide-react';

export type LoadingSpinnerProps = {
  size?: number; // px
  message?: string;
  className?: string;
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 48, message, className }) => {
  const px = `${size}px`;
  return (
    <div className={`flex flex-col items-center justify-center ${className || ''}`}>
      <div style={{ width: px, height: px }} className="flex items-center justify-center">
        <Loader className="w-full h-full text-gray-500 animate-spin" />
      </div>
      {message && <p className="text-sm text-gray-600 mt-3">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
