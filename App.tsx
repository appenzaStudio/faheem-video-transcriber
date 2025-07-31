import React, { useState, useCallback } from 'react';
import { transcribeVideoStream } from './services/geminiService';
import FileUploader from './components/FileUploader';
import Header from './components/Header';
import Footer from './components/Footer';
import VideoTranscriptionCard, { Metadata } from './components/VideoTranscriptionCard';
import { Icon } from './components/Icon';

export interface FileState {
  id: string;
  file: File;
  status: 'awaiting_metadata' | 'queued' | 'preparing' | 'transcribing' | 'completed' | 'error';
  transcription: string;
  error?: string;
  metadata?: Metadata;
  progress?: number; // Progress percentage (0-100)
}

const App: React.FC = () => {
  const [files, setFiles] = useState<FileState[]>([]);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);

  const handleFileSelect = (selectedFiles: FileList) => {
    const newFiles: FileState[] = Array.from(selectedFiles)
      .filter(file => {
        if (file.size > 500 * 1024 * 1024) {
          alert(`الملف "${file.name}" كبير جدًا (الحد الأقصى 500 ميجابايت) وسيتم تجاهله.`);
          return false;
        }
        return !files.some(f => f.id === `${file.name}-${file.lastModified}-${file.size}`);
      })
      .map(file => ({
        id: `${file.name}-${file.lastModified}-${file.size}`,
        file,
        status: 'awaiting_metadata',
        transcription: '',
      }));
    setFiles(currentFiles => [...currentFiles, ...newFiles]);
  };
  
  const handleMetadataUpdate = useCallback((fileId: string, metadata: Metadata) => {
    setFiles(currentFiles =>
      currentFiles.map(f =>
        f.id === fileId ? { ...f, metadata, status: 'queued' } : f
      )
    );
  }, []);

  const handleStartAllTranscriptions = useCallback(async () => {
    const filesToTranscribe = files.filter(f => f.status === 'queued');
    if (filesToTranscribe.length === 0) return;

    setIsTranscribing(true);

    const transcriptionPromises = filesToTranscribe.map(fileState =>
        transcribeVideoStream(
          fileState.file,
          fileState.metadata!,
          (chunk) => { // onChunk
            setFiles(currentFiles =>
              currentFiles.map(f =>
                f.id === fileState.id ? { ...f, transcription: f.transcription + chunk } : f
              )
            );
          },
          (status) => { // onStatusChange
            setFiles(currentFiles => 
              currentFiles.map(f => 
                f.id === fileState.id ? { ...f, status } : f
              )
            );
          },
          (progress) => { // onProgress
            setFiles(currentFiles =>
              currentFiles.map(f =>
                f.id === fileState.id ? { ...f, progress } : f
              )
            );
          }
        ).then(() => {
             setFiles(currentFiles =>
                currentFiles.map(f =>
                  f.id === fileState.id && f.status !== 'error' ? { ...f, status: 'completed', progress: undefined } : f
                )
             );
        }).catch(error => {
            console.error(`Transcription failed for ${fileState.file.name}:`, error);
            setFiles(currentFiles =>
              currentFiles.map(f =>
                f.id === fileState.id ? { ...f, status: 'error', error: error.message, progress: undefined } : f
              )
            );
        })
    );
    
    await Promise.all(transcriptionPromises);
    setIsTranscribing(false);

  }, [files]);

  const handleClearCompleted = () => {
    setFiles(currentFiles => currentFiles.filter(f => f.status !== 'completed' && f.status !== 'error'));
  };

  const handleClearAll = () => {
    setFiles([]);
    setIsTranscribing(false);
  }

  const hasTranscribableFiles = files.some(f => f.status === 'queued');
  const hasCompletedFiles = files.some(f => f.status === 'completed' || f.status === 'error');

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="w-full max-w-4xl mx-auto p-4 flex-grow">
        <div className="mb-6">
          <FileUploader onFilesSelect={handleFileSelect} />
        </div>
        
        {files.length > 0 && (
          <div className="space-y-4">
              <div className="flex flex-col sm:flex-row-reverse justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleStartAllTranscriptions}
                        disabled={!hasTranscribableFiles || isTranscribing}
                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed dark:focus:ring-offset-slate-800 flex items-center gap-2"
                    >
                       <Icon name="play" className="w-5 h-5" />
                       {isTranscribing ? 'جاري التفريغ...' : `بدء التفريغ (${files.filter(f=>f.status === 'queued').length})`}
                    </button>
                    {hasCompletedFiles && (
                         <button
                            onClick={handleClearCompleted}
                            className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                            >
                            مسح المكتمل
                        </button>
                    )}
                </div>
                 <button
                    onClick={handleClearAll}
                    className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                    مسح الكل
                </button>
            </div>

            {files.map(fileState => (
              <VideoTranscriptionCard 
                key={fileState.id} 
                fileState={fileState} 
                onMetadataSave={handleMetadataUpdate}
              />
            ))}
          </div>
        )}

        {files.length === 0 && (
            <div className="text-center py-12">
                <Icon name="video" className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600" />
                <h3 className="mt-2 text-lg font-medium text-slate-800 dark:text-slate-200">لنبدأ!</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">ارفع ملفات الفيديو الخاصة بك لبدء عملية التفريغ الصوتي.</p>
            </div>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default App;
