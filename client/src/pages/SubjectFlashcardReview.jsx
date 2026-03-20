import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import FlashcardItem from '../components/FlashcardItem';

const SubjectFlashcardReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flippedCardId, setFlippedCardId] = useState(null);

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        const res = await api.get(`/subjects/${id}/flashcards`);
        setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFlashcards();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl">
        <h3 className="text-lg font-bold mb-2">Error Loading Flashcards</h3>
        <p>{error || 'Flashcards not found'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm font-medium transition-colors">
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <button 
            onClick={() => navigate(`/subject/${id}`)}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 mb-2 transition-colors"
          >
            &larr; Back to Subject
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="w-4 h-8 rounded-md" style={{ backgroundColor: subject.color }}></span>
            Flashcard Review
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Reviewing all flashcards generated for <strong style={{ color: subject.color }}>{subject.title}</strong>
          </p>
        </div>
      </div>

      {groupedFlashcards.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">No flashcards have been generated for this subject yet.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {groupedFlashcards.map(group => (
            <section key={group.topicId} className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                <svg className="w-6 h-6" style={{ color: subject.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                {group.topicTitle}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {group.flashcards.map(card => (
                  <FlashcardItem 
                    key={card._id}
                    card={card}
                    themeColor={subject.color}
                    isFlipped={flippedCardId === card._id}
                    onFlip={() => handleCardFlip(card._id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubjectFlashcardReview;
