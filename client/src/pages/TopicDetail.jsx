import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTopic } from '../hooks/useTopic';
import { useDebounce } from '../hooks/useDebounce';
import DocumentUpload from '../components/DocumentUpload';
import DocumentModal from '../components/DocumentModal';
import AIPanel from '../components/AIPanel';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const TopicDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    topic, setTopic, loading, error, 
    updateNotes, uploadDocuments, updateDocumentText, deleteDocument, deleteImage
  } = useTopic(id);
  
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [savingDoc, setSavingDoc] = useState(false);

  // Initialize local notes state
  useEffect(() => {
    if (topic && typeof topic.notes === 'string') {
      setNotes(topic.notes);
    }
  }, [topic?.notes]);

  // Debounce Auto-Save
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
      setSelectedDoc(prev => prev ? { ...prev, extractedText } : null);
    }
  };

  const handleDocumentDelete = async (e, documentId) => {
    e.stopPropagation();
    if (!window.confirm('Remove this document? This cannot be undone.')) return;
    await deleteDocument(documentId);
  };

  const handleImageDelete = async (e, imageId) => {
    e.stopPropagation();
    if (!window.confirm('Remove this image? This cannot be undone.')) return;
    await deleteImage(imageId);
  };

  const handleAIGenerated = (updatedTopic) => {
    setTopic(updatedTopic);
  };

  if (loading && !topic) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="p-6 bg-error-container text-on-error-container rounded-3xl border border-red-200">
        <h3 className="text-lg font-bold mb-2">Error Loading Topic</h3>
        <p>{error || 'Topic not found'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-3 bg-white hover:bg-surface-container font-bold rounded-xl shadow-sm transition-colors text-sm uppercase tracking-wider">
          Go Back
        </button>
      </div>
    );
  }

  const sourceDocuments = topic.sourceDocuments || [];
  const sourceImages = topic.sourceImages || [];
  const hasFlashcards = topic.generationStatus?.hasFlashcards === true;
  const hasQuiz = topic.generationStatus?.hasQuiz === true;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate(`/subject/${topic.subjectId}`)}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-outline-variant/20 hover:bg-outline-variant/30 text-on-surface-variant text-xs font-bold tracking-widest uppercase transition-colors"
          >
            &larr; Back
          </button>
          <span className="text-outline text-xs">•</span>
          {/* Status Indicator mapping from the design */}
          <span className={`text-xs font-medium flex items-center gap-1.5 ${isSaving ? 'text-primary' : 'text-outline'}`}>
             <span className="material-symbols-outlined text-[14px]">
               {isSaving ? 'sync' : 'cloud_done'}
             </span>
             {isSaving ? 'Syncing notes...' : 'All notes synced'}
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tight text-on-background mb-4 dark:text-gray-50">
          {topic.title}
        </h1>
        {topic.description && (
          <p className="text-lg text-on-surface-variant dark:text-gray-400 max-w-2xl leading-relaxed">
            {topic.description}
          </p>
        )}
      </header>

      {/* AI Action Panel */}
      <AIPanel topic={topic} onGenerated={handleAIGenerated} />

      {/* Main Grid Layout matching Stitch Design */}
      <div className="grid grid-cols-12 gap-8 lg:gap-12">
        
        {/* Content Area: Markdown Summary & Source Notes */}
        <article className="col-span-12 lg:col-span-8 flex flex-col gap-8">
          
          {/* User's Original Notes Section (Re-styled for the grid) */}
          <div className="bg-surface-container-lowest dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
            <h3 className="text-xl font-bold font-headline text-on-surface dark:text-white mb-6">Topic Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleBlur}
              placeholder="Start typing your rough notes here. The AI will use these to generate study materials..."
              className="w-full min-h-[300px] bg-surface-container-low dark:bg-gray-900/50 resize-y border-none rounded-2xl p-6 text-on-surface dark:text-gray-200 placeholder-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed font-body transition-shadow"
            />
          </div>

          {/* Source Documents Grid */}
          <div className="bg-surface-container-lowest dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold font-headline text-on-surface dark:text-white flex items-center gap-2">
                 <span className="material-symbols-outlined text-on-surface-variant">attach_file</span>
                 Uploads
               </h3>
            </div>
            
            {(sourceDocuments.length > 0 || sourceImages.length > 0) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Uploaded Images */}
                {sourceImages.map((img, index) => (
                  <div
                    key={img._id || `img-${index}`}
                    onClick={() => setSelectedDoc({ _id: img._id, fileName: img.fileName || (img.url ? decodeURIComponent(img.url.split('/').pop()) : 'Image'), fileType: 'image', extractedText: img.extractedText, imageUrl: img.url })}
                    className="group relative flex items-start gap-4 p-5 bg-surface-container-low dark:bg-gray-700/50 rounded-2xl border border-transparent cursor-pointer hover:border-primary/30 hover:bg-surface-container-lowest hover:shadow-sm dark:hover:bg-gray-700 transition-all border-dashed"
                  >
                    <img 
                      src={img.url} 
                      alt="Uploaded"
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-200 dark:border-gray-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface dark:text-white truncate">{img.fileName || (img.url ? decodeURIComponent(img.url.split('/').pop()) : 'Image')}</p>
                      <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-2">
                        <span className="font-mono uppercase">image</span>
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleImageDelete(e, img.publicId || img._id)}
                      className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 p-2 text-outline-variant hover:text-error rounded-full hover:bg-error-container/50 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))}

                {/* Uploaded Documents */}
                {sourceDocuments.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => setSelectedDoc(doc)}
                    className="group relative flex items-start gap-4 p-5 bg-surface-container-low dark:bg-gray-700/50 rounded-2xl border border-transparent cursor-pointer hover:border-primary/30 hover:bg-surface-container-lowest hover:shadow-sm dark:hover:bg-gray-700 transition-all border-dashed"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      doc.fileType === 'pdf' 
                        ? 'bg-error-container text-error' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      <span className="material-symbols-outlined font-bold text-xl">description</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface dark:text-white truncate">{doc.fileName}</p>
                      <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-2">
                        <span className="font-mono uppercase">{doc.fileType}</span>
                        {doc.extractionMethod === 'ocr' && (
                          <span className="px-1.5 py-0.5 text-[9px] font-black bg-amber-100 text-amber-800 rounded uppercase tracking-widest">OCR</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDocumentDelete(e, doc._id)}
                      className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 p-2 text-outline-variant hover:text-error rounded-full hover:bg-error-container/50 transition-all"
                      title="Remove document"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            
            <DocumentUpload onUpload={handleUpload} uploading={uploading} />
          </div>

        </article>

        {/* Secondary Focus Area: Empty States & Quick Actions */}
        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                   {/* Flashcards Status Box */}
          {!hasFlashcards ? (
            <div 
              onClick={() => document.querySelector('button[title="Flashcards"]')?.parentElement?.click()}
              className="bg-[#f0f4f7]/50 dark:bg-gray-800/50 rounded-3xl p-8 text-center border-2 border-dashed border-[#a9b4b9]/30 dark:border-gray-700 cursor-pointer hover:border-primary/50 transition-colors group"
            >
              <div className="w-16 h-16 rounded-full bg-[#e1e9ee] dark:bg-gray-700 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[#717c82] dark:text-gray-400 text-3xl group-hover:text-primary">style</span>
              </div>
              <h4 className="font-headline font-bold text-on-surface dark:text-gray-200 mb-2 text-lg">No flashcards yet</h4>
              <p className="text-sm text-on-surface-variant dark:text-gray-400 mb-6 leading-relaxed">Let the AI analyze your summary and create active recall cards for you.</p>
              <button 
                className="w-full py-3 bg-white dark:bg-gray-700 text-primary dark:text-primary-fixed border border-primary/20 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-white dark:hover:bg-primary transition-all duration-300 relative overflow-hidden"
              >
                Generate Flashcards
              </button>
            </div>
          ) : (
            <div className="bg-primary hover:-translate-y-1 transition-transform duration-300 rounded-3xl p-8 shadow-lg shadow-primary/20 text-white relative overflow-hidden group border border-primary/50 cursor-pointer" onClick={() => navigate(`/topic/${topic._id}/flashcards`)}>
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-white text-2xl">style</span>
              </div>
              <h4 className="font-headline font-bold mb-2 text-2xl">Study Flashcards</h4>
              <p className="text-white/80 text-sm mb-8 leading-relaxed">
                You have an active deck generated for this topic. Ready to test your memory?
              </p>
              <button className="w-full py-3.5 bg-white text-primary rounded-xl font-bold text-sm tracking-wide shadow-sm hover:shadow-md transition-shadow">
                Start Review
              </button>
            </div>
          )}

          {/* Quiz Status Box (Replaces Topic Mastery) */}
          {!hasQuiz ? (
            <div 
              onClick={() => document.querySelector('button[title="Quiz"]')?.parentElement?.click()}
              className="bg-[#f0f4f7]/50 dark:bg-gray-800/50 rounded-3xl p-8 text-center border-2 border-dashed border-[#a9b4b9]/30 dark:border-gray-700 cursor-pointer hover:border-[#22C55E]/50 transition-colors group"
            >
               <div className="w-16 h-16 rounded-full bg-[#e1e9ee] dark:bg-gray-700 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                 <span className="material-symbols-outlined text-[#717c82] dark:text-gray-400 text-3xl group-hover:text-[#22C55E]">quiz</span>
               </div>
               <h4 className="font-headline font-bold text-on-surface dark:text-gray-200 mb-2 text-lg">No Practice Quiz</h4>
               <p className="text-sm text-on-surface-variant dark:text-gray-400 mb-6 leading-relaxed">Evaluate your understanding by generating an interactive AI quiz.</p>
               <button 
                className="w-full py-3 bg-white dark:bg-gray-800 text-[#22C55E] border border-[#22C55E]/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 hover:bg-[#22C55E] hover:text-white dark:hover:bg-[#22C55E]"
              >
                Generate Quiz
              </button>
            </div>
          ) : (
            <div className="bg-[#22C55E] hover:-translate-y-1 transition-transform duration-300 rounded-3xl p-8 shadow-lg shadow-[#22C55E]/20 text-white relative overflow-hidden group border border-[#22C55E]/50 cursor-pointer" onClick={() => navigate(`/topic/${topic._id}/quiz`)}>
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-white text-2xl">quiz</span>
              </div>
              <h4 className="font-headline font-bold mb-2 text-2xl">Take Quiz</h4>
              <p className="text-white/80 text-sm mb-6 leading-relaxed">
                Put your knowledge to the test with multiple-choice questions!
              </p>
              <div className="flex gap-3 relative z-10">
                 <button className="flex-1 py-3.5 bg-white text-[#22C55E] rounded-xl font-bold text-sm tracking-wide shadow-sm hover:shadow-md transition-shadow">
                   Start Quiz
                 </button>
                 <button 
                   onClick={(e) => { e.stopPropagation(); navigate(`/topic/${topic._id}/quiz-history`); }} 
                   className="p-3.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors flex items-center justify-center" 
                   title="View History"
                 >
                   <span className="material-symbols-outlined text-lg">history</span>
                 </button>
              </div>
            </div>
          )}

        </aside>

      </div>

      {/* Document Content Modal (Preserved logic for OCR viewing) */}
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
