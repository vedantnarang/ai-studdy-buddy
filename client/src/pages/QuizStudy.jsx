import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTopic } from '../hooks/useTopic';
import { useQuizSession } from '../hooks/useQuizSession';
import QuizQuestion from '../components/QuizQuestion';

const QuizStudy = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { topic, loading, error } = useTopic(id);
  const quiz = topic?.quiz || [];

  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    selectedAnswer,
    score,
    isFinished,
    selectAnswer,
    nextQuestion,
    resetSession
  } = useQuizSession(id, quiz);

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
           <h3 className="text-lg font-bold mb-2">Error Loading Quiz</h3>
           <p>{error || 'Quiz not found'}</p>
           <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-white rounded-lg shadow-sm">Go Back</button>
        </div>
     );
  }

  if (quiz.length === 0) {
      return (
         <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 m-8">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No quiz found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Generate quizzes from the topic detail page first.</p>
            <Link to={`/topic/${id}`} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">Back to Topic</Link>
         </div>
      );
  }

  if (isFinished) {
    const percentage = Math.round((score / totalQuestions) * 100);
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 animate-in fade-in">
         <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Quiz Complete!</h2>
         <div className={`text-6xl font-black mb-8 ${percentage >= 80 ? 'text-green-500' : percentage >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
            {percentage}%
         </div>
         <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 font-medium">
            You scored {score} out of {totalQuestions} correctly.
         </p>
         <div className="flex justify-center gap-4">
           <button 
              onClick={resetSession} 
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-xl transition-colors"
            >
              Retry Quiz
           </button>
           <Link to={`/topic/${id}`} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm">
              Return to Topic
           </Link>
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-8">
         <Link to={`/topic/${id}`} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 font-medium transition-colors">
            &larr; Exit Quiz
         </Link>
         <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
           Question {currentIndex + 1} of {totalQuestions}
         </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-12 shadow-inner overflow-hidden flex">
        <div className="bg-blue-600 h-2 transition-all duration-300 rounded-full" style={{ width: `${((currentIndex) / totalQuestions) * 100}%` }}></div>
      </div>

      <QuizQuestion 
        question={currentQuestion}
        selectedAnswer={selectedAnswer}
        onSelect={selectAnswer}
      />

      <div className="bg-transparent flex justify-end mt-6">
        <button
          onClick={nextQuestion}
          disabled={!selectedAnswer}
          className={`px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${selectedAnswer ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}
        >
          {currentIndex < totalQuestions - 1 ? 'Next Question' : 'Finish Quiz'} &rarr;
        </button>
      </div>
    </div>
  );
};

export default QuizStudy;
