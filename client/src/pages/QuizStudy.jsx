import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuizSession } from '../hooks/useQuizSession';
import { useTopic } from '../hooks/useTopic';
import QuizQuestion from '../components/QuizQuestion';

const QuizStudy = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { topic } = useTopic(id);

  const specificQuizId = searchParams.get('quizId');

  const {
    isLoading,
    error,
    quiz,
    currentQuestion,
    currentIndex,
    totalQuestions,
    selectedAnswer,
    answersMap,
    score,
    isFinished,
    isSubmitting,
    selectAnswer,
    nextQuestion,
    resetSession
  } = useQuizSession(id, specificQuizId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-surface px-6">
        <div className="bg-error-container text-on-error-container p-6 rounded-2xl max-w-md text-center">
          <span className="material-symbols-outlined text-4xl mb-2">error</span>
          <h2 className="text-xl font-bold font-headline mb-2">Failed to load Quiz</h2>
          <p className="text-sm">{error}</p>
          <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 bg-error text-on-error rounded-xl font-bold font-label">Go Back</button>
        </div>
      </div>
    );
  }

  if (!quiz || totalQuestions === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-surface px-6">
        <div className="text-center p-12 bg-surface-container-lowest rounded-3xl shadow-sm border border-surface-variant/50 max-w-md">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-on-surface-variant text-3xl">quiz</span>
          </div>
          <h3 className="text-2xl font-bold font-headline text-on-surface mb-2">No active quiz</h3>
          <p className="text-on-surface-variant mb-8 text-sm leading-relaxed">Please generate a quiz from the topic detail page first.</p>
          <button onClick={() => navigate(`/topic/${id}`)} className="px-8 py-3 bg-primary text-on-primary rounded-xl font-bold transition-all hover:bg-primary/90 shadow-md">Back to Topic</button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / totalQuestions) * 100);
    const isSuccess = percentage >= 80;
    const isPassing = percentage >= 60;
    
    let resultColor = 'text-error';
    if (isSuccess) resultColor = 'text-[#22C55E]';
    else if (isPassing) resultColor = 'text-[#F59E0B]';

    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl bg-surface-container-lowest dark:bg-gray-800 rounded-4xl p-10 md:p-14 text-center shadow-xl border border-surface-variant/30 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-500">
           <div className={`w-24 h-24 mx-auto rounded-full bg-surface-container flex items-center justify-center mb-6`}>
             <span className={`material-symbols-outlined text-5xl ${resultColor}`}>
               {isSuccess ? 'emoji_events' : isPassing ? 'thumb_up' : 'school'}
             </span>
           </div>
           
           <h2 className="text-4xl font-extrabold font-headline text-on-surface dark:text-gray-100 mb-2">Quiz Completed</h2>
           <p className="text-on-surface-variant dark:text-gray-400 mb-8 font-medium">You scored {score} out of {totalQuestions} correctly.</p>
           
           <div className={`text-7xl font-black mb-12 ${resultColor} tracking-tighter`}>
              {percentage}%
           </div>

           <div className="flex flex-col sm:flex-row justify-center gap-3">
             <button 
                onClick={resetSession} 
                className="px-6 py-4 bg-surface-container hover:bg-surface-container-high dark:bg-gray-700 dark:hover:bg-gray-600 text-on-surface dark:text-gray-100 font-bold font-label rounded-xl transition-all shadow-sm"
              >
                Retake Quiz
             </button>
             <button 
                onClick={() => navigate(`/topic/${id}/quiz-history`)}
                className="px-6 py-4 bg-primary hover:bg-primary/90 text-on-primary font-bold font-label rounded-xl transition-all shadow-md active:scale-95"
              >
                View History
             </button>
             <button 
                onClick={() => navigate(`/topic/${id}`)}
                className="px-6 py-4 bg-surface-variant hover:bg-surface-variant/90 text-on-surface-variant font-bold font-label rounded-xl transition-all active:scale-95"
              >
                Return to Notes
             </button>
           </div>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.round((currentIndex / totalQuestions) * 100);
  // Re-eval local state + remote mapping to determine if question is locked
  const currentAnswerData = answersMap[currentQuestion?._id];
  const hasAnswered = !!currentAnswerData;
  const currentSelectedAnswer = hasAnswered ? currentAnswerData.index : selectedAnswer;

  return (
    <div className="min-h-screen bg-surface dark:bg-[#111827] text-on-surface dark:text-gray-100 font-body pb-24">
      {/* TopNavBar Shell */}
      <nav className="sticky top-0 w-full z-30 flex justify-between items-center px-6 md:px-8 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-surface-variant/20 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <span className="text-lg font-black text-primary font-headline tracking-tight">Study Buddy</span>
          <div className="h-6 w-px bg-surface-variant dark:bg-gray-700 mx-1 md:mx-2 hidden sm:block"></div>
          <span className="text-sm font-medium text-secondary truncate max-w-[150px] md:max-w-xs hidden sm:block">
            {topic?.title || 'Quiz'}
          </span>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={() => navigate(`/topic/${id}`)}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-container hover:bg-surface-container-high dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full text-xs font-bold font-label transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
            Exit
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8 md:py-12">
        {/* Progress Section */}
        <div className="mb-10 md:mb-12">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="text-secondary dark:text-gray-400 font-bold uppercase tracking-widest text-[10px] block mb-1">Current Progress</span>
              <h2 className="text-xl md:text-2xl font-extrabold font-headline">Question {currentIndex + 1} of {totalQuestions}</h2>
            </div>
            <div className="text-right">
              <span className="text-xs md:text-sm font-bold text-primary dark:text-primary-fixed">{progressPercentage}% Complete</span>
            </div>
          </div>
          <div className="w-full h-2 bg-surface-container dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>

        {/* Question Component */}
        {currentQuestion && (
          <QuizQuestion 
            question={currentQuestion}
            selectedAnswer={currentSelectedAnswer}
            hasAnswered={hasAnswered}
            onSelect={selectAnswer}
          />
        )}

        {/* Action Footer */}
        <div className="mt-12 pt-8 flex items-center justify-end border-t border-surface-container-high dark:border-gray-800 border-dashed animate-in fade-in">
          {hasAnswered && (
             <button 
               onClick={nextQuestion}
               disabled={isSubmitting}
               className={`relative px-8 py-3.5 bg-primary text-on-primary font-bold font-label rounded-xl transition-all flex items-center gap-3 shadow-lg shadow-primary/20 hover:bg-primary/95 active:scale-95 ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
             >
               {currentIndex < totalQuestions - 1 ? 'Next Question' : 'Finish Quiz'}
               {isSubmitting ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
               ) : (
                 <span className="material-symbols-outlined text-xl">
                   {currentIndex < totalQuestions - 1 ? 'arrow_forward' : 'done_all'}
                 </span>
               )}
               <div className="absolute inset-x-0 top-0 h-[2px] bg-white/20 rounded-t-xl"></div>
             </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default QuizStudy;
