import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTopic } from '../hooks/useTopic';
import { useFlashcardSession } from '../hooks/useFlashcardSession';

const FlashcardStudy = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { topic, loading, error } = useTopic(id);
  const flashcards = topic?.flashcards || [];

  const {
    currentCard,
    currentIndex,
    totalCards,
    isFlipped,
    correctCount,
    isFinished,
    flipCard,
    nextCard,
    resetSession
  } = useFlashcardSession(id, flashcards);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-xl mx-4 mt-6">
        <h3 className="text-lg font-bold mb-2">Error Loading Topic</h3>
        <p>{error || 'Topic not found'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-white rounded-lg shadow-sm font-medium hover:bg-gray-50">Go Back</button>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 m-8">
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No flashcards available</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Generate flashcards from the topic detail page first to test your knowledge.</p>
        <Link to={`/topic/${id}`} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
          Back to Topic
        </Link>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((correctCount / totalCards) * 100);
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 animate-in fade-in">
         <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Deck Complete!</h2>
         <div className={`text-6xl font-black mb-8 ${percentage >= 80 ? 'text-green-500' : percentage >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
            {percentage}%
         </div>
         <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 font-medium">
            You knew {correctCount} out of {totalCards} cards.
         </p>
         <div className="flex justify-center gap-4">
           <button 
              onClick={resetSession} 
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-xl transition-colors"
            >
              Study Again
           </button>
           <Link to={`/topic/${id}`} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm">
              Return to Topic
           </Link>
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center py-8 px-4">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-8">
         <Link to={`/topic/${id}`} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 font-medium transition-colors">
            &larr; Exit Study Mode
         </Link>
         <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
           Card {currentIndex + 1} of {totalCards}
         </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-2xl bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-12 shadow-inner overflow-hidden">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${((currentIndex) / totalCards) * 100}%` }}
        ></div>
      </div>

      {/* Flashcard Container using 3D styles */}
      <div 
        className="w-full max-w-2xl aspect-3/2 cursor-pointer group mb-12"
        style={{ perspective: '1000px' }}
        onClick={flipCard}
      >
        <div 
          className="relative w-full h-full transition-transform duration-500 shadow-md hover:shadow-xl rounded-2xl"
          style={{ 
            transformStyle: 'preserve-3d', 
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
          }}
        >
          
          {/* Front */}
          <div 
            className="absolute w-full h-full bg-white dark:bg-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700 pointer-events-none"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="absolute top-5 left-5 text-xs font-bold tracking-wider text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-md uppercase">Question</span>
            <h2 className="text-3xl sm:text-4xl text-center font-medium text-gray-900 dark:text-white leading-relaxed px-4">
              {currentCard?.front}
            </h2>
            <p className="absolute bottom-5 right-5 text-sm text-gray-400 dark:text-gray-500 flex items-center gap-1 font-medium bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-md border border-gray-100 dark:border-gray-700">
              Tap to flip
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
            </p>
          </div>

          {/* Back */}
          <div 
            className="absolute w-full h-full bg-blue-50 dark:bg-blue-900/30 rounded-2xl p-8 flex flex-col items-center justify-center border border-blue-200 dark:border-blue-800 pointer-events-none"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="absolute top-5 left-5 text-xs font-bold tracking-wider text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-400 px-3 py-1 rounded-md uppercase">Answer</span>
            <p className="text-2xl text-center text-gray-800 dark:text-gray-200 leading-relaxed max-h-full overflow-y-auto w-full px-4 scrollbar-thin">
              {currentCard?.back}
            </p>
          </div>

        </div>
      </div>

      {/* Controls */}
      <div className={`flex gap-6 transition-all duration-300 ${isFlipped ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <button 
          onClick={() => nextCard(false)}
          className="w-40 sm:w-48 py-4 bg-white hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-900/20 border border-gray-200 hover:border-red-200 dark:border-gray-700 dark:hover:border-red-800 text-red-600 dark:text-red-400 rounded-xl font-bold flex flex-col items-center gap-2 transition-colors shadow-sm"
        >
          <span className="text-2xl text-red-500">❌</span>
          Missed it
        </button>
        <button 
          onClick={() => nextCard(true)}
          className="w-40 sm:w-48 py-4 bg-white hover:bg-green-50 dark:bg-gray-800 dark:hover:bg-green-900/20 border border-gray-200 hover:border-green-200 dark:border-gray-700 dark:hover:border-green-800 text-green-600 dark:text-green-400 rounded-xl font-bold flex flex-col items-center gap-2 transition-colors shadow-sm"
        >
           <span className="text-2xl text-green-500">✅</span>
           Got it
        </button>
      </div>

    </div>
  );
};

export default FlashcardStudy;
