import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTopic } from '../hooks/useTopic';
import { useDebounce } from '../hooks/useDebounce';
import DocumentUpload from '../components/DocumentUpload';
import DocumentModal from '../components/DocumentModal';
import AIPanel from '../components/AIPanel';

const TopicDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    topic, setTopic, loading, error, 
    updateNotes, uploadDocuments, updateDocumentText, deleteDocument 
  } = useTopic(id);
  
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [savingDoc, setSavingDoc] = useState(false);
  
  // Initialize local notes state when topic loads
  useEffect(() => {
    if (topic && typeof topic.notes === 'string') {
      setNotes(topic.notes);
    }
  }, [topic?.notes]);

  // Handle Debounce Auto-Save
  const debouncedNotes = useDebounce(notes, 2000);
  
  useEffect(() => {
    if (!topic || debouncedNotes === topic.notes) return;
    
    const saveChanges = async () => {
      setIsSaving(true);
      await updateNotes(debouncedNotes);
      setIsSaving(false);
    };
    
    saveChanges();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedNotes]);

  const handleBlur = async () => {
    if (!topic || notes === topic.notes) return;
    setIsSaving(true);
    await updateNotes(notes);
    setIsSaving(false);
  };

  const handleUpload = async (files) => {
    setUploading(true);
    const result = await uploadDocuments(files);
    setUploading(false);
    return result;
  };

  const handleDocumentSave = async (documentId, extractedText) => {
    setSavingDoc(true);
    const result = await updateDocumentText(documentId, extractedText);
    setSavingDoc(false);
    if (result.success) {
      // Update the selectedDoc to reflect the new text
      setSelectedDoc(prev => prev ? { ...prev, extractedText } : null);
    }
  };

  const handleDocumentDelete = async (e, documentId) => {
    e.stopPropagation();
    if (!window.confirm('Remove this document? This cannot be undone.')) return;
    await deleteDocument(documentId);
  };

  const handleAIGenerated = (updatedTopic) => {
    setTopic(updatedTopic);
  };

  if (loading && !topic) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="p-6 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl">
        <h3 className="text-lg font-bold mb-2">Error Loading Topic</h3>
        <p>{error || 'Topic not found'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  const sourceDocuments = topic.sourceDocuments || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <button 
            onClick={() => navigate(`/subject/${topic.subjectId}`)}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 mb-2 transition-colors"
          >
            &larr; Back to Subject
          </button>
          <div className="flex items-center gap-3">
             <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{topic.title}</h1>
             {isSaving && <span className="text-sm px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 rounded-full animate-pulse transition-opacity">Saving...</span>}
             {!isSaving && notes === topic.notes && <span className="text-sm px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 rounded-full transition-opacity">Saved</span>}
          </div>
        </div>

        {/* Study Mode Links */}
        <div className="flex gap-3">
           {topic.flashcards && topic.flashcards.length > 0 && (
             <Link 
               to={`/topic/${topic._id}/flashcards`}
               className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm transition-colors"
             >
               Study Flashcards
             </Link>
           )}
           {topic.quiz && topic.quiz.length > 0 && (
             <Link 
               to={`/topic/${topic._id}/quiz`}
               className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg shadow-sm transition-colors"
             >
               Take Quiz
             </Link>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Notes, Source Documents & Upload */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* My Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Notes</h3>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleBlur}
              placeholder="Start typing your notes here. They will save automatically..."
              className="flex-1 w-full bg-transparent resize-none border-0 focus:ring-0 p-0 text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none"
            />
          </div>

          {/* Source Documents Section */}
          {sourceDocuments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                Source Documents
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({sourceDocuments.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sourceDocuments.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => setSelectedDoc(doc)}
                    className="group relative flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    {/* PDF/TXT icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      doc.fileType === 'pdf' 
                        ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' 
                        : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.fileName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                        {doc.fileType.toUpperCase()} • {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                        {doc.extractionMethod === 'ocr' && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 rounded">OCR</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">
                        {doc.extractedText ? doc.extractedText.substring(0, 80) + (doc.extractedText.length > 80 ? '...' : '') : 'No text extracted'}
                      </p>
                    </div>
                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDocumentDelete(e, doc._id)}
                      className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      title="Remove document"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <DocumentUpload onUpload={handleUpload} uploading={uploading} />
        </div>

        {/* Right Column: AI Panel & Summary */}
        <div className="space-y-6">
          <AIPanel topic={topic} onGenerated={handleAIGenerated} />
          
          {topic.summary && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                AI Summary
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                {topic.summary}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Document Modal */}
      <DocumentModal
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onSave={handleDocumentSave}
        saving={savingDoc}
      />
    </div>
  );
};

export default TopicDetail;
