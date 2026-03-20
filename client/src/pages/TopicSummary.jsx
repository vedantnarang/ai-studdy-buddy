import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTopic } from '../hooks/useTopic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useReactToPrint } from 'react-to-print';
import rehypeRaw from 'rehype-raw';
import toast from 'react-hot-toast';
import api from '../services/api';

const TopicSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { topic, loading, error, updateSummaryText, setTopic } = useTopic(id);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subjectColor, setSubjectColor] = useState('#0053db'); // Default primary blue fallback
  
  const printRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (topic && typeof topic.summary === 'string') {
      setEditValue(topic.summary);
    }
  }, [topic?.summary]);

  useEffect(() => {
    if (topic?.subjectId) {
      api.get(`/subjects/${topic.subjectId}`)
        .then(res => {
          const color = res.data.data?.color || res.data.subject?.color || res.data?.color || '#0053db';
          setSubjectColor(color);
        })
        .catch(err => console.error("Could not load subject theme color:", err));
    }
  }, [topic?.subjectId]);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') ||  
                   window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
           setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(topic?.summary || '');
    toast.success('Summary copied to clipboard!');
  };

  const handleExportPDF = useReactToPrint({
    contentRef: printRef,
    documentTitle: topic ? `${topic.title}_Summary` : 'Topic_Summary',
    onAfterPrint: () => toast.success('Exported to PDF!'),
  });

  const handleSave = async () => {
    setSaving(true);
    const result = await updateSummaryText(editValue);
    setSaving(false);
    if (result.success) {
      toast.success('Summary updated!');
      setIsEditing(false);
    } else {
      toast.error('Failed to save summary updates');
    }
  };

  const handleCancel = () => {
    setEditValue(topic?.summary || '');
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Are you sure you want to regenerate the summary? This will completely overwrite the existing deep dive with a new AI generation based on your current notes and documents.')) return;
    
    setIsRegenerating(true);
    try {
      const endpoint = `/topics/${topic._id}/generate/summary`;
      const res = await api.post(endpoint, { forceRegenerate: true });
      const updatedData = res.data.data || res.data.topic || res.data;
      setTopic(updatedData);
      toast.success('Summary regenerated successfully!');
    } catch (err) {
      if (err.response?.status === 429) {
         toast.error("AI is taking a breather, try again in 30s");
      } else {
         toast.error(err.response?.data?.message || err.message || 'Failed to regenerate summary');
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  const applyFormat = (prefix, suffix) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editValue.substring(start, end);
    
    // If no text is selected, just insert the formatting tags and put cursor between them
    const newText = editValue.substring(0, start) + prefix + selectedText + suffix + editValue.substring(end);
    setEditValue(newText);
    
    // Set cursor focus back after React state updates
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  if (loading && !topic) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tertiary"></div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="p-6 bg-error-container text-on-error-container rounded-3xl border border-red-200">
        <h3 className="text-lg font-bold mb-2">Error Loading Summary</h3>
        <p>{error || 'Topic not found'}</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 px-6 py-3 bg-white hover:bg-surface-container font-bold rounded-xl shadow-sm transition-colors text-sm uppercase tracking-wider">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-in fade-in duration-300">
      
      {/* Header and Back navigation */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate(`/topic/${topic._id}`)}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-outline-variant/20 hover:bg-outline-variant/30 text-on-surface-variant text-xs font-bold tracking-widest uppercase transition-colors mb-4"
          >
            &larr; Back to Topic
          </button>
          <div className="flex items-center gap-3">
             <span className="material-symbols-outlined text-tertiary text-3xl">auto_awesome</span>
             <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface dark:text-gray-100">
               AI Deep Dive: {topic.title}
             </h1>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-surface-container-low dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          {!isEditing ? (
            <>
              <button 
                onClick={handleCopy}
                className="p-2.5 text-on-surface-variant hover:text-tertiary hover:bg-tertiary-container dark:hover:bg-tertiary-900/40 rounded-xl transition-colors shrink-0"
                title="Copy to clipboard"
              >
                <span className="material-symbols-outlined text-xl block">content_copy</span>
              </button>
              
              <button 
                onClick={() => handleExportPDF()}
                className="p-2.5 text-on-surface-variant hover:text-error hover:bg-error-container dark:hover:bg-error-900/40 rounded-xl transition-colors shrink-0 tooltip-trigger"
                title="Export to PDF"
              >
                <span className="material-symbols-outlined text-xl block">picture_as_pdf</span>
              </button>
              
              <div className="w-px h-8 bg-outline-variant/30 dark:bg-gray-600 mx-1"></div>
              
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2.5 text-sm font-bold bg-white dark:bg-gray-700 text-on-surface dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                Edit
              </button>

              <button 
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="px-4 py-2.5 text-sm font-bold bg-tertiary hover:bg-tertiary-dim text-white rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-lg ${isRegenerating ? 'animate-spin' : ''}`}>
                  {isRegenerating ? 'sync' : 'refresh'}
                </span>
                Regenerate
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2.5 text-sm font-bold text-on-surface-variant bg-surface-container-highest dark:bg-gray-700 hover:bg-surface-variant dark:hover:bg-gray-600 rounded-xl transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 text-sm font-bold text-white bg-tertiary hover:bg-tertiary-dim rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                disabled={saving}
              >
                {saving && <span className="material-symbols-outlined animate-spin text-lg">sync</span>}
                Save Changes
              </button>
            </>
          )}
        </div>
      </header>

      {/* Reading Canvas */}
      <div className="bg-surface-container-lowest dark:bg-[#0d1117] rounded-3xl p-8 md:p-12 lg:p-16 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100 dark:border-gray-800 transition-colors duration-300 relative">
        <style dangerouslySetInnerHTML={{ __html: `
          .custom-highlight mark {
            background-color: ${subjectColor}40 !important;
            color: ${subjectColor} !important;
            padding: 0.1em 0.3em;
            border-radius: 0.25em;
            font-weight: 600;
          }
        `}} />
        
        {isEditing ? (
          <div className="flex flex-col h-[70vh] border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
            {/* Custom Toolbar */}
            <div className="flex items-center gap-2 p-2 px-4 border-b border-gray-200 dark:border-gray-700 bg-surface-container-low dark:bg-gray-800 flex-wrap">
              <button 
                onClick={() => applyFormat('**', '**')}
                className="w-8 h-8 flex items-center justify-center font-bold text-on-surface dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Bold (Selection or Cursor)"
              >
                B
              </button>
              <button 
                onClick={() => applyFormat('*', '*')}
                className="w-8 h-8 flex items-center justify-center italic font-serif font-bold text-on-surface dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Italic (Selection or Cursor)"
              >
                I
              </button>
              <div className="w-px h-5 mx-1 bg-gray-300 dark:bg-gray-600"></div>
              <button 
                onClick={() => applyFormat('<mark>', '</mark>')}
                className="px-3 h-8 flex items-center justify-center font-bold rounded transition-colors text-sm"
                style={{ backgroundColor: `${subjectColor}20`, color: subjectColor }}
                title="Highlight Selection with Subject Theme"
              >
                <span className="material-symbols-outlined text-[16px] mr-1">format_ink_highlighter</span>
                Highlight
              </button>
            </div>
            
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 w-full bg-transparent resize-none p-6 outline-none font-mono text-sm leading-relaxed text-on-surface dark:text-gray-200"
              placeholder="Start editing your summary using Markdown syntax..."
            />
          </div>
        ) : (
          <div ref={printRef} className="prose custom-highlight prose-slate dark:prose-invert prose-lg max-w-none font-body text-gray-800 dark:text-gray-200 prose-headings:font-headline prose-headings:font-bold prose-a:text-tertiary prose-h2:text-tertiary prose-code:bg-surface-container-high dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code({node, inline, className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={atomDark}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-2xl overflow-hidden shadow-sm mt-6 mb-6"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={`${className} bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-tertiary dark:text-tertiary-fixed before:content-none after:content-none`} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {topic?.summary || '*No deep dive summary generated yet.*'}
            </ReactMarkdown>
          </div>
        )}
      </div>

    </div>
  );
};

export default TopicSummary;
