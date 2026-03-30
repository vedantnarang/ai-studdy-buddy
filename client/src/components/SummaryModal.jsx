import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useReactToPrint } from 'react-to-print';
import MDEditor from '@uiw/react-md-editor';
import toast from 'react-hot-toast';
import { formatMathForMarkdown } from '../utils/formatMathForMarkdown';

const SummaryModal = ({ summary, onClose, onSave, saving }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(summary || '');
  const printRef = useRef(null);

  useEffect(() => {
    setEditValue(summary || '');
  }, [summary]);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary || '');
    toast.success('Summary copied to clipboard!');
  };

  const handleExportPDF = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Topic_Summary',
    onAfterPrint: () => toast.success('Exported to PDF!'),
  });

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(summary || '');
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200"
         onClick={onClose}>
      
      {/* Modal Container */}
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[95vw] max-w-7xl max-h-[90vh] flex flex-col overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/80">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Topic Summary
          </h2>
          
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button 
                  onClick={handleCopy}
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
                <button 
                  onClick={() => handleExportPDF()}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
                  title="Export to PDF"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  PDF
                </button>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 font-medium rounded-lg transition-colors flex items-center gap-1.5 ml-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Edit
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 font-medium rounded-lg transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving && <span className="animate-spin text-white">↻</span>}
                  Save Changes
                </button>
              </>
            )}

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>

            <button 
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0d1117]">
          {isEditing ? (
            <div className="h-full w-full custom-md-editor" data-color-mode="light">
              <MDEditor
                value={editValue}
                onChange={setEditValue}
                height="100%"
                preview="live"
                hideToolbar={false}
                visibleDragbar={false}
                className="border-0! rounded-none! min-h-[500px]"
              />
            </div>
          ) : (
            <div className="p-8">
              {/* Ref wrapper for printing capability */}
              <div ref={printRef} className="prose prose-indigo prose-img:rounded-xl max-w-none dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  remarkRehypeOptions={{ allowDangerousHtml: true }}
                  rehypePlugins={[rehypeRaw, rehypeKatex]}
                  components={{
                    code({inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={atomDark}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-xl overflow-hidden shadow-sm"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={`${className} bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 before:content-none after:content-none`} {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {formatMathForMarkdown(summary || '*No summary available.*')}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;
