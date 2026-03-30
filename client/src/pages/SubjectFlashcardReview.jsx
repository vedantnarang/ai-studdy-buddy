import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import FlashcardItem from '../components/FlashcardItem';
import EditableFlashcard from '../components/EditableFlashcard';
import toast from 'react-hot-toast';

const SubjectFlashcardReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flippedCardId, setFlippedCardId] = useState(null);
  const [regeneratingTopicId, setRegeneratingTopicId] = useState(null);
  const [editingTopicId, setEditingTopicId] = useState(null);


  const fetchFlashcards = async () => {
    try {
      const res = await api.get(`/subjects/${id}/flashcards`);
      setData(res.data.data);
    } catch (err) {
      if(!data) {
        setError(err.response?.data?.message || err.message);
      } else {
        toast.error("Failed to sync fresh flashcards.");
      }
    } finally {
      if(loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen -mt-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-error-container text-on-error-container rounded-[2rem] border border-red-200 mt-12 text-center">
        <span className="material-symbols-outlined text-5xl mb-4 text-error">error</span>
        <h3 className="text-2xl font-headline font-bold mb-2">Error Loading Flashcards</h3>
        <p className="text-lg opacity-80">{error || 'Flashcards not found'}</p>
        <button onClick={() => navigate(-1)} className="mt-8 px-6 py-3 bg-white hover:bg-surface-container-high rounded-xl shadow-sm font-bold uppercase tracking-widest text-sm transition-colors text-error">
          Go Back
        </button>
      </div>
    );
  }

  const { subject, groupedFlashcards } = data;

  const handleCardFlip = (cardId) => {
    // If clicking the currently flipped card, unflip it. Else flip the new one.
    setFlippedCardId(prev => prev === cardId ? null : cardId);
  };

  const handleRegenerateTopic = async (topicId) => {
    if (!window.confirm("Replace these flashcards? This will permanently generate a new set from your latest topic notes.")) return;
    
    setRegeneratingTopicId(topicId);
    try {
      const endpoint = `/topics/${topicId}/generate/flashcards`;
      await api.post(endpoint, { forceRegenerate: true });
      toast.success('Flashcards refreshed!');
      await fetchFlashcards(); // Background refetch, visually constrained to the loading state
    } catch (err) {
      if (err.response?.status === 429) {
         toast.error("AI is busy, please wait 30s");
      } else {
         toast.error(err.response?.data?.message || err.message || 'Failed to regenerate flashcards');
      }
    } finally {
      setRegeneratingTopicId(null);
    }
  };

  const handleSaveFlashcard = async (topicId, flashcardId, newQuestion, newAnswer) => {
    try {
      await api.put(`/flashcards/${flashcardId}`, { question: newQuestion, answer: newAnswer });
      toast.success("Flashcard updated!");
      setData(prevData => {
        const newData = { ...prevData };
        newData.groupedFlashcards = newData.groupedFlashcards.map(group => {
          if (group.topicId === topicId) {
            return {
              ...group,
              flashcards: group.flashcards.map(fc => 
                fc._id === flashcardId 
                  ? { ...fc, question: newQuestion, answer: newAnswer, isEdited: true }
                  : fc
              )
            };
          }
          return group;
        });
        return newData;
      });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save flashcard');
    }
  };

  const handleDeleteFlashcard = async (topicId, flashcardId) => {
    try {
      await api.delete(`/flashcards/${flashcardId}`);
      toast.success("Flashcard deleted!");
      
      let topicBecameEmpty = false;

      setData(prevData => {
        const newData = { ...prevData };
        newData.groupedFlashcards = newData.groupedFlashcards.map(group => {
          if (group.topicId === topicId) {
             const newCards = group.flashcards.filter(fc => fc._id !== flashcardId);
             if (newCards.length === 0) topicBecameEmpty = true;
            return {
              ...group,
              flashcards: newCards
            };
          }
          return group;
        }).filter(group => group.flashcards.length > 0);
        return newData;
      });

      if (topicBecameEmpty && editingTopicId === topicId) {
         setEditingTopicId(null);
      }

    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete flashcard');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Stitch Design Context Header */}
      <header className="mb-12 flex flex-col items-center md:items-start text-center md:text-left">
        <button 
          onClick={() => navigate(`/subject/${id}`)}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-surface-container-high dark:bg-gray-800 text-on-surface-variant dark:text-gray-300 font-label text-xs font-bold rounded-full mb-6 hover:bg-surface-container-highest transition-colors uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          {subject.title}
        </button>
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-on-background dark:text-gray-100 mb-4 flex items-center justify-center md:justify-start gap-4">
          Flashcard Experience
        </h1>
        <p className="text-tertiary dark:text-gray-400 font-label text-base md:text-lg max-w-2xl">
          Review all flashcards across your subject. Only one card flipped at a time. Total memory focus.
        </p>
      </header>

      {groupedFlashcards.length === 0 ? (
        <div className="text-center p-16 md:p-24 bg-surface-container-lowest dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <span className="material-symbols-outlined text-6xl text-outline-variant dark:text-gray-600 mb-6 block">style</span>
          <h3 className="font-headline text-2xl font-bold text-on-surface dark:text-gray-200 mb-3">Blank Deck</h3>
          <p className="text-on-surface-variant dark:text-gray-400">No flashcards have been generated for this subject yet. Go into a topic and let the AI extract them for you.</p>
        </div>
      ) : (
        <div className="space-y-16 lg:space-y-24">
          {groupedFlashcards.map(group => {
            const isTopicRegenerating = regeneratingTopicId === group.topicId;
            const isEditingThisTopic = editingTopicId === group.topicId;
            const isOtherTopicEditing = editingTopicId !== null && editingTopicId !== group.topicId;

            return (
              <section 
                key={group.topicId} 
                className={`space-y-8 relative transition-opacity duration-300 ${isOtherTopicEditing ? 'opacity-30 pointer-events-none' : ''}`}
              >
                
                {/* Topic Heading Strip */}
                <div className="flex items-center justify-between border-b-2 border-surface-container-high dark:border-gray-800 p-4 sticky top-16 bg-background dark:bg-[#0b0f10] z-20 shadow-[0_10px_10px_-10px_rgba(0,0,0,0.05)]">
                  <h2 className="text-2xl md:text-3xl font-extrabold font-headline text-on-surface dark:text-gray-100 flex items-center gap-3">
                    <span 
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-high dark:bg-gray-800"
                      style={{ color: subject.color || '#0053db' }}
                    >
                      <span className="material-symbols-outlined text-[18px]">bookmark</span>
                    </span>
                    {group.topicTitle}
                  </h2>

                  <div className="flex items-center gap-2">
                    {/* Edit Mode Toggle */}
                    <button
                      onClick={() => {
                        setEditingTopicId(isEditingThisTopic ? null : group.topicId);
                        setFlippedCardId(null);
                      }}
                      disabled={isTopicRegenerating}
                      className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl transition-all border focus:outline-none focus:ring-2 disabled:opacity-50 group font-bold text-xs tracking-wider ${
                        isEditingThisTopic 
                          ? `bg-[${subject.color || '#0053db'}] text-white border-transparent` 
                          : `bg-surface-container-lowest dark:bg-gray-800 hover:bg-surface-container-high dark:hover:bg-gray-700 text-on-surface-variant dark:text-gray-300 border-gray-100 dark:border-gray-700`
                      }`}
                      style={isEditingThisTopic ? { backgroundColor: subject.color || '#0053db' } : { '--tw-ring-color': subject.color || '#0053db' }}
                      title="Edit flashcards for this topic"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isEditingThisTopic ? 'task_alt' : 'edit'}
                      </span>
                      <span className="hidden sm:block uppercase">
                        {isEditingThisTopic ? 'Done Editing' : 'Edit'}
                      </span>
                    </button>

                    {/* Localized Regeneration Trigger */}
                    <button
                      onClick={() => handleRegenerateTopic(group.topicId)}
                      disabled={regeneratingTopicId !== null || editingTopicId !== null}
                      className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-surface-container-lowest dark:bg-gray-800 hover:bg-surface-container-high dark:hover:bg-gray-700 text-on-surface-variant dark:text-gray-300 rounded-xl transition-all border border-gray-100 dark:border-gray-700 focus:outline-none focus:ring-2 disabled:opacity-50 group"
                      style={{ '--tw-ring-color': subject.color || '#0053db' }}
                      title="Regenerate flashcards for this topic"
                    >
                      <span className={`material-symbols-outlined text-[18px] group-hover:text-primary dark:group-hover:text-white ${isTopicRegenerating ? 'animate-spin text-primary' : ''}`}>
                        sync
                      </span>
                      <span className="font-bold text-xs uppercase tracking-wider hidden sm:block group-hover:text-primary dark:group-hover:text-white">
                        {isTopicRegenerating ? 'Working...' : 'Regenerate'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Localized Loading Overlay mapped precisely to the user's request */}
                <div className="relative">
                  {isTopicRegenerating && (
                    <div className="absolute inset-0 z-10 bg-background/60 dark:bg-[#0b0f10]/60 backdrop-blur-[2px] rounded-[2rem] flex items-center justify-center animate-in fade-in">
                       <div className="px-6 py-4 bg-surface-container-lowest dark:bg-gray-800 rounded-2xl shadow-xl flex items-center gap-4 border border-gray-100 dark:border-gray-700">
                          <span className="material-symbols-outlined animate-spin text-primary dark:text-primary-fixed text-2xl">sync</span>
                          <span className="font-bold font-headline text-on-surface dark:text-white">AI is reading notes...</span>
                       </div>
                    </div>
                  )}

                  {/* Flashcard Grid Layout */}
                  <div className={`grid gap-6 lg:gap-10 transition-opacity duration-300 ${isTopicRegenerating ? 'opacity-30 pointer-events-none' : ''} ${isEditingThisTopic ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'}`}>
                    {group.flashcards.map((card, index) => (
                      <div className="relative animate-in slide-in-from-bottom-8 fade-in h-full" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }} key={card._id}>
                        {isEditingThisTopic ? (
                           <EditableFlashcard
                             card={card}
                             themeColor={subject.color}
                             onSave={(targetId, q, a) => handleSaveFlashcard(group.topicId, targetId, q, a)}
                             onDelete={(targetId) => handleDeleteFlashcard(group.topicId, targetId)}
                           />
                        ) : (
                           <FlashcardItem 
                             card={card}
                             themeColor={subject.color}
                             isFlipped={flippedCardId === card._id}
                             onFlip={() => handleCardFlip(card._id)}
                             isMissed={card.difficultyBox > 1}
                           />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubjectFlashcardReview;
