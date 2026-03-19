import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTopic } from '../hooks/useTopic';
import { useDebounce } from '../hooks/useDebounce';
import DocumentUpload from '../components/DocumentUpload';
import AIPanel from '../components/AIPanel';

const TopicDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { topic, setTopic, loading, error, updateNotes } = useTopic(id);
  
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize local notes state when topic loads
  useEffect(() => {
    if (topic && typeof topic.content === 'string') {
      setNotes(topic.content);
    }
  }, [topic?.content]);

  // Handle Debounce Auto-Save
  const debouncedNotes = useDebounce(notes, 2000);
  
  useEffect(() => {
    // Prevent saving if notes haven't actually changed from DB or if we don't have a topic loaded
    if (!topic || debouncedNotes === topic.content) return;
    
    const saveChanges = async () => {
      setIsSaving(true);
      await updateNotes(debouncedNotes);
      setIsSaving(false);
    };
    
    saveChanges();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedNotes]); // Omit dependencies to avoid circular loops on topic state 

  const handleBlur = async () => {
    if (!topic || notes === topic.content) return;
    setIsSaving(true);
    await updateNotes(notes);
    setIsSaving(false);
  };

  const handleExtraction = (extractedText) => {
    const newNotes = notes ? `${notes}\n\n${extractedText}` : extractedText;
    setNotes(newNotes);
    // Debounce will pick up the Notes state change and trigger auto-save!
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
             {!isSaving && notes === topic.content && <span className="text-sm px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 rounded-full transition-opacity">Saved</span>}
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
        {/* Left Column: Notes & Document Upload */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Study Notes</h3>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleBlur}
              placeholder="Start typing your notes here. They will save automatically..."
              className="flex-1 w-full bg-transparent resize-none border-0 focus:ring-0 p-0 text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none"
            />
          </div>
          
          <DocumentUpload topicId={topic._id} onExtractionSuccess={handleExtraction} />
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
    </div>
  );
};

export default TopicDetail;
