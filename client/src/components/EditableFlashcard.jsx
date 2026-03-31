import React, { useState } from 'react';
import { toastConfirm } from '../utils/toastConfirm';
const EditableFlashcard = ({ card, onSave, onDelete, themeColor }) => {
  const [question, setQuestion] = useState(card.question);
  const [answer, setAnswer] = useState(card.answer);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(card._id, question, answer);
    setIsSaving(false);
  };

  const handleDelete = async () => {
    const isConfirmed = await toastConfirm("Are you sure you want to delete this flashcard?");
    if (!isConfirmed) return;
    setIsDeleting(true);
    await onDelete(card._id);
    setIsDeleting(false);
  };

  return (
    <div className="flex flex-col gap-3 p-5 bg-surface-container-lowest dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 h-full relative" 
         style={{ borderTop: `4px solid ${themeColor || '#0053db'}` }}>
      
      <div className="flex-1 flex flex-col gap-2">
        <label className="text-xs font-bold font-label uppercase tracking-wider text-on-surface-variant dark:text-gray-400">Front (Question)</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full bg-surface-container-low dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl p-3 text-sm flex-1 focus:ring-2 focus:outline-none resize-y min-h-[120px]"
          style={{ '--tw-ring-color': themeColor || '#0053db' }}
        />
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <label className="text-xs font-bold font-label uppercase tracking-wider text-on-surface-variant dark:text-gray-400">Back (Answer)</label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full bg-surface-container-low dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl p-3 text-sm flex-1 focus:ring-2 focus:outline-none resize-y min-h-[160px]"
          style={{ '--tw-ring-color': themeColor || '#0053db' }}
        />
      </div>

      <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={handleDelete}
          disabled={isDeleting || isSaving}
          className="text-error hover:text-red-700 bg-error-container/30 hover:bg-error-container/50 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1 disabled:opacity-50"
          title="Delete Flashcard"
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
        </button>
        
        <button
          onClick={handleSave}
          disabled={Boolean(isSaving || isDeleting || (question === card.question && answer === card.answer))}
          className="px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: Boolean(isSaving || isDeleting || (question === card.question && answer === card.answer)) ? '#6b7280' : (themeColor || '#0053db'), color: '#fff' }}
        >
          {isSaving ? (
            <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
          ) : (
            <span className="material-symbols-outlined text-[16px]">save</span>
          )}
          Save
        </button>
      </div>
    </div>
  );
};

export default EditableFlashcard;
