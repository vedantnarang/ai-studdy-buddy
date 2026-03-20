import React from 'react';

const FlashcardItem = ({ card, isFlipped, onFlip, themeColor }) => {
  return (
    <div 
      className="w-full aspect-3/2 cursor-pointer group"
      style={{ perspective: '1000px' }}
      onClick={onFlip}
    >
      <div 
        className="relative w-full h-full transition-transform duration-500 shadow-sm hover:shadow-md rounded-xl"
        style={{ 
          transformStyle: 'preserve-3d', 
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
        }}
      >
        {/* Front - Question */}
        <div 
          className="absolute inset-0 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <span 
            className="absolute top-3 left-3 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded uppercase opacity-80"
            style={{ color: themeColor || '#6366f1', backgroundColor: `${themeColor || '#6366f1'}20` }}
          >
            Question
          </span>
          <p className="text-gray-900 dark:text-white font-medium line-clamp-4 px-2 select-none">
            {card.question}
          </p>
        </div>

        {/* Back - Answer */}
        <div 
          className="absolute inset-0 rounded-xl p-6 flex flex-col items-center justify-center text-center"
          style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden', 
            transform: 'rotateY(180deg)',
            backgroundColor: `${themeColor || '#6366f1'}10`,
            border: `1px solid ${themeColor || '#6366f1'}40`
          }}
        >
          <span 
            className="absolute top-3 left-3 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded uppercase"
            style={{ color: themeColor || '#6366f1', backgroundColor: `${themeColor || '#6366f1'}20` }}
          >
            Answer
          </span>
          <p className="text-gray-800 dark:text-gray-200 text-sm overflow-y-auto w-full scrollbar-thin px-2 py-4 mt-2">
            {card.answer}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FlashcardItem;
