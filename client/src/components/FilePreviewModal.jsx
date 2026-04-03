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

              {/* Extracted text */}
              {file.extractedText ? (
                <section>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
                    Extracted Text
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-gray-200 dark:border-gray-700">
                    {file.extractedText}
                  </div>
                </section>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                  No text was extracted from this image.
                </p>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700" />

              {/* Explain section */}
              <section className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  ✨ Explain this Diagram
                </h4>

                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add specific context or questions..."
                  rows={3}
                  className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />

                <button
                  type="button"
                  onClick={handleExplainDiagram}
                  disabled={isExplaining}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {isExplaining ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Explaining…
                    </>
                  ) : (
                    <>✨ Explain this Diagram</>
                  )}
                </button>

                {/* Error state */}
                {explainError && (
                  <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg p-3">
                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {explainError}
                  </div>
                )}

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
                  <div className="text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/40 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                    The AI explanation will appear here.
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
