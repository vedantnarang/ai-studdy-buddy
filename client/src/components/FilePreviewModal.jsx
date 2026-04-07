import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const FilePreviewModal = ({ file, onClose, topicId }) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState(file?.diagramExplanation || '');
  const [explainError, setExplainError] = useState('');
  
  // New state for manual & AI text extraction
  const [isEditingText, setIsEditingText] = useState(false);
  const [editableText, setEditableText] = useState(file?.extractedText || '');
  const [isExtracting, setIsExtracting] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Bulletproof state synchronization
  React.useEffect(() => {
    if (file) {
      setExplanation(file.diagramExplanation || '');
      setCustomPrompt('');
      setExplainError('');
      setIsEditingText(false);
      setEditableText(file.extractedText || '');
      setSaveError('');
      setIsExplaining(false);
      setIsExtracting(false);
    }
  }, [file]);

  if (!file) return null;
  const isImage = file.type?.startsWith('image/');

  const handleExplainDiagram = async () => {
    if (!file._id || !topicId) {
      setExplainError('Cannot explain: missing image or topic reference.');
      return;
    }

    setIsExplaining(true);
    setExplainError('');

    try {
      const res = await fetch(
        `${API_BASE}/api/topics/${topicId}/documents/${file._id}/explain`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customPrompt }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || data?.message || 'Explanation failed');
      }

      setExplanation(data.data?.explanation || '');
    } catch (err) {
      setExplainError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleExtractText = async () => {
    if (!file._id || !topicId) return;
    setIsExtracting(true);
    setSaveError('');

    try {
      const res = await fetch(`${API_BASE}/api/topics/${topicId}/images`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: file._id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Extraction failed');

      setEditableText(data.data?.extractedText || '');
      setIsEditingText(false);
    } catch (err) {
      setSaveError(err.message || 'Failed to extract text.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveManualText = async () => {
    if (!file._id || !topicId) return;
    setIsExtracting(true);
    setSaveError('');

    try {
      const res = await fetch(`${API_BASE}/api/topics/${topicId}/documents/${file._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedText: editableText }),
      });

      if (!res.ok) throw new Error('Failed to save text.');
      setIsEditingText(false);
    } catch (err) {
      setSaveError(err.message || 'Failed to save text.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden ${
          isImage ? 'w-full max-w-6xl' : 'w-full max-w-5xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-8">
            {isImage ? '🖼️ ' : '📄 '}Preview: {file.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-1.5 focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        {isImage ? (
          /* ── Split view ──────────────────────────────────────────── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 max-h-[85vh] overflow-hidden">

            {/* Left – sticky image */}
            <div className="bg-gray-50 dark:bg-gray-900/60 flex items-start justify-center p-4 overflow-y-auto">
              <div className="md:sticky md:top-4 w-full">
                <img
                  src={file.preview || file.url}
                  alt={`Preview of ${file.name}`}
                  className="max-h-[76vh] w-full object-contain rounded-lg"
                />
              </div>
            </div>

            {/* Right – AI panel */}
            <div className="flex flex-col gap-5 p-5 overflow-y-auto max-h-[85vh] border-l border-gray-200 dark:border-gray-700">

              <section>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Extracted Text
                  </h4>
                  {!isEditingText && editableText && (
                    <button 
                      onClick={() => setIsEditingText(true)}
                      className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      Edit
                    </button>
                  )}
                </div>

                {isEditingText ? (
                  <div className="flex flex-col gap-3">
                    <textarea 
                      value={editableText}
                      onChange={(e) => setEditableText(e.target.value)}
                      placeholder="Type the text found in the image here..."
                      className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        disabled={isExtracting}
                        onClick={() => { setIsEditingText(false); setEditableText(file.extractedText || ''); }}
                        className="px-3 py-1.5 text-xs text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                         disabled={isExtracting}
                         onClick={handleSaveManualText}
                         className="px-3 py-1.5 text-xs bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        {isExtracting ? 'Saving...' : 'Save Text'}
                      </button>
                    </div>
                  </div>
                ) : editableText ? (
                  <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-gray-200 dark:border-gray-700">
                    {editableText}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 bg-gray-50 dark:bg-gray-900/40 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                      No text has been extracted for this image yet.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <button 
                        onClick={handleExtractText}
                        disabled={isExtracting}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 transition-all shadow-sm"
                      >
                        {isExtracting ? (
                           <>
                           <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                           </svg>
                           Extracting...
                         </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            Vision AI Extraction
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => setIsEditingText(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">keyboard</span>
                        Give Manually
                      </button>
                    </div>
                  </div>
                )}
                {saveError && <p className="text-xs text-red-500 mt-2">{saveError}</p>}
              </section>

              <div className="border-t border-gray-200 dark:border-gray-700" />

              {/* Explain section */}
              <section className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  Diagram Explanation
                </h4>

                {/* Explanation output */}
                {explanation ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/50 rounded-lg p-4">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {explanation}
                    </ReactMarkdown>
                  </div>
                ) : !explainError && (
                  <div className="text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/40 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center italic">
                    Generate an AI explanation of this diagram below.
                  </div>
                )}
                
                {/* Error state */}
                {explainError && (
                  <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg p-3">
                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {explainError}
                  </div>
                )}

                {/* Only show prompt if explanation hasn't been generated yet */}
                {!explanation && (
                  <div className="flex gap-2 items-start mt-2">
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Add specific context to explain... (Optional)"
                      rows={1}
                      className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                    <button
                      type="button"
                      onClick={handleExplainDiagram}
                      disabled={isExplaining}
                      className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      {isExplaining ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        </>
                      ) : (
                        <>Generate</>
                      )}
                    </button>
                  </div>
                )}
              </section>
            </div>
          </div>

        ) : file.type === 'application/pdf' ? (
          <div className="p-2">
            <iframe
              src={file.preview}
              title={`Preview of ${file.name}`}
              className="w-full h-[85vh] rounded-lg bg-white"
            />
          </div>

        ) : (
          <div className="flex items-center justify-center h-[50vh] text-gray-500 flex-col gap-3 p-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Preview not available for this file type.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePreviewModal;
