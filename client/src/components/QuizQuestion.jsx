const QuizQuestion = ({ question, selectedAnswer, onSelect }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-8 sm:p-10 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white leading-relaxed">
          {question.question}
        </h2>
      </div>

      <div className="p-8 sm:p-10 space-y-4 bg-gray-50/50 dark:bg-gray-800/50">
        {question.options?.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === question.correctAnswer;
          
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
              onClick={() => onSelect(option)}
              disabled={!!selectedAnswer}
              className={`w-full flex items-center justify-between p-5 rounded-xl border text-left text-lg font-medium transition-all ${buttonClass} ${!selectedAnswer ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}`}
            >
              <span>{option}</span>
              {icon}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuizQuestion;
