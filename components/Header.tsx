import React from 'react';
import { Icon } from './Icon';

const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm">
      <div className="w-full max-w-4xl mx-auto p-4 flex items-center gap-3">
        <Icon name="files" className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          فهيم - أداة تفريغ الفيديوهات بالذكاء الاصطناعي
        </h1>
      </div>
    </header>
  );
};

export default Header;