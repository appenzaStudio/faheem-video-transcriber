import React, { useState, useCallback, useRef } from 'react';
import { Icon } from './Icon';

interface FileUploaderProps {
  onFilesSelect: (files: FileList) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFiles = (files: FileList): boolean => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`ملف "${file.name}" كبير جداً (${fileSizeMB} ميجابايت).\nالحد الأقصى المدعوم: 50 ميجابايت.\nحاول ضغط الفيديو أولاً.`);
        return false;
      }
    }
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (validateFiles(e.dataTransfer.files)) {
        onFilesSelect(e.dataTransfer.files);
      }
      e.dataTransfer.clearData();
    }
  }, [onFilesSelect]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (validateFiles(e.target.files)) {
        onFilesSelect(e.target.files);
      }
    }
  };
  
  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all duration-300 ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-slate-700' : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex flex-col items-center">
        <Icon name="upload" className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-4" />
        <p className="text-slate-600 dark:text-slate-400 mb-2">
          <button
            type="button"
            onClick={onButtonClick}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus:outline-none"
          >
            اضغط للرفع
          </button>
          {' '}أو قم بسحب وإفلات الفيديوهات
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500">ملفات الفيديو (MP4, MOV, إلخ) - 500 ميجابايت كحد أقصى لكل ملف</p>
      </div>
    </div>
  );
};

export default FileUploader;