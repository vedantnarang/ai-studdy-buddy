import { useState, useRef, useEffect } from 'react';

const DocumentUpload = ({ onUpload, uploading: externalUploading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, [files]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
    // Reset file input so the same files can be selected again
    e.target.value = '';
  };

  const isImageType = (type) => type.startsWith('image/');

  const addFiles = (newFiles) => {
    setError('');
    const validTypes = ['application/pdf', 'text/plain', 'image/webp', 'image/png', 'image/jpeg'];
    const maxSize = 5 * 1024 * 1024;
    const validFiles = [];

    for (const file of newFiles) {
      if (!validTypes.includes(file.type)) {
        setError(`"${file.name}" is not a valid file type. Only PDF, TXT, JPG, PNG, and WEBP files are allowed.`);
        continue;
      }
      if (file.size > maxSize) {
        setError(`"${file.name}" is too large. Max size is 5MB.`);
        continue;
      }
      // Prevent duplicate file names
      const alreadyAdded = files.some(f => f.name === file.name && f.size === file.size);
      if (!alreadyAdded) {
        // Add preview URL for images
        if (isImageType(file.type)) {
          file.preview = URL.createObjectURL(file);
        }
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => {
      const removed = prev[index];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
    setError('');
  };

  const handleUpload = async () => {
    if (files.length === 0 || !onUpload) return;
    const result = await onUpload(files);
    if (result?.success) {
      // Clean up previews before clearing
      files.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
      setFiles([]);
    }
  };

  const uploading = externalUploading;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Documents</h3>
      
      {/* Drop Zone */}
      <div 
        className={`relative flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl transition-colors cursor-pointer hover:shadow-lg hover:border-blue-400 hover:border-2  hover:border-solid transition-all duration-500 ${
          dragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input 
          ref={inputRef}
          type="file" 
          className="hidden" 
          accept="application/pdf,text/plain,image/webp,image/png,image/jpeg" 
          onChange={handleChange} 
          multiple
        />
        <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
        <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">PDF, TXT, or images (JPG, PNG, WEBP) — MAX. 5MB each</p>
      </div>

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{files.length} file(s) selected</p>
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3 overflow-hidden">
                {isImageType(file.type) && file.preview ? (
                  <img 
                    src={file.preview} 
                    alt={file.name} 
                    className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-200 dark:border-gray-600"
                  />
                ) : (
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                )}
                <div className="truncate">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                disabled={uploading}
                className="text-gray-400 hover:text-red-500 p-1.5 disabled:opacity-50 transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          
          <button 
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-3"
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {files.some(f => isImageType(f.type)) ? 'Extracting text via Vision AI...' : 'Extracting Text...'}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Upload & Extract ({files.length} file{files.length > 1 ? 's' : ''})
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default DocumentUpload;
