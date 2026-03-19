import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTopic } from '../hooks/useTopic';

const QuizStudy = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { topic, loading, error } = useTopic(id);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

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

  const quiz = topic.quiz || [];

  if (quiz.length === 0) {
      return (
         <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 m-8">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No quiz found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Generate quizzes from the topic detail page first.</p>
            <Link to={`/topic/${id}`} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">Back to Topic</Link>
         </div>
      );
  }

  const currentQuestion = quiz[currentIndex];

  const handleSelect = (option) => {
    if (selectedAnswer) return; 
    setSelectedAnswer(option);
    
    if (option === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < quiz.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    const percentage = Math.round((score / quiz.length) * 100);
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
         <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Quiz Complete!</h2>
         <div className={`text-6xl font-black mb-8 ${percentage >= 80 ? 'text-green-500' : percentage >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
            {percentage}%
         </div>
         <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 font-medium">
            You scored {score} out of {quiz.length} correctly.
         </p>
         <div className="flex justify-center gap-4">
           <button 
              onClick={() => { setCurrentIndex(0); setSelectedAnswer(null); setScore(0); setIsFinished(false); }} 
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
           Question {currentIndex + 1} of {quiz.length}
         </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-12 shadow-inner overflow-hidden flex">
        <div className="bg-blue-600 h-2 transition-all duration-300 rounded-full" style={{ width: `${((currentIndex) / quiz.length) * 100}%` }}></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-8 sm:p-10 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white leading-relaxed">
            {currentQuestion.question}
          </h2>
        </div>

        <div className="p-8 sm:p-10 space-y-4 bg-gray-50/50 dark:bg-gray-800/50">
          {currentQuestion.options?.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQuestion.correctAnswer;
            
            let buttonClass = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-blue-400 text-gray-700 dark:text-gray-200';
            let icon = null;

            if (selectedAnswer) {
              if (isCorrect) {
                buttonClass = 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400 ring-2 ring-green-500/50';
                icon = <span className="text-green-600 dark:text-green-400">✅</span>;
              } else if (isSelected) {
                buttonClass = 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400 ring-2 ring-red-500/50';
                icon = <span className="text-red-600 dark:text-red-400">❌</span>;
              } else {
                buttonClass = 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-50';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(option)}
                disabled={!!selectedAnswer}
                className={`w-full flex items-center justify-between p-5 rounded-xl border text-left text-lg font-medium transition-all ${buttonClass} ${!selectedAnswer ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}`}
              >
                <span>{option}</span>
                {icon}
              </button>
            );
          })}
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!selectedAnswer}
            className={`px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${selectedAnswer ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}
          >
            {currentIndex < quiz.length - 1 ? 'Next Question' : 'Finish Quiz'} &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizStudy;
