
import React from 'react';
import { Icon } from './Icon';

interface ErrorMessageProps {
  message: string;
  onClear: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClear }) => {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative mb-6 flex items-start gap-3" role="alert">
      <Icon name="alert" className="w-5 h-5 mt-0.5 text-red-500"/>
      <div className="flex-grow">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{message}</span>
      </div>
       <button onClick={onClear} className="p-1 -m-1">
          <Icon name="close" className="w-5 h-5 text-red-600 dark:text-red-400 hover:opacity-75" />
       </button>
    </div>
  );
};

export default ErrorMessage;
