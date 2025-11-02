
import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      <p className="text-brand-primary text-sm font-medium">Обработка...</p>
    </div>
  );
};
