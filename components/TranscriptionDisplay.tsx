import React from 'react';

interface TranscriptionDisplayProps {
  content: string;
  placeholder: string;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ content, placeholder }) => {
  const baseClasses = "w-full min-h-[120px] max-h-60 overflow-y-auto p-3 rounded-md text-sm leading-relaxed";

  // If there's no content, show the placeholder with specific styling.
  if (!content) {
    return (
      <div className={`${baseClasses} bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-500 dark:text-slate-400 italic`}>
        {placeholder}
      </div>
    );
  }

  // If there is content, render it inside a styled div.
  // `dangerouslySetInnerHTML` is used to render the <u> tags for highlighting.
  // `transcription-content` class is crucial for applying the underline styles from index.html.
  // `white-space: 'pre-wrap'` ensures that newlines from the stream are respected.
  return (
    <div
      className={`${baseClasses} bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600/50 transcription-content`}
      style={{ whiteSpace: 'pre-wrap' }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default TranscriptionDisplay;
