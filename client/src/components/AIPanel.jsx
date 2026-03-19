import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const AIPanel = ({ topic, onGenerated }) => {
  const [loadingType, setLoadingType] = useState(null); // 'summary', 'flashcards', 'quiz'
  const [confirmAction, setConfirmAction] = useState(null);

  if (!topic) return null;

  const handleGenerate = async (type) => {
    // Check if data already exists to warn user
    const hasData = Array.isArray(topic[type]) ? topic[type].length > 0 : !!topic[type];
    
    if (hasData) {
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
      // Sending forceRegenerate just in case backend expects it
      const res = await api.post(endpoint, { forceRegenerate: true });
      
      const updatedData = res.data.data || res.data.topic || res.data;
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} generated successfully!`);
      
      if (onGenerated) {
        onGenerated(updatedData);
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        AI Study Features
      </h3>

      {/* Confirmation Modal Inline */}
      {confirmAction && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg animate-in fade-in">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
            You already have a {confirmAction} for this topic. Generating a new one will overwrite the existing content. Are you sure?
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setConfirmAction(null)}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => executeGeneration(confirmAction)}
              className="px-3 py-1.5 text-sm bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-md transition-colors"
            >
              Overwrite
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button 
          disabled={loadingType !== null}
          onClick={() => handleGenerate('summary')}
          className="flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg transition-colors border border-indigo-100 dark:border-indigo-900/50 disabled:opacity-50"
        >
          <span className="font-medium">Generate Summary</span>
          {loadingType === 'summary' && <span className="animate-spin text-indigo-500 text-xl">↻</span>}
        </button>
        
        <button 
          disabled={loadingType !== null}
          onClick={() => handleGenerate('flashcards')}
          className="flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg transition-colors border border-purple-100 dark:border-purple-900/50 disabled:opacity-50"
        >
          <span className="font-medium">Generate Flashcards</span>
          {loadingType === 'flashcards' && <span className="animate-spin text-purple-500 text-xl">↻</span>}
        </button>

        <button 
          disabled={loadingType !== null}
          onClick={() => handleGenerate('quiz')}
          className="flex items-center justify-between px-4 py-3 bg-pink-50 hover:bg-pink-100 dark:bg-pink-900/20 dark:hover:bg-pink-900/40 text-pink-700 dark:text-pink-300 rounded-lg transition-colors border border-pink-100 dark:border-pink-900/50 disabled:opacity-50"
        >
          <span className="font-medium">Generate Quiz</span>
          {loadingType === 'quiz' && <span className="animate-spin text-pink-500 text-xl">↻</span>}
        </button>
      </div>
    </div>
  );
};

export default AIPanel;
