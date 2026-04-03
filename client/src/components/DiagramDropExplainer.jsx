import React, { useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

/* ── Retry Modal ─────────────────────────────────────────────────────────── */
const RetryModal = ({ code, message, existingImage, onRetry, onDismiss, onPreviewRequested }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    onClick={onDismiss}
  >
    <div
      className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Icon */}
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
        code === 'MODELS_BUSY'
          ? 'bg-amber-100 dark:bg-amber-900/30'
          : code === 'FILE_ALREADY_EXISTS'
          ? 'bg-blue-100 dark:bg-blue-900/30'
          : 'bg-orange-100 dark:bg-orange-900/30'
      }`}>
        {code === 'MODELS_BUSY' ? (
          <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : code === 'FILE_ALREADY_EXISTS' ? (
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        {code === 'MODELS_BUSY' ? 'AI Models are Busy' : code === 'FILE_ALREADY_EXISTS' ? 'Image Already Exists' : 'Slow Down a Little'}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
        {message}
      </p>

      <div className="flex flex-col gap-2">
        {code === 'FILE_ALREADY_EXISTS' ? (
          <button
            onClick={() => {
              onDismiss();
              if (onPreviewRequested && existingImage) {
                onPreviewRequested(existingImage);
              }
            }}
            className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Okay
          </button>
        ) : (
          <>
            <button
              onClick={onRetry}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              ↺ Try Again
            </button>
            <button
              onClick={onDismiss}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Dismiss
            </button>
          </>
        )}
      </div>
    </div>
  </div>
);

const DiagramDropExplainer = ({ topicId, onImageSaved, onPreviewRequested }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [image, setImage] = useState(null);       // { file, preview }
  const [prompt, setPrompt] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [inlineError, setInlineError] = useState('');
  const [retryModal, setRetryModal] = useState(null); 

  const inputRef = useRef(null);


  const loadFile = (file) => {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setInlineError('Only JPG, PNG, or WEBP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setInlineError('Image must be under 5 MB.');
      return;
    }
    setInlineError('');
    setExplanation('');
    setRetryModal(null);
    setImage({ file, preview: URL.createObjectURL(file) });
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    loadFile(e.dataTransfer.files?.[0]);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave  = () => setIsDragging(false);
  const handleFileInput  = (e) => loadFile(e.target.files?.[0]);

  const handleClear = () => {
    setImage(null);
    setExplanation('');
    setInlineError('');
    setRetryModal(null);
    setPrompt('');
    if (inputRef.current) inputRef.current.value = '';
  };


  const handleExplain = async () => {
    if (!image?.file) return;
    setIsExplaining(true);
    setInlineError('');
    setRetryModal(null);

    try {
      const form = new FormData();
      form.append('image', image.file);
      form.append('prompt', prompt);

      const res = await fetch(`${API_BASE}/api/topics/${topicId}/explain-diagram`, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });

      const data = await res.json();

      // Hard failure (auth, validation, Cloudinary) — inline error, nothing was saved
      if (!res.ok) {
        if (data?.error?.code === 'FILE_ALREADY_EXISTS') {
          setRetryModal({
            code: data.error.code,
            message: data.error.message,
            existingImage: data.error.existingImage
          });
          return;
        }
        throw new Error(data?.error?.message || 'Upload failed');
      }

      const { explanation: text, savedImage, aiError } = data.data;

      // Image was saved regardless — notify parent to append to uploads list
      if (savedImage && typeof onImageSaved === 'function') {
        onImageSaved(savedImage);
      }

      // AI failed but image is still persisted → show retry modal
      if (aiError) {
        setRetryModal({ code: aiError.code, message: aiError.message });
        return;
      }

      setExplanation(text || '');
    } catch (err) {
      setInlineError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsExplaining(false);
    }
  };

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <>
      {/* Retry modal — rendered outside the card so it covers the full screen */}
      {retryModal && (
        <RetryModal
          code={retryModal.code}
          message={retryModal.message}
          existingImage={retryModal.existingImage}
          onRetry={() => { setRetryModal(null); handleExplain(); }}
          onDismiss={() => setRetryModal(null)}
          onPreviewRequested={onPreviewRequested}
        />
      )}

      <div className="bg-[#f0f4f7]/50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-outline-variant/30 dark:border-gray-700 overflow-hidden transition-colors">

        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[#e1e9ee] dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <h4 className="font-headline font-bold text-on-surface dark:text-gray-200 text-lg mb-1">
            Explain a Diagram
          </h4>
          <p className="text-sm text-on-surface-variant dark:text-gray-400 leading-relaxed">
            Drop any diagram or image for an instant AI explanation.
          </p>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-3">

          {/* Drop zone / image preview */}
          {!image ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => inputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.02]'
                  : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10'
              }`}
            >
              <svg
                className={`w-8 h-8 transition-colors ${isDragging ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Click to upload</span>{' '}
                or drag &amp; drop
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">JPG, PNG, WEBP — max 5 MB</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          ) : (
            /* Image preview */
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
              <img
                src={image.preview}
                alt="Diagram to explain"
                className="w-full max-h-52 object-contain bg-gray-50 dark:bg-gray-900/50"
              />
              <button
                onClick={handleClear}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/60 to-transparent px-3 py-2">
                <p className="text-white text-xs font-medium truncate">{image.file.name}</p>
              </div>
            </div>
          )}

          {/* Optional prompt */}
          {image && (
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask something specific, e.g. 'What does the arrow represent?'"
              rows={2}
              className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          )}

          {/* Inline validation / generic error */}
          {inlineError && (
            <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 rounded-xl p-3">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {inlineError}
            </div>
          )}

          {/* CTA */}
          <button
            type="button"
            onClick={image ? handleExplain : () => inputRef.current?.click()}
            disabled={isExplaining}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2
              bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400
              border border-indigo-200 dark:border-indigo-700/50
              hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white
              hover:border-indigo-600 hover:shadow-md"
          >
            {isExplaining ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Analyzing…
              </>
            ) : image ? (
              <>✨ Explain this Diagram</>
            ) : (
              <>Upload an Image</>
            )}
          </button>

          {/* Explanation output */}
          {explanation && (
            <div className="mt-1 prose prose-sm dark:prose-invert max-w-none bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/40 rounded-2xl p-4 max-h-72 overflow-y-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {explanation}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DiagramDropExplainer;
