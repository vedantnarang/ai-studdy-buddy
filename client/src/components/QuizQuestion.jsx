import React from 'react';

const QuizQuestion = ({ question, selectedAnswer, hasAnswered, onSelect }) => {
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Question Text */}
      <div className="p-8 bg-surface-container-lowest dark:bg-gray-800 rounded-xl shadow-sm border border-surface-variant/30 dark:border-gray-700">
        <h1 className="text-2xl md:text-3xl font-bold font-headline leading-tight tracking-tight text-on-surface dark:text-gray-100">
          {question.question}
        </h1>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-4">
        {question.options?.map((option, idx) => {
          const isSelected = selectedAnswer === idx; // Local UI optimistic state
          const isCorrect = idx === question.correctIndex;
          
          let containerClass = "p-6 bg-surface-container-lowest dark:bg-gray-800 border-l-4 border-transparent hover:border-surface-dim dark:hover:border-gray-600 rounded-xl flex items-start gap-5 transition-all cursor-pointer hover:bg-surface-container-low dark:hover:bg-gray-700/50 shadow-sm";
          let circleClass = "w-10 h-10 rounded-full bg-surface-container dark:bg-gray-700 flex items-center justify-center shrink-0 text-on-surface-variant dark:text-gray-400 font-bold font-headline group-hover:bg-primary/10 group-hover:text-primary transition-colors";
          let textClass = "text-lg font-semibold text-on-surface dark:text-gray-200 group-hover:text-primary transition-colors";
          
          let headerBadge = null;
          let explanationBlock = null;

          if (hasAnswered || isSelected) {
            // If answered, lock styling based on truth
            if (isCorrect) {
              containerClass = "p-6 bg-surface-container-lowest dark:bg-gray-800 border-l-4 border-[#22C55E] rounded-xl flex items-start gap-5 transition-all duration-200 shadow-sm";
              circleClass = "w-10 h-10 rounded-full bg-[#22C55E]/10 flex items-center justify-center shrink-0 text-[#22C55E] font-bold font-headline";
              textClass = "text-lg font-semibold text-on-surface dark:text-gray-100";
              headerBadge = (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#22C55E]/10 text-[#22C55E] rounded-full text-[10px] md:text-xs font-bold uppercase shrink-0">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Correct!
                </div>
              );
              if (hasAnswered) {
                explanationBlock = (
                  <div className="mt-4 p-4 bg-[#22C55E]/5 dark:bg-gray-900/40 rounded-lg border-l-2 border-[#22C55E]/20 text-left animate-in fade-in slide-in-from-top-2">
                    <span className="text-[#22C55E] font-bold text-xs uppercase block mb-1 tracking-wider">AI Explanation</span>
                    <p className="text-on-surface-variant dark:text-gray-400 text-sm italic leading-relaxed">
                      {question.explanation || "This is the correct answer based on your notes."}
                    </p>
                  </div>
                );
              }
            } else if (isSelected) { // Selected but WRONG
              containerClass = "p-6 bg-surface-container-lowest dark:bg-gray-800 border-l-4 border-[#EF4444] rounded-xl flex items-start gap-5 transition-all shadow-sm";
              circleClass = "w-10 h-10 rounded-full bg-[#EF4444]/10 flex items-center justify-center shrink-0 text-[#EF4444] font-bold font-headline";
              textClass = "text-lg font-semibold text-on-surface dark:text-gray-100";
              headerBadge = (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#EF4444]/10 text-[#EF4444] rounded-full text-[10px] md:text-xs font-bold uppercase shrink-0">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                  Wrong Attempt
                </div>
              );
            } else {
              // Not selected, but question answered. Fade out slightly.
              containerClass = "p-6 bg-surface-container-lowest dark:bg-gray-800 border-l-4 border-transparent rounded-xl flex items-start gap-5 transition-all opacity-60";
              circleClass = "w-10 h-10 rounded-full bg-surface-container dark:bg-gray-700 flex items-center justify-center shrink-0 text-on-surface-variant dark:text-gray-500 font-bold font-headline";
              textClass = "text-lg font-semibold text-on-surface dark:text-gray-400";
            }
          }

          return (
            <div 
              key={idx} 
              // Enforce anti-cheat click disability
              className={`group ${!hasAnswered ? 'cursor-pointer' : 'cursor-default pointer-events-none'}`} 
              onClick={() => {
                if (!hasAnswered) onSelect(idx);
              }}
            >
              <div className={containerClass}>
                <div className={circleClass}>
                  {letters[idx]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start md:items-center justify-between gap-2 flex-col md:flex-row mb-1">
                    <span className={textClass}>{option}</span>
                    {headerBadge}
                  </div>
                  {explanationBlock}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizQuestion;
