import React from 'react';

const FilePreviewModal = ({ file, onClose }) => {
  if (!file) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden p-4"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
      >
        {/* Header / Close Button */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-8">
            Preview: {file.name}
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-1.5 focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Content */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
          {file.type.startsWith('image/') ? (
            <img 
              src={file.preview} 
              alt={`Preview of ${file.name}`}
              className="max-h-[85vh] object-contain mx-auto" 
            />
          ) : file.type === 'application/pdf' ? (
            <iframe 
              src={file.preview} 
              title={`Preview of ${file.name}`}
              className="w-full h-[85vh] rounded-lg bg-white" 
            />
          ) : (
             <div className="flex items-center justify-center h-[50vh] text-gray-500 flex-col gap-3">
                 <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <p>Preview not available for this file type.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
