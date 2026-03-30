import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const AIPanel = ({ topic, onGenerated }) => {
  const [loadingType, setLoadingType] = useState(null); // 'summary', 'flashcards', 'quiz'
  const [confirmAction, setConfirmAction] = useState(null);
  const [quizWarning, setQuizWarning] = useState(false);
  const navigate = useNavigate();

  if (!topic) return null;

  const handleGenerate = async (type) => {
    // Check if data already exists to warn user
    let hasData = false;
    if (type === 'flashcards' && topic.generationStatus?.hasFlashcards) hasData = true;
    if (type === 'quiz' && topic.generationStatus?.hasQuiz) hasData = true;
    if (type === 'summary' && topic.generationStatus?.hasSummary) hasData = true;
    
    // For flashcards/quiz, if they just want to view them, they should use the sidebar buttons
    // But if clicking here, maybe they intend to (re)generate or view. 
    // The design only has "Deep Dive/Flashcards/Quiz" buttons. 
    if (hasData) {
      if (type === 'summary') {
        navigate(`/topic/${topic._id}/summary`);
        return;
      }
      
      // For flashcards and quiz, show the options alert
      setConfirmAction(type);
      if (type === 'quiz') setQuizWarning(false);
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
        navigate(`/topic/${topic._id}/flashcards`);
      } else if (type === 'quiz') {
        navigate(`/topic/${topic._id}/quiz`);
      } else if (type === 'summary') {
        navigate(`/topic/${topic._id}/summary`);
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.errorCode === 'UPGRADE_REQUIRED') {
         navigate('/pricing');
      } else if (err.response?.status === 429) {
         toast.error("AI is taking a breather, try again in 30s");
      } else if (err.response?.status === 500) {
         toast.error("AI model is facing too much traffic right now. Please retry after sometime.");
      } else {
         toast.error(err.response?.data?.message || err.message || `Failed to generate ${type}`);
      }
    } finally {
      setLoadingType(null);
    }
  };

  const handleTakeLatest = () => {
    const materialsObj = topic.materialsUpdatedAt ? new Date(topic.materialsUpdatedAt) : new Date(0);
    const quizObj = topic.latestQuizCreatedAt ? new Date(topic.latestQuizCreatedAt) : new Date(0);
    const hasMaterialsChanged = materialsObj.getTime() - quizObj.getTime() > 5000;

    if (hasMaterialsChanged) {
      setQuizWarning(true);
    } else {
      navigate(`/topic/${topic._id}/quiz`);
    }
  };

  return (
    <>
      {/* Confirmation Modal Inline */}
      {confirmAction && (
        <div className="mb-6 p-4 bg-surface-container-high border border-surface-variant/50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          
          {confirmAction === 'quiz' && quizWarning ? (
            <div className="flex-1">
              <p className="text-sm font-medium text-[#F59E0B]">
                <span className="material-symbols-outlined text-sm align-middle mr-1 pb-0.5">warning</span>
                You've updated your study materials since the last quiz was generated. Test yourself on the new material?
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <button 
                  onClick={() => navigate(`/topic/${topic._id}/quiz`)}
                  className="px-4 py-2 bg-surface hover:bg-surface-variant text-on-surface text-xs font-bold rounded-lg transition-colors border border-surface-variant/50"
                  disabled={!!loadingType}
                >
                  Continue Anyway
                </button>
                <button 
                  onClick={() => executeGeneration('quiz')}
                  className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                  disabled={!!loadingType}
                >
                  {loadingType === 'quiz' ? 'Generating...' : 'Generate New Quiz'}
                </button>
              </div>
            </div>
          ) : confirmAction === 'quiz' ? (
            <div className="flex-1">
              <p className="text-sm font-medium text-on-surface">
                You have generated <span className="font-bold text-primary">{topic.quizCount || 1}</span> quiz(zes) for this topic.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <button 
                  onClick={() => navigate(`/topic/${topic._id}/quiz-history`)}
                  className="px-4 py-2 bg-surface hover:bg-surface-variant text-on-surface text-xs font-bold rounded-lg transition-colors border border-surface-variant/50"
                  disabled={!!loadingType}
                >
                  View History
                </button>
                <button 
                  onClick={handleTakeLatest}
                  className="px-4 py-2 bg-surface hover:bg-surface-variant text-on-surface text-xs font-bold rounded-lg transition-colors border border-surface-variant/50"
                  disabled={!!loadingType}
                >
                  Take Latest
                </button>
                <button 
                  onClick={() => executeGeneration('quiz')}
                  className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                  disabled={!!loadingType}
                >
                  {loadingType === 'quiz' ? 'Generating...' : 'Generate New'}
                </button>
              </div>
            </div>
          ) : confirmAction === 'flashcards' ? (
            <div className="flex-1">
              <p className="text-sm font-medium text-on-surface">
                You already have generated flashcards for this topic.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <button 
                  onClick={() => navigate(`/topic/${topic._id}/flashcards`)}
                  className="px-4 py-2 bg-surface hover:bg-surface-variant text-on-surface text-xs font-bold rounded-lg transition-colors border border-surface-variant/50"
                  disabled={!!loadingType}
                >
                  View Existing
                </button>
                <button 
                  onClick={() => executeGeneration('flashcards')}
                  className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                  disabled={!!loadingType}
                >
                  {loadingType === 'flashcards' ? 'Generating...' : 'Generate New'}
                </button>
              </div>
            </div>
          ) : null}
          
          <button 
            onClick={() => setConfirmAction(null)}
            className="self-end md:self-auto p-2 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-variant/30 transition-colors"
            title="Dismiss"
          >
             <span className="material-symbols-outlined text-sm">close</span>
          </button>
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
