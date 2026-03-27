import { useState } from 'react';

const ExtractionFailureModal = ({ failedImages, onClose, onManualEntry, onRetry }) => {
  const [retryingIds, setRetryingIds] = useState(new Set());

  if (!failedImages || failedImages.length === 0) return null;

  const handleRetry = async (imageId) => {
    setRetryingIds(prev => new Set(prev).add(imageId));
    await onRetry(imageId);
    setRetryingIds(prev => {
      const next = new Set(prev);
      next.delete(imageId);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Text Extraction Partial Failure</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Models are currently busy, text could not be extracted.</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {failedImages.map((img) => (
            <div key={img._id} className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600">
              <img 
                src={img.url} 
                alt="Failed extraction" 
                className="w-20 h-20 rounded-xl object-cover border border-gray-200 dark:border-gray-600"
              />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{img.fileName || 'Image'}</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                  <button
                    onClick={() => onManualEntry(img)}
                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                  >
                    Add Manually
                  </button>
                  <button
                    onClick={() => handleRetry(img._id)}
                    disabled={retryingIds.has(img._id)}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {retryingIds.has(img._id) ? (
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : null}
                    {retryingIds.has(img._id) ? 'Retrying...' : 'Retry'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-gray-50/50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            I'll do it later
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtractionFailureModal;
