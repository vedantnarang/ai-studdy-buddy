import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const AIPanel = ({ topic, onGenerated }) => {
  const [loadingType, setLoadingType] = useState(null); // 'summary', 'flashcards', 'quiz'
  const [confirmAction, setConfirmAction] = useState(null);
  const navigate = useNavigate();

  if (!topic) return null;

  const handleGenerate = async (type) => {
    // Check if data already exists to warn user
    const hasData = Array.isArray(topic[type]) ? topic[type].length > 0 : !!topic[type];
    
    // For flashcards/quiz, if they just want to view them, they should use the sidebar buttons
    // But if clicking here, maybe they intend to (re)generate or view. 
    // The design only has "Deep Dive/Flashcards/Quiz" buttons. 
    if (hasData) {
      if (type === 'flashcards') {
        navigate(`/subject/${topic.subjectId}/flashcards`);
        return;
      }
      if (type === 'quiz') {
        navigate(`/topic/${topic._id}/quiz`);
        return;
      }
      if (type === 'summary') {
        navigate(`/topic/${topic._id}/summary`);
        return;
      }
      setConfirmAction(type);
      return;
    }
    await executeGeneration(type);
  };

  const executeGeneration = async (type) => {
    setConfirmAction(null);
    setLoadingType(type);

    try {
      const endpoint = `/topics/${topic._id}/generate/${type}`;
      const res = await api.post(endpoint, { forceRegenerate: true });
      
      const updatedData = res.data.data || res.data.topic || res.data;
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} generated successfully!`);
      
      if (onGenerated) {
        onGenerated(updatedData);
      }

      if (type === 'flashcards') {
        navigate(`/subject/${topic.subjectId}/flashcards`);
      } else if (type === 'quiz') {
        navigate(`/topic/${topic._id}/quiz`);
      } else if (type === 'summary') {
        navigate(`/topic/${topic._id}/summary`);
      }
    } catch (err) {
      if (err.response?.status === 429) {
         toast.error("AI is taking a breather, try again in 30s");
      } else {
         toast.error(err.response?.data?.message || err.message || `Failed to generate ${type}`);
      }
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <>
      {/* Confirmation Modal Inline */}
      {confirmAction && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-2xl animate-in fade-in flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            You already have a {confirmAction} for this topic. Generating a new one will overwrite the existing content. Are you sure?
          </p>
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => setConfirmAction(null)}
              className="px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-bold"
            >
              Cancel
            </button>
            <button 
              onClick={() => executeGeneration(confirmAction)}
              className="px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl shadow-sm transition-colors"
            >
              Overwrite
            </button>
          </div>
        </div>
      )}

      {/* AI Action Panel Grid - Exactly matching Stitch UI */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Action Button: Flashcards */}
        <button 
          disabled={loadingType !== null}
          onClick={() => handleGenerate('flashcards')}
          className="group flex flex-col items-start p-6 bg-surface-container-lowest dark:bg-gray-800 rounded-2xl transition-all duration-300 hover:bg-primary hover:scale-[1.02] border border-gray-100 outline-none hover:border-primary/10 dark:border-gray-700 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-surface-container-lowest relative overflow-hidden shadow-sm"
        >
          {loadingType === 'flashcards' && (
             <div className="absolute inset-x-0 top-0 h-1 bg-primary animate-pulse"></div>
          )}
          <div className="w-12 h-12 rounded-xl bg-primary-container dark:bg-primary-900/40 group-hover:bg-white/20 flex items-center justify-center mb-4 transition-colors">
            {loadingType === 'flashcards' ? (
              <span className="animate-spin text-primary group-hover:text-white text-xl">↻</span>
            ) : (
              <span className="material-symbols-outlined text-primary group-hover:text-white">style</span>
            )}
          </div>
          <h3 className="font-headline font-bold text-lg text-on-surface dark:text-gray-100 group-hover:text-white mb-1">Flashcards</h3>
          <p className="text-sm text-on-surface-variant dark:text-gray-400 group-hover:text-white/80 text-left">Master terminology with active recall.</p>
        </button>

        {/* Action Button: Quiz */}
        <button 
          disabled={loadingType !== null}
          onClick={() => handleGenerate('quiz')}
          className="group flex flex-col items-start p-6 bg-surface-container-lowest dark:bg-gray-800 rounded-2xl transition-all duration-300 hover:bg-[#22C55E] hover:scale-[1.02] border border-gray-100 outline-none hover:border-[#22C55E]/10 dark:border-gray-700 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-surface-container-lowest relative overflow-hidden shadow-sm"
        >
          {loadingType === 'quiz' && (
             <div className="absolute inset-x-0 top-0 h-1 bg-[#22C55E] animate-pulse"></div>
          )}
          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/40 group-hover:bg-white/20 flex items-center justify-center mb-4 transition-colors">
            {loadingType === 'quiz' ? (
              <span className="animate-spin text-[#22C55E] group-hover:text-white text-xl">↻</span>
            ) : (
              <span className="material-symbols-outlined text-[#22C55E] group-hover:text-white">quiz</span>
            )}
          </div>
          <h3 className="font-headline font-bold text-lg text-on-surface dark:text-gray-100 group-hover:text-white mb-1">Practice Quiz</h3>
          <p className="text-sm text-on-surface-variant dark:text-gray-400 group-hover:text-white/80 text-left">Test your knowledge on key concepts.</p>
        </button>

        {/* Action Button: Summary */}
        <button 
          disabled={loadingType !== null}
          onClick={() => handleGenerate('summary')}
          className="group flex flex-col items-start p-6 bg-surface-container-lowest dark:bg-gray-800 rounded-2xl transition-all duration-300 hover:bg-tertiary hover:scale-[1.02] border border-gray-100 outline-none hover:border-tertiary/10 dark:border-gray-700 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-surface-container-lowest relative overflow-hidden shadow-sm"
        >
          {loadingType === 'summary' && (
             <div className="absolute inset-x-0 top-0 h-1 bg-tertiary animate-pulse"></div>
          )}
          <div className="w-12 h-12 rounded-xl bg-tertiary-container dark:bg-tertiary-900/40 group-hover:bg-white/20 flex items-center justify-center mb-4 transition-colors">
            {loadingType === 'summary' ? (
              <span className="animate-spin text-tertiary group-hover:text-white text-xl">↻</span>
            ) : (
              <span className="material-symbols-outlined text-tertiary group-hover:text-white">auto_awesome</span>
            )}
          </div>
          <h3 className="font-headline font-bold text-lg text-on-surface dark:text-gray-100 group-hover:text-white mb-1">AI Deep Dive</h3>
          <p className="text-sm text-on-surface-variant dark:text-gray-400 group-hover:text-white/80 text-left">Generate an advanced concept breakdown.</p>
        </button>
      </section>
    </>
  );
};

export default AIPanel;
